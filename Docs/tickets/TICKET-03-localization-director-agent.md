# TICKET-03: Localization Director Agent

## Status
- **State**: Completed
- **Verification**: Vitest (`frontend/__tests__/localization_director.test.ts`) + Pytest (`backend/tests/test_localization_director.py`)

## Objective
Implement the Localization Director agent to perform in-character, culturally nuanced translations with mandatory translation rationale per line (resolving idioms such as "count chickens before they hatch" into locale equivalents like Hindi "hawa mein mahal mat banao" or Spanish "no vendas la piel del oso").

## Seams & Interfaces
- Python: `backend/app/agents/localization_director.py` (`LocalizationDirectorAgent`)
- TypeScript: `frontend/lib/agents/localization_director.ts` (`validateLocalizationOutput`, `parseLocalizationOutput`)

## Input / Output Contracts
- **Input**: `target_language`, `audience_profile`, `annotated_segments`, `speakers`.
- **Output**:
  - `localized_lines`: list of `LocalizedLine` with `segment_id`, `speaker_id`, `translated_text`, `rationale`, `character_count`.

## Verification Results
- Vitest: 3 tests passed
- Pytest: 1 test passed
