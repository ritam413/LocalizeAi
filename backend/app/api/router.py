from fastapi import APIRouter
from app.api.clips import clips_router
from app.api.presets import presets_router
from app.api.runs import runs_router
from app.api.stages import stages_router
from app.api.segments import segments_router
from app.api.artifacts import artifacts_router
from app.api.models import models_router
from app.api.settings import settings_router
from app.api.websocket import ws_router
from app.api.telemetry import telemetry_router
from app.api.demo import demo_router
from app.api.deliverables import deliverables_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(clips_router)
api_router.include_router(presets_router)
api_router.include_router(runs_router)
api_router.include_router(stages_router)
api_router.include_router(segments_router)
api_router.include_router(artifacts_router)
api_router.include_router(models_router)
api_router.include_router(settings_router)
api_router.include_router(telemetry_router)
api_router.include_router(demo_router)
api_router.include_router(deliverables_router)
