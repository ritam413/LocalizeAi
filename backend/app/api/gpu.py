import io
import os
import tempfile
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
import psutil
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import PlainTextResponse

logger = logging.getLogger("dubforge.gpu")
gpu_router = APIRouter(prefix="/gpu", tags=["GPU Worker"])

try:
    import torch
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
except Exception:
    DEVICE = "cpu"

# Lazy Model Instances
asr_model = None
diarize_pipeline = None
kokoro_pipelines: Dict[str, Any] = {}

def get_asr_model():
    global asr_model
    if asr_model is None:
        try:
            import whisperx
            logger.info(f"Loading WhisperX Large-v3 on {DEVICE}...")
            asr_model = whisperx.load_model("large-v3", DEVICE, compute_type="float16" if DEVICE == "cuda" else "int8")
            logger.info("✓ WhisperX Large-v3 loaded successfully")
        except Exception as wx_err:
            logger.warning(f"WhisperX load fallback to Faster-Whisper: {wx_err}")
            from faster_whisper import WhisperModel
            asr_model = WhisperModel("large-v3-turbo", device=DEVICE, compute_type="float16" if DEVICE == "cuda" else "int8")
    return asr_model

def get_diarize_pipeline():
    global diarize_pipeline
    if diarize_pipeline is None:
        token = os.environ.get('HF_TOKEN')
        try:
            import whisperx
            logger.info(f"Loading PyAnnote Diarization on {DEVICE}...")
            diarize_pipeline = whisperx.DiarizationPipeline(use_auth_token=token, device=DEVICE)
            logger.info("✓ PyAnnote Diarization loaded successfully")
        except Exception as e:
            logger.warning(f"PyAnnote load fallback: {e}")
            diarize_pipeline = False
    return diarize_pipeline

def get_kokoro_pipeline(lang_code='a'):
    global kokoro_pipelines
    if lang_code not in kokoro_pipelines:
        try:
            from kokoro import KPipeline
            logger.info(f"Loading Kokoro-82M Pipeline for lang='{lang_code}' on {DEVICE}...")
            kokoro_pipelines[lang_code] = KPipeline(lang_code=lang_code)
            logger.info(f"✓ Kokoro-82M lang='{lang_code}' loaded successfully")
        except Exception as e:
            logger.error(f"Kokoro load failed: {e}")
            raise
    return kokoro_pipelines[lang_code]

@gpu_router.get("/health")
async def gpu_health_check():
    vram_mb = 0.0
    vram_reserved_mb = 0.0
    gpu_name = "CPU"
    try:
        import torch
        if torch.cuda.is_available():
            vram_mb = torch.cuda.memory_allocated() / (1024 * 1024)
            vram_reserved_mb = torch.cuda.memory_reserved() / (1024 * 1024)
            gpu_name = torch.cuda.get_device_name(0)
    except Exception:
        pass

    return {
        "status": "ok",
        "gpu": gpu_name,
        "vram_allocated_mb": round(vram_mb, 2),
        "vram_reserved_mb": round(vram_reserved_mb, 2),
        "ram_used_pct": psutil.virtual_memory().percent,
        "models_loaded": {
            "asr": asr_model is not None,
            "diarize": diarize_pipeline is not None and diarize_pipeline is not False,
            "kokoro_langs": list(kokoro_pipelines.keys())
        }
    }

@gpu_router.post("/transcribe_chunk")
async def transcribe_chunk(
    file: UploadFile = File(...),
    chunk_idx: int = Form(0),
    source_lang: Optional[str] = Form(None),
    diarize: Optional[str] = Form("false"),
    num_speakers: Optional[str] = Form(None),
):
    logger.info(f"[Chunk {chunk_idx}] Transcribing audio chunk on GPU (source_lang={source_lang})...")
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        model = get_asr_model()
        segments_list = []
        lang = source_lang or "en"

        # Check if WhisperX or Faster-Whisper
        if hasattr(model, "transcribe") and "batch_size" in model.transcribe.__code__.co_varnames:
            import whisperx
            audio = whisperx.load_audio(tmp_path)
            result = model.transcribe(audio, batch_size=16, language=source_lang)
            lang = result.get("language", source_lang or "en")

            try:
                align_model, meta = whisperx.load_align_model(language_code=lang, device=DEVICE)
                result = whisperx.align(result["segments"], align_model, meta, audio, DEVICE, return_char_alignments=False)
            except Exception as e:
                logger.warning(f"[Chunk {chunk_idx}] Forced alignment note: {e}")

            if diarize and diarize.lower() == "true":
                diarizer = get_diarize_pipeline()
                if diarizer:
                    try:
                        diarize_segments = diarizer(audio)
                        result = whisperx.assign_word_speakers(diarize_segments, result)
                    except Exception as e:
                        logger.warning(f"[Chunk {chunk_idx}] Diarization note: {e}")

            segments_list = result.get("segments", [])
        else:
            # Faster-Whisper fallback
            segments_iter, info = model.transcribe(
                tmp_path,
                language=source_lang,
                task="transcribe",
                beam_size=5,
                vad_filter=True,
                word_timestamps=True,
            )
            lang = info.language or source_lang or "en"
            for seg in segments_iter:
                segments_list.append({
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text.strip(),
                    "words": [{"word": w.word, "start": w.start, "end": w.end, "score": w.probability} for w in (seg.words or [])]
                })

        Path(tmp_path).unlink(missing_ok=True)
        return {
            "status": "success",
            "chunk_idx": chunk_idx,
            "language": lang,
            "segments": segments_list
        }
    except Exception as e:
        logger.error(f"[Chunk {chunk_idx}] Transcription failed: {e}")
        Path(tmp_path).unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=str(e))

class StemSynthesisRequest(BaseModel):
    segment_id: int = 0
    text: str
    voice_id: str = "af_heart"
    lang_code: str = "a"
    speed: float = 1.0

@gpu_router.post("/synthesize_stem")
async def synthesize_stem(req: StemSynthesisRequest):
    import numpy as np
    import soundfile as sf

    logger.info(f"[Segment {req.segment_id}] Synthesizing TTS (voice={req.voice_id}, lang={req.lang_code})...")
    pipeline = get_kokoro_pipeline(req.lang_code)
    generator = pipeline(req.text, voice=req.voice_id, speed=req.speed)
    
    audio_chunks = []
    for _, _, audio in generator:
        audio_chunks.append(audio)
        
    if not audio_chunks:
        combined = np.zeros(24000, dtype=np.float32)
    else:
        combined = np.concatenate(audio_chunks)
        
    buf = io.BytesIO()
    sf.write(buf, combined, 24000, format='WAV', subtype='PCM_16')
    buf.seek(0)
    
    return Response(content=buf.getvalue(), media_type="audio/wav", headers={
        "X-Segment-Id": str(req.segment_id),
        "X-Duration-Seconds": f"{len(combined) / 24000:.3f}"
    })
