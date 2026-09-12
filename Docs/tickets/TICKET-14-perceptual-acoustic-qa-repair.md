# TICKET-14: Perceptual Acoustic QA & Quantitative Self-Repair Routing

## Status
- **State**: Planned
- **Primary Seam**: `backend/app/agents/qa_agent.py` (`QAContinuityAgent`) & `backend/app/agents/director.py` (`DirectorAgent`)
- **Verification**: Pytest (`backend/tests/test_qa_agent.py`, `backend/tests/test_director.py`)
- **Blocking Dependencies**: TICKET-07, TICKET-08, TICKET-11, TICKET-13

## Objective
Upgrade `QAContinuityAgent` from shallow duration subtraction to objective perceptual signal inspection (detecting digital audio clipping at 0 dBFS and measuring true duration delta) and enable `DirectorAgent` to route quantitative syllable delta fix proposals directly back to `LocalizationDirectorAgent` for deterministic, bounded self-repair.

## Seams & Interfaces
- Python: `backend/app/agents/qa_agent.py`
  - `check_audio_clipping(audio_path: Path) -> Tuple[bool, int, float]`
  - `inspect_stems_with_signal(stems: List[Dict]) -> QAInspectionResult`
- Python: `backend/app/agents/director.py`
  - Targeted retry router evaluating `TIMING_OVERFLOW` vs `AUDIO_CLIPPING` and dispatching upstream with exact quantitative fix directives.

## Input / Output Contracts
- **Input Context**:
  - `stems`: List of dialogue audio stems with `audio_path`, `duration_s`, `target_window_s`.
  - `min_readiness_threshold`: Quality threshold (default: `85.0`).
- **Output Schema**:
  - `release_readiness_score`: 0–100 score.
  - `verdict`: `"pass"` | `"rework_required"`.
  - `findings`: List of defect findings with `defect_type` (`TIMING_OVERFLOW`, `AUDIO_CLIPPING`, `SUBTITLE_DRIFT`), `target_agent`, `target_segment_id`, `fix_proposal`, `syllables_to_reduce`.

## Acceptance Criteria
1. Digital audio clipping is detected and flagged when WAV samples reach $\ge 0.999$.
2. When timing overflow exceeds threshold ($\Delta t > 0.3s$), `findings` includes exact numerical calculation of syllables to reduce ($\Delta S = \text{ceil}(\Delta t \times 3.2)$).
3. `DirectorAgent` intercepts the finding and dispatches a targeted retry directly to `LocalizationDirectorAgent` with the syllable reduction directive.
4. Repaired cut is re-evaluated by QA and achieves $\ge 85.0$ readiness score.
