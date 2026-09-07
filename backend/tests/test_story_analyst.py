import pytest
from app.agents.story_analyst import StoryAnalystAgent
from app.telemetry.events import telemetry_logger

@pytest.mark.asyncio
async def test_story_analyst_execution():
    agent = StoryAnalystAgent()
    context = {
        "segments": [
            {"start_s": 0.0, "end_s": 3.0, "source_text": "Don't count your chickens before they hatch!"},
            {"start_s": 3.5, "end_s": 6.0, "source_text": "Why are you asking me?"}
        ]
    }

    result = await agent.run(job_id="test-job-sa", scene_id="scene-01", context=context)

    assert "speakers" in result
    assert len(result["speakers"]) == 2
    assert "scenes" in result
    assert "annotated_segments" in result
    assert len(result["annotated_segments"]) == 2

    # Check idiom detection
    assert any("idiom: chickens before they hatch" in s["cultural_flags"] for s in result["annotated_segments"])
    # Check tone tags
    assert "urgent" in result["annotated_segments"][0]["tone_tags"]
    assert "inquisitive" in result["annotated_segments"][1]["tone_tags"]

    # Verify telemetry was logged
    events = await telemetry_logger.get_events("test-job-sa")
    assert len(events) >= 1
    assert events[-1].agent == "story_analyst"
    assert events[-1].status == "ok"
