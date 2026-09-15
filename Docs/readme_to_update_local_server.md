# Instructions for AI Agents & Developers: Updating the Local GPU Server

**Target Purpose:** Guide any AI coding assistant (or engineer) working on the local server machine (GTX 1050 Ti) or client laptop to quickly understand, configure, and maintain the 50-minute offline localization pipeline without rediscovering previous architectural decisions.

---

## 📚 Required Reading Order

Before making any server configuration changes or running jobs, the AI agent **MUST read the following documents in order**:

### 1. Primary Execution & Setup Runbook (START HERE)
* **[Docs/final_optimized_server_setup_guide_50min.md](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/Docs/final_optimized_server_setup_guide_50min.md)**
  * **Why read it:** Contains the complete step-by-step installation, firewall rules, and Python environment configuration for the NVIDIA GTX 1050 Ti (4GB VRAM) server machine.
  * **Key component:** Details `backend/server_coordinator.py` with the asynchronous GPU mutex lock (`asyncio.Lock()`) ensuring VRAM stays $< 2.0\text{ GB}$ at all times.

### 2. Hardware Constraints & Pipeline Tradeoffs
* **[Docs/HYBRID_COMPUTE_ARCHITECTURE_1050TI_VS_CLOUD.md](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/Docs/HYBRID_COMPUTE_ARCHITECTURE_1050TI_VS_CLOUD.md)**
  * **Why read it:** Explains *why* certain models are configured the way they are. Specifically:
    - **Pascal Architecture (Compute 6.1):** No FP16 Tensor Cores. Faster-Whisper MUST use `compute_type="int8"` or `"float32"`.
    - **Demucs Bypass:** Demucs takes 4+ hours for 50 minutes on a 1050 Ti. The codebase uses `use_demucs: False` (5-second FFmpeg speech formant filter) for offline speed.
    - **Network Inversion Trap:** Never upload raw 2.5GB video files over network; extract 45MB audio locally first.

### 3. Cloud / Colab Fallback Alternatives
* **[Docs/COLAB_AS_AI_SERVER_EVALUATION.md](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/Docs/COLAB_AS_AI_SERVER_EVALUATION.md)**
  * **Why read it:** Explains how to route heavy Demucs audio separation or Qwen 2.5 14B/32B multilingual translation to Google Colab Pro+ (via Cloudflare Tunnels) if studio-grade stem isolation is explicitly requested.

### 4. Codebase Architecture & Agent State
* **[context.md](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/context.md)**
  * **Why read it:** Preserves the core multi-agent domain model (`Director`, `StoryAnalyst`, `LocalizationDirector`, `VoiceDirector`, `SyncEngineer`, `SubtitleDirector`, `QAAgent`).
* **[tracker.md](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/tracker.md)**
  * **Why read it:** The central Agent Handoff Log documenting recent work, verified test suites, completed tickets, and active sprint tickets (TICKET-16 through TICKET-19).

---

## 🛠️ Quick Verification Commands for the AI Agent

When an AI agent connects to this repository on the server machine, it should run these commands to verify the local server state:

```powershell
# 1. Verify GPU visibility & VRAM
nvidia-smi

# 2. Verify Ollama is running on LAN with zero keep-alive
curl http://127.0.0.1:11434/api/tags

# 3. Verify Server Coordinator Health
curl http://127.0.0.1:8000/health

# 4. Run Pytest test suite to ensure no regressions
pytest backend/tests -q
```
