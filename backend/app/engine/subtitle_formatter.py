"""
subtitle_formatter.py — DubForge Studio
========================================
Post-processing pipeline for ASR output before SRT/VTT export.

Processing order (call clean_segments() for the full pipeline):
  1. purge_hallucinations()   — strip known Whisper phantom strings
  2. deduplicate_segments()   — collapse consecutive identical lines (fight-scene loops)
  3. merge_micro_segments()   — absorb segments shorter than MIN_MICRO_DURATION_S
  4. apply_qa_adjustments()   — enforce min duration, min gap, line splitting
  5. validate_subtitles()     — return QA violations (does NOT mutate segments)
  6. format_srt() / format_vtt()
"""

import re
import math
from typing import List, Dict, Any, Tuple

# ─────────────────────────────────────────────────────────────────────────── #
#  Constants                                                                  #
# ─────────────────────────────────────────────────────────────────────────── #

MIN_MICRO_DURATION_S: float = 0.3
"""Segments shorter than this are merged into the next segment."""

# Known Whisper hallucination patterns (case-insensitive substring or regex).
# Extend this list as new phantoms are observed in the wild.
_HALLUCINATION_SUBSTRINGS: Tuple[str, ...] = (
    "thank you for watching",
    "thanks for watching",
    "subtitles by",
    "subtitle by",
    "subscribed to",
    "subscribe to",
    "like and subscribe",
    "please subscribe",
    "www.",
    ".com",
    "♪",
    "[ music ]",
    "[music]",
    "[ applause ]",
    "[applause]",
    "amara.org",
    "opensubtitles",
    "addic7ed",
    "subscene",
    "wizards in winter",
)

_HALLUCINATION_REGEX: re.Pattern = re.compile(
    "|".join(re.escape(p) for p in _HALLUCINATION_SUBSTRINGS),
    flags=re.IGNORECASE,
)


# ─────────────────────────────────────────────────────────────────────────── #
#  Public pipeline entry-point                                               #
# ─────────────────────────────────────────────────────────────────────────── #

def clean_segments(
    segments: List[Dict[str, Any]],
    min_gap_ms: int = 100,
    min_duration_s: float = 1.0,
    max_chars_per_line: int = 42,
    micro_duration_s: float = MIN_MICRO_DURATION_S,
) -> List[Dict[str, Any]]:
    """
    Full cleaning pipeline in one call:
      hallucination purge → deduplication → micro-merge → QA adjustments.
    Returns a list of cleaned, QA-adjusted segments ready for SRT/VTT export.
    """
    segs = purge_hallucinations(segments)
    segs = deduplicate_segments(segs)
    segs = merge_micro_segments(segs, micro_duration_s)
    segs = apply_qa_adjustments(segs, min_gap_ms, min_duration_s, max_chars_per_line)
    return segs


# ─────────────────────────────────────────────────────────────────────────── #
#  1. Hallucination purge                                                     #
# ─────────────────────────────────────────────────────────────────────────── #

