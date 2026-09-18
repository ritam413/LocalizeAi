# 🚀 Localize AI — Agent Session Handoff & Startup Protocol

**Last Updated:** 2026-09-18  
**Session Objective:** Next-agent startup instructions and local GTX 1050 Ti GPU acceleration guide.

---

## 📌 Startup Action Trigger
> **When the user opens this repository and says `start` (or starts a new chat):**
> 1. Read this `HANDOFF.md` and `TRACKER.md`.
> 2. Immediately ask the user if they want to activate local GPU acceleration for **Qwen 2.5:3B** on their **GTX 1050 Ti (4GB VRAM)** via **Option A (Native Windows Ollama)** or **Option B (Native llama-server)**.
> 3. Guide them through the 2-step setup to test and verify GPU offloading in `nvidia-smi`.

---

## 🛠️ GPU Setup Guide for GTX 1050 Ti

### Why GPU Setup is Needed:
The official Linux Docker container for Ollama skips CUDA on Pascal GPUs (`Compute Capability 6.1` / `610`). Running Ollama or `llama-server` natively on Windows directly offloads all 36 transformer layers into the 1050 Ti's 4GB VRAM at ~40–60 tokens/sec.

### Option A: Native Windows Ollama (Recommended — 2 min)
1. Stop the Docker Ollama container:
   ```powershell
   docker stop localize-ollama
   ```
2. Install [Ollama for Windows](https://ollama.com/download/windows).
3. Pull and run Qwen:
   ```powershell
   ollama run qwen2.5:3b
   ```
4. Verify port `11434` is active and offloaded to GPU.

### Option B: Native `llama.cpp` Server
1. Download `llama-server.exe` with CUDA support from [llama.cpp releases](https://github.com/ggerganov/llama.cpp/releases).
2. Download `qwen2.5-3b-instruct-q4_k_m.gguf` (~1.9 GB).
3. Run:
   ```powershell
   .\llama-server.exe -m .\qwen2.5-3b-instruct-q4_k_m.gguf -ngl 99 --port 11434 --host 0.0.0.0
   ```

---

## 📊 Current Project State & Accomplishments

### 1. Completed Hindi Dub & Deliverables
All 148 dialogue segments for `Twitter_API_With_n8n__Step-by-Step___No_Code__3` have been generated and verified on disk:
- 🎬 **Dubbed MP4**: `storage/runs/Twitter_API_With_n8n__Step-by-Step___No_Code__3/hi/twitter_n8n_hi_dubbed.mp4` (27.48 MB)
- 🎧 **Mastered Audio**: `storage/runs/Twitter_API_With_n8n__Step-by-Step___No_Code__3/hi/master_dub_hi.wav` (302 MB)
- 📝 **Hindi Subtitles**: `storage/runs/Twitter_API_With_n8n__Step-by-Step___No_Code__3/hi/subtitles_hi.srt` (100% Devanagari Hindi)
- 📝 **Hindi Subtitles (VTT)**: `storage/runs/Twitter_API_With_n8n__Step-by-Step___No_Code__3/hi/subtitles_hi.vtt`
- 📋 **Segment Metadata**: `storage/runs/Twitter_API_With_n8n__Step-by-Step___No_Code__3/hi/translated_segments_hi.json`

### 2. Pipeline Features Wired
- **Parallel Translation Streaming**: Concurrent workers flush to disk immediately after each segment.
- **Devanagari Verification (`is_hindi()`)**: Ensures no raw English fallback strings can slip into the subtitle files.
- **Edge TTS Synthesis**: `hi-IN-MadhurNeural` neural voice stems generated in parallel.
- **Duration Alignment**: FFmpeg `atempo` reconciles dialogue length to original video speech windows.
- **Sidechain Acoustic Mastering**: `-6 dB` dynamic background ducking and EBU R128 (`-24.0 LUFS`) loudness normalization.
- **Video Multiplexing**: Stream-copy multiplexing without re-encoding video.

---

## 🔮 Next Immediate Steps for the Agent
1. When user prompts `start`, greet them and offer to verify/configure **Native Windows Ollama** on their **GTX 1050 Ti**.
2. Run `nvidia-smi` and test `http://localhost:11434/api/generate` to confirm full GPU utilization.
