"""
Centralized Language and Voice Persona Registry.
Single source of truth for ISO 639-1 language specifications, Kokoro neural voice personas,
and Microsoft Edge-TTS fallback personas.
"""

from typing import Dict, Optional
from app.core.tts_contracts import LanguageSpec

SUPPORTED_LANGUAGES: Dict[str, LanguageSpec] = {
    "en": LanguageSpec(
        code="en",
        name="English",
        flag="🇺🇸",
        kokoro_lang_code="a",
        kokoro_male_voice="am_adam",
        kokoro_female_voice="af_heart",
        edge_male_voice="en-US-GuyNeural",
        edge_female_voice="en-US-JennyNeural",
    ),
    "hi": LanguageSpec(
        code="hi",
        name="Hindi",
        flag="🇮🇳",
        kokoro_lang_code="h",
        kokoro_male_voice="hm_omega",
        kokoro_female_voice="hf_alpha",
        edge_male_voice="hi-IN-MadhurNeural",
        edge_female_voice="hi-IN-SwaraNeural",
    ),
    "es": LanguageSpec(
        code="es",
        name="Spanish",
        flag="🇪🇸",
        kokoro_lang_code="e",
        kokoro_male_voice="em_alex",
        kokoro_female_voice="ef_dora",
        edge_male_voice="es-ES-AlvaroNeural",
        edge_female_voice="es-ES-ElviraNeural",
    ),
    "fr": LanguageSpec(
        code="fr",
        name="French",
        flag="🇫🇷",
        kokoro_lang_code="f",
        kokoro_male_voice="fm_pierre",
        kokoro_female_voice="ff_siwis",
        edge_male_voice="fr-FR-HenriNeural",
        edge_female_voice="fr-FR-DeniseNeural",
    ),
    "ja": LanguageSpec(
        code="ja",
        name="Japanese",
        flag="🇯🇵",
        kokoro_lang_code="j",
        kokoro_male_voice="jm_kento",
        kokoro_female_voice="jf_alpha",
        edge_male_voice="ja-JP-KeitaNeural",
        edge_female_voice="ja-JP-NanamiNeural",
    ),
    "de": LanguageSpec(
        code="de",
        name="German",
        flag="🇩🇪",
        kokoro_lang_code=None,
        kokoro_male_voice=None,
        kokoro_female_voice=None,
        edge_male_voice="de-DE-ConradNeural",
        edge_female_voice="de-DE-KatjaNeural",
    ),
}


LANGUAGE_ALIASES: Dict[str, str] = {
    "jp": "ja",
    "sp": "es",
    "japanese": "ja",
    "spanish": "es",
    "hindi": "hi",
    "english": "en",
    "french": "fr",
    "german": "de",
}


def resolve_language(lang_code: Optional[str]) -> LanguageSpec:
    """
    Normalizes compound locale tags (e.g. 'hi-IN' -> 'hi', 'es_ES' -> 'es', 'jp' -> 'ja', 'sp' -> 'es')
    and returns the matching LanguageSpec, gracefully falling back to English ('en').
    """
    if not lang_code or not isinstance(lang_code, str):
        return SUPPORTED_LANGUAGES["en"]
    normalized = lang_code.strip().replace("_", "-").split("-")[0].lower()
    canonical = LANGUAGE_ALIASES.get(normalized, normalized)
    return SUPPORTED_LANGUAGES.get(canonical, SUPPORTED_LANGUAGES["en"])
