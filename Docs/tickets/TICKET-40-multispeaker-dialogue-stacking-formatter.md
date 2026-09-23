# TICKET-40: Multi-Speaker Overlapping Dialogue Stacking & Subtitle Formatter

## Status
- **State**: Ready for Implementation (Wayfinder Map Frontier)
- **Primary Seams**: `backend/app/engine/subtitle_formatter.py` (`split_text_into_lines`, `apply_qa_adjustments`)
- **Verification**: Pytest (`backend/tests/test_subtitle_stacking.py`)
- **Blocking Dependencies**: None
- **Downstream Blocked**: None

---

## Objective
Enable automatic stacking of simultaneous / multi-speaker dialogue turns into standard broadcast dual-line dash notation (`- Person 1\n- Person 2`) in `subtitle_formatter.py` without requiring explicit speaker-name prefixes or heavy diarization dependencies.

---

## Background & Broadcast Standard
When multiple characters speak concurrently or in rapid turn-taking within a single subtitle timecode:
- Broadcast subtitle standards (BBC / Netflix / EBU-TT) represent dual-speaker turns as:
  ```
  - Hey, watch out!
  - I'm trying to!
  ```
- If dialogue contains explicit turn cues (`- `, `\n-`, or dual punctuation sentences), `split_text_into_lines()` must preserve the two distinct dialogue lines and stack them over 2 lines while maintaining the 42 max characters per line boundary.

---

## Seams & Interfaces
- File: `backend/app/engine/subtitle_formatter.py`
  - Function: `split_text_into_lines(text: str, max_chars_per_line: int = 42) -> List[str]`
  - Logic:
    1. Check for multi-speaker indicators (` - `, `\n-`, or leading `-`).
    2. Split cleanly into 2 stacked lines prefixed with `- `.
    3. Truncate / wrap each line within `max_chars_per_line`.

---

## TDD Test Specification (Red -> Green)
Test Seam: `backend/tests/test_subtitle_stacking.py`

```python
import pytest
from app.engine.subtitle_formatter import split_text_into_lines, apply_qa_adjustments, format_srt

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
```

---

## Acceptance Criteria
1. `split_text_into_lines` cleanly separates dual-speaker dialogue into stacked lines (`- Speaker 1\n- Speaker 2`).
2. Each line complies with `max_chars_per_line=42`.
3. Standard single-speaker sentences continue to split naturally across 2 lines without unexpected dash additions.
4. Unit tests in `pytest backend/tests/test_subtitle_stacking.py` pass 100%.
