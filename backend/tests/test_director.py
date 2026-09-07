import pytest
from app.agents.director import DirectorAgent
from app.telemetry.events import telemetry_logger

@pytest.mark.asyncio
async def test_director_orchestration_and_targeted_retry(tmp_path):
    director = DirectorAgent(base_storage_dir=str(tmp_path))
    context = {
        "target_language": "hi",
        "audience_profile": "Urban Hindi youth",
        "segments": [
            {
                "start_s": 0.5,
                "end_s": 3.8,
                "source_text": "Don't count your chickens before they hatch."
            }
        ]
    }

    result = await director.run(job_id="test-job-director", scene_id="scene-01", context=context)

    # Asserts that full pipeline ran
    assert result["status"] == "completed"
    assert result["release_readiness_score"] >= 85.0
    assert result["iterations"] >= 1
    assert "srt_path" in result

    # Check telemetry contains records from all agents
    events = await telemetry_logger.get_events("test-job-director")
    agent_names = {e.agent for e in events}
    assert "story_analyst" in agent_names
    assert "localization_director" in agent_names
    assert "voice_director" in agent_names
    assert "sync_engineer" in agent_names
    assert "subtitle_director" in agent_names
    assert "qa_agent" in agent_names
    assert "director" in agent_names
