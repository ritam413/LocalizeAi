import re
from typing import Tuple, List

# Numeral adaptation mappings across target languages for spoken dubbing
NUMERAL_CONFIG = {
    "hi": {
        "thousand": "हज़ार",
        "million": "मिलियन",
        "billion": "अरब",
        "decimal_sep": ".",
        "alt_thousand": "hazar",
    },
    "es": {
        "thousand": "mil",
        "million_singular": "millón",
        "million_plural": "millones",
        "billion": "mil millones",
        "decimal_sep": ".",
    },
    "fr": {
        "thousand": "mille",
        "million_singular": "million",
        "million_plural": "millions",
        "billion_singular": "milliard",
        "billion_plural": "milliards",
        "decimal_sep": ",",
    },
    "de": {
        "thousand": "Tausend",
        "million_singular": "Million",
        "million_plural": "Millionen",
        "billion_singular": "Milliarde",
        "billion_plural": "Milliarden",
        "decimal_sep": ",",
    },
    "en": {
        "thousand": "thousand",
        "million": "million",
        "billion": "billion",
        "decimal_sep": ".",
    }
}

def adapt_spoken_numerals(text: str, target_lang: str = "en") -> Tuple[str, List[str]]:
    """
    Transforms metric abbreviations (2.4k, 100k, 10M, 2.5B) and raw numeric quantities
    into natural spoken expressions formatted for clean TTS dubbing pronunciation.
    Returns the adapted text and a list of transformations applied.
    """
    if not text or not text.strip():
        return text, []

    lang = (target_lang or "en").lower()
    cfg = NUMERAL_CONFIG.get(lang, NUMERAL_CONFIG["en"])
    adaptations: List[str] = []
    adapted_text = text

    # 1. Match metric thousands: e.g. 2.4k, 2,4k, 100K, 214k, 50k
    pattern_k = re.compile(r'\b(\d+(?:[.,]\d+)?)\s*[kK]\b')
    def replace_k(match: re.Match) -> str:
        num_str = match.group(1).replace(",", ".")
        original = match.group(0)
        try:
            val = float(num_str)
            fmt_num = f"{val:g}".replace(".", cfg["decimal_sep"])
        except ValueError:
            fmt_num = num_str

        if lang == "hi":
            # For Hindi: support colloquial 'hazar' / 'हज़ार'
            # If text contains Latin or user audience is tech, use 'hazar' or Devanagari based on script
            has_devanagari = any('\u0900' <= char <= '\u097F' for char in text)
            unit = cfg["thousand"] if has_devanagari else cfg["alt_thousand"]
            replacement = f"{fmt_num} {unit}"
        elif lang == "es":
            replacement = f"{fmt_num} {cfg['thousand']}"
        elif lang == "fr":
            replacement = f"{fmt_num} {cfg['thousand']}"
        elif lang == "de":
            replacement = f"{fmt_num} {cfg['thousand']}"
        else:
            replacement = f"{fmt_num} {cfg['thousand']}"

        adaptations.append(f"{original} -> {replacement}")
        return replacement

    adapted_text = pattern_k.sub(replace_k, adapted_text)

    # 2. Match metric millions: e.g. 10M, 2.5m, 1M
    pattern_m = re.compile(r'\b(\d+(?:[.,]\d+)?)\s*[mM]\b(?!\w)')
    def replace_m(match: re.Match) -> str:
        num_str = match.group(1).replace(",", ".")
        original = match.group(0)
        try:
            val = float(num_str)
            fmt_num = f"{val:g}".replace(".", cfg["decimal_sep"])
            is_singular = (val == 1.0)
        except ValueError:
            fmt_num = num_str
            is_singular = False

        if lang == "hi":
            has_devanagari = any('\u0900' <= char <= '\u097F' for char in text)
            unit = cfg["million"] if has_devanagari else "million"
            replacement = f"{fmt_num} {unit}"
        elif lang == "es":
            unit = cfg["million_singular"] if is_singular else cfg["million_plural"]
            replacement = f"{fmt_num} {unit}"
        elif lang == "fr":
            unit = cfg["million_singular"] if is_singular else cfg["million_plural"]
            replacement = f"{fmt_num} {unit}"
        elif lang == "de":
            unit = cfg["million_singular"] if is_singular else cfg["million_plural"]
            replacement = f"{fmt_num} {unit}"
        else:
            replacement = f"{fmt_num} {cfg['million']}"

        adaptations.append(f"{original} -> {replacement}")
        return replacement

    adapted_text = pattern_m.sub(replace_m, adapted_text)

    # 3. Match metric billions: e.g. 1.5B, 2B, 10b
    pattern_b = re.compile(r'\b(\d+(?:[.,]\d+)?)\s*[bB]\b(?!\w)')
    def replace_b(match: re.Match) -> str:
        num_str = match.group(1).replace(",", ".")
        original = match.group(0)
        try:
            val = float(num_str)
            fmt_num = f"{val:g}".replace(".", cfg["decimal_sep"])
            is_singular = (val == 1.0)
        except ValueError:
            fmt_num = num_str
            is_singular = False

        if lang == "hi":
            has_devanagari = any('\u0900' <= char <= '\u097F' for char in text)
            unit = cfg["billion"] if has_devanagari else "billion"
            replacement = f"{fmt_num} {unit}"
        elif lang == "es":
            replacement = f"{fmt_num} {cfg['billion']}"
        elif lang == "fr":
            unit = cfg["billion_singular"] if is_singular else cfg["billion_plural"]
            replacement = f"{fmt_num} {unit}"
        elif lang == "de":
            unit = cfg["billion_singular"] if is_singular else cfg["billion_plural"]
            replacement = f"{fmt_num} {unit}"
        else:
            replacement = f"{fmt_num} {cfg['billion']}"

        adaptations.append(f"{original} -> {replacement}")
        return replacement

    adapted_text = pattern_b.sub(replace_b, adapted_text)

    return adapted_text, adaptations
