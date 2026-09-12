# TICKET-15: English Proper Noun Preservation & Colloquial Numeral Localization

## Status
- **State**: Planned
- **Primary Seam**: `backend/app/agents/localization_director.py`, `backend/app/engine/localization/`
- **Verification**: Pytest (`backend/tests/test_localization_director.py`) + Vitest (`frontend/__tests__/localization_director.test.ts`)
- **Blocking Dependencies**: TICKET-03

## Objective
Deepen the `LocalizationDirectorAgent` and localization engine to ensure that English proper nouns, brand names, product titles, and tech terminology are preserved verbatim without literal or distorted translation (e.g. `Claude Code`, `Anthropic`, `GitHub`, `Supabase`, `Zenith Chat`, `Afan Mustafa`), and numbers/quantifiers (e.g. `2.4k`, `214,000`, `10M`) are adapted into natural, colloquial spoken dubbing expressions (e.g., Hindi `2.4 hazar` / `2.4 हज़ार`, Spanish `2.4 mil`, French `2,4 mille`).

## Seams & Interfaces
- Python:
  - `backend/app/engine/localization/entity_preserver.py`:
    - `extract_proper_nouns(text: str) -> List[str]`
    - `protect_entities(text: str, entities: List[str]) -> Tuple[str, Dict[str, str]]`
    - `restore_entities(text: str, entity_map: Dict[str, str]) -> str`
  - `backend/app/engine/localization/numeral_localizer.py`:
    - `adapt_spoken_numerals(text: str, target_lang: str) -> Tuple[str, List[str]]`
  - `backend/app/agents/localization_director.py` (`LocalizationDirectorAgent`)
- TypeScript:
  - `frontend/lib/agents/localization_director.ts` (`LocalizedLine`, `validateLocalizationOutput`, `parseLocalizationOutput`)

## Input / Output Contracts
- **Input Context**:
  - `annotated_segments`: List of dialogue segments with `source_text`, `start_s`, `end_s`, `speaker_id`, `cultural_flags`.
  - `target_language`: e.g. `"hi"`, `"es"`, `"fr"`, `"de"`.
  - `audience_profile`: Audience tone description (e.g. `"Colloquial Hindi urban tech audience"`).
  - `glossary_locks` (optional): User/system predefined list of proper nouns to preserve intact.
- **Output Schema (`localized_lines`)**:
  - `segment_id`: `int`
  - `speaker_id`: `str`
  - `source_text`: `str`
  - `translated_text`: `str` (with proper nouns preserved and numerals adapted for spoken dubbing)
  - `rationale`: `str` (explicitly documenting proper noun preservation and numeral adaptation)
  - `character_count`: `int`
  - `preserved_entities`: `List[str]` (optional, extracted proper nouns retained)
  - `numeral_adaptations`: `List[str]` (optional, record of numeral transforms e.g. `["2.4k -> 2.4 hazar"]`)

## Acceptance Criteria
1. **Proper Noun Preservation**:
   - Named entities, brands, software products, and personal names (e.g., `Anthropic`, `Claude Code`, `Zenith Chat`, `Afan Mustafa`, `Playwright`, `Supabase`) remain in their canonical English form in the translated output text rather than being literally translated into target-language nouns.
2. **Colloquial Spoken Numeral Adaptation**:
   - Metric abbreviations like `2.4k`, `100k`, `214k` are transformed into natural spoken target-language words:
     - Hindi (`hi`): `2.4k` $\rightarrow$ `2.4 hazar` / `2.4 हज़ार`
     - Spanish (`es`): `2.4k` $\rightarrow$ `2.4 mil`
     - French (`fr`): `2.4k` $\rightarrow$ `2,4 mille`
   - Spoken formatting enables natural, fluid pronunciation in Edge-TTS (`hi-IN-MadhurNeural`, `es-ES-AlvaroNeural`, `fr-FR-HenriNeural`).
3. **Translation Rationale**:
   - The line rationale must note any preserved proper nouns and numeral adaptations for transparency and inspection in the Studio Console UI.
4. **Test Verification**:
   - Pytest suite in `backend/tests/test_localization_director.py` asserts proper noun preservation and numeral adaptation across target languages.
   - Vitest suite in `frontend/__tests__/localization_director.test.ts` validates output contracts and metadata parsing.
