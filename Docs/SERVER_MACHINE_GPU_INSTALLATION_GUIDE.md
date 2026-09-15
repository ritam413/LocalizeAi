# Local GPU Server Installation & Network Exposure Guide
**Target Machine:** PC with NVIDIA GTX 1050 Ti (4GB VRAM), Windows 10/11
**Client Machine:** Laptop connected to the same Local Area Network (Wi-Fi / Ethernet)

---

## 1. System Architecture Overview

To avoid CUDA Out-Of-Memory (OOM) errors on 4GB VRAM while running both Large Language Models (LLMs) and Audio Processing (ASR/TTS/Separation), we implement a **GPU Mutex Locked Coordinator Gateway** on the PC.

```
       [ Client Laptop ] (Same Wi-Fi / LAN)
               │
               ▼ HTTP (e.g., http://192.168.1.50:8000)
┌────────────────────────────────────────────────────────┐
│ PC Host Machine (GTX 1050 Ti - 4GB VRAM)              │
│                                                        │
│   FastAPI Gateway (port 8000) [asyncio.Lock GPU Guard] │
│   ├── /v1/chat/completions                             │
│   │     └──► Unloads Whisper ──► Calls Ollama (11434) │
│   │                                                    │
│   └── /v1/audio/transcriptions                         │
│         └──► Unloads Ollama ──► Calls Faster-Whisper   │
└────────────────────────────────────────────────────────┘
```

---

## 2. PC Setup & Installation Steps

### Step 1: Install NVIDIA CUDA Toolkit & cuDNN
Ensure NVIDIA drivers and CUDA 12.x or 11.8 are installed:
```powershell
nvidia-smi
```
Verify that the GPU is recognized and CUDA is available.

---

### Step 2: Install and Configure Ollama for LAN

1. Download and install Ollama for Windows from [https://ollama.com](https://ollama.com).
2. Configure Windows System Environment Variables:
   - `OLLAMA_HOST` = `0.0.0.0:11434` *(Allows connections from all interfaces)*
   - `OLLAMA_ORIGINS` = `*` *(Enables CORS)*
   - `OLLAMA_KEEP_ALIVE` = `0` *(Forces VRAM release after each prompt)*
3. Restart the Ollama desktop service.
4. Pull the recommended 4GB-optimized models in PowerShell:
   ```powershell
   ollama pull qwen2.5:3b
   ollama pull gemma2:2b
   ```

---

### Step 3: Setup Python Environment for Audio & Gateway

Open PowerShell as Administrator in a working directory (e.g., `C:\LocalAI_Server`):

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install FastAPI server, Faster-Whisper, Kokoro, Edge-TTS, and Demucs
pip install fastapi uvicorn[standard] httpx python-multipart faster-whisper demucs soundfile kokoro edge-tts
```

---

### Step 4: Configure Windows Firewall

Open **PowerShell as Administrator** and execute:

```powershell
# Allow Gateway Port 8000
New-NetFirewallRule -DisplayName "Local AI Gateway" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

# Allow Direct Ollama Port 11434 (Optional fallback)
New-NetFirewallRule -DisplayName "Ollama API" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow
```

---

### Step 5: The GPU Coordinator Server Script (`gpu_gateway.py`)

Save this file as `gpu_gateway.py` on your PC:

```python
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
    return {"status": "online", "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu"}


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
```

---

### Step 6: Start the Server

Run on your PC:
```powershell
python gpu_gateway.py
```

Find your PC's IP address:
```powershell
ipconfig
# Note your IPv4 Address (e.g. 192.168.1.50)
```

---

## 3. Client Laptop Connection & Testing

From your laptop, update your `.env` or configuration to point to the PC:

```env
LOCAL_AI_BASE_URL="http://192.168.1.50:8000/v1"
LOCAL_AI_API_KEY="local-token"
```

### Verification Script on Laptop:
```python
import requests
from openai import OpenAI

PC_IP = "192.168.1.50"

# 1. Test Health
res = requests.get(f"http://{PC_IP}:8000/health")
print("Server Health:", res.json())

# 2. Test LLM Translation
client = OpenAI(base_url=f"http://{PC_IP}:8000/v1", api_key="ollama")
chat_res = client.chat.completions.create(
    model="qwen2.5:3b",
    messages=[{"role": "user", "content": "Translate 'We must defend the gate!' to Hindi."}]
)
print("LLM Translation:", chat_res.choices[0].message.content)
```
