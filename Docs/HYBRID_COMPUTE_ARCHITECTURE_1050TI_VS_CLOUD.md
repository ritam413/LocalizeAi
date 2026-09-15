# Hybrid Compute Architecture: GTX 1050 Ti (4GB) Local vs Cloud Partitioning

**Author:** Senior Forward Deployed AI Engineer  
**Date:** 2026-09-15  
**Target:** LocalizeAI (`localize_movie_dub`) Post-Production Pipeline  
**Target Hardware:** NVIDIA GeForce GTX 1050 Ti (4GB GDDR5, Pascal CC 6.1) + Colab Pro+ / Cloud Endpoints

---

## 1. Executive Hardware Reality Check (GTX 1050 Ti)

| Metric | GTX 1050 Ti (Local) | Cloud T4 / A100 (Colab Pro+) | Cloud Serverless (Modal / RunPod) |
|---|---|---|---|
| **VRAM** | **4.0 GB** (hard ceiling) | **16 GB – 40 GB** | **16 GB – 80 GB** |
| **Tensor Cores** | **0** (Pascal CC 6.1) | **320+ Tensor Cores** | **320–640 Tensor Cores** |
| **FP16 / BF16 Support** | Slow / Emulated (FP32 native) | Native Hardware FP16 / BF16 | Native Hardware FP16 / BF16 |
| **Memory Bandwidth** | 112 GB/s | 320–1555 GB/s (3x–14x faster) | 900–2000 GB/s |
| **NVENC / Video Encode** | Supported (H.264 / HEVC) | Supported | CPU / GPU dependent |

---

## 2. Workload Partitioning Matrix: Local (1050 Ti) vs Cloud

| Pipeline Stage | Model / Tool | Local 1050 Ti Viability | Cloud Viability | Recommendation |
|---|---|---|---|---|
| **1. Ingest & Audio Demux** | `FFmpeg` | 🟢 **100% Smooth (CPU/NVENC)** | 🔴 Wasteful (Upload lag) | **KEEP LOCAL** |
| **2. Stem Separation / Denoise** | `Demucs HTDemucs v4` | 🔴 **Unusable (0.1x RT, 3-10m/min)** | 🟢 **Blazing (<15s on T4/A100)** | **OFFLOAD TO CLOUD** *(or use local FFmpeg high-pass filter)* |
| **3. Speech ASR & Diarization** | `Faster-Whisper (small/medium)` | 🟢 **Smooth (int8 / float32, ~3x RT)** | 🟢 Instant | **RUN LOCAL (small.en / medium)** |
| **4. Speech ASR (large-v3)** | `Faster-Whisper (large-v3)` | 🟡 **Risk of 4GB OOM / Paging** | 🟢 **Smooth** | **OFFLOAD IF large-v3 required** |
| **5. Agent Crew Reasoning** | `Gemini 2.5/3.7 Flash API` | 🟢 **0 VRAM (API Call)** | 🟢 **Native** | **KEEP IN CLOUD API** |
| **6. Voice Synthesis (TTS)** | `Kokoro-82M` / `Piper` / `Edge-TTS` | 🟢 **Smooth (Kokoro <500MB VRAM)** | 🟢 Smooth | **KEEP LOCAL (Kokoro / Edge-TTS)** |
| **7. Heavy Voice Cloning** | `XTTS-v2` / `F5-TTS` / `CosyVoice` | 🔴 **Fatal OOM (>6GB VRAM)** | 🟢 **Smooth** | **OFFLOAD TO CLOUD** |
| **8. Sync & Time-Stretching** | `FFmpeg atempo` / `rubberband` | 🟢 **100% Smooth (CPU)** | 🔴 Unnecessary network hop | **KEEP LOCAL** |
| **9. Subtitles & QA Formatting** | `SRT/VTT Generator` | 🟢 **100% Smooth (CPU)** | 🔴 Unnecessary network hop | **KEEP LOCAL** |
| **10. Video Remux & Mastering** | `FFmpeg + NVENC` | 🟢 **100% Smooth (Hardware)** | 🔴 Upload/Download bandwidth cliff | **KEEP LOCAL** |

---

## 3. Why Things Break in Production & How to Fix Them

### 💥 Failure Mode 1: The "Network Inversion Trap" (Uploading 500MB Video to Cloud for a 2MB Output)
* **Why it breaks:** Uploading a full 4K or 1080p movie file to Colab or Cloud takes 5–15 minutes over residential upload speeds.
* **Production Fix:** **Extract audio locally first!** Convert 500MB video to a 16kHz mono or stereo WAV (10–30MB). Upload *only* the audio stem to the cloud worker for Demucs separation. Download *only* the separated vocal/music stems.

### 💥 Failure Mode 2: Pascal 1050 Ti FP16 Crash / Slowdown
* **Why it breaks:** PyTorch defaults to `torch.float16` or `bfloat16` on modern GPUs. The GTX 1050 Ti has **no FP16 Tensor Cores**. Running FP16 either crashes or runs at 1/64x speed via software emulation.
* **Production Fix:** Enforce `compute_type="int8"` or `torch.float32` explicitly in all local PyTorch/CTranslate2 loaders.

### 💥 Failure Mode 3: Memory Fragmentation (CUDA OOM after Stage 2)
* **Why it breaks:** Running Whisper immediately after Demucs on a 4GB card fails because PyTorch caches memory allocations.
* **Production Fix:** Call `torch.cuda.empty_cache()` and `gc.collect()` in between pipeline stages, or run heavy stages in isolated subprocesses.

### 💥 Failure Mode 4: Token Inflation & Redundant Agent LLM Calls
* **Why it breaks:** Passing complete raw video transcript JSON with all time codes and confidence scores into the Localization Director blows token context and triggers rate limits.
* **Production Fix:** Strip non-essential metadata before LLM prompts. Batch sentences into scene chunks (10–15 lines per agent invocation).
