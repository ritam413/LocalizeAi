import os
import gc
import asyncio
import httpx
import torch
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

app = FastAPI(
    title="LOCALIZE 50-Min 4GB GPU Server Coordinator",
    description="GPU Mutex Coordinator for NVIDIA GTX 1050 Ti & Local Compute"
)

# Mutex Lock to ensure Whisper and Ollama never collide in VRAM
gpu_lock = asyncio.Lock()
whisper_model = None


def get_whisper():
    global whisper_model
    if whisper_model is None:
        print("[GPU Coordinator] Loading Faster-Whisper (medium, int8) into VRAM...")
        # INT8 is required for Pascal GTX 1050 Ti to avoid FP16 software emulation
        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "int8" if torch.cuda.is_available() else "default"
        whisper_model = WhisperModel("medium", device=device, compute_type=compute_type)
    return whisper_model


def unload_whisper():
    global whisper_model
    if whisper_model is not None:
        print("[GPU Coordinator] Unloading Whisper & emptying CUDA cache...")
        del whisper_model
        whisper_model = None
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()


async def unload_ollama():
    try:
        async with httpx.AsyncClient() as client:
            await client.post("http://127.0.0.1:11434/api/generate", json={"model": "", "keep_alive": 0}, timeout=2.0)
    except Exception:
        pass


@app.get("/health")
async def health():
    vram_free = 0
    gpu_name = "CPU"
    if torch.cuda.is_available():
        vram_free = torch.cuda.mem_get_info()[0] / (1024 ** 2)
        gpu_name = torch.cuda.get_device_name(0)
    return {
        "status": "online",
        "gpu": gpu_name,
        "vram_free_mb": round(vram_free, 1),
        "pipeline_ready": True
    }


@app.post("/v1/audio/transcriptions")
async def transcribe(file: UploadFile = File(...), language: str = Form(None)):
    """Transcribes 50-min audio in chunks with exclusive GPU Lock."""
    async with gpu_lock:
        print(">>> [Lock Acquired] Running Faster-Whisper ASR...")
        await unload_ollama()

        temp_audio = f"temp_{file.filename}"
        with open(temp_audio, "wb") as f:
            f.write(await file.read())

        try:
            model = get_whisper()
            segments, info = model.transcribe(temp_audio, language=language, vad_filter=True)
            result_segments = []
            for seg in segments:
                result_segments.append({
                    "id": seg.id,
                    "start": round(seg.start, 3),
                    "end": round(seg.end, 3),
                    "text": seg.text.strip()
                })
            return {
                "language": info.language,
                "duration": round(info.duration, 2),
                "segments": result_segments
            }
        finally:
            if os.path.exists(temp_audio):
                os.remove(temp_audio)
            unload_whisper()
            print("<<< [Lock Released] Whisper transcription complete.")


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    """Routes batched dialogue translation scenes to Ollama with GPU lock."""
    async with gpu_lock:
        unload_whisper()
        payload = await request.json()
        payload["keep_alive"] = "0s"  # Flush immediately after response

        async with httpx.AsyncClient(timeout=300.0) as client:
            res = await client.post("http://127.0.0.1:11434/v1/chat/completions", json=payload)
            return JSONResponse(status_code=res.status_code, content=res.json())


if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 for LAN access
    uvicorn.run(app, host="0.0.0.0", port=8000)
