import pytest
import shutil
from pathlib import Path
from app.telemetry.events import TelemetryEvent, TelemetryLogger

@pytest.mark.asyncio
async def test_telemetry_event_validation():
    event = TelemetryEvent(
        job_id="test-job-1",
        scene_id="scene-01",
        agent="story_analyst",
        action="scene_analysis",
        decision="Identified 2 speakers and emotional arc.",
        latency_ms=250,
        retry_count=0,
        quality_score=92.0,
        status="ok"
    )
    assert event.job_id == "test-job-1"
    assert event.agent == "story_analyst"
    assert event.status == "ok"
    assert event.quality_score == 92.0

@pytest.mark.asyncio
async def test_telemetry_logger_persistence(tmp_path):
    logger = TelemetryLogger(base_storage_dir=str(tmp_path))
    
    e1 = TelemetryEvent(
        job_id="run-abc",
        scene_id="scene-1",
        agent="qa_agent",
        action="inspect_cut",
        decision="Found dialogue window overflow in line 4.",
        latency_ms=180,
        retry_count=0,
        quality_score=70.0,
        status="failed"
    )
    e2 = TelemetryEvent(
        job_id="run-abc",
        scene_id="scene-1",
        agent="sync_engineer",
        action="reconcile_timing",
        decision="Applied 1.15x speed adjust to fix overflow.",
        latency_ms=310,
        retry_count=1,
        quality_score=96.0,
        status="fixed"
    )

    await logger.log_event(e1)
    await logger.log_event(e2)

    events = await logger.get_events("run-abc")
    assert len(events) == 2
    assert events[0].status == "failed"
    assert events[1].status == "fixed"

    summary = await logger.get_summary("run-abc")
    assert summary["total_events"] == 2
    assert summary["total_retries"] == 1
    assert summary["defects_failed"] == 1
    assert summary["defects_fixed"] == 1
    assert summary["avg_quality_score"] == 83.0
