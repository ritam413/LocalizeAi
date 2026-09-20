# TICKET-25: Hardened Kokoro-82M Neural TTS Adapter

## Status
- **State**: Planned
- **Primary Seam**: `backend/app/agents/voice_director.py` (`KokoroTTSAdapter`, `VoiceDirectorAgent`)
- **Verification**: Pytest (`backend/tests/test_voice_director.py`)
- **Blocking Dependencies**: TICKET-24
- **Downstream Blocked**: TICKET-26, TICKET-27, TICKET-28

## Objective
Implement `KokoroTTSAdapter(SpeechSynthesisAdapter)` in `backend/app/agents/voice_director.py` to provide 100% offline, local neural speech synthesis with StyleTTS 2 prosody at 24kHz uncompressed PCM_16 WAV. Incorporates Council-approved hardening against multi-sentence truncation, pause crashes, Windows file locks, and missing `espeak-ng` dependencies.

## Seams & Interfaces
- Python: `backend/app/agents/voice_director.py`
  - `SpeechSynthesisAdapter`: Abstract base class updated with signature `async def synthesize(text, voice_id, output_path, target_duration_s=3.0, retry_count=0, target_lang="en") -> float`.
  - `KokoroTTSAdapter(SpeechSynthesisAdapter)`:
    - Class-level singleton `_pipeline_cache: Dict[str, Any]` guarded by `_lock = threading.Lock()`.
    - Chunk aggregation: `full_audio = np.concatenate(chunks)`.
    - Lexical guard: `if not text or not re.search(r'\w', text):` writes clean silence matching `target_duration_s`.
    - Windows file-lock defense: writes to `output_path.with_suffix(".tmp.wav")` and commits via `os.replace()`.
    - Resilient fallback: catches `(ImportError, RuntimeError, OSError, Exception)` and delegates to `EdgeTTSAdapter`.
  - `VoiceDirectorAgent.__init__`: instantiates `KokoroTTSAdapter` when `adapter_type == "kokoro"`.
  - `VoiceDirectorAgent._execute()`: imports `resolve_language` from `app.core.languages` and passes `target_lang=target_lang`.

## Implementation Reference (Hardened & Lean)
```python
class KokoroTTSAdapter(SpeechSynthesisAdapter):
    name = "kokoro"
    _pipeline_cache: Dict[str, Any] = {}
    _lock = threading.Lock()

    def __init__(self, sample_rate: int = 24000, device: Optional[str] = None):
        import torch
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.sample_rate = sample_rate

    def _get_pipeline(self, kokoro_lang_code: str):
        with self._lock:
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

        # 1. Silence on non-lexical text or pause markers
        if not text or not re.search(r'\w', text):
            silent_audio = np.zeros(int(max(0.5, target_duration_s) * self.sample_rate), dtype=np.int16)
            sf.write(str(output_path), silent_audio, self.sample_rate, subtype="PCM_16")
            return round(len(silent_audio) / float(self.sample_rate), 3)

        # 2. Unsupported language -> immediate Edge-TTS fallback
        if not spec.kokoro_lang_code:
            edge = EdgeTTSAdapter()
            return await edge.synthesize(text, spec.edge_female_voice, output_path, target_duration_s, retry_count)

        try:
            def _generate():
                pipeline = self._get_pipeline(spec.kokoro_lang_code)
                resolved_voice = voice_id if voice_id.startswith(spec.kokoro_lang_code) else (spec.kokoro_female_voice or "af_heart")
                generator = pipeline(text.strip(), voice=resolved_voice, speed=1.0, split_pattern=r'\n+')

                # Exploit 1 Fix: Accumulate ALL chunks across generator
                chunks = [audio for _, _, audio in generator if len(audio) > 0]
                if not chunks:
                    raise RuntimeError("Kokoro generated 0 audio frames")

                full_audio = np.concatenate(chunks)

                # Exploit 3 Fix: Write to .tmp.wav and atomic replace
                temp_wav = output_path.with_suffix(".tmp.wav")
                sf.write(str(temp_wav), full_audio, self.sample_rate, subtype="PCM_16")
                os.replace(temp_wav, output_path)

                return round(len(full_audio) / float(self.sample_rate), 3)

            return await asyncio.to_thread(_generate)

        except (ImportError, RuntimeError, OSError, Exception):
            # Exploit 5 Fix: Seamless fallback on missing weights / espeak-ng / CUDA OOM
            edge = EdgeTTSAdapter()
            fallback_voice = spec.edge_female_voice if "female" in voice_id.lower() or "f_" in voice_id else spec.edge_male_voice
            return await edge.synthesize(text, fallback_voice, output_path, target_duration_s, retry_count)
```

## TDD Test Specification (Red -> Green)
Test Seam: `backend/tests/test_voice_director.py`
1. `test_kokoro_multi_sentence_concatenation`:
   - Mock `KPipeline` generator yielding 2 distinct chunks: `[np.array([1, 2]), np.array([3, 4])]`.
   - Assert synthesized audio contains all 4 samples and does not truncate at chunk 1.
2. `test_kokoro_pause_silence_generation`:
   - Call `synthesize("...")`.
   - Assert output file exists, is valid 16-bit PCM WAV, and has duration matching `target_duration_s`.
3. `test_kokoro_exception_fallback`:
   - Trigger `RuntimeError("espeak not installed")`.
   - Assert fallback to `EdgeTTSAdapter` / `MockAudioAdapter` succeeds without raising uncaught exception.

## Acceptance Criteria
1. `KokoroTTSAdapter` instantiates without error and registers on `VoiceDirectorAgent(adapter_type="kokoro")`.
2. Multi-sentence dialogue monologues are concatenated without loss.
3. Silence is generated for non-lexical inputs.
4. Temporary file replace prevents Windows `[WinError 32]` lock crashes.
5. All audio stems are written as 24,000 Hz 16-bit PCM (`subtype="PCM_16"`).
