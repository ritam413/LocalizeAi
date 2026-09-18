import json
import re
import asyncio
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Run, Clip, Preset, StageRun
from app.engine.executor import RunExecutor
from app.engine.cancel_registry import signal_cancel
from app.api.websocket import manager

runs_router = APIRouter(prefix="/runs", tags=["Runs"])

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
    subtitle_only = payload.get("subtitle_only", project_mode == "C")
    use_demucs = payload.get("use_demucs", project_mode != "C")
    whisper_model = payload.get("whisper_model") or payload.get("asr_model")

    if not whisper_model:
        if project_mode == "A":
            whisper_model = "whisper-large-v3"
        elif project_mode == "B":
            whisper_model = "whisper-large-v3-turbo"
        else:
            whisper_model = "whisper-large-v3-turbo"

    if not clip_id:
        raise HTTPException(status_code=400, detail="clip_id is required")

    clip = await db.get(Clip, clip_id)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    # Generate human-readable run ID derived from uploaded clip's filename
    raw_stem = Path(clip.filename).stem if clip.filename else "clip"
    base_id = re.sub(r'[^a-zA-Z0-9_\-]', '_', raw_stem) or "run"

    candidate_id = base_id
    counter = 1
    while True:
        existing = await db.get(Run, candidate_id)
        if not existing:
            break
        candidate_id = f"{base_id}_{counter}"
        counter += 1

    run_id = candidate_id

    frozen_stage_config = {
        "stages": ["extraction", "denoise", "transcription", "translation"] if subtitle_only else ["extraction", "denoise", "transcription", "translation", "tts", "duration_align", "remix", "remux"],
        "subtitle_only": subtitle_only,
        "use_demucs": use_demucs,
        "whisper_model": whisper_model,
        "asr_model": whisper_model,
        "tts_adapter": payload.get("tts_adapter", "edge_tts"),
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
