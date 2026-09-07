import pytest
from app.agents.qa_agent import QAContinuityAgent
from app.telemetry.events import telemetry_logger

@pytest.mark.asyncio
async def test_qa_agent_defect_detection_and_fix_proposal():
    agent = QAContinuityAgent(min_readiness_threshold=85.0)
    context = {
        "stems": [
            {
                "segment_id": 7,
                "duration_s": 4.6,
                "target_window_s": 3.2 # 1.4s overflow!
            }
        ]
    }

    result = await agent.run(job_id="test-job-qa", scene_id="scene_07", context=context)

    assert result["verdict"] == "rework_required"
    assert result["defect_count"] == 1
    assert result["release_readiness_score"] < 80.0

    finding = result["findings"][0]
    assert finding["defect_type"] == "TIMING_OVERFLOW"
    assert finding["target_agent"] == "sync_engineer"
    assert "exceeds speech window by 1.40s" in finding["description"]
    assert "atempo" in finding["recommended_fix"]

    events = await telemetry_logger.get_events("test-job-qa")
    assert len(events) >= 1
    assert events[-1].agent == "qa_agent"
    assert events[-1].status == "ok" # agent ran successfully (its finding returned verdict rework_required)
