from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import Preset

presets_router = APIRouter(prefix="/presets", tags=["Presets"])

@presets_router.get("")
async def list_presets(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Preset).order_by(Preset.created_at.desc()))
    return res.scalars().all()

@presets_router.get("/{preset_id}")
async def get_preset(preset_id: str, db: AsyncSession = Depends(get_db)):
    preset = await db.get(Preset, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    return preset

@presets_router.post("")
async def create_preset(payload: dict, db: AsyncSession = Depends(get_db)):
    preset = Preset(
        name=payload["name"],
        project_mode=payload.get("project_mode", "C"),
        is_builtin=False,
        stage_config_json=payload.get("stage_config_json", "{}"),
        qa_thresholds_json=payload.get("qa_thresholds_json")
    )
    db.add(preset)
    await db.commit()
    await db.refresh(preset)
    return preset
