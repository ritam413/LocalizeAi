from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import Artifact

artifacts_router = APIRouter(prefix="/runs/{run_id}", tags=["Artifacts"])

@artifacts_router.get("/artifacts")
async def list_artifacts(run_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Artifact).where(Artifact.run_id == run_id))
    return res.scalars().all()

@artifacts_router.get("/artifacts/{artifact_id}/download")
async def download_artifact(run_id: str, artifact_id: str, db: AsyncSession = Depends(get_db)):
    artifact = await db.get(Artifact, artifact_id)
    if not artifact or artifact.run_id != run_id:
        raise HTTPException(status_code=404, detail="Artifact not found")

    file_path = Path(artifact.path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File on disk not found")

    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type="application/octet-stream"
    )

@artifacts_router.get("/output")
async def get_run_output(run_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Artifact).where(Artifact.run_id == run_id, Artifact.type.in_(["subtitle", "video", "audio"]))
    )
    artifacts = res.scalars().all()
    return {
        "run_id": run_id,
        "outputs": artifacts
    }
