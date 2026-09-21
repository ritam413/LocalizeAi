import re
import json
import logging
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Callable, Awaitable, Optional
from sqlalchemy.future import select

from sqlalchemy.orm import selectinload
from sqlalchemy.future import select

from app.config import settings
from app.db.database import AsyncSessionLocal
from app.db.models import Run, StageRun, Artifact, Segment
from app.engine.gpu_lock import gpu_lock
from app.engine.cancel_registry import register as cancel_register, is_cancelled, unregister as cancel_unregister
from app.engine.stages.extraction import ExtractionStage
from app.engine.stages.denoise import DenoiseStage
from app.engine.stages.transcription import TranscriptionStage
from app.engine.stages.translation import TranslationStage
from app.engine.stages.tts import TTSStage
from app.engine.stages.duration_align import DurationAlignStage
from app.engine.stages.mixer import MasteringStage
from app.engine.stages.exporter import RemuxStage
from app.engine.stages.stub import StubStage

logger = logging.getLogger("dubforge.executor")

# Registry of stage handlers
STAGE_CLASSES = {
    "extraction": ExtractionStage,
    "denoise": DenoiseStage,
    "transcription": TranscriptionStage,
    "translation": TranslationStage,
    "tts": TTSStage,
    "duration_align": DurationAlignStage,
    "remix": MasteringStage,
    "remux": RemuxStage,
}

