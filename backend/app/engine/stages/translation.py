import json
import os
import asyncio
from pathlib import Path
from typing import Dict, Any, List

os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from app.engine.stage import BaseStage, ProgressCallback, LogCallback
from app.engine.subtitle_formatter import clean_segments, apply_qa_adjustments, format_srt, format_vtt
from app.engine.stages.transcription import TranscriptionStage

class TranslationStage(BaseStage):
    def __init__(self):
        super().__init__("translation", gpu_required=True)

    async def execute(
        self,
        input_artifacts: Dict[str, Any],
        config: Dict[str, Any],
        progress_cb: ProgressCallback,
        log_cb: LogCallback
    ) -> Dict[str, Any]:
        target_lang = config.get("target_language") or "en"
        raw_model = config.get("whisper_model") or config.get("asr_model") or "small"
        model_name = TranscriptionStage._normalize_model_name(raw_model)

        run_dir = Path(config.get("run_dir", "./storage/runs/default"))
        audio_path = input_artifacts.get("audio_path")
        if not audio_path or not Path(audio_path).exists():
            for candidate in [run_dir / "denoised_audio.wav", run_dir / "extracted_audio.wav"]:
                if candidate.exists():
                    audio_path = str(candidate)
                    break
        
        await log_cb("INFO", f"Running Translation Stage (target_lang={target_lang}, model={model_name})")
        await progress_cb(20.0, "Translating segments")

        raw_segments: List[Dict[str, Any]] = input_artifacts.get("segments", [])
        translated_segments: List[Dict[str, Any]] = []

        if audio_path and Path(audio_path).exists() and target_lang.lower() == "en":
            def run_whisper_translation():
                from faster_whisper import WhisperModel
                import ctranslate2
                try:
                    cuda_types = ctranslate2.get_supported_compute_types("cuda")
                    device = "cuda" if cuda_types else "cpu"
                except Exception:
                    device = "cpu"
                    cuda_types = set()

                if device == "cuda":
                    for preferred in ("float16", "int8_float32", "int8", "float32"):
                        if preferred in cuda_types:
                            compute_type = preferred
                            break
                    else:
                        compute_type = "auto"
                else:
                    compute_type = "int8"

                model = WhisperModel(model_name, device=device, compute_type=compute_type)
                segments, info = model.transcribe(
                    audio_path,
                    task="translate",
                    beam_size=5,
                    no_speech_threshold=0.6,
                    compression_ratio_threshold=2.4,
                    condition_on_previous_text=False,
                    vad_filter=True,
                    vad_parameters=dict(
                        min_speech_duration_ms=250,
                        min_silence_duration_ms=500,
                        speech_pad_ms=100,
                    ),
                )
                res = []
                for s in segments:
                    res.append({
                        "start_s": round(s.start, 3),
                        "end_s": round(s.end, 3),
                        "source_text": s.text.strip(),
                        "translated_text": s.text.strip(),
                        "target_language": "en"
                    })
                return res

            try:
                loop = asyncio.get_running_loop()
                await progress_cb(40.0, f"Performing Whisper English Translation pass using '{model_name}'")
                translated_segments = await loop.run_in_executor(None, run_whisper_translation)
                await log_cb("INFO", f"Whisper English Translation complete. Total segments: {len(translated_segments)}")
            except Exception as e:
                await log_cb("WARNING", f"Whisper translation pass failed: {e}")

        if not translated_segments and raw_segments:
            for seg in raw_segments:
                src = seg.get("source_text", "")
                seg_copy = dict(seg)
                seg_copy["translated_text"] = seg.get("translated_text", src)
                seg_copy["target_language"] = target_lang
                translated_segments.append(seg_copy)

        if not translated_segments:
            if config.get("stub_mode"):
                translated_segments = [
                    {"start_s": 0.5, "end_s": 4.2, "source_text": "Bienvenidos", "translated_text": "Welcome to DubForge Studio.", "target_language": target_lang},
                ]
            else:
                raise RuntimeError("No input segments available for translation stage.")

        await progress_cb(70.0, "Applying subtitle cleaning & QA rules (dedup, min gap, min duration, max CPS)")
        qa_segments = clean_segments(translated_segments)

        # Write output files
        srt_content = format_srt(qa_segments)
        vtt_content = format_vtt(qa_segments)

        srt_path = run_dir / f"subtitles_{target_lang}.srt"
        vtt_path = run_dir / f"subtitles_{target_lang}.vtt"

        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        with open(vtt_path, "w", encoding="utf-8") as f:
            f.write(vtt_content)

        await log_cb("INFO", f"Saved final subtitle files: {srt_path.name}, {vtt_path.name}")
        await progress_cb(100.0, "Translation & subtitle formatting complete")

        return {
            "status": "success",
            "segments": qa_segments,
            "artifacts": [
                {"type": "subtitle", "label": f"Subtitles ({target_lang.upper()} SRT)", "path": str(srt_path)},
                {"type": "subtitle", "label": f"Subtitles ({target_lang.upper()} VTT)", "path": str(vtt_path)}
            ]
        }

