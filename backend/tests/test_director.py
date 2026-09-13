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
    assert "vtt_path" in result

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


@pytest.mark.asyncio
async def test_director_targeted_retry_quantitative_syllable_routing(tmp_path, monkeypatch):
    """
    Test that when QA flags a severe TIMING_OVERFLOW defect with syllables_to_reduce > 0,
    the Director dispatches targeted retry directly to LocalizationDirectorAgent with
    exact rework_instructions, which selects a compact translation and completes QA cleanly.
    """
    director = DirectorAgent(base_storage_dir=str(tmp_path))

    # Mock initial QA run to return a TIMING_OVERFLOW defect requiring 4 syllables reduction
    original_qa_run = director.qa_agent.run
    qa_call_count = 0

    async def mock_qa_run(job_id, scene_id, context, retry_count=0):
        nonlocal qa_call_count
        qa_call_count += 1
        if qa_call_count == 1:
            return {
                "job_id": job_id,
                "release_readiness_score": 73.0,
                "verdict": "rework_required",
                "defect_count": 1,
                "findings": [
                    {
                        "finding_id": f"qa-{job_id}-1",
                        "scene_id": scene_id,
                        "segment_id": 1,
                        "target_segment_id": 1,
                        "timestamp_s": 3.3,
                        "defect_type": "TIMING_OVERFLOW",
                        "severity": "critical",
                        "syllables_to_reduce": 4,
                        "target_agent": "localization_director",
                        "description": "Dialogue exceeds visual speech window by 1.2s",
                        "recommended_fix": "Shorten localized line by 4 syllable(s) to fit 3.30s dialogue window.",
                        "fix_applied": False,
                    }
                ],
                "decision": "QA flagged TIMING_OVERFLOW. Rework required.",
                "quality_score": 73.0,
            }
        # Subsequent runs pass
        return {
            "job_id": job_id,
            "release_readiness_score": 96.0,
            "verdict": "pass",
            "defect_count": 0,
            "findings": [],
            "decision": "QA Agent approved release candidate with score 96.0/100.",
            "quality_score": 96.0,
        }

    monkeypatch.setattr(director.qa_agent, "run", mock_qa_run)

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

    result = await director.run(job_id="test-job-director-rework", scene_id="scene-01", context=context)

    assert result["status"] == "completed"
    assert result["retries_executed"] == 1
    assert result["release_readiness_score"] == 96.0
    assert len(result["repaired_defects"]) == 1
    assert result["repaired_defects"][0]["fix_applied"] is True
    assert result["repaired_defects"][0]["syllables_to_reduce"] == 4
