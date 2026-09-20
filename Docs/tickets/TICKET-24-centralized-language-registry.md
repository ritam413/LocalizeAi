
# TICKET-24: Centralized Language & Voice Persona Registry

## Status
- **State**: Completed
- **Primary Seam**: `backend/app/core/languages.py` (`LanguageSpec`, `resolve_language`, `SUPPORTED_LANGUAGES`)
- **Verification**: Pytest (`backend/tests/test_languages.py` - 4/4 Passed)
- **Blocking Dependencies**: None
- **Downstream Unblocked**: TICKET-25, TICKET-26

## Objective
Centralize language metadata, Kokoro 1-character language codes (`'a'`, `'e'`, `'f'`, `'h'`, `'j'`, `'z'`), Kokoro style voices (`af_heart`, `am_adam`, `ef_dora`, `hm_omega`), and Microsoft Edge-TTS fallback voice IDs into a single source of truth (`backend/app/core/languages.py`). This eliminates scattered, hardcoded dictionaries across `voice_director.py`, `tts.py`, and `mediaTrackHelpers.ts`.

## Seams & Interfaces
- Python: `backend/app/core/languages.py`
  - `LanguageSpec(dataclass, frozen=True)`:
    - `code: str` (ISO 639-1)
    - `name: str` (Display name)
    - `flag: str` (Flag emoji)
    - `kokoro_lang_code: Optional[str]` (`'a'`, `'b'`, `'e'`, `'f'`, `'h'`, `'i'`, `'j'`, `'z'`, `'p'`)
    - `kokoro_male_voice: Optional[str]`
    - `kokoro_female_voice: Optional[str]`
    - `edge_male_voice: str`
    - `edge_female_voice: str`
  - `SUPPORTED_LANGUAGES: Dict[str, LanguageSpec]`
  - `resolve_language(lang_code: str) -> LanguageSpec`: Normalizes tags like `"hi-IN"` -> `"hi"`, falling back gracefully to `"en"` for unknown codes.

## TDD Test Specification (Red -> Green)
Test Seam: `backend/tests/test_languages.py`
```python
import pytest
from app.core.languages import resolve_language, SUPPORTED_LANGUAGES, LanguageSpec

def test_resolve_supported_languages():
    spec_hi = resolve_language("hi-IN")
    assert spec_hi.code == "hi"
    assert spec_hi.kokoro_lang_code == "h"
    assert spec_hi.kokoro_female_voice == "hf_alpha"
    assert spec_hi.edge_male_voice == "hi-IN-MadhurNeural"

    spec_es = resolve_language("es-ES")
    assert spec_es.kokoro_lang_code == "e"
    assert spec_es.kokoro_male_voice == "em_alex"

def test_resolve_unsupported_language_fallback():
    spec_unknown = resolve_language("xx-YY")
    assert spec_unknown.code == "en"
    assert spec_unknown.kokoro_lang_code == "a"
```

## Acceptance Criteria
1. Single authoritative module `backend/app/core/languages.py` exports `LanguageSpec` and `resolve_language`.
2. Resolves all tier-1 supported languages: English (`en`), Hindi (`hi`), Spanish (`es`), French (`fr`), Japanese (`ja`), and German (`de`).
3. German (`de`) explicitly declares `kokoro_lang_code=None` to trigger immediate, clean fallback to Edge-TTS without phonemization errors.
4. Normalizes compound locale tags (`"hi-IN"` -> `"hi"`, `"es-MX"` -> `"es"`).