def purge_hallucinations(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove segments whose text matches known Whisper phantom patterns.
    Also removes segments with empty or whitespace-only text.
    """
    clean = []
    for seg in segments:
        text = (seg.get("source_text") or "").strip()
        if not text:
            continue
        if _HALLUCINATION_REGEX.search(text):
            continue
        clean.append(seg)
    return clean


# ─────────────────────────────────────────────────────────────────────────── #
#  2. Deduplication                                                           #
# ─────────────────────────────────────────────────────────────────────────── #

def deduplicate_segments(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Collapse runs of consecutive segments with identical normalised text.

    Whisper commonly loops the same line during action sequences
    (explosions, punches, fight scenes) when non-speech noise reaches the model.
    We keep the original valid occurrence and discard duplicate loop hits.
    To prevent a subtitle from staying on screen forever during a fight scene,
    we cap the extended end_s to (start_s + MAX_DEDUP_DURATION_S).
    """
    if not segments:
        return segments

    MAX_DEDUP_DURATION_S = 8.0  # Max duration for a deduplicated segment

    result: List[Dict[str, Any]] = []
    current = dict(segments[0])

    for seg in segments[1:]:
        if _normalise(seg) == _normalise(current):
            # Cap end_s so action scene loops don't lock the subtitle on screen
            max_end = current["start_s"] + MAX_DEDUP_DURATION_S
            proposed_end = max(current.get("end_s", current["start_s"]), seg.get("end_s", current["start_s"]))
            current["end_s"] = min(proposed_end, max(current.get("end_s", current["start_s"]), max_end))
        else:
            result.append(current)
            current = dict(seg)

    result.append(current)
    return result


def _normalise(seg: Dict[str, Any]) -> str:
    """Lower-case, strip punctuation/whitespace for dedup comparison."""
    text = (seg.get("source_text") or seg.get("translated_text") or "").lower()
    return re.sub(r"[^a-z0-9\u00c0-\uffff]", "", text)


# ─────────────────────────────────────────────────────────────────────────── #
#  3. Micro-segment merge                                                     #
# ─────────────────────────────────────────────────────────────────────────── #

def merge_micro_segments(
    segments: List[Dict[str, Any]],
    micro_duration_s: float = MIN_MICRO_DURATION_S,
) -> List[Dict[str, Any]]:
    """
    Absorb segments shorter than *micro_duration_s* into the next segment.

    Short bursts are usually partial words, breath sounds, or misfire VAD
    hits that survived deduplication. Merging preserves their timestamps by
    extending the surviving segment's start_s backwards.
    """
    if not segments:
        return segments

    merged: List[Dict[str, Any]] = []
    pending: List[Dict[str, Any]] = []

    for seg in segments:
        duration = seg.get("end_s", 0.0) - seg.get("start_s", 0.0)
        if duration < micro_duration_s:
            pending.append(seg)
        else:
            if pending:
                # Extend current segment backward to absorb pending micros.
                seg = dict(seg)
                seg["start_s"] = pending[0]["start_s"]
                # Prepend micro texts so nothing is silently dropped.
                micro_text = " ".join(
                    (p.get("source_text") or "").strip() for p in pending
                ).strip()
                seg_text = (seg.get("source_text") or "").strip()
                if micro_text:
                    seg["source_text"] = f"{micro_text} {seg_text}".strip()
                pending = []
            merged.append(seg)

    # If trailing micros remain (nothing to absorb into), extend the last segment.
    if pending and merged:
        last = dict(merged[-1])
        last["end_s"] = pending[-1]["end_s"]
        trailing_text = " ".join(
            (p.get("source_text") or "").strip() for p in pending
        ).strip()
        if trailing_text:
            last["source_text"] = f"{last.get('source_text', '')} {trailing_text}".strip()
        merged[-1] = last
    elif pending:
        # Edge case: all segments were micro — keep as-is rather than discard.
        merged.extend(pending)

    return merged


# ─────────────────────────────────────────────────────────────────────────── #
#  4. QA adjustments (non-destructive timing pass)                           #
# ─────────────────────────────────────────────────────────────────────────── #

def apply_qa_adjustments(
    segments: List[Dict[str, Any]],
    min_gap_ms: int = 100,
    min_duration_s: float = 1.0,
    max_chars_per_line: int = 42,
) -> List[Dict[str, Any]]:
    """Apply non-destructive timing adjustments: min duration, min gap, line splitting."""
    adjusted = []
    min_gap_s = min_gap_ms / 1000.0

    for i, seg in enumerate(segments):
        start = seg.get("start_s", 0.0)
        end = seg.get("end_s", 0.0)
        text = seg.get("translated_text") or seg.get("source_text") or ""

        # Enforce minimum duration.
        if (end - start) < min_duration_s:
            end = start + min_duration_s

        # Enforce minimum gap with the previous segment.
        if i > 0 and adjusted:
            prev_end = adjusted[-1]["end_s"]
            if (start - prev_end) < min_gap_s:
                start = prev_end + min_gap_s
                if end < start + min_duration_s:
                    end = start + min_duration_s

        cps = len(text) / max(0.1, end - start)
        lines = split_text_into_lines(text, max_chars_per_line)
        formatted_text = "\n".join(lines)

        adjusted_seg = dict(seg)
        adjusted_seg["start_s"] = round(start, 3)
        adjusted_seg["end_s"] = round(end, 3)
        adjusted_seg["cps"] = round(cps, 2)
        adjusted_seg["formatted_text"] = formatted_text
        adjusted.append(adjusted_seg)

    return adjusted


# ─────────────────────────────────────────────────────────────────────────── #
#  5. Validation (read-only — returns violation list, does not mutate)       #
# ─────────────────────────────────────────────────────────────────────────── #

def validate_subtitles(
    segments: List[Dict[str, Any]],
    min_gap_ms: int = 100,
    max_cps: float = 17.0,
    min_duration_s: float = 1.0,
    max_line_chars: int = 42,
) -> List[Dict[str, Any]]:
    """Returns a list of QA violations for segments (does NOT mutate)."""
    violations = []
    min_gap_s = min_gap_ms / 1000.0

    for i, seg in enumerate(segments):
        seg_id = seg.get("id", f"seg_{i}")
        start = seg.get("start_s", 0.0)
        end = seg.get("end_s", 0.0)
        text = seg.get("translated_text") or seg.get("source_text") or ""
        duration = end - start

        if duration < min_duration_s:
            violations.append({
                "segment_id": seg_id,
                "type": "min_duration",
                "message": f"Duration ({duration:.2f}s) below threshold ({min_duration_s}s)",
            })

        if i > 0:
            prev_end = segments[i - 1].get("end_s", 0.0)
            gap = start - prev_end
            if gap < min_gap_s:
                violations.append({
                    "segment_id": seg_id,
                    "type": "min_gap",
                    "message": f"Gap ({gap * 1000:.0f}ms) below threshold ({min_gap_ms}ms)",
                })

        cps = len(text) / max(0.1, duration)
        if cps > max_cps:
            violations.append({
                "segment_id": seg_id,
                "type": "max_cps",
                "message": f"CPS ({cps:.1f}) exceeds max ({max_cps})",
            })

        lines = text.split("\n")
        if len(lines) > 2:
            violations.append({
                "segment_id": seg_id,
                "type": "max_lines",
                "message": f"Segment has {len(lines)} lines (max 2)",
            })
        for idx, line in enumerate(lines):
            if len(line) > max_line_chars:
                violations.append({
                    "segment_id": seg_id,
                    "type": "max_line_length",
                    "message": f"Line {idx + 1} length ({len(line)}) exceeds max ({max_line_chars})",
                })

    return violations


# ─────────────────────────────────────────────────────────────────────────── #
#  6. SRT / VTT formatters                                                   #
# ─────────────────────────────────────────────────────────────────────────── #

def format_srt(segments: List[Dict[str, Any]]) -> str:
    blocks = []
    for i, seg in enumerate(segments, 1):
        start_str = seconds_to_srt_time(seg["start_s"])
        end_str = seconds_to_srt_time(seg["end_s"])
        text = seg.get("formatted_text") or seg.get("translated_text") or seg.get("source_text") or ""
        blocks.append(f"{i}\n{start_str} --> {end_str}\n{text}\n")
    return "\n".join(blocks)


def format_vtt(segments: List[Dict[str, Any]]) -> str:
    blocks = ["WEBVTT\n"]
    for i, seg in enumerate(segments, 1):
        start_str = seconds_to_vtt_time(seg["start_s"])
        end_str = seconds_to_vtt_time(seg["end_s"])
        text = seg.get("formatted_text") or seg.get("translated_text") or seg.get("source_text") or ""
        blocks.append(f"{i}\n{start_str} --> {end_str}\n{text}\n")
    return "\n".join(blocks)


# ─────────────────────────────────────────────────────────────────────────── #
#  Utilities                                                                  #
# ─────────────────────────────────────────────────────────────────────────── #

def seconds_to_srt_time(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    if millis >= 1000:
        secs += 1
        millis = 0
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def seconds_to_vtt_time(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    if millis >= 1000:
        secs += 1
        millis = 0
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def split_text_into_lines(text: str, max_chars_per_line: int = 42) -> List[str]:
    """Splits subtitle text into at most 2 lines without breaking words when possible."""
    words = text.strip().split()
    if not words:
        return [""]

    line1: List[str] = []
    line2: List[str] = []
    current_len = 0

    for word in words:
        needed = len(word) + (1 if line1 else 0)
        if current_len + needed <= max_chars_per_line:
            line1.append(word)
            current_len += needed
        else:
            line2.append(word)

    if not line2:
        return [" ".join(line1)]
    return [" ".join(line1), " ".join(line2)]
