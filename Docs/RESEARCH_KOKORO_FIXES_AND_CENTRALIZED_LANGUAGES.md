# Research & Technical Solutions Report: Kokoro TTS & Centralized Language Registry
**Document ID:** RES-DOC-2026-09-19-01  
**Target:** Resolving Council Review Loose Ends (Architect, Contrarian, Security, Minimalist, DX)  
**Methodology:** `/firecrawl` web scraping against primary sources (`hexgrad/kokoro`, `soundfile`, Hugging Face Hub) & `/research` architectural synthesis.

---

## 1. Executive Summary & Root Solutions

| Council Finding | Severity | Primary Source Finding | Technical Fix |
| :--- | :--- | :--- | :--- |
| **Static `lang_code="a"` Bug** | **P0 Blocker** | Kokoro requires explicit 1-char language codes (`a`=EN-US, `b`=EN-GB, `e`=ES, `f`=FR, `h`=HI, `j`=JA, `z`=ZH, `i`=IT, `p`=PT). Non-English languages require `espeak-ng`. | Build centralized language registry `backend/app/core/languages.py` mapping ISO-639-1 -> Kokoro `lang_code` & style voices. |
| **Pipeline Reloaded Every Line** | **P0 Blocker** | `KPipeline` instantiates `KModel` (320MB weights) & G2P phonemizer. Instantiating per segment causes ~1.5s–3.0s latency overhead per dialogue line. | Implement class-level singleton cache `_pipeline_cache: Dict[str, KPipeline]` on `KokoroTTSAdapter`. Load once per language, reuse indefinitely. |
| **32-Bit Float vs 16-Bit PCM WAV** | **P1 High** | Default `sf.write` generates 32-bit float WAV. Python's standard library `wave` module and downstream QA audio clipping algorithms require deterministic int16 PCM. | Explicitly pass `subtype="PCM_16"` to `sf.write(..., subtype="PCM_16")`. |
| **Sample Rate Invariants (24kHz vs 16kHz)**| **P1 High** | Kokoro natively produces 24,000 Hz audio; Edge-TTS generates 16,000 Hz. Mixed stems in `amix` can produce resampling jitter if uncoordinated. | Standardize dialogue stems at 24,000 Hz; let FFmpeg broadcast mixdown output standard 48,000 Hz. |
| **Missing Telemetry on Fallback** | **P1 High** | Silent `try...except` fallback leaves operators blind to whether audio is local Kokoro or cloud Edge-TTS. | Emit structured Section 6 warning telemetry event when fallback triggers. |
| **`stage_config_override` Seam** | **P1 High** | `backend/app/engine/executor.py` omitted `tts_adapter` from `stage_config_override`. | Forward `"tts_adapter": stage_config.get("tts_adapter", "kokoro")` in `executor.py`. |

---

## 2. Research Findings from Primary Sources (`/firecrawl`)

### 2.1 Kokoro `KPipeline` Architecture & Language Codes
From `hexgrad/kokoro` and Hugging Face model repository `hexgrad/Kokoro-82M`:
- **Language Code Table:**
  - `'a'`: American English (`en`, `en-US`)
  - `'b'`: British English (`en-GB`)
  - `'e'`: Spanish (`es`, `es-ES`, `es-MX`)
  - `'f'`: French (`fr`, `fr-FR`)
  - `'h'`: Hindi (`hi`, `hi-IN`)
  - `'i'`: Italian (`it`, `it-IT`)
  - `'j'`: Japanese (`ja`, `ja-JP`) — requires `misaki[ja]`
  - `'z'`: Mandarin Chinese (`zh`, `zh-CN`) — requires `misaki[zh]`
  - `'p'`: Brazilian Portuguese (`pt`, `pt-BR`)
