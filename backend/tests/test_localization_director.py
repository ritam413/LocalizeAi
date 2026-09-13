import pytest
from app.agents.localization_director import (
    LocalizationDirectorAgent,
    estimate_syllables,
    calculate_syllable_budget,
    parse_rework_reduction,
)
from app.engine.localization.entity_preserver import (
    extract_proper_nouns,
    protect_entities,
    restore_entities,
)
from app.engine.localization.numeral_localizer import (
    adapt_spoken_numerals,
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

def test_entity_preserver_extraction_and_masking():
    text = "We built the demo using Claude Code, Supabase, and tested with Vitest."
    entities = extract_proper_nouns(text)
    assert "Claude Code" in entities
    assert "Supabase" in entities
    assert "Vitest" in entities

    # Custom glossary lock
    custom_text = "Afan Mustafa launched Zenith Chat on GitHub."
    custom_entities = extract_proper_nouns(custom_text, custom_entities=["Zenith Chat", "Afan Mustafa"])
    assert "Afan Mustafa" in custom_entities
    assert "Zenith Chat" in custom_entities
    assert "GitHub" in custom_entities

    # Masking and restoration
    masked, entity_map = protect_entities(text, entities)
    assert "Claude Code" not in masked
    assert "__ENT_0__" in masked

    restored = restore_entities(masked, entity_map)
    assert restored == text

def test_numeral_localizer_multilingual():
    # Hindi
    hi_text = "हमने 2.4k सितारे और 10M डाउनलोड हासिल किए"
    hi_adapted, hi_notes = adapt_spoken_numerals(hi_text, "hi")
    assert "2.4 हज़ार" in hi_adapted
    assert "10 मिलियन" in hi_adapted
    assert len(hi_notes) == 2

    # Spanish
    es_text = "Tenemos 2.4k usuarios y 1M de suscriptores"
    es_adapted, es_notes = adapt_spoken_numerals(es_text, "es")
    assert "2.4 mil" in es_adapted
    assert "1 millón" in es_adapted
    assert len(es_notes) == 2

    # French
    fr_text = "Nous avons 100k membres et 2.5m de vues"
    fr_adapted, fr_notes = adapt_spoken_numerals(fr_text, "fr")
    assert "100 mille" in fr_adapted
    assert "2,5 millions" in fr_adapted

    # German
    de_text = "Mehr als 50k Entwickler und 10M Aufrufe"
    de_adapted, de_notes = adapt_spoken_numerals(de_text, "de")
    assert "50 Tausend" in de_adapted
    assert "10 Millionen" in de_adapted

@pytest.mark.asyncio
async def test_localization_director_with_proper_nouns_and_numerals():
    agent = LocalizationDirectorAgent()
    context = {
        "target_language": "hi",
        "audience_profile": "Indian tech developer community",
        "glossary_locks": ["Zenith Chat", "Afan Mustafa"],
        "annotated_segments": [
            {
                "segment_id": 1,
                "speaker_id": "speaker_1",
                "start_s": 0.0,
                "end_s": 4.0,
                "source_text": "Afan Mustafa shipped Zenith Chat on Claude Code with 2.4k GitHub stars.",
                "tone_tags": ["enthusiastic"],
                "cultural_flags": []
            }
        ]
    }

    result = await agent.run(job_id="test-job-proper-nouns", scene_id="scene-01", context=context)

    assert result["target_language"] == "hi"
    assert len(result["localized_lines"]) == 1
    line = result["localized_lines"][0]

    # Check that proper nouns are intact in translated text
    assert "Afan Mustafa" in line["translated_text"]
    assert "Zenith Chat" in line["translated_text"]
    assert "Claude Code" in line["translated_text"]
    assert "GitHub" in line["translated_text"]

    # Check that 2.4k was adapted for spoken Hindi dubbing
    assert ("2.4 हज़ार" in line["translated_text"] or "2.4 hazar" in line["translated_text"])
    assert "Preserved proper nouns" in line["rationale"]
    assert "Adapted spoken numerals" in line["rationale"]
    assert "Afan Mustafa" in line["preserved_entities"]
    assert len(line["numeral_adaptations"]) >= 1

    assert "decision" in result
    assert "Preserved" in result["decision"]
    assert "Adapted" in result["decision"]

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