class RunExecutor:
    _active_stage_locks: Dict[str, asyncio.Lock] = {}
    _stage_lock_guard = asyncio.Lock()

    def __init__(self, websocket_broadcast: Callable[[str, Dict[str, Any]], Awaitable[None]] = None):
        self.websocket_broadcast = websocket_broadcast

    @classmethod
    async def get_stage_lock(cls, run_id: str, stage_name: str) -> asyncio.Lock:
        key = f"{run_id}:{stage_name}"
        async with cls._stage_lock_guard:
            if key not in cls._active_stage_locks:
                cls._active_stage_locks[key] = asyncio.Lock()
            return cls._active_stage_locks[key]

    @classmethod
    def cleanup_stage_locks(cls, run_id: str) -> None:
        prefix = f"{run_id}:"
        for k in list(cls._active_stage_locks.keys()):
            if k.startswith(prefix):
                cls._active_stage_locks.pop(k, None)

    def _rehydrate_disk_artifacts(self, run_dir: Path, current_artifacts: Dict[str, Any]) -> None:
        """
        Rehydrates in-memory stage artifacts from disk manifests and stems directories
        for single-stage retries and resumed pipelines.
        """
        # 1. Base Audio Stems
        if (run_dir / "vocals.wav").exists():
            current_artifacts["vocals_path"] = str(run_dir / "vocals.wav")
            current_artifacts["audio_path"] = str(run_dir / "vocals.wav")
        if (run_dir / "background.wav").exists():
            current_artifacts["background_path"] = str(run_dir / "background.wav")
        if (run_dir / "extracted_audio.wav").exists() and "audio_path" not in current_artifacts:
            current_artifacts["audio_path"] = str(run_dir / "extracted_audio.wav")

        # 2. Transcript & Segment Map Lookup (Segment ID -> Segment Dict)
        seg_map: Dict[int, Dict[str, Any]] = {}
        if (run_dir / "transcript.json").exists():
            try:
                with open(run_dir / "transcript.json", "r", encoding="utf-8") as fh:
                    segments = json.load(fh)
                    if isinstance(segments, list):
                        current_artifacts["segments"] = segments
                        for seg in segments:
                            raw_id = seg.get("segment_id")
                            if raw_id is not None:
                                try:
                                    seg_map[int(raw_id)] = seg
                                except (ValueError, TypeError):
                                    pass
            except Exception as e:
                logger.warning(f"Failed to read transcript.json in {run_dir}: {e}")

        # 3. Synthesized Stems (stems.json manifest takes priority; fallback to stems/ directory scan)
        stems_manifest = run_dir / "stems.json"
        loaded_stems = False
        if stems_manifest.exists():
            try:
                with open(stems_manifest, "r", encoding="utf-8") as fh:
                    manifest_stems = json.load(fh)
                    if isinstance(manifest_stems, list) and len(manifest_stems) > 0:
                        current_artifacts["synthesized_stems"] = manifest_stems
                        loaded_stems = True
            except Exception as e:
                logger.warning(f"Failed to load stems.json manifest: {e}")

        if not loaded_stems and (run_dir / "stems").is_dir():
            stem_files = sorted((run_dir / "stems").glob("seg_*.wav"))
            reconstructed_stems = []
            for sf in stem_files:
                match = re.search(r"seg_(\d+)", sf.stem)
                if not match:
                    continue
                seg_id = int(match.group(1))
                seg_info = seg_map.get(seg_id, {})
                reconstructed_stems.append({
                    "segment_id": seg_id,
                    "speaker_id": seg_info.get("speaker_id", "speaker_1"),
                    "start_s": float(seg_info.get("start_s", 0.0)),
                    "end_s": float(seg_info.get("end_s", 3.0)),
                    "target_duration_s": max(0.1, float(seg_info.get("end_s", 3.0)) - float(seg_info.get("start_s", 0.0))),
                    "audio_path": str(sf)
                })
            if reconstructed_stems:
                current_artifacts["synthesized_stems"] = reconstructed_stems

        # 4. Aligned Stems
        if (run_dir / "aligned").is_dir():
            aligned_files = sorted((run_dir / "aligned").glob("aligned_seg_*.wav"))
            if aligned_files:
                aligned_stems = []
                for af in aligned_files:
                    match = re.search(r"aligned_seg_(\d+)", af.stem) or re.search(r"seg_(\d+)", af.stem)
                    if not match:
                        continue
                    seg_id = int(match.group(1))
                    seg_info = seg_map.get(seg_id, {})
                    aligned_stems.append({
                        "segment_id": seg_id,
                        "start_s": float(seg_info.get("start_s", 0.0)),
                        "end_s": float(seg_info.get("end_s", 3.0)),
                        "aligned_path": str(af),
                        "audio_path": str(af)
                    })
                if aligned_stems:
                    current_artifacts["aligned_stems"] = aligned_stems

        # 5. Composite Mixdown & Deliverables
        if (run_dir / "dialogue_bus.wav").exists():
            current_artifacts["dialogue_bus_path"] = str(run_dir / "dialogue_bus.wav")
        if (run_dir / "mastered_audio.wav").exists():
            current_artifacts["mastered_audio_path"] = str(run_dir / "mastered_audio.wav")

    async def execute_run(
        self,
        run_id: str,
        force_resume: bool = False,
        single_stage: Optional[str] = None
    ):
        # Register a cancel event for this run so the /cancel endpoint can signal us.
        cancel_register(run_id)
        try:
            await self._run_pipeline(run_id, force_resume=force_resume, single_stage=single_stage)
        finally:
            cancel_unregister(run_id)
            self.cleanup_stage_locks(run_id)

    async def _run_pipeline(
        self,
        run_id: str,
        force_resume: bool = False,
        single_stage: Optional[str] = None
    ):
        async with AsyncSessionLocal() as session:
            res = await session.execute(
                select(Run).options(selectinload(Run.clip)).where(Run.id == run_id)
            )
            run = res.scalar_one_or_none()
            if not run:
                logger.error(f"Run {run_id} not found")
                return

            if run.status == "cancelling" or is_cancelled(run_id):
                logger.info(f"Run {run_id} was cancelled before execution started.")
                run.status = "cancelled"
                run.completed_at = datetime.utcnow()
                await session.commit()
                if self.websocket_broadcast:
                    await self.websocket_broadcast(run_id, {
                        "type": "run_cancelled",
                        "status": "cancelled"
                    })
                return

            run.status = "running"
            run.started_at = run.started_at or datetime.utcnow()
            await session.commit()

            target_langs = json.loads(run.target_languages_json) if run.target_languages_json else ["en"]
            stage_config = json.loads(run.frozen_stage_config_json)
            all_stage_names: List[str] = stage_config.get("stages", ["extraction", "denoise", "transcription", "translation"])
            stage_names = [single_stage] if single_stage else all_stage_names

            # Setup working directory for artifacts
            run_dir = settings.STORAGE_DIR / "runs" / run_id
            run_dir.mkdir(parents=True, exist_ok=True)

            current_artifacts: Dict[str, Any] = {
                "source_path": run.clip.source_path if run.clip else None
            }

            # Pre-load existing artifacts from disk for previous completed stages
            self._rehydrate_disk_artifacts(run_dir, current_artifacts)


            for stage_name in stage_names:
                # ── Cancellation check between stages ─────────────────── #
                if is_cancelled(run_id):
                    logger.info(f"Run {run_id} cancelled before stage '{stage_name}'")
                    run.status = "cancelled"
                    run.completed_at = datetime.utcnow()
                    await session.commit()
                    if self.websocket_broadcast:
                        await self.websocket_broadcast(run_id, {
                            "type": "run_cancelled",
                            "status": "cancelled"
                        })
                    return

                # Query or create stage_run row
                res = await session.execute(
                    select(StageRun).where(StageRun.run_id == run_id, StageRun.stage_name == stage_name)
                )
                stage_run = res.scalar_one_or_none()

                if not stage_run:
                    stage_run = StageRun(
                        run_id=run_id,
                        stage_name=stage_name,
                        status="pending",
                        progress_pct=0.0
                    )
                    session.add(stage_run)
                    await session.commit()

                # Skip if already completed (unless force_resume or explicit single_stage execution)
                if stage_run.status == "completed" and not force_resume and not single_stage:
                    logger.info(f"Skipping completed stage: {stage_name}")
                    continue

                # WRITE TO STAGE_RUNS BEFORE ADVANCING (Resumability F-10 rule)
                stage_run.status = "running"
                stage_run.started_at = datetime.utcnow()
                run.current_stage = stage_name
                await session.commit()

                if self.websocket_broadcast:
                    await self.websocket_broadcast(run_id, {
                        "type": "stage_status_changed",
                        "stage_name": stage_name,
                        "status": "running"
                    })

                # Instantiate stage engine
                if stage_name == "tts":
                    tts_adapter = stage_config.get("tts_adapter", "kokoro")
                    stage_engine = TTSStage(adapter_type=tts_adapter)
                else:
                    stage_cls = STAGE_CLASSES.get(stage_name, lambda: StubStage(stage_name))
                    stage_engine = stage_cls()

                async def progress_callback(pct: float, msg: str):
                    if is_cancelled(run_id):
                        raise asyncio.CancelledError(f"Run {run_id} cancelled by user")
                    async with AsyncSessionLocal() as db_inner:
                        st = await db_inner.get(StageRun, stage_run.id)
                        if st:
                            st.progress_pct = pct
                            await db_inner.commit()
                    if self.websocket_broadcast:
                        await self.websocket_broadcast(run_id, {
                            "type": "progress_update",
                            "stage_name": stage_name,
                            "progress_pct": pct,
                            "message": msg
                        })

                async def log_callback(level: str, msg: str):
                    if is_cancelled(run_id):
                        raise asyncio.CancelledError(f"Run {run_id} cancelled by user")
                    if self.websocket_broadcast:
                        await self.websocket_broadcast(run_id, {
                            "type": "log_line",
                            "stage_name": stage_name,
                            "level": level,
                            "message": msg
                        })
                    # Persist log line to run.log (JSON Lines)
                    try:
                        log_file = run_dir / "run.log"
                        entry = json.dumps({
                            "stage_name": stage_name,
                            "level": level,
                            "message": msg,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })
                        with open(log_file, "a", encoding="utf-8") as fh:
                            fh.write(entry + "\n")
                    except Exception:
                        pass

                stage_config_override = {
                    "run_dir": str(run_dir),
                    "source_language": run.source_language,
                    "target_language": target_langs[0] if target_langs else "en",
                    "use_demucs": stage_config.get("use_demucs", True),
                    "whisper_model": stage_config.get("whisper_model") or stage_config.get("asr_model"),
                    "asr_model": stage_config.get("asr_model") or stage_config.get("whisper_model"),
                    "tts_adapter": stage_config.get("tts_adapter", "kokoro"),
                }

                stage_lock = await self.get_stage_lock(run_id, stage_name)
                async with stage_lock:
                    try:
                        # Rehydrate disk artifacts to guarantee fresh state
                        self._rehydrate_disk_artifacts(run_dir, current_artifacts)

                        # GPU lock check
                        if stage_engine.gpu_required:
                            await log_callback("INFO", f"Acquiring GpuLock for GPU stage: {stage_name}")
                            async with gpu_lock.acquire(f"{run_id}:{stage_name}"):
                                output_res = await stage_engine.execute(current_artifacts, stage_config_override, progress_callback, log_callback)
                        else:
                            output_res = await stage_engine.execute(current_artifacts, stage_config_override, progress_callback, log_callback)

                        # Check cancellation immediately after stage execution completes
                        if is_cancelled(run_id):
                            raise asyncio.CancelledError(f"Run {run_id} cancelled by user")

                        # Update current artifacts
                        current_artifacts.update(output_res)

                        # Save DB artifacts & segments if present
                        if "artifacts" in output_res:
                            raw_artifacts = output_res["artifacts"]
                            if isinstance(raw_artifacts, dict):
                                art_list = [
                                    {
                                        "type": k,
                                        "label": f"{stage_name}_{k}",
                                        "path": str(v)
                                    }
                                    for k, v in raw_artifacts.items()
                                ]
                            elif isinstance(raw_artifacts, list):
                                art_list = raw_artifacts
                            else:
                                art_list = []

                            for art_info in art_list:
                                if isinstance(art_info, dict):
                                    art_obj = Artifact(
                                        stage_run_id=stage_run.id,
                                        run_id=run_id,
                                        type=art_info.get("type", "json"),
                                        label=art_info.get("label", stage_name),
                                        path=str(art_info.get("path", ""))
                                    )
                                    session.add(art_obj)

                        if "segments" in output_res:
                            # Clear old segments for run & insert new
                            for seg_data in output_res["segments"]:
                                seg_obj = Segment(
                                    run_id=run_id,
                                    target_language=seg_data.get("target_language", target_langs[0] if target_langs else "en"),
                                    start_s=seg_data["start_s"],
                                    end_s=seg_data["end_s"],
                                    source_text=seg_data.get("source_text"),
                                    translated_text=seg_data.get("translated_text"),
                                    cps=seg_data.get("cps")
                                )
                                session.add(seg_obj)

                        stage_run.status = "completed"
                        stage_run.progress_pct = 100.0
                        stage_run.completed_at = datetime.utcnow()
                        await session.commit()

                        if self.websocket_broadcast:
                            await self.websocket_broadcast(run_id, {
                                "type": "stage_status_changed",
                                "stage_name": stage_name,
                                "status": "completed"
                            })

                    except (Exception, asyncio.CancelledError) as exc:
                        if isinstance(exc, asyncio.CancelledError) or is_cancelled(run_id):
                            logger.info(f"Run {run_id} cancelled during stage {stage_name}")
                            stage_run.status = "cancelled"
                            stage_run.completed_at = datetime.utcnow()
                            run.status = "cancelled"
                            run.completed_at = datetime.utcnow()
                            await session.commit()

                            if self.websocket_broadcast:
                                await self.websocket_broadcast(run_id, {
                                    "type": "run_cancelled",
                                    "status": "cancelled"
                                })
                            return

                        logger.error(f"Stage {stage_name} failed: {exc}", exc_info=True)
                        stage_run.status = "failed"
                        stage_run.error_message = str(exc)
                        run.status = "failed"
                        await session.commit()

                        if self.websocket_broadcast:
                            await self.websocket_broadcast(run_id, {
                                "type": "stage_status_changed",
                                "stage_name": stage_name,
                                "status": "failed",
                                "error": str(exc)
                            })
                        return

            # Final cancellation check — in case cancel was signalled during the last stage
            if is_cancelled(run_id):
                run.status = "cancelled"
                run.completed_at = datetime.utcnow()
                await session.commit()
                if self.websocket_broadcast:
                    await self.websocket_broadcast(run_id, {
                        "type": "run_cancelled",
                        "status": "cancelled"
                    })
                return

            run.status = "completed"
            run.completed_at = datetime.utcnow()
            await session.commit()

            if self.websocket_broadcast:
                await self.websocket_broadcast(run_id, {
                    "type": "run_completed",
                    "status": "completed"
                })
