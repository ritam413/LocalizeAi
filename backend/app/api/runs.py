import json
import re
import uuid
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Run, Clip, Preset, StageRun
from app.core.languages import resolve_language
from app.engine.executor import RunExecutor
from app.engine.cancel_registry import signal_cancel
from app.engine.stages.tts import sanitize_tts_adapter
from app.api.websocket import manager

runs_router = APIRouter(prefix="/runs", tags=["Runs"])

def generate_run_slug(filename: Optional[str] = None, fallback_id: Optional[str] = None) -> str:
    """
    Generates a deterministic, human-readable run slug:
    - Normal: '{clean_stem}_{6char_uuid}' (e.g., 'trial1_a1b2c3')
    - Fallback: '{date_time_slug}_{6char_uuid}' (e.g., '22_tuesday_september_10_45pm_a1b2c3')
    
    Safety:
    - Windows MAX_PATH defense: capped at 32 chars
    - NTFS path safety: zero colons, commas, or special symbols
    - Clean underscore deduplication
    """
    stem = ""
    if filename:
        raw_stem = Path(filename).stem.strip()
        stem = re.sub(r'[^a-zA-Z0-9_-]+', '_', raw_stem).strip('_')

    if not stem:
        if fallback_id:
            clean_fallback = re.sub(r'[^a-zA-Z0-9_-]+', '_', str(fallback_id).strip()).strip('_')
            stem = clean_fallback[:32] if clean_fallback else ""

    if not stem:
        now = datetime.now()
        time_str = now.strftime("%d_%A_%B_%I_%M%p").lower()
        stem = re.sub(r'[^a-zA-Z0-9_-]+', '_', time_str).strip('_')

    stem = stem[:32].rstrip('_') or "run"
    short_uid = uuid.uuid4().hex[:6]
    return f"{stem}_{short_uid}"

@runs_router.post("")
async def create_run(
    payload: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    clip_id = payload.get("clip_id")
    preset_id = payload.get("preset_id")
    project_mode = payload.get("project_mode", "C")
    source_language = payload.get("source_language", "es")
    target_languages = payload.get("target_languages", ["en"])
    subtitle_only = payload.get("subtitle_only")
    use_demucs = payload.get("use_demucs")
    whisper_model = payload.get("whisper_model") or payload.get("asr_model")

    # Fetch clip and validate existence
    clip_res = None
    if clip_id:
        clip_res = await db.get(Clip, clip_id)
        if not clip_res:
            raise HTTPException(status_code=404, detail=f"Clip '{clip_id}' not found")

    clip_filename = clip_res.filename if clip_res else None

    # If preset_id provided, fetch and override empty settings
    if preset_id:
        preset_res = await db.execute(select(Preset).where(Preset.id == preset_id))
        preset = preset_res.scalar_one_or_none()
        if preset:
            if subtitle_only is None:
                subtitle_only = preset.subtitle_only
            if use_demucs is None:
                use_demucs = preset.use_demucs
            if whisper_model is None:
                whisper_model = preset.whisper_model

    # Defaults if still None
    if subtitle_only is None:
        subtitle_only = (project_mode == "C")
    if use_demucs is None:
        use_demucs = (project_mode != "C")
    if whisper_model is None:
        whisper_model = "large-v3-turbo"

    # Human-readable Run ID generation: {filename_stem}_{6char_uuid}
    while True:
        candidate_id = generate_run_slug(clip_filename, fallback_id=clip_id)
        existing = await db.execute(select(Run).where(Run.id == candidate_id))
        if not existing.scalar_one_or_none():
            break

    run_id = candidate_id

    # Resolve normalized language codes for stage pipeline routing
    primary_target_lang = target_languages[0] if target_languages else "en"
    src_code = resolve_language(source_language).code if source_language else "es"
    tgt_code = resolve_language(primary_target_lang).code if primary_target_lang else "en"

    if subtitle_only or project_mode == "C":
        # Mode C: Festival Subtitle Master / Subtitle Only
        if src_code == tgt_code:
            # Same language (e.g. en == en): transcription produces subtitles & transcript directly, skip translation & deliverables remux
            stages = ["extraction", "denoise", "transcription"]
        else:
            # Cross language (e.g. !en -> en): extraction -> denoise -> transcription -> translation, no steps after translation
            stages = ["extraction", "denoise", "transcription", "translation"]
    else:
        # Mode A & Mode B (Full Dubbing)
        stages = ["extraction", "denoise", "transcription", "translation", "tts", "duration_align", "remix", "remux"]

    frozen_stage_config = {
        "stages": stages,
        "subtitle_only": subtitle_only,
        "use_demucs": use_demucs,
        "whisper_model": whisper_model,
        "asr_model": whisper_model,
        "tts_adapter": sanitize_tts_adapter(payload.get("tts_adapter")),
    }


    if payload.get("stage_config_override"):
        frozen_stage_config.update(payload["stage_config_override"])

    run = Run(
        id=run_id,
        clip_id=clip_id,
        preset_id=preset_id,
        project_mode=project_mode,
        source_language=source_language,
        target_languages_json=json.dumps(target_languages),
        subtitle_only=subtitle_only,
        frozen_stage_config_json=json.dumps(frozen_stage_config),
        status="queued"
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    executor = RunExecutor(websocket_broadcast=manager.broadcast)
    background_tasks.add_task(executor.execute_run, run.id)

    return run

@runs_router.get("")
async def list_runs(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Run).options(selectinload(Run.clip)).order_by(Run.created_at.desc())
    )
    return res.scalars().all()

@runs_router.get("/{run_id}")
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Run)
        .options(selectinload(Run.clip), selectinload(Run.stage_runs), selectinload(Run.artifacts))
        .where(Run.id == run_id)
    )
    run = res.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

