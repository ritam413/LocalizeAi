from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import ModelRegistry

models_router = APIRouter(prefix="/models", tags=["Models"])

@models_router.get("")
async def list_models(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ModelRegistry))
    return res.scalars().all()

@models_router.get("/{model_id}")
async def get_model(model_id: str, db: AsyncSession = Depends(get_db)):
    model = await db.get(ModelRegistry, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model
