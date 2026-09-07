# TICKET-06: Subtitle Director Agent

## Status
- **State**: Completed
- **Verification**: Vitest (`frontend/__tests__/subtitle_director.test.ts`) + Pytest (`backend/tests/test_subtitle_director.py`)

## Objective
Implement the Subtitle Director agent to produce millisecond-accurate `.srt` and `.vtt` subtitle files aligned with the final Sync Engineer adjusted audio timings, ensuring zero subtitle drift and enforcing reading speed limits (max 17 CPS).

## Seams & Interfaces
- Python: `backend/app/agents/subtitle_director.py` (`SubtitleDirectorAgent`)
- TypeScript: `frontend/lib/agents/subtitle_director.ts` (`generateSubtitleCues`, `formatSrt`, `formatVtt`, `validateSubtitleDirectorOutput`)

## Input / Output Contracts
- **Input**: `localized_lines`, `sync_adjustments`.
- **Output**:
  - `srt_path`: string
  - `vtt_path`: string
  - `total_cues`: number
  - `max_cps`: number
  - `drift_detected`: boolean

## Verification Results
- Vitest: 3 tests passed
- Pytest: 1 test passed
