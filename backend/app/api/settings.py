from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import Setting

settings_router = APIRouter(prefix="/settings", tags=["Settings"])

@settings_router.get("")
async def get_settings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Setting).where(Setting.id == 1))
    setting = res.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Settings not found")
    return setting

@settings_router.patch("")
async def update_settings(payload: dict, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Setting).where(Setting.id == 1))
    setting = res.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Settings not found")

    for key, val in payload.items():
        if hasattr(setting, key):
            setattr(setting, key, val)

    await db.commit()
    await db.refresh(setting)
    return setting
