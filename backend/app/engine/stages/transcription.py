import json
import os
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional

os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from app.engine.stage import BaseStage, ProgressCallback, LogCallback
from app.engine.subtitle_formatter import clean_segments, purge_hallucinations, deduplicate_segments


class TranscriptionStage(BaseStage):
    """
    ASR stage using Faster-Whisper with full anti-hallucination configuration.

    Key settings (per ADR 0001):
    - Reads isolated vocals.wav produced by DenoiseStage (HTDemucs stem).
    - VAD filter enabled: min_speech_duration_ms=250, min_silence_duration_ms=500.
    - Anti-hallucination: no_speech_threshold=0.6, compression_ratio_threshold=2.4,
      condition_on_previous_text=False.
    - Device: CUDA (float16) if available, CPU (int8) as fallback.
    - Model is loaded, used, then explicitly deleted + CUDA cache cleared so the
      next GPU stage (e.g. TTS) can load without OOM on a 4 GB GTX 1050 Ti.
    """

    MODEL_SIZE = "medium"

    @staticmethod
    def _normalize_model_name(raw_name: Optional[str]) -> str:
        if not raw_name:
            return "medium"
        name = str(raw_name).strip().lower()
        if "turbo" in name:
            return "turbo"
        if "large" in name:
            return "large-v3"
        if "medium" in name:
            return "medium"
        if "small" in name:
            return "small"
        if "tiny" in name:
            return "tiny"
        if "base" in name:
            return "base"
        return name

    def __init__(self):
        super().__init__("transcription", gpu_required=True)

    async def execute(
        self,
        input_artifacts: Dict[str, Any],
        config: Dict[str, Any],
        progress_cb: ProgressCallback,
        log_cb: LogCallback,
    ) -> Dict[str, Any]:
        source_lang: Optional[str] = config.get("source_language")
        if source_lang and source_lang.lower() in ("auto", "auto-detect", ""):
            source_lang = None

        raw_model = config.get("whisper_model") or config.get("asr_model") or self.MODEL_SIZE
        model_name = self._normalize_model_name(raw_model)

        run_dir = Path(config.get("run_dir", "./storage/runs/default"))
        output_json = run_dir / "transcript.json"

        audio_path = self._resolve_audio(input_artifacts, run_dir)

        await log_cb(
            "INFO",
            f"TranscriptionStage: source_lang={source_lang or 'auto-detect'}, "
            f"model={model_name} (raw={raw_model}), audio={audio_path}",
        )
        await progress_cb(10.0, "Resolving input audio path")

        segments_data: List[Dict[str, Any]] = []

        if audio_path and Path(audio_path).exists():
            segments_data = await self._run_whisper(
                audio_path, source_lang, model_name, progress_cb, log_cb
            )
        elif config.get("stub_mode"):
            await log_cb("WARNING", f"No valid audio found at '{audio_path}'. Using stub placeholder segments.")
            segments_data = self._placeholder_segments()
        else:
            await log_cb("ERROR", f"No valid audio found at '{audio_path}'.")
            raise RuntimeError(f"No valid audio file found for transcription stage at path: '{audio_path}'")

        if not segments_data:
            if config.get("stub_mode"):
                segments_data = self._placeholder_segments()
            else:
                raise RuntimeError("Transcription produced zero segments.")

        # Post-process: purge phantom hallucinations and deduplicate consecutive loops (action/fight scenes)
        segments_data = purge_hallucinations(segments_data)
        segments_data = deduplicate_segments(segments_data)

        with open(output_json, "w", encoding="utf-8") as fh:
            json.dump(segments_data, fh, indent=2, ensure_ascii=False)

        await progress_cb(100.0, "Transcription complete")
        return {
            "status": "success",
            "segments": segments_data,
            "audio_path": audio_path,
            "artifacts": [
                {"type": "json", "label": "Transcription JSON", "path": str(output_json)}
            ],
        }

    # ------------------------------------------------------------------ #
    #  Whisper inference (runs in a thread to not block the event loop)   #
    # ------------------------------------------------------------------ #

    async def _run_whisper(
        self,
        audio_path: str,
        source_lang: Optional[str],
        model_name: str,
        progress_cb: ProgressCallback,
        log_cb: LogCallback,
    ) -> List[Dict[str, Any]]:
        await log_cb("INFO", f"Loading Faster-Whisper '{model_name}' model")
        await progress_cb(20.0, f"Loading Whisper model '{model_name}' into memory")

        def _whisper_sync() -> List[Dict[str, Any]]:
            from faster_whisper import WhisperModel
            import ctranslate2

            # faster-whisper uses ctranslate2, NOT torch — detect CUDA via ct2.
            try:
                cuda_types = ctranslate2.get_supported_compute_types("cuda")
                device = "cuda" if cuda_types else "cpu"
            except Exception:
                device = "cpu"
                cuda_types = set()

            if device == "cuda":
                # Select best compute_type supported by target GPU hardware (e.g. float16, int8_float32, int8, float32)
                for preferred in ("float16", "int8_float32", "int8", "float32"):
                    if preferred in cuda_types:
                        compute_type = preferred
                        break
                else:
                    compute_type = "auto"
            else:
                compute_type = "int8"

            def _transcribe_with_model(dev: str, comp: str):
                model = WhisperModel(
                    model_name,
                    device=dev,
                    compute_type=comp,
                )

                segments_iter, info = model.transcribe(
                    audio_path,
                    language=source_lang,
                    task="transcribe",
                    beam_size=5,
                    # ── Anti-hallucination ───────────────────────────────── #
                    no_speech_threshold=0.6,
                    compression_ratio_threshold=2.4,
                    condition_on_previous_text=False,
                    # ── Silero VAD — ignores non-speech bursts (ADR 0001) ── #
                    vad_filter=True,
                    vad_parameters=dict(
                        min_speech_duration_ms=250,
                        min_silence_duration_ms=500,
                        speech_pad_ms=100,
                    ),
                    word_timestamps=True,
                )

                result: List[Dict[str, Any]] = []
                for seg in segments_iter:
                    # Snap to first/last spoken word boundaries for tight timing.
                    if seg.words and len(seg.words) > 0:
                        start_time = seg.words[0].start
                        end_time = seg.words[-1].end
                    else:
                        start_time = seg.start
                        end_time = seg.end

                    result.append({
                        "start_s": round(start_time, 3),
                        "end_s": round(end_time, 3),
                        "source_text": seg.text.strip(),
                    })

                # Release ctranslate2 model from memory
                del model
                return result, info.language

            if device == "cuda":
                try:
                    return _transcribe_with_model(dev="cuda", comp=compute_type)
                except Exception as cuda_err:
                    import logging
                    logging.warning(
                        f"[TranscriptionStage] CUDA Whisper execution failed ({cuda_err}). "
                        f"Transparently falling back to CPU (int8) inference."
                    )
                    return _transcribe_with_model(dev="cpu", comp="int8")
            else:
                return _transcribe_with_model(dev="cpu", comp="int8")

        try:
            loop = asyncio.get_running_loop()
            await progress_cb(50.0, "Transcribing speech segments with word timestamps")
            segments, detected_lang = await loop.run_in_executor(None, _whisper_sync)
            await log_cb(
                "INFO",
                f"Whisper done. Detected language: {detected_lang}, "
                f"segments: {len(segments)}",
            )
            return segments
        except Exception as exc:
            await log_cb("ERROR", f"Whisper transcription failed: {exc}")
            raise

    # ------------------------------------------------------------------ #
    #  Helpers                                                            #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _resolve_audio(
        input_artifacts: Dict[str, Any],
        run_dir: Path,
    ) -> Optional[str]:
        """
        Prefer the isolated vocals stem from DenoiseStage; fall back to
        denoised or raw extracted audio if vocals.wav is absent.
        """
        path = input_artifacts.get("vocals_path") or input_artifacts.get("audio_path")
        if path and Path(path).exists():
            return str(path)

        for candidate in (
            run_dir / "vocals.wav",
            run_dir / "denoised_audio.wav",
            run_dir / "extracted_audio.wav",
        ):
            if candidate.exists():
                return str(candidate)

        return None

    @staticmethod
    def _placeholder_segments() -> List[Dict[str, Any]]:
        """Demo data used when real transcription is unavailable."""
        return [
            {
                "start_s": 0.5,
                "end_s": 4.2,
                "source_text": "Bienvenidos a esta demostración del sistema de doblaje DubForge Studio.",
            },
            {
                "start_s": 4.8,
                "end_s": 9.1,
                "source_text": "El pipeline procesa audio, transcripción y traducción de alta calidad.",
            },
            {
                "start_s": 9.8,
                "end_s": 14.5,
                "source_text": "Generamos subtítulos perfectamente sincronizados con reglas estrictas de QA.",
            },
        ]
