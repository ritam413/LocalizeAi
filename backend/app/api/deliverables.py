import json
import re
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.engine.stages.exporter import BroadcastDeliverablesExporter

deliverables_router = APIRouter(prefix="/runs/{run_id}/deliverables", tags=["Deliverables"])


@deliverables_router.get("")
async def get_deliverables(run_id: str):
    """
    Retrieve the deliverables.json manifest for a completed run.
    """
    safe_run_id = re.sub(r'[^a-zA-Z0-9_\-]', '', run_id)
    if not safe_run_id:
        raise HTTPException(status_code=400, detail="Invalid run_id")

    run_dir = Path(f"./storage/runs/{safe_run_id}")
    manifest_file = run_dir / "deliverables" / "deliverables.json"

    if manifest_file.exists():
        try:
            manifest_data = json.loads(manifest_file.read_text(encoding="utf-8"))
            has_subtitles = bool(manifest_data.get("files", {}).get("subtitles_vtt") or manifest_data.get("files", {}).get("subtitles_srt"))
            # If manifest already has subtitles or no subtitles/transcript exist on disk, return it
            has_disk_subtitles = bool(
                (run_dir / "subtitles.vtt").exists()
                or (run_dir / "subtitles.srt").exists()
                or (run_dir / "transcript.json").exists()
                or list(run_dir.glob("subtitles_*.vtt"))
            )
            if has_subtitles or not has_disk_subtitles:
                return manifest_data
        except Exception:
            pass

    # Assemble and package deliverables
    exporter = BroadcastDeliverablesExporter()
    out_dir = run_dir / "deliverables"
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest = await exporter.package_release(
        job_id=run_id,
        source_video_path=run_dir / "input.mp4" if (run_dir / "input.mp4").exists() else (run_dir / "release_candidate.mp4" if (run_dir / "release_candidate.mp4").exists() else None),
        mastered_audio_path=run_dir / "mastered_audio.wav" if (run_dir / "mastered_audio.wav").exists() else None,
        dialogue_bus_path=run_dir / "dialogue_bus.wav" if (run_dir / "dialogue_bus.wav").exists() else None,
        subtitles_vtt_path=None,
        subtitles_srt_path=None,
        output_dir=run_dir,
    )

    if manifest.manifest_path and manifest.manifest_path.exists():
        return json.loads(manifest.manifest_path.read_text(encoding="utf-8"))

    return {
        "job_id": run_id,
        "status": "pending",
        "message": "Deliverables not yet packaged.",
        "files": {},
    }


@deliverables_router.post("/package")
async def package_run_deliverables(run_id: str, target_language: str = "es"):
    """
    Explicitly trigger packaging of run artifacts into studio deliverables.
    """
    safe_run_id = re.sub(r'[^a-zA-Z0-9_\-]', '', run_id)
    if not safe_run_id:
        raise HTTPException(status_code=400, detail="Invalid run_id")

    run_dir = Path(f"./storage/runs/{safe_run_id}")
    if not run_dir.exists():
        raise HTTPException(status_code=404, detail="Run directory not found.")

    exporter = BroadcastDeliverablesExporter()
    manifest = await exporter.package_release(
        job_id=safe_run_id,
        source_video_path=run_dir / "input.mp4" if (run_dir / "input.mp4").exists() else (run_dir / "release_candidate.mp4" if (run_dir / "release_candidate.mp4").exists() else None),
        mastered_audio_path=run_dir / "mastered_audio.wav" if (run_dir / "mastered_audio.wav").exists() else None,
        dialogue_bus_path=run_dir / "dialogue_bus.wav" if (run_dir / "dialogue_bus.wav").exists() else None,
        subtitles_vtt_path=run_dir / "subtitles.vtt" if (run_dir / "subtitles.vtt").exists() else None,
        subtitles_srt_path=run_dir / "subtitles.srt" if (run_dir / "subtitles.srt").exists() else None,
        output_dir=run_dir,
        target_language=target_language,
    )

    return json.loads(manifest.manifest_path.read_text(encoding="utf-8"))