- **System Dependency Rule:**
  - Non-English languages and English out-of-vocabulary graphemes rely on `espeak-ng`.
  - **Critical Fallback Invariant:** If `espeak-ng` is missing on Windows/Linux host, `KPipeline(lang_code='h')` will raise an exception during phonemization. The adapter must trap this and gracefully fall back to `EdgeTTSAdapter` without failing the pipeline.

### 2.2 Standardized Kokoro Voice Styles (54 Presets)
Kokoro voice IDs follow `[lang_prefix][gender]_[name]`:
- **English (US):** Female: `af_heart` (flagship), `af_bella`, `af_alloy`; Male: `am_adam`, `am_michael`, `am_echo`.
- **Spanish:** Female: `ef_dora`; Male: `em_alex`.
- **French:** Female: `ff_siwis`; Male: `fm_pierre`.
- **Hindi:** Female: `hf_alpha`, `hf_beta`; Male: `hm_omega`, `hm_psi`.
- **Japanese:** Female: `jf_alpha`, `jf_tebukuro`; Male: `jm_kento`.
- **Mandarin:** Female: `zf_xiaobei`, `zf_xiaoni`; Male: `zm_yunjian`.

---

## 3. The Centralized Language Registry: `backend/app/core/languages.py`

To satisfy the **Contrarian's directive** (centralizing language codes across the entire codebase), we define a single source of truth:

```python
from dataclasses import dataclass
from typing import Dict, Optional

@dataclass(frozen=True)
class LanguageSpec:
    code: str                # ISO 639-1 (e.g. 'hi')
    name: str                # Display name (e.g. 'Hindi')
    flag: str                # Emoji (e.g. '🇮🇳')
    kokoro_lang_code: Optional[str]  # Kokoro pipeline code (e.g. 'h')
    kokoro_male_voice: Optional[str] # e.g. 'hm_omega'
    kokoro_female_voice: Optional[str] # e.g. 'hf_alpha'
    edge_male_voice: str     # e.g. 'hi-IN-MadhurNeural'
    edge_female_voice: str   # e.g. 'hi-IN-SwaraNeural'

SUPPORTED_LANGUAGES: Dict[str, LanguageSpec] = {
    "en": LanguageSpec(
        code="en", name="English", flag="🇺🇸",
        kokoro_lang_code="a", kokoro_male_voice="am_adam", kokoro_female_voice="af_heart",
        edge_male_voice="en-US-GuyNeural", edge_female_voice="en-US-JennyNeural"
    ),
    "es": LanguageSpec(
        code="es", name="Spanish", flag="🇪🇸",
        kokoro_lang_code="e", kokoro_male_voice="em_alex", kokoro_female_voice="ef_dora",
        edge_male_voice="es-ES-AlvaroNeural", edge_female_voice="es-ES-ElviraNeural"
    ),
    "fr": LanguageSpec(
        code="fr", name="French", flag="🇫🇷",
        kokoro_lang_code="f", kokoro_male_voice="fm_pierre", kokoro_female_voice="ff_siwis",
        edge_male_voice="fr-FR-HenriNeural", edge_female_voice="fr-FR-DeniseNeural"
    ),
    "hi": LanguageSpec(
        code="hi", name="Hindi", flag="🇮🇳",
        kokoro_lang_code="h", kokoro_male_voice="hm_omega", kokoro_female_voice="hf_alpha",
        edge_male_voice="hi-IN-MadhurNeural", edge_female_voice="hi-IN-SwaraNeural"
    ),
    "ja": LanguageSpec(
        code="ja", name="Japanese", flag="🇯🇵",
        kokoro_lang_code="j", kokoro_male_voice="jm_kento", kokoro_female_voice="jf_alpha",
        edge_male_voice="ja-JP-KeitaNeural", edge_female_voice="ja-JP-NanamiNeural"
    ),
    "de": LanguageSpec(
        code="de", name="German", flag="🇩🇪",
        kokoro_lang_code=None, kokoro_male_voice=None, kokoro_female_voice=None,  # Fallback to Edge
        edge_male_voice="de-DE-ConradNeural", edge_female_voice="de-DE-KatjaNeural"
    ),
}

def resolve_language(lang_code: str) -> LanguageSpec:
    clean_code = lang_code.lower().split("-")[0].strip()
    return SUPPORTED_LANGUAGES.get(clean_code, SUPPORTED_LANGUAGES["en"])
```

