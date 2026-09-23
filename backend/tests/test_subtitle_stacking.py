import pytest
from app.engine.subtitle_formatter import split_text_into_lines, apply_qa_adjustments, format_srt, format_vtt

def test_split_text_into_lines_handles_dialogue_dashes():
    raw_text = "- Where are you going? - To the store."
    lines = split_text_into_lines(raw_text, max_chars_per_line=42)
    assert len(lines) == 2
    assert lines[0] == "- Where are you going?"
    assert lines[1] == "- To the store."

def test_split_text_into_lines_handles_multiline_dashes():
    raw_text = "- Stop right there!\n- I can't!"
    lines = split_text_into_lines(raw_text, max_chars_per_line=42)
    assert len(lines) == 2
    assert lines[0] == "- Stop right there!"
    assert lines[1] == "- I can't!"

def test_split_text_into_lines_respects_max_chars():
    long_line = "- This is a very very very very very very long sentence that exceeds forty two characters - Short reply"
    lines = split_text_into_lines(long_line, max_chars_per_line=42)
    assert len(lines) == 2
    assert len(lines[0]) <= 42
    assert len(lines[1]) <= 42

def test_apply_qa_adjustments_formats_stacked_subtitles():
    segments = [
        {
            "start_s": 1.0,
            "end_s": 3.5,
            "source_text": "- Hello! - Hey how are you?",
        }
    ]
    adjusted = apply_qa_adjustments(segments, max_chars_per_line=42)
    assert len(adjusted) == 1
    assert "\n" in adjusted[0]["formatted_text"]
    lines = adjusted[0]["formatted_text"].split("\n")
    assert lines[0].startswith("- ")
    assert lines[1].startswith("- ")
