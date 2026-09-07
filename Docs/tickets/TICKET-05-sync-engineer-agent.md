# TICKET-05: Sync Engineer Agent

## Status
- **State**: Completed
- **Verification**: Vitest (`frontend/__tests__/sync_engineer.test.ts`) + Pytest (`backend/tests/test_sync_engineer.py`)

## Objective
Implement the Sync Engineer agent to reconcile differences between synthesized localized dialogue duration and original dialogue visual windows. Applies `ffmpeg atempo` speed factor calculations (clamped within 0.75x–1.35x), timing shifts, or silence trimming, logging the engineering rationale for each adjustment.

## Seams & Interfaces
- Python: `backend/app/agents/sync_engineer.py` (`SyncEngineerAgent`)
- TypeScript: `frontend/lib/agents/sync_engineer.ts` (`calculateSyncAdjustment`, `validateSyncEngineerOutput`)

## Input / Output Contracts
- **Input**: `synthesized_stems`, `tolerance_s` (default 0.05s).
- **Output**:
  - `sync_adjustments`: list of `SyncAdjustment` (`segment_id`, `original_window_s`, `raw_synthesized_s`, `strategy`, `atempo_factor`, `final_duration_s`, `rationale`, `aligned_audio_path`).

## Verification Results
- Vitest: 3 tests passed
- Pytest: 1 test passed
