# 🚀 Localize AI — Agent Session Handoff & Startup Protocol

**Last Updated:** 2026-09-18  
**Top Priority Task:** Implement Kokoro-82M TTS Adapter (`KokoroTTSAdapter`) into `backend/app/agents/voice_director.py` and register it in `TTSStage`.

---

## 🚨 PRIORITY 1: IMPLEMENT THIS FIRST BEFORE ANYTHING ELSE 🚨

> **CRITICAL AGENT INSTRUCTION (STARTUP DIRECTIVE):**  
> When you pull this repository on your PC or start a new agent session, **the very first implementation task you must complete is adding `KokoroTTSAdapter` to the speech synthesis pipeline**.  
> Read [`Docs/KOKORO_TTS_INTEGRATION_ARCHITECTURAL_REPORT.md`](file:///Docs/KOKORO_TTS_INTEGRATION_ARCHITECTURAL_REPORT.md) and execute the steps below immediately:

### Step-by-Step Implementation Action Plan:
1. **Edit `backend/app/agents/voice_director.py`**:
   - Implement `KokoroTTSAdapter(SpeechSynthesisAdapter)` wrapping `kokoro.KPipeline` with 24kHz PCM float32 output and automatic fallback to `EdgeTTSAdapter`.
   - Update `VoiceDirectorAgent.__init__` to instantiate `KokoroTTSAdapter` when `adapter_type == "kokoro"`.
2. **Edit `backend/app/engine/stages/tts.py`**:
   - Pass `adapter_type = config.get("tts_adapter", "kokoro")` so Mode A runs default to Kokoro-82M.
3. **Verify with Pytest**:
   - Run unit tests: `pytest backend/tests/test_voice_director.py backend/tests/test_dubbing_stages_chain.py`
4. **Update Tracking Files**:
   - Log the completed implementation in `TRACKER.md` and update `features_implemented.md`.

---

## 📌 Secondary Action: Local GPU Acceleration (Qwen 2.5:3B & Faster-Whisper)

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
- **Duration Alignment**: FFmpeg `atempo` reconciles dialogue length to original video speech windows.
- **Sidechain Acoustic Mastering**: `-6 dB` dynamic background ducking and EBU R128 (`-24.0 LUFS`) loudness normalization.
- **Video Multiplexing**: Stream-copy multiplexing without re-encoding video.

---

## 🔮 Summary Checklist for Next Agent
- [ ] Implement `KokoroTTSAdapter` in `backend/app/agents/voice_director.py`.
- [ ] Connect Kokoro in `backend/app/engine/stages/tts.py`.
- [ ] Run Pytest and Vitest test suites.
- [ ] Update `TRACKER.md` and `features_implemented.md`.
