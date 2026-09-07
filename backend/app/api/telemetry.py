from fastapi import APIRouter, Query, Response
from typing import List, Dict, Any
from app.telemetry.events import telemetry_logger, TelemetryEvent
from app.telemetry.grafana_mcp import grafana_mcp

telemetry_router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@telemetry_router.get("/events")
async def get_telemetry_events(job_id: str = Query(...)) -> List[TelemetryEvent]:
    return await telemetry_logger.get_events(job_id)

@telemetry_router.get("/summary")
async def get_telemetry_summary(job_id: str = Query(...)) -> Dict[str, Any]:
    return await telemetry_logger.get_summary(job_id)

@telemetry_router.get("/metrics")
async def get_prometheus_metrics(job_id: str = Query(...)) -> Response:
    content = await grafana_mcp.export_prometheus_metrics(job_id)
    return Response(content=content, media_type="text/plain")

@telemetry_router.get("/defect_rate")
async def get_defect_rate(job_id: str = Query(...)) -> Dict[str, Any]:
    return await grafana_mcp.query_defect_rate(job_id)
