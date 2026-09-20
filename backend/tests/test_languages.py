import pytest
from app.core.languages import resolve_language, SUPPORTED_LANGUAGES, LanguageSpec


def test_resolve_supported_languages():
    spec_hi = resolve_language("hi-IN")
    assert spec_hi.code == "hi"
    assert spec_hi.name == "Hindi"
    assert spec_hi.kokoro_lang_code == "h"
    assert spec_hi.kokoro_male_voice == "hm_omega"
    assert spec_hi.kokoro_female_voice == "hf_alpha"
    assert spec_hi.edge_male_voice == "hi-IN-MadhurNeural"
    assert spec_hi.edge_female_voice == "hi-IN-SwaraNeural"

    spec_es = resolve_language("es-ES")
    assert spec_es.code == "es"
    assert spec_es.kokoro_lang_code == "e"
    assert spec_es.kokoro_male_voice == "em_alex"
    assert spec_es.kokoro_female_voice == "ef_dora"
    assert spec_es.edge_male_voice == "es-ES-AlvaroNeural"

    spec_en = resolve_language("en-US")
    assert spec_en.code == "en"
    assert spec_en.kokoro_lang_code == "a"
    assert spec_en.kokoro_female_voice == "af_heart"
    assert spec_en.kokoro_male_voice == "am_adam"

    spec_fr = resolve_language("fr-FR")
    assert spec_fr.code == "fr"
    assert spec_fr.kokoro_lang_code == "f"
    assert spec_fr.kokoro_female_voice == "ff_siwis"

    spec_ja = resolve_language("ja-JP")
    assert spec_ja.code == "ja"
    assert spec_ja.kokoro_lang_code == "j"
    assert spec_ja.kokoro_female_voice == "jf_alpha"


def test_german_explicit_edge_fallback():
    spec_de = resolve_language("de-DE")
    assert spec_de.code == "de"
    assert spec_de.kokoro_lang_code is None
    assert spec_de.kokoro_male_voice is None
    assert spec_de.kokoro_female_voice is None
    assert spec_de.edge_male_voice == "de-DE-ConradNeural"
    assert spec_de.edge_female_voice == "de-DE-KatjaNeural"


def test_resolve_unsupported_language_fallback():
    spec_unknown = resolve_language("xx-YY")
    assert spec_unknown.code == "en"
    assert spec_unknown.kokoro_lang_code == "a"

    spec_empty = resolve_language("")
    assert spec_empty.code == "en"

    spec_none = resolve_language(None)
    assert spec_none.code == "en"


def test_supported_languages_immutable():
    spec = SUPPORTED_LANGUAGES["en"]
    with pytest.raises(Exception):
        spec.code = "modified"
