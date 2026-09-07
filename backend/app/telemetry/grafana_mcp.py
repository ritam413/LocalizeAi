from typing import Dict, Any, List
from app.telemetry.events import telemetry_logger, TelemetryEvent

class GrafanaMcpAdapter:
    """
    Exposes MCP tool endpoints for Grafana telemetry inspection at runtime.
    Allows Director and Ops agents to query live performance metrics.
    """
    def __init__(self):
        self.logger = telemetry_logger

    async def query_stage_latency(self, job_id: str) -> List[Dict[str, Any]]:
        events = await self.logger.get_events(job_id)
        return [
            {
                "agent": e.agent,
                "latency_seconds": round(e.latency_ms / 1000.0, 3),
                "timestamp": e.timestamp
            }
            for e in events
        ]

    async def query_defect_rate(self, job_id: str) -> Dict[str, Any]:
        summary = await self.logger.get_summary(job_id)
        total = summary["total_events"]
        defects = summary["defects_failed"]
        fixed = summary["defects_fixed"]
        rate = round((defects / total) * 100.0, 1) if total > 0 else 0.0

        return {
            "job_id": job_id,
            "total_events": total,
            "defects_detected": defects,
            "defects_repaired": fixed,
            "defect_percentage": rate,
            "avg_quality_score": summary["avg_quality_score"]
        }

    async def export_prometheus_metrics(self, job_id: str) -> str:
        events = await self.logger.get_events(job_id)
        lines = [
            "# HELP agent_latency_seconds Latency per agent execution",
            "# TYPE agent_latency_seconds gauge",
        ]
        for e in events:
            lines.append(f'agent_latency_seconds{{agent="{e.agent}",job_id="{e.job_id}"}} {e.latency_ms / 1000.0:.2f}')

        lines.extend([
            "# HELP agent_quality_score Quality score evaluated per stage (0-100)",
            "# TYPE agent_quality_score gauge",
        ])
        for e in events:
            lines.append(f'agent_quality_score{{agent="{e.agent}",job_id="{e.job_id}"}} {e.quality_score:.1f}')

        return "\n".join(lines)

grafana_mcp = GrafanaMcpAdapter()
