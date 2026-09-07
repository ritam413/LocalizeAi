# DubForge Studio — Changes Made

**Branch**: `demucus_inerion`  
**Date**: 2026-08-11

---

## Overview

Three major features were implemented on top of the base Demucs vocal-isolation pipeline:

1. **Silence-Aware Resumable Demucs Separation** — audio is chunked at natural speech pauses and each chunk is individually checkpointed, allowing the Demucs stage to resume from the last unprocessed chunk rather than restarting from 0% after a cancellation or failure.
2. **User-Controlled Demucs ON/OFF Toggle** — users can enable or disable Demucs HTDemucs stem separation per run. When disabled, the pipeline instantly falls back to an `ffmpeg` speech-formant enhancement filter.
3. **Persistent Dashboard Stage Logs** — every stage log line emitted during pipeline execution is now written to disk (`run.log`) and reloaded when the user opens or refreshes the run dashboard, providing full log history across page reloads and run resumes.

---

## Files Modified

### Backend

#### `backend/app/api/runs.py`
- **Added**: Accept `use_demucs: bool` (default `True`) from the `POST /api/v1/runs` request payload.
- **Added**: Store `use_demucs` inside `frozen_stage_config_json` (alongside `stages` and `subtitle_only`).
- **Added**: New REST endpoint `GET /api/v1/runs/{run_id}/logs` — reads `storage/runs/{run_id}/run.log` (JSON Lines) and returns the full log history as a JSON array. Returns `[]` if the file does not yet exist.

#### `backend/app/engine/executor.py`
- **Modified**: `log_callback()` — appends each log entry (stage name, level, message, UTC timestamp) as a JSON Line to `storage/runs/{run_id}/run.log` after broadcasting it over WebSocket.
- **Modified**: `stage_config_override` — passes `use_demucs` value read from `frozen_stage_config_json` into each stage's configuration dictionary.
- **Modified**: `datetime` import updated to include `timezone` for proper UTC timestamping.

#### `backend/app/engine/stages/denoise.py` _(full rewrite)_
- **Architecture redesigned** with three major capabilities:

  | Capability | Implementation |
  |---|---|
  | `use_demucs` flag | `execute()` checks `config.get("use_demucs", True)` and routes to `_run_ffmpeg_fallback()` when `False` |
  | Early stem cache hit | Skips all separation if `vocals.wav` and `background.wav` already exist with non-zero size |
  | Short clip (≤120s) | Runs Demucs in single-pass mode via `_demucs_single_file()` |
  | Long clip (>120s) | Splits at silence boundaries, runs Demucs per chunk, resumes from first unprocessed chunk |

- **New method `_detect_silence_split_points()`** — runs `ffmpeg silencedetect` to find natural speech pause timestamps, then selects the closest silence to each `TARGET_CHUNK_S` (180s) interval as the actual cut point. Falls back to evenly spaced cuts if no silence is found.
- **New method `_ffmpeg_cut_segment()`** — slices a time window from the input WAV using `ffmpeg`.
- **New method `_ffmpeg_concat_wavs()`** — concatenates a list of chunk stem WAVs into a single output using the `ffmpeg` concat demuxer.
- **Refactored `_demucs_single_file()`** — extracted from the original `_run_demucs()` so the same Demucs subprocess logic can be used for both single-pass and per-chunk modes. Accepts `progress_base` and `progress_range` for accurate per-chunk progress reporting.
- **New static method `_get_audio_duration()`** — queries audio duration via `ffprobe` (JSON output), with fallback to reading the WAV header directly.
- **Cleanup**: Temporary per-chunk Demucs output directories are removed after stem files are copied.

---

### Frontend

#### `frontend/app/runs/new/page.tsx`
- **Added**: `useDemucs` React state variable (default `true`).
- **Added**: Demucs Vocal Isolation toggle card (violet accent) placed in the Step 2 "Languages & Pipeline Toggles" section alongside the existing Subtitle-Only toggle.
  - When ON: shows label `"HTDemucs stem separation (GPU)"`.
  - When OFF: shows label `"Fast ffmpeg fallback (no GPU)"`.
- **Added**: `use_demucs: useDemucs` included in the `POST /api/v1/runs` request body.
- **Modified**: Grid layout for Step 2 expanded from `md:grid-cols-3` to `md:grid-cols-2 lg:grid-cols-4` to accommodate the fourth card.
- **Added**: `Cpu` icon imported from `lucide-react` for the toggle card.

#### `frontend/app/runs/[id]/page.tsx`
- **Added**: `fetchHistoricalLogs()` async function — calls `GET /api/v1/runs/{runId}/logs` and pre-populates the `logs` state with previously persisted log entries.
- **Modified**: Initial `useEffect` now calls both `fetchRunDetails()` and `fetchHistoricalLogs()` on mount, so dashboard log history survives page reloads and pipeline resumes.

---

### Tests

#### `backend/tests/test_demucs_silence_chunking.py` _(new file)_
Three test cases:
1. **`test_use_demucs_false_skips_demucs`** — verifies that `execute()` with `use_demucs=False` calls `_run_ffmpeg_fallback()` and never invokes `_run_demucs()`.
2. **`test_demucs_chunked_resumption`** — simulates a 5-chunk separation where chunks 0 and 1 are already completed; asserts that only chunks 2, 3, 4 are processed through Demucs.
3. **`test_get_run_logs_endpoint`** — writes synthetic JSON Lines to a `run.log` file and verifies that `GET /api/v1/runs/{run_id}/logs` returns the correct entries.

---

## Behaviour Summary

| Scenario | Before | After |
|---|---|---|
| Demucs cancelled at 60% | Restarts from 0% | Resumes from chunk 3/5 |
| Audio word at chunk boundary | Could be cut in half | Always cut at silence pause |
| Page refreshed mid-run | Logs cleared | Full log history reloaded from disk |
| Demucs not available/desired | Always attempted, fallback silent | User-controlled toggle on New Run screen |
| Short clip (≤2 min) | Single-pass | Single-pass (no chunking overhead) |
