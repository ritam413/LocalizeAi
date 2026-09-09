import json
import shutil
import subprocess
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Clip
from app.config import settings

clips_router = APIRouter(prefix="/clips", tags=["Clips"])

def probe_media_info(file_path: Path) -> dict:
    try:
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", str(file_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            data = json.loads(res.stdout)
            format_info = data.get("format", {})
            duration = float(format_info.get("duration", 120.0))
            codec = "h264"
            resolution = "1080p"
            audio_channels = 2
            for stream in data.get("streams", []):
                if stream.get("codec_type") == "video":
                    codec = stream.get("codec_name", "h264")
                    width = stream.get("width")
                    height = stream.get("height")
                    if width and height:
                        resolution = f"{width}x{height}"
                elif stream.get("codec_type") == "audio":
                    audio_channels = stream.get("channels", 2)
            return {
                "duration_s": round(duration, 2),
                "codec": codec,
                "resolution": resolution,
                "audio_channels": audio_channels
            }
    except Exception:
        pass
    return {
        "duration_s": 120.0,
        "codec": "h264",
        "resolution": "1080p",
        "audio_channels": 2
    }

@clips_router.post("/upload")
async def upload_clip(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty")
        
    safe_filename = Path(file.filename).name
    upload_dir = settings.STORAGE_DIR / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest_path = upload_dir / safe_filename

    with open(dest_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            buffer.write(chunk)

    info = probe_media_info(dest_path)

    clip = Clip(
        source_path=str(dest_path),
        filename=safe_filename,
        duration_s=info["duration_s"],
        codec=info["codec"],
        resolution=info["resolution"],
        audio_channels=info["audio_channels"]
    )
    db.add(clip)
    await db.commit()
    await db.refresh(clip)

    return {
        "id": clip.id,
        "filename": clip.filename,
        "source_path": clip.source_path,
        "duration_s": clip.duration_s,
        "codec": clip.codec,
        "resolution": clip.resolution
    }

@clips_router.post("/import")
async def import_clip(payload: dict, db: AsyncSession = Depends(get_db)):
    path_str = payload.get("path", "").strip()
    if not path_str:
        raise HTTPException(status_code=400, detail="Path string cannot be empty")

    path_obj = Path(path_str)
    if not path_obj.is_absolute():
        candidates = [
            settings.BASE_DIR / path_str,
            settings.STORAGE_DIR / path_str,
            settings.STORAGE_DIR / "uploads" / path_str,
            settings.STORAGE_DIR / "uploads" / Path(path_str).name,
        ]
        found = False
        for candidate in candidates:
            if candidate.exists() and candidate.is_file():
                path_obj = candidate
                found = True
                break
        
        if not found and not path_obj.exists():
            raise HTTPException(status_code=400, detail=f"Invalid path or file does not exist: {path_str}")
    elif not path_obj.exists():
        raise HTTPException(status_code=400, detail=f"Invalid path or file does not exist: {path_str}")

    info = probe_media_info(path_obj)

    clip = Clip(
        source_path=str(path_obj),
        filename=path_obj.name,
        duration_s=info["duration_s"],
        codec=info["codec"],
        resolution=info["resolution"],
        audio_channels=info["audio_channels"]
    )
    db.add(clip)
    await db.commit()
    await db.refresh(clip)
    return {
        "id": clip.id,
        "filename": clip.filename,
        "source_path": clip.source_path,
        "duration_s": clip.duration_s,
        "codec": clip.codec,
        "resolution": clip.resolution,
        "audio_channels": clip.audio_channels
    }

@clips_router.get("")
async def list_clips(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Clip).order_by(Clip.created_at.desc()))
    return res.scalars().all()

@clips_router.get("/preview-stream")
async def preview_stream(path: str = Query(..., description="File path to preview")):
    path_str = path.strip()
    if not path_str:
        raise HTTPException(status_code=400, detail="Path string cannot be empty")

    path_obj = Path(path_str)
    if not path_obj.is_absolute():
        candidates = [
            settings.BASE_DIR / path_str,
            settings.STORAGE_DIR / path_str,
            settings.STORAGE_DIR / "uploads" / path_str,
            settings.STORAGE_DIR / "uploads" / Path(path_str).name,
        ]
        found = False
        for candidate in candidates:
            if candidate.exists() and candidate.is_file():
                path_obj = candidate
                found = True
                break
        
        if not found and not path_obj.exists():
            raise HTTPException(status_code=404, detail=f"File does not exist: {path_str}")
    elif not path_obj.exists():
        raise HTTPException(status_code=404, detail=f"File does not exist: {path_str}")

    media_type = "video/mp4"
    ext = path_obj.suffix.lower()
    if ext in [".mov", ".quicktime"]:
        media_type = "video/quicktime"
    elif ext in [".webm"]:
        media_type = "video/webm"
    elif ext in [".mkv"]:
        media_type = "video/x-matroska"
    elif ext in [".mp3"]:
        media_type = "audio/mpeg"
    elif ext in [".wav"]:
        media_type = "audio/wav"
    elif ext in [".vtt"]:
        media_type = "text/vtt"
    elif ext in [".srt"]:
        media_type = "text/plain"

    return FileResponse(
        path=str(path_obj),
        media_type=media_type,
        filename=path_obj.name
    )

@clips_router.get("/{clip_id}")
async def get_clip(clip_id: str, db: AsyncSession = Depends(get_db)):
    clip = await db.get(Clip, clip_id)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    return clip

@clips_router.get("/{clip_id}/stream")
async def stream_clip(clip_id: str, db: AsyncSession = Depends(get_db)):
    clip = await db.get(Clip, clip_id)
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    file_path = Path(clip.source_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Clip file not found on disk: {clip.source_path}")

    media_type = "video/mp4"
    ext = file_path.suffix.lower()
    if ext in [".mov", ".quicktime"]:
        media_type = "video/quicktime"
    elif ext in [".webm"]:
        media_type = "video/webm"
    elif ext in [".mkv"]:
        media_type = "video/x-matroska"

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=file_path.name
    )


