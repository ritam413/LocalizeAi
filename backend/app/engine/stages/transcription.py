import json
import os
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from app.engine.stage import BaseStage, ProgressCallback, LogCallback
from app.engine.subtitle_formatter import clean_segments, purge_hallucinations, deduplicate_segments, format_srt, format_vtt
from app.engine.audio_chunker import AudioChunker, AudioChunk


class TranscriptionStage(BaseStage):
    """
    ASR stage using Faster-Whisper with silence-aware chunking and persistent checkpoints.

    Key settings (per ADR 0001 & ADR 0007):
    - Standardized on faster-whisper medium (int8/float16).
    - Divides input audio into chunks, transcribing each sequentially.
    - Persists progress to transcription_checkpoint.json after each chunk (e.g. 20%, 40%).
    - Resumes seamlessly from existing checkpoints on re-runs.
    - VAD filter enabled: min_speech_duration_ms=250, min_silence_duration_ms=500.
    - Anti-hallucination: no_speech_threshold=0.6, compression_ratio_threshold=2.4,
      condition_on_previous_text=False.
    - Explicit memory cleanup after execution to free GPU for downstream TTS.
    """

    MODEL_SIZE = "turbo"

    @staticmethod
    def _normalize_model_name(raw_name: Optional[str]) -> str:
        if not raw_name:
            return "turbo"
        name = str(raw_name).strip().lower()
        if "turbo" in name:
            return "turbo"
        if "large" in name:
            return "large-v3"
        if "medium" in name:
            return "medium"
        if "small" in name:
            return "small"
        if "tiny" in name:
            return "tiny"
        if "base" in name:
            return "base"
        return name

    def __init__(self):
        super().__init__("transcription", gpu_required=True)

    async def execute(
        self,
        input_artifacts: Dict[str, Any],
        config: Dict[str, Any],
        progress_cb: ProgressCallback,
        log_cb: LogCallback,
    ) -> Dict[str, Any]:
        source_lang: Optional[str] = config.get("source_language")
        if source_lang and source_lang.lower() in ("auto", "auto-detect", ""):
            source_lang = None

        raw_model = config.get("whisper_model") or config.get("asr_model") or self.MODEL_SIZE
        model_name = self._normalize_model_name(raw_model)
        target_chunk_s: float = float(config.get("target_chunk_s", 60.0))

        run_dir = Path(config.get("run_dir", "./storage/runs/default"))
        run_dir.mkdir(parents=True, exist_ok=True)
        output_json = run_dir / "transcript.json"
        checkpoint_json = run_dir / "transcription_checkpoint.json"

        audio_path = self._resolve_audio(input_artifacts, run_dir)

        await log_cb(
            "INFO",
            f"TranscriptionStage: source_lang={source_lang or 'auto-detect'}, "
            f"model={model_name} (raw={raw_model}), audio={audio_path}",
        )
        await progress_cb(5.0, "Resolving input audio path")

        if not audio_path or not Path(audio_path).exists():
            if config.get("stub_mode"):
                await log_cb("WARNING", f"No valid audio found at '{audio_path}'. Using stub placeholder segments.")
                segments_data = self._placeholder_segments()
                with open(output_json, "w", encoding="utf-8") as fh:
                    json.dump(segments_data, fh, indent=2, ensure_ascii=False)
                await progress_cb(100.0, "Transcription complete (stub)")
                return {
                    "status": "success",
                    "segments": segments_data,
                    "audio_path": audio_path,
                    "artifacts": [
                        {"type": "json", "label": "Transcription JSON", "path": str(output_json)}
                    ],
                }
            else:
                await log_cb("ERROR", f"No valid audio found at '{audio_path}'.")
                raise RuntimeError(f"No valid audio file found for transcription stage at path: '{audio_path}'")

        # ── 1. Split audio into windowed chunks ────────────────────────── #
        chunks_dir = run_dir / "chunks"
        chunks = AudioChunker.split_audio(audio_path, str(chunks_dir), target_chunk_s=target_chunk_s)
        total_chunks = len(chunks)

        if total_chunks == 0:
            raise RuntimeError("AudioChunker produced 0 chunks from input audio.")

        await log_cb("INFO", f"TranscriptionStage: Divided audio into {total_chunks} chunk(s) of ~{target_chunk_s}s each")

        # ── 2. Checkpoint Loading & Resumption ─────────────────────────── #
        completed_chunks: List[int] = []
        accumulated_segments: List[Dict[str, Any]] = []

        if checkpoint_json.exists():
            try:
                with open(checkpoint_json, "r", encoding="utf-8") as fh:
                    cp_data = json.load(fh)
                    completed_chunks = cp_data.get("completed_chunks", [])
                    accumulated_segments = cp_data.get("accumulated_segments", [])
                
                prev_pct = cp_data.get("progress_percent", 0.0)
                await log_cb(
                    "INFO",
                    f"TranscriptionStage: Found existing checkpoint! Resuming from chunk {len(completed_chunks)}/{total_chunks} ({prev_pct}% previously completed).",
                )
            except Exception as cp_err:
                await log_cb("WARNING", f"Failed to load checkpoint ({cp_err}), restarting transcription from chunk 0.")
                completed_chunks = []
                accumulated_segments = []

        # ── 3. Sequential Chunk Transcription Loop ────────────────────── #
        for chunk in chunks:
            if chunk.index in completed_chunks:
                await log_cb("INFO", f"TranscriptionStage: Skipping already completed chunk {chunk.index} [{chunk.start_offset_s}s - {chunk.end_offset_s}s]")
                continue

            await log_cb("INFO", f"TranscriptionStage: Transcribing chunk {chunk.index + 1}/{total_chunks} [{chunk.start_offset_s}s - {chunk.end_offset_s}s]")
            
            chunk_segments, detected_lang = await self._transcribe_single_chunk(
                chunk_path=chunk.path,
                source_lang=source_lang,
                model_name=model_name,
            )

            # Offset chunk relative timestamps by chunk.start_offset_s
            for seg in chunk_segments:
                seg["start_s"] = round(seg["start_s"] + chunk.start_offset_s, 3)
                seg["end_s"] = round(seg["end_s"] + chunk.start_offset_s, 3)
                accumulated_segments.append(seg)

            completed_chunks.append(chunk.index)
            progress_pct = round((len(completed_chunks) / total_chunks) * 100.0, 1)

            # Atomic checkpoint write (.tmp + os.replace)
            self._save_checkpoint(
                checkpoint_json=checkpoint_json,
                total_chunks=total_chunks,
                completed_chunks=completed_chunks,
                progress_percent=progress_pct,
                last_completed_offset_s=chunk.end_offset_s,
                accumulated_segments=accumulated_segments,
            )

            await log_cb("INFO", f"TranscriptionStage: {progress_pct}% complete (chunk {chunk.index + 1}/{total_chunks} done)")
            await progress_cb(progress_pct, f"Transcribing audio: {progress_pct}% complete ({chunk.index + 1}/{total_chunks} chunks)")

        # ── 4. Post-processing & Final Transcript/Subtitle Export ──────── #
        segments_data = purge_hallucinations(accumulated_segments)
        segments_data = deduplicate_segments(segments_data)
        cleaned_for_subtitles = clean_segments(segments_data)

        with open(output_json, "w", encoding="utf-8") as fh:
            json.dump(segments_data, fh, indent=2, ensure_ascii=False)

        # Write active and language-specific subtitles immediately
        active_lang = source_lang or "en"
        srt_content = format_srt(cleaned_for_subtitles)
        vtt_content = format_vtt(cleaned_for_subtitles)

        default_srt = run_dir / "subtitles.srt"
        default_vtt = run_dir / "subtitles.vtt"
        lang_srt = run_dir / f"subtitles_{active_lang}.srt"
        lang_vtt = run_dir / f"subtitles_{active_lang}.vtt"

        default_srt.write_text(srt_content, encoding="utf-8")
        default_vtt.write_text(vtt_content, encoding="utf-8")
        lang_srt.write_text(srt_content, encoding="utf-8")
        lang_vtt.write_text(vtt_content, encoding="utf-8")

        await progress_cb(100.0, "Transcription complete")
        return {
            "status": "success",
            "segments": segments_data,
            "audio_path": audio_path,
            "subtitles_srt_path": str(default_srt),
            "subtitles_vtt_path": str(default_vtt),
            "artifacts": [
                {"type": "json", "label": "Transcription JSON", "path": str(output_json)},
                {"type": "subtitle", "label": f"Subtitles ({active_lang.upper()} SRT)", "path": str(lang_srt)},
                {"type": "subtitle", "label": f"Subtitles ({active_lang.upper()} VTT)", "path": str(lang_vtt)},
                {"type": "json", "label": "Transcription Checkpoint", "path": str(checkpoint_json)},
            ],
        }

    # ------------------------------------------------------------------ #
    #  Single Chunk Whisper Inference                                    #
    # ------------------------------------------------------------------ #

    async def _transcribe_single_chunk(
        self,
        chunk_path: str,
        source_lang: Optional[str],
        model_name: str,
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        def _whisper_sync() -> Tuple[List[Dict[str, Any]], Optional[str]]:
            from faster_whisper import WhisperModel
            import ctranslate2

            try:
                cuda_types = ctranslate2.get_supported_compute_types("cuda")
                device = "cuda" if cuda_types else "cpu"
            except Exception:
                device = "cpu"
                cuda_types = set()

            if device == "cuda":
                for preferred in ("float16", "int8_float32", "int8", "float32"):
                    if preferred in cuda_types:
                        compute_type = preferred
                        break
                else:
                    compute_type = "auto"
            else:
                compute_type = "int8"

            def _transcribe_with_model(dev: str, comp: str):
                model = WhisperModel(
                    model_name,
                    device=dev,
                    compute_type=comp,
                )

                segments_iter, info = model.transcribe(
                    chunk_path,
                    language=source_lang,
                    task="transcribe",
                    beam_size=5,
                    no_speech_threshold=0.85,
                    log_prob_threshold=-1.5,
                    compression_ratio_threshold=2.4,
                    condition_on_previous_text=False,
                    temperature=[0.0, 0.2, 0.4],
                    vad_filter=True,
                    vad_parameters=dict(
                        threshold=0.30,
                        min_speech_duration_ms=150,
                        min_silence_duration_ms=250,
                        speech_pad_ms=200,
                    ),
                    word_timestamps=True,
                )

                result: List[Dict[str, Any]] = []
                for seg in segments_iter:
                    if seg.words and len(seg.words) > 0:
                        start_time = seg.words[0].start
                        end_time = seg.words[-1].end
                    else:
                        start_time = seg.start
                        end_time = seg.end

                    result.append({
                        "start_s": round(start_time, 3),
                        "end_s": round(end_time, 3),
                        "source_text": seg.text.strip(),
                    })

                del model
                return result, info.language

            if device == "cuda":
                try:
                    return _transcribe_with_model(dev="cuda", comp=compute_type)
                except Exception:
                    return _transcribe_with_model(dev="cpu", comp="int8")
            else:
                return _transcribe_with_model(dev="cpu", comp="int8")

        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _whisper_sync)

    # ------------------------------------------------------------------ #
    #  Checkpoint Persistence Helpers                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _save_checkpoint(
        checkpoint_json: Path,
        total_chunks: int,
        completed_chunks: List[int],
        progress_percent: float,
        last_completed_offset_s: float,
        accumulated_segments: List[Dict[str, Any]],
    ) -> None:
        """
        Atomically saves transcription checkpoint state to disk.
        Uses sibling .tmp.json + os.replace to prevent corruption on Windows.
        """
        tmp_file = checkpoint_json.with_suffix(".tmp.json")
        data = {
            "total_chunks": total_chunks,
            "completed_chunks": completed_chunks,
            "progress_percent": progress_percent,
            "last_completed_offset_s": last_completed_offset_s,
            "accumulated_segments": accumulated_segments,
        }
        with open(tmp_file, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, ensure_ascii=False)
        os.replace(tmp_file, checkpoint_json)

    # ------------------------------------------------------------------ #
    #  Helpers                                                            #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _resolve_audio(
        input_artifacts: Dict[str, Any],
        run_dir: Path,
    ) -> Optional[str]:
        path = input_artifacts.get("vocals_path") or input_artifacts.get("audio_path")
        if path and Path(path).exists():
            return str(path)

        for candidate in (
            run_dir / "vocals.wav",
            run_dir / "extracted_audio.wav",
            run_dir / "denoised_audio.wav",
        ):
            if candidate.exists():
                return str(candidate)

        return None

    @staticmethod
    def _placeholder_segments() -> List[Dict[str, Any]]:
        return [
            {
                "start_s": 0.5,
                "end_s": 4.2,
                "source_text": "Bienvenidos a esta demostración del sistema de doblaje DubForge Studio.",
            },
            {
                "start_s": 4.8,
                "end_s": 9.1,
                "source_text": "El pipeline procesa audio, transcripción y traducción de alta calidad.",
            },
            {
                "start_s": 9.8,
                "end_s": 14.5,
                "source_text": "Generamos subtítulos perfectamente sincronizados con reglas estrictas de QA.",
            },
        ]
