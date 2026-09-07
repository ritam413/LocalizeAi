# TICKET-07: QA / Continuity Agent (Hero Feature)

## Status
- **State**: Completed
- **Verification**: Vitest (`frontend/__tests__/qa_agent.test.ts`) + Pytest (`backend/tests/test_qa_agent.py`)

## Objective
Implement the QA / Continuity Agent as an autonomous post-production reviewer. Inspects assembled release candidates, evaluates release-readiness (0–100 score), detects defect classes (`TIMING_OVERFLOW`, `SUBTITLE_DRIFT`, `AUDIO_CLIPPING`), and produces structured fix proposals targeting upstream agents for automated self-repair.

## Seams & Interfaces
- Python: `backend/app/agents/qa_agent.py` (`QAContinuityAgent`)
- TypeScript: `frontend/lib/agents/qa_agent.ts` (`inspectCutForDefects`, `validateQAOutput`)

## Input / Output Contracts
- **Input**: `stems` (audio duration vs target visual window), `subtitles`, `min_readiness_threshold` (default 85.0).
- **Output**:
  - `release_readiness_score`: float (0.0 to 100.0)
  - `verdict`: "pass" | "rework_required"
  - `defect_count`: number
  - `findings`: list of `QAFinding` (`finding_id`, `scene_id`, `segment_id`, `defect_type`, `severity`, `description`, `recommended_fix`, `target_agent`, `fix_applied`).

## Verification Results
- Vitest: 3 tests passed
- Pytest: 1 test passed
