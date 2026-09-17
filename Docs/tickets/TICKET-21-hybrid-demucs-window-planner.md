# TICKET-21: Hybrid Speech Clustering & VAD-Guided Macro-Window Generator

**Status:** Planned  
**Parent Epic:** Selective Windowed Demucs Vocal Separation  
**Primary Seam:** `backend/app/engine/stages/demucs_window_planner.py`  
**Test Suite:** `backend/tests/test_demucs_window_planner.py`  
**Dependencies:** TICKET-20  

---

## 1. Context & Motivation
Advanced users should be able to manually specify time ranges (e.g. `04:15-08:30, 22:00-31:15`), but by default (following Minimalist/YAGNI principles), the system should automatically inspect Faster-Whisper / VAD speech timestamps, cluster adjacent dialogue lines into macro-windows, and generate the optimal Demucs separation ranges with zero user effort.

## 2. Specification & Requirements

1. **Auto Macro-Window Clusterer (`generate_auto_demucs_windows`)**:
   - Takes Whisper transcript segments `[{start: float, end: float, ...}]`.
   - Groups dialogue segments occurring within `min_gap_sec=4.0` seconds of each other into unified macro-intervals.
   - Appends `padding_sec=1.5` pre-roll and post-roll to each interval.
   - Merges any resulting overlapping intervals to prevent redundant processing.

2. **Manual Range Parser & Validator (`parse_custom_time_ranges`)**:
   - Parses user-provided strings: `00:04:15 - 00:08:30, 22:00 - 31:15` or raw float seconds `255-510, 1320-1875`.
   - Handles malformed syntax, clamps bounds to total video duration, and sorts intervals deterministically.

3. **Hybrid Resolver (`resolve_demucs_windows`)**:
   - If `custom_ranges` is non-empty, validates and uses custom ranges.
   - If `custom_ranges` is empty, generates auto-clustered ranges from transcription segments.
   - Calculates and returns `total_demucs_seconds`, `saved_seconds`, and `efficiency_ratio`.

## 3. Verification Criteria
- [ ] Unit tests for auto-clustering (disjoint intervals, dense speech merging, edge padding).
- [ ] Unit tests for string timecode parsing (MM:SS, HH:MM:SS, seconds, whitespace tolerance).
- [ ] Out-of-bounds error handling and overlap deduplication.
