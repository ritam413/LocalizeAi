import json
import os
import re
import asyncio
import httpx
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from app.config import settings
from app.core.languages import resolve_language
from app.engine.stage import BaseStage, ProgressCallback, LogCallback
from app.engine.subtitle_formatter import clean_segments, apply_qa_adjustments, format_srt, format_vtt
from app.engine.stages.transcription import TranscriptionStage
from app.engine.localization.entity_preserver import extract_proper_nouns, protect_entities, restore_entities
from app.engine.localization.numeral_localizer import adapt_spoken_numerals
from app.agents.localization_director import LocalizationDirectorAgent

logger = logging.getLogger("dubforge.translation")


def _atomic_write_json(path: Path, data: Any) -> None:
    """Atomically writes JSON payload using temporary file substitution."""
    tmp = path.with_suffix(".tmp.json")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, path)


class TranslationStage(BaseStage):
    def __init__(self):
        super().__init__("translation", gpu_required=True)

    async def _call_ollama_translation(
        self,
        segments: List[Dict[str, Any]],
        source_lang: str,
        target_lang: str,
        target_lang_name: str,
        log_cb: LogCallback,
        config: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Translates a list of dialogue segments via Ollama LLM endpoint.
        Falls back to local host URLs (127.0.0.1:11434) if configured docker host is unreachable.
        """
        if config is None:
            config = {}
        urls = [
            settings.OLLAMA_BASE_URL.rstrip("/") + "/api/chat",
            "http://127.0.0.1:11434/api/chat",
            "http://localhost:11434/api/chat",
            settings.OLLAMA_BASE_URL.rstrip("/") + "/v1/chat/completions",
            "http://127.0.0.1:11434/v1/chat/completions",
        ]
        # De-duplicate while preserving order
        candidate_urls = list(dict.fromkeys(urls))

        dialogue_items = [
            {"id": idx + 1, "text": seg.get("source_text", "")}
            for idx, seg in enumerate(segments)
        ]

        system_prompt = (
            f"You are a professional film and media localization director.\n"
            f"Translate the following dialogue from {source_lang} into natural, colloquial {target_lang_name} ({target_lang}).\n"
            f"Preserve character voice, emotional tone, and rhythmic duration.\n"
            f"Do NOT translate proper names, brand names, or software names.\n"
            f"Output ONLY valid JSON matching this schema: [{{\"id\": 1, \"translated_text\": \"...\"}}]"
        )

        user_content = json.dumps(dialogue_items, ensure_ascii=False)
        model_name = config.get("ollama_model") or config.get("llm_model") or settings.OLLAMA_MODEL
        candidate_models = [model_name, "qwen2.5:3b", "qwen25-3b-subtitles:latest"]
        candidate_models = list(dict.fromkeys(candidate_models))

        batch_size = 8
        translated_map = {}
        for target_model in candidate_models:
            model_translated_map = {}
            all_batches_succeeded = True
            for batch_start in range(0, len(segments), batch_size):
                batch_segments = segments[batch_start:batch_start + batch_size]
                dialogue_items = [
                    {"id": batch_start + idx + 1, "text": seg.get("source_text", "")}
                    for idx, seg in enumerate(batch_segments)
                ]
                user_content = json.dumps(dialogue_items, ensure_ascii=False)
                payload = {
                    "model": target_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    "stream": False,
                    "options": {
                        "temperature": 0.3
                    }
                }

                batch_ok = False
                for url in candidate_urls:
                    try:
                        async with httpx.AsyncClient(timeout=180.0) as client:
                            resp = await client.post(url, json=payload)
                            if resp.status_code == 200:
                                data = resp.json()
                                raw_reply = ""
                                if "message" in data:
                                    raw_reply = data["message"].get("content", "")
                                elif "choices" in data and len(data["choices"]) > 0:
                                    raw_reply = data["choices"][0].get("message", {}).get("content", "")
                                elif "response" in data:
                                    raw_reply = data.get("response", "")

                                json_match = re.search(r"\[\s*\{.*\}\s*\]", raw_reply, re.DOTALL)
                                if json_match:
                                    try:
                                        parsed = json.loads(json_match.group(0))
                                        for item in parsed:
                                            model_translated_map[item.get("id")] = item.get("translated_text", "")
                                        batch_ok = True
                                        break
                                    except Exception as json_err:
                                        logger.warning(f"JSON decode failed on batch {batch_start}: {json_err}")
                            else:
                                logger.warning(f"Ollama request to {url} (model={target_model}) returned HTTP {resp.status_code}: {resp.text}")
                    except Exception as e:
                        logger.debug(f"Ollama request failed on {url} (model={target_model}): {e}")
                        continue

                if not batch_ok:
                    all_batches_succeeded = False
                    break

            if all_batches_succeeded and len(model_translated_map) > 0:
                translated_map = model_translated_map
                await log_cb("INFO", f"Ollama translation successful using model '{target_model}' ({len(translated_map)} lines)")
                break

        # Recombine with original segment timings and metadata
        result = []
        for idx, seg in enumerate(segments):
            seg_id = idx + 1
            src_text = seg.get("source_text", "")
            trans_text = translated_map.get(seg_id) or src_text
            
            # Apply numeral localization (e.g. 2.4k -> 2.4 hazar)
            adapted_text, _ = adapt_spoken_numerals(trans_text, target_lang=target_lang)
            
            seg_copy = dict(seg)
            seg_copy["translated_text"] = adapted_text
            seg_copy["target_language"] = target_lang
            result.append(seg_copy)

        return result

    async def execute(
        self,
        input_artifacts: Dict[str, Any],
        config: Dict[str, Any],
        progress_cb: ProgressCallback,
        log_cb: LogCallback
    ) -> Dict[str, Any]:
        target_lang_raw = config.get("target_language") or "en"
        target_spec = resolve_language(target_lang_raw)
        target_lang = target_spec.code
        target_lang_name = target_spec.name

        source_lang_raw = config.get("source_language") or "en"
        source_spec = resolve_language(source_lang_raw)
        source_lang = source_spec.code

        raw_model = config.get("whisper_model") or config.get("asr_model") or "small"
        model_name = TranscriptionStage._normalize_model_name(raw_model)

        run_dir = Path(config.get("run_dir", "./storage/runs/default"))
        run_dir.mkdir(parents=True, exist_ok=True)
        audio_path = input_artifacts.get("audio_path")
        if not audio_path or not Path(audio_path).exists():
            for candidate in [run_dir / "denoised_audio.wav", run_dir / "extracted_audio.wav"]:
                if candidate.exists():
                    audio_path = str(candidate)
                    break
        
        await log_cb("INFO", f"Running Translation Stage ({source_lang} -> {target_lang} [{target_lang_name}], model={model_name})")
        await progress_cb(20.0, f"Translating dialogue into {target_lang_name}")

        raw_segments: List[Dict[str, Any]] = input_artifacts.get("segments", [])
        translated_segments: List[Dict[str, Any]] = []

        # ── Pathway 0: Same Language / English-to-English Passthrough ───────── #
        if source_lang == target_lang:
            force_ollama = bool(config.get("force_ollama_translation", False))
            if not force_ollama:
                await log_cb("INFO", f"Source and target languages are both '{target_lang}'. Skipping Ollama LLM translation.")
                await progress_cb(45.0, f"Generating subtitles directly in {target_lang_name} from transcribed dialogue.")
                for seg in raw_segments:
                    seg_copy = dict(seg)
                    seg_copy["translated_text"] = seg.get("source_text", "")
                    seg_copy["target_language"] = target_lang
                    translated_segments.append(seg_copy)
                await log_cb("PROMPT", f"Subtitles generated in {target_lang_name}. Ready to proceed to dubbing or trigger Ollama rephrasing with force_ollama_translation=True.")

        # ── Pathway 1: Target is English & foreign audio is available ──────── #
        if not translated_segments and audio_path and Path(audio_path).exists() and target_lang == "en" and source_lang != "en":
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

                def _run_pass(dev: str, comp: str):
                    model = WhisperModel(model_name, device=dev, compute_type=comp)
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
                    del model
                    return res

                if device == "cuda":
                    try:
                        return _run_pass(dev="cuda", comp=compute_type)
                    except Exception as cuda_err:
                        logging.warning(
                            f"[TranslationStage] CUDA Whisper execution failed ({cuda_err}). "
                            f"Falling back to CPU (int8) translation."
                        )
                        return _run_pass(dev="cpu", comp="int8")
                else:
                    return _run_pass(dev="cpu", comp="int8")

            try:
                loop = asyncio.get_running_loop()
                await progress_cb(40.0, f"Performing Whisper English Translation pass using '{model_name}'")
                translated_segments = await loop.run_in_executor(None, run_whisper_translation)
                await log_cb("INFO", f"Whisper English Translation complete. Total segments: {len(translated_segments)}")
            except Exception as e:
                await log_cb("WARNING", f"Whisper translation pass failed: {e}")

        # ── Pathway 2: Target is non-English (en->hi, es->en->hi, hi->en->ja) ── #
        if not translated_segments and raw_segments:
            await progress_cb(40.0, f"Querying Ollama LLM for {target_lang_name} dialogue translation")
            translated_segments = await self._call_ollama_translation(
                segments=raw_segments,
                source_lang=source_lang,
                target_lang=target_lang,
                target_lang_name=target_lang_name,
                log_cb=log_cb,
                config=config
            )

        # ── Pathway 3: Fallback if LLM produced empty or passthrough ───────── #
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

        # Sanitize segment contracts
        for idx, seg in enumerate(qa_segments):
            seg["segment_id"] = int(seg.get("segment_id", idx + 1))
            seg["start_s"] = float(seg.get("start_s", 0.0))
            seg["end_s"] = float(seg.get("end_s", 0.0))
            seg["source_text"] = str(seg.get("source_text", ""))
            seg["translated_text"] = str(seg.get("translated_text") or seg.get("source_text", ""))
            seg["target_language"] = str(target_lang)

        # Write output files (subtitles & atomic transcript manifests)
        srt_path = run_dir / f"subtitles_{target_lang}.srt"
        vtt_path = run_dir / f"subtitles_{target_lang}.vtt"
        transcript_path = run_dir / "transcript.json"
        lang_transcript_path = run_dir / f"transcript_{target_lang}.json"

        srt_path.write_text(format_srt(qa_segments), encoding="utf-8")
        vtt_path.write_text(format_vtt(qa_segments), encoding="utf-8")
        _atomic_write_json(transcript_path, qa_segments)
        _atomic_write_json(lang_transcript_path, qa_segments)

        await log_cb("INFO", f"Saved final subtitle and transcript files: {srt_path.name}, {vtt_path.name}, {transcript_path.name}")
        await progress_cb(100.0, "Translation & subtitle formatting complete")

        return {
            "status": "success",
            "segments": qa_segments,
            "artifacts": [
                {"type": "subtitle", "label": f"Subtitles ({target_lang.upper()} SRT)", "path": str(srt_path)},
                {"type": "subtitle", "label": f"Subtitles ({target_lang.upper()} VTT)", "path": str(vtt_path)},
                {"type": "transcript", "label": "Transcript (Active JSON)", "path": str(transcript_path)},
                {"type": "transcript", "label": f"Transcript ({target_lang.upper()} JSON)", "path": str(lang_transcript_path)},
            ]
        }


