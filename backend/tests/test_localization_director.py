import pytest
from app.agents.localization_director import LocalizationDirectorAgent
from app.telemetry.events import telemetry_logger

@pytest.mark.asyncio
async def test_localization_director_idiom_adaptation():
    agent = LocalizationDirectorAgent()
    context = {
        "target_language": "hi",
        "audience_profile": "Urban Hindi youth",
        "annotated_segments": [
            {
                "segment_id": 1,
                "speaker_id": "speaker_1",
                "start_s": 0.5,
                "end_s": 3.8,
                "source_text": "Don't count your chickens before they hatch.",
                "tone_tags": ["warning"],
                "cultural_flags": ["idiom: chickens before they hatch"]
            }
        ]
    }

    result = await agent.run(job_id="test-job-loc", scene_id="scene-01", context=context)

    assert result["target_language"] == "hi"
    assert len(result["localized_lines"]) == 1
    line = result["localized_lines"][0]
    assert "हवा में महल मत बनाओ" in line["translated_text"]
    assert "hawa mein mahal mat banao" in line["rationale"]
    assert line["character_count"] == len(line["translated_text"])

    events = await telemetry_logger.get_events("test-job-loc")
    assert len(events) >= 1
    assert events[-1].agent == "localization_director"
    assert events[-1].status == "ok"