@runs_router.post("/{run_id}/resume")
async def resume_run(
    run_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    run = await db.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    executor = RunExecutor(websocket_broadcast=manager.broadcast)
    background_tasks.add_task(executor.execute_run, run_id, force_resume=False)
    return {"message": "Run resume queued", "run_id": run_id}


@runs_router.post("/{run_id}/cancel")
async def cancel_run(run_id: str, db: AsyncSession = Depends(get_db)):
    """
    Signal the running executor to stop.
    If the run is actively running in memory, it is set to 'cancelling' so the executor
    can terminate sub-processes and clean up. If it is not active in memory (e.g. lost task,
    already cancelling, or queued), it is immediately marked as 'cancelled'.
    """
    run = await db.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status not in ("running", "queued", "cancelling"):
        raise HTTPException(
            status_code=409,
            detail=f"Run is not active (current status: {run.status})"
        )

    # Signal the executor event (if the run is already in-process).
    was_active = signal_cancel(run_id)

    if not was_active or run.status == "cancelling":
        run.status = "cancelled"
        run.completed_at = datetime.utcnow()
        await db.commit()

        await manager.broadcast(run_id, {
            "type": "run_cancelled",
            "status": "cancelled"
        })

        return {
            "message": "Run status updated to cancelled",
            "run_id": run_id,
            "status": "cancelled"
        }

    # Update DB immediately so the UI sees the intent right away.
    run.status = "cancelling"
    await db.commit()

    # Broadcast to all WebSocket subscribers watching this run.
    await manager.broadcast(run_id, {
        "type": "run_cancelling",
        "status": "cancelling"
    })

    return {
        "message": "Cancel signal sent",
        "run_id": run_id,
        "status": "cancelling"
    }


@runs_router.get("/{run_id}/logs")
async def get_run_logs(run_id: str):
    """
    Return persisted log lines for a run from storage/runs/{run_id}/run.log.
    Each line is a JSON object with keys: stage_name, level, message, timestamp.
    """
    log_path = Path(f"./storage/runs/{run_id}/run.log")
    if not log_path.exists():
        return JSONResponse(content=[])

    entries = []
    try:
        with open(log_path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    try:
                        entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
    except Exception:
        return JSONResponse(content=[])

    return JSONResponse(content=entries)
