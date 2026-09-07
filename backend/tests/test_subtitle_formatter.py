import pytest
from app.engine.subtitle_formatter import (
    apply_qa_adjustments,
    validate_subtitles,
    format_srt,
    format_vtt,
    seconds_to_srt_time,
    split_text_into_lines,
    purge_hallucinations,
    deduplicate_segments,
    merge_micro_segments,
    clean_segments,
)

def test_seconds_to_srt_time():
    assert seconds_to_srt_time(0.0) == "00:00:00,000"
    assert seconds_to_srt_time(61.5) == "00:01:01,500"
    assert seconds_to_srt_time(3665.123) == "01:01:05,123"

def test_split_text_into_lines():
    short_text = "Hello world"
    lines = split_text_into_lines(short_text, max_chars_per_line=42)
    assert len(lines) == 1
    assert lines[0] == "Hello world"

    long_text = "This is a much longer subtitle sentence that exceeds forty two characters in a single line"
    lines = split_text_into_lines(long_text, max_chars_per_line=42)
    assert len(lines) == 2
    assert len(lines[0]) <= 42

def test_qa_min_duration():
    segments = [
        {"id": "s1", "start_s": 0.0, "end_s": 0.5, "source_text": "Short duration line"}
    ]
    # Check validation detects violation
    violations = validate_subtitles(segments, min_duration_s=1.0)
    assert any(v["type"] == "min_duration" for v in violations)

    # Check adjustment fixes duration
    adjusted = apply_qa_adjustments(segments, min_duration_s=1.0)
    assert adjusted[0]["end_s"] - adjusted[0]["start_s"] >= 1.0

def test_qa_min_gap():
    segments = [
        {"id": "s1", "start_s": 0.0, "end_s": 2.0, "source_text": "First line"},
        {"id": "s2", "start_s": 2.02, "end_s": 4.0, "source_text": "Second line"} # 20ms gap (< 100ms)
    ]
    violations = validate_subtitles(segments, min_gap_ms=100)
    assert any(v["type"] == "min_gap" for v in violations)

    adjusted = apply_qa_adjustments(segments, min_gap_ms=100)
    gap = adjusted[1]["start_s"] - adjusted[0]["end_s"]
    assert gap >= 0.099 # 100ms within float precision

def test_qa_max_cps():
    segments = [
        # 100 chars in 1 second = 100 CPS (> 17 CPS)
        {"id": "s1", "start_s": 0.0, "end_s": 1.0, "source_text": "A" * 100}
    ]
    violations = validate_subtitles(segments, max_cps=17.0)
    assert any(v["type"] == "max_cps" for v in violations)

def test_format_srt_and_vtt():
    segments = [
        {"start_s": 0.0, "end_s": 2.0, "formatted_text": "Line one\nLine two"}
    ]
    srt = format_srt(segments)
    assert "1" in srt
    assert "00:00:00,000 --> 00:00:02,000" in srt
    assert "Line one\nLine two" in srt

    vtt = format_vtt(segments)
    assert "WEBVTT" in vtt
    assert "00:00:00.000 --> 00:00:02.000" in vtt


# ─────────────────────────────────────────────────────────────────────────── #
#  Tests for ADR 0001 — action-scene post-processing                         #
# ─────────────────────────────────────────────────────────────────────────── #

def test_purge_hallucinations_removes_known_phantoms():
    segments = [
        {"start_s": 0.0, "end_s": 2.0, "source_text": "Thank you for watching"},
        {"start_s": 2.5, "end_s": 5.0, "source_text": "Subtitles by amara.org"},
        {"start_s": 5.5, "end_s": 8.0, "source_text": "He drew his sword."},
    ]
    clean = purge_hallucinations(segments)
    assert len(clean) == 1
    assert clean[0]["source_text"] == "He drew his sword."


def test_purge_hallucinations_removes_empty_text():
    segments = [
        {"start_s": 0.0, "end_s": 2.0, "source_text": "   "},
        {"start_s": 2.5, "end_s": 5.0, "source_text": "Real line here."},
    ]
    clean = purge_hallucinations(segments)
    assert len(clean) == 1


def test_deduplicate_segments_collapses_fight_loop():
    # Whisper often repeats the same line 3× during fight audio
    segments = [
        {"start_s": 1.0, "end_s": 3.0, "source_text": "Come on!"},
        {"start_s": 3.1, "end_s": 5.0, "source_text": "Come on!"},
        {"start_s": 5.1, "end_s": 7.0, "source_text": "Come on!"},
        {"start_s": 7.5, "end_s": 9.0, "source_text": "You can't beat me."},
    ]
    deduped = deduplicate_segments(segments)
    assert len(deduped) == 2
    # The retained segment should span through the last duplicate
    assert deduped[0]["end_s"] == pytest.approx(7.0)
    assert deduped[1]["source_text"] == "You can't beat me."


def test_deduplicate_preserves_distinct_lines():
    segments = [
        {"start_s": 0.0, "end_s": 2.0, "source_text": "First."},
        {"start_s": 2.5, "end_s": 4.5, "source_text": "Second."},
        {"start_s": 5.0, "end_s": 7.0, "source_text": "Third."},
    ]
    deduped = deduplicate_segments(segments)
    assert len(deduped) == 3


def test_merge_micro_segments_absorbs_short_bursts():
    # A 0.1 s micro burst followed by a full segment
    segments = [
        {"start_s": 2.0, "end_s": 2.1, "source_text": "Ah"},   # micro
        {"start_s": 2.5, "end_s": 5.0, "source_text": "Watch out!"},
    ]
    merged = merge_micro_segments(segments, micro_duration_s=0.3)
    assert len(merged) == 1
    # Full segment start should be pulled back to the micro's start
    assert merged[0]["start_s"] == pytest.approx(2.0)
    assert "Watch out!" in merged[0]["source_text"]


def test_merge_micro_trailing_extends_last():
    segments = [
        {"start_s": 0.0, "end_s": 3.0, "source_text": "Main line."},
        {"start_s": 3.5, "end_s": 3.6, "source_text": "Uh"},  # trailing micro
    ]
    merged = merge_micro_segments(segments, micro_duration_s=0.3)
    assert len(merged) == 1
    assert merged[0]["end_s"] == pytest.approx(3.6)


def test_clean_segments_full_pipeline():
    """Integration: hallucination + dedup + micro-merge + QA on a dirty batch."""
    segments = [
        {"start_s": 0.0, "end_s": 2.0, "source_text": "Thank you for watching"},   # phantom
        {"start_s": 2.5, "end_s": 5.0, "source_text": "Fight!"},
        {"start_s": 5.1, "end_s": 7.0, "source_text": "Fight!"},                   # dupe
        {"start_s": 7.3, "end_s": 7.4, "source_text": "Ugh"},                      # micro
        {"start_s": 7.5, "end_s": 10.0, "source_text": "It ends here."},
    ]
    result = clean_segments(segments, min_gap_ms=100, min_duration_s=1.0)
    # Phantom removed → 4 remain. Dupe collapsed → 3. Micro merged → 2.
    assert len(result) == 2
    assert result[0]["source_text"] == "Fight!"
    assert "It ends here." in result[1]["source_text"]
    # All durations >= 1.0 after QA pass
    for seg in result:
        assert seg["end_s"] - seg["start_s"] >= 1.0
