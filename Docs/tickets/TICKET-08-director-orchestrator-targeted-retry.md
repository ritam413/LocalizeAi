# TICKET-08: Director Orchestrator & Targeted Retry Loop

## Status
- **State**: Completed
- **Verification**: Vitest (`frontend/__tests__/director_orchestration.test.ts`) + Pytest (`backend/tests/test_director.py`)

## Objective
Implement the Director Agent as the crew orchestrator holding job state, managing task execution across all crew members, and executing the closed self-repair loop: intercepting QA defect findings and routing a targeted retry back to the specific upstream agent (without restarting the entire pipeline) until QA passes.

## Seams & Interfaces
- Python: `backend/app/agents/director.py` (`DirectorAgent`)
- TypeScript: `frontend/lib/agents/director.ts` (`createDirectorJobState`, `applyTargetedRepair`, `validateDirectorJobState`)

## Input / Output Contracts
- **Input**: `job_id`, `target_language`, `audience_profile`, `segments`.
- **Output**:
  - `status`: "completed" | "rework_needed"
  - `iterations`: number of execution loops
  - `retries_executed`: count of targeted repairs
  - `release_readiness_score`: final QA score
  - `repaired_defects`: list of resolved defects
  - `srt_path`, `vtt_path`: output paths

## Verification Results
- Vitest: 3 tests passed
- Pytest: 1 test passed
