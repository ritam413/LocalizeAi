import pytest
from app.agents.localization_director import (
    LocalizationDirectorAgent,
    estimate_syllables,
    calculate_syllable_budget,
    parse_rework_reduction,
)
from app.telemetry.events import telemetry_logger

def test_estimate_syllables_multilingual():
    # English
    assert estimate_syllables("Hello world", "en") == 3
    assert estimate_syllables("Don't count your chickens before they hatch", "en") == 9

    # Spanish
    assert estimate_syllables("No vendas la piel del oso", "es") == 8
    assert estimate_syllables("Ten mucho cuidado", "es") >= 5

    # French
    assert estimate_syllables("Ne vends pas la mèche", "fr") >= 5

    # German
    assert estimate_syllables("Plaudere nicht alles aus", "de") >= 6

    # Hindi (Devanagari aksharas: ह-वा में म-ह-ल म-त ब-ना-ओ)
    hi_text = "हवा में महल मत बनाओ"
    assert estimate_syllables(hi_text, "hi") == 11

    # Edge cases
    assert estimate_syllables("", "en") == 0
    assert estimate_syllables("   ", "es") == 0

def test_calculate_syllable_budget():
    # 1 second duration
    target, max_b = calculate_syllable_budget(0.0, 1.0, rate=3.2)
    assert target == 3
    assert max_b == 4

    # 3.3 seconds duration
    target_3s, max_3s = calculate_syllable_budget(0.5, 3.8, rate=3.2)
    assert target_3s == 11
    assert max_3s == 12

    # Parse rework reduction
    assert parse_rework_reduction("Reduce line 1 by 4 syllables", 1) == 4
    assert parse_rework_reduction("Reduce segment 2 by 3 syllables", 2) == 3
    assert parse_rework_reduction({1: 4}, 1) == 4
    assert parse_rework_reduction({"segment_id": 1, "delta_syllables": 5}, 1) == 5

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
    assert line["target_budget"] > 0
    assert line["syllable_count"] > 0
    assert "isochrony_ratio" in line
    assert "isochrony_score" in result
    assert result["isochrony_score"] > 0.0

    events = await telemetry_logger.get_events("test-job-loc")
    assert len(events) >= 1
    assert events[-1].agent == "localization_director"
    assert events[-1].status == "ok"

@pytest.mark.asyncio
async def test_localization_director_quantitative_rework_reduction():
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
        ],
        "rework_instructions": "Reduce line 1 by 4 syllables due to 0.4s timing overflow."
    }

    result = await agent.run(job_id="test-job-loc-rework", scene_id="scene-01", context=context)
    line = result["localized_lines"][0]

    # Target budget was originally 11, with 4 syllables reduction -> 7
    assert line["target_budget"] == 7
    # Compact adaptation selected
    assert line["translated_text"] == "हवा में महल मत बनाओ।"
    assert line["syllable_count"] == 11

