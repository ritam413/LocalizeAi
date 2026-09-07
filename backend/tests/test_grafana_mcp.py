import pytest
from app.telemetry.events import TelemetryEvent, TelemetryLogger
from app.telemetry.grafana_mcp import GrafanaMcpAdapter

@pytest.mark.asyncio
async def test_grafana_mcp_query_adapter(tmp_path):
    logger = TelemetryLogger(base_storage_dir=str(tmp_path))
    adapter = GrafanaMcpAdapter()
    adapter.logger = logger

    e1 = TelemetryEvent(
        job_id="job-grafana-test",
        scene_id="scene-01",
        agent="story_analyst",
        action="analyze",
        decision="Extracted speakers",
        latency_ms=120,
        retry_count=0,
        quality_score=95.0,
        status="ok"
    )
    e2 = TelemetryEvent(
        job_id="job-grafana-test",
        scene_id="scene-01",
        agent="qa_agent",
        action="inspect",
        decision="Detected timing defect",
        latency_ms=180,
        retry_count=0,
        quality_score=70.0,
        status="failed"
    )

    await logger.log_event(e1)
    await logger.log_event(e2)

    latency_records = await adapter.query_stage_latency("job-grafana-test")
    assert len(latency_records) == 2
    assert latency_records[0]["agent"] == "story_analyst"
    assert latency_records[0]["latency_seconds"] == 0.12

    defect_summary = await adapter.query_defect_rate("job-grafana-test")
    assert defect_summary["total_events"] == 2
    assert defect_summary["defects_detected"] == 1
    assert defect_summary["defect_percentage"] == 50.0

    prom_text = await adapter.export_prometheus_metrics("job-grafana-test")
    assert 'agent_latency_seconds{agent="story_analyst",job_id="job-grafana-test"} 0.12' in prom_text
    assert 'agent_quality_score{agent="qa_agent",job_id="job-grafana-test"} 70.0' in prom_text
