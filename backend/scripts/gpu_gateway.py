import os
import gc
import asyncio
import httpx
import torch
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

app = FastAPI(title="LocalizeAI 4GB GPU Coordinator Gateway")

# Mutex Lock to ensure only one engine touches VRAM at a time
gpu_lock = asyncio.Lock()
whisper_model = None

def get_whisper():
    """Dynamically loads Faster-Whisper into CUDA VRAM."""
    global whisper_model
    if whisper_model is None:
        print("[GPU Lock] Loading Faster-Whisper (small) to CUDA...")
        whisper_model = WhisperModel("small", device="cuda", compute_type="float16")
    return whisper_model

def unload_whisper():
    """Flushes Whisper model from VRAM."""
    global whisper_model
    if whisper_model is not None:
        print("[GPU Lock] Unloading Whisper from VRAM...")
        del whisper_model
        whisper_model = None
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

async def unload_ollama():
    """Instructs Ollama to drop models from VRAM."""
    try:
        async with httpx.AsyncClient() as client:
            await client.post("http://127.0.0.1:11434/api/generate", json={"model": "", "keep_alive": 0}, timeout=2.0)
    except Exception:
        pass


@app.get("/health")
async def health():
    return {
        "status": "online",
        "gpu_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None"
    }


@app.post("/v1/audio/transcriptions")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form(None)
):
    """Whisper ASR endpoint with exclusive GPU lock."""
    async with gpu_lock:
        print("\n>>> [Lock Acquired] Transcribing audio with Faster-Whisper...")
        await unload_ollama()
        
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())

        try:
            model = get_whisper()
            segments, info = model.transcribe(temp_path, language=language)
            segments_list = []
            full_text = []
            for seg in segments:
                full_text.append(seg.text.strip())
                segments_list.append({
                    "id": seg.id,
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text.strip()
                })
            
            return {
                "text": " ".join(full_text),
                "language": info.language,
                "duration": info.duration,
                "segments": segments_list
            }
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            unload_whisper()
            print("<<< [Lock Released] Whisper completed.")


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    """OpenAI-compatible LLM endpoint forwarding to Ollama with exclusive GPU lock."""
    async with gpu_lock:
        print("\n>>> [Lock Acquired] Executing LLM prompt on Ollama...")
        unload_whisper()
        
        payload = await request.json()
        payload["keep_alive"] = "0s"  # Release VRAM immediately after completion

        async with httpx.AsyncClient(timeout=180.0) as client:
            res = await client.post("http://127.0.0.1:11434/v1/chat/completions", json=payload)
            print("<<< [Lock Released] Ollama completed.")
            return JSONResponse(status_code=res.status_code, content=res.json())

if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 to allow LAN access from laptop
    uvicorn.run(app, host="0.0.0.0", port=8000)
