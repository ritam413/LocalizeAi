# TICKET-11: Isometric Dialogue Engine & Syllable Quotas

## Status
- **State**: Completed
- **Primary Seam**: `backend/app/agents/localization_director.py` (`LocalizationDirectorAgent`)
- **Verification**: Pytest (`backend/tests/test_localization_director.py`) + Vitest (`frontend/__tests__/localization_director.test.ts`)
- **Blocking Dependencies**: TICKET-03

## Objective
Deepen the `LocalizationDirectorAgent` into an **Isometric Dialogue Engine** that calculates syllable budgets from dialogue duration windows ($S_{target} \approx \Delta t \times 3.2$, $S_{max} \approx \Delta t \times 3.6$) and enforces rhythmic isometry directly during Gemini LLM translation prompting, eliminating downstream timing overflows and reducing reliance on aggressive audio time-stretching.

## Seams & Interfaces
- Python: `backend/app/agents/localization_director.py`
- Syllable Quota Helper: `estimate_syllables(text, lang) -> int`, `calculate_syllable_budget(start_s, end_s, rate=3.2) -> Tuple[int, int]`
- TypeScript: `frontend/lib/agents/localization_director.ts`

## Input / Output Contracts
- **Input Context**:
  - `annotated_segments`: List of segments with `start_s`, `end_s`, `speaker_id`, `text`.
  - `target_language`: e.g. `"hi"`, `"es"`, `"fr"`, `"de"`.
  - `audience_profile`: Context tone description.
  - `rework_instructions` (optional): Quantitative retry delta constraints (e.g. `"Reduce line 1 by 4 syllables"`).
- **Output Schema**:
  - `localized_lines`: List of items containing `segment_id`, `speaker_id`, `translated_text`, `rationale`, `syllable_count`, `target_budget`, `isochrony_ratio`.
  - `isochrony_score`: Overall rhythm compliance score (0–100).
  - `decision`: Telemetry decision rationale.

## Acceptance Criteria
1. Target syllable budget and maximum threshold are calculated per segment based on dialogue duration window.
2. Prompt to Gemini incorporates strict syllable limits and rhythm compactness rules.
3. Rework instructions with quantitative syllable reduction are respected during targeted retries.
4. Output schema includes `syllable_count` and `target_budget`.