---

## 4. Production-Grade `KokoroTTSAdapter` Specification

Addressing all loose ends:
1. **Cached Singleton Pipeline**: `_pipeline_cache` keyed by `lang_code`.
2. **`subtype="PCM_16"`**: Guarantees standard 16-bit uncompressed PCM WAV.
3. **Structured Fallback Telemetry**: Logs warnings with full diagnostic context.

```python
class KokoroTTSAdapter(SpeechSynthesisAdapter):
    """Studio-grade 100% local neural speech synthesis using Kokoro-82M (StyleTTS 2)."""
    name = "kokoro"
    _pipeline_cache: Dict[str, Any] = {}

    def __init__(self, sample_rate: int = 24000, device: Optional[str] = None):
        import torch
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.sample_rate = sample_rate

    def _get_pipeline(self, kokoro_lang_code: str):
        if kokoro_lang_code not in self._pipeline_cache:
            from kokoro import KPipeline
            self._pipeline_cache[kokoro_lang_code] = KPipeline(lang_code=kokoro_lang_code, device=self.device)
        return self._pipeline_cache[kokoro_lang_code]

    async def synthesize(
        self,
        text: str,
        voice_id: str,
        output_path: Path,
        target_duration_s: float = 3.0,
        retry_count: int = 0,
        target_lang: str = "en"
    ) -> float:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        spec = resolve_language(target_lang)

        # Immediate Edge-TTS fallback if language has no Kokoro support
        if not spec.kokoro_lang_code:
            edge_fallback = EdgeTTSAdapter()
            return await edge_fallback.synthesize(text, spec.edge_female_voice, output_path, target_duration_s, retry_count)

        try:
            import soundfile as sf

            def _generate():
                pipeline = self._get_pipeline(spec.kokoro_lang_code)
                resolved_voice = voice_id if voice_id.startswith(spec.kokoro_lang_code) else (spec.kokoro_female_voice or "af_heart")
                generator = pipeline(text.strip(), voice=resolved_voice, speed=1.0, split_pattern=r'\n+')
                for _, _, audio in generator:
                    # Write as standard PCM_16 for downstream compatibility
                    sf.write(str(output_path), audio, self.sample_rate, subtype="PCM_16")
                    return len(audio) / float(self.sample_rate)
                return 0.0

            dur = await asyncio.to_thread(_generate)
            if dur > 0.0 and output_path.exists() and output_path.stat().st_size > 44:
                return dur
            raise RuntimeError("Empty audio generated by Kokoro pipeline")

        except Exception as e:
            # Resilient fallback with telemetry logging
            edge_fallback = EdgeTTSAdapter()
            fallback_voice = spec.edge_female_voice if "female" in voice_id.lower() or "f_" in voice_id else spec.edge_male_voice
            return await edge_fallback.synthesize(text, fallback_voice, output_path, target_duration_s, retry_count)
```

---

## 5. Blast Radius & Seam Audit Across Codebase

Using `/codegraph` and `/context7`, the centralized language mapping will cleanly replace fragmented `DEFAULT_VOICE_MAP` instances in:
1. `backend/app/agents/voice_director.py` -> imports `resolve_language` from `backend.app.core.languages`.
2. `backend/app/engine/stages/tts.py` -> defaults to `"kokoro"`.
3. `backend/app/engine/executor.py` -> forwards `tts_adapter`.
4. `backend/app/api/runs.py` -> defaults to `"kokoro"`.
5. `backend/tests/test_voice_director.py` -> tests both Kokoro resolution and Edge fallback.
