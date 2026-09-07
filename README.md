# LOCALIZE — Autonomous AI Post-Production Crew for Film & Video Localization

> **Turn a finished video and a target audience prompt into a release-ready, localized dub with synchronized speech windows, character-consistent voices, and automated QA self-repair.**

---

## 🎬 Overview

Traditional video dubbing pipelines execute rigid, sequential steps (transcribe → translate → TTS → mux) with no awareness of quality or context. If speech overflows the dialogue window or subtitles drift, traditional tools ship broken results.

**LOCALIZE** operates as an autonomous multi-agent post-production crew:
- **Director Agent**: Orchestrates tasks, holds job state, and initiates targeted retries.
- **Story Analyst**: Extracts character speaker maps, scene boundaries, emotional tone tags, and cultural idiom flags.
- **Localization Director**: Produces culturally adapted scripts preserving character voice and humor with translation rationale per line.
- **Voice Director**: Assigns character-matched neural voices and synthesizes audio stems.
- **Sync Engineer**: Resolves duration expansion/compression via `atempo` speed factors and timing shifts.
- **Subtitle Director**: Generates drift-free SRT and WebVTT subtitles aligned with final audio timings.
- **QA / Continuity Agent (Hero Feature)**: Reviews the cut, flags defects (`TIMING_OVERFLOW`, `SUBTITLE_DRIFT`, `AUDIO_CLIPPING`), and triggers **targeted repair loops** back to upstream agents without restarting the full pipeline.
- **Control Tower (Grafana)**: Live telemetry observability tracking agent latencies, quality scores, and defect resolution.

---

## 🔑 Required API Keys & Environment Variables

Create a `.env` file in the root directory (or in `backend/`):

```bash
cp .env.example .env
```

### Core API Keys

| Environment Variable | Required? | Purpose |
|----------------------|-----------|---------|
| `GEMINI_API_KEY` | **Required** | Powers all agent reasoning across the crew (Story Analyst, Localization Director, Sync Engineer, QA Agent) via Google Cloud AI / Gemini structured JSON outputs. |

### Observability & Partner Integrations (Optional / Stretch)

| Environment Variable | Required? | Purpose |
|----------------------|-----------|---------|
| `GRAFANA_URL` | Optional | URL to your Grafana Cloud or self-hosted instance (e.g. `https://<instance>.grafana.net`). |
| `GRAFANA_SERVICE_ACCOUNT_TOKEN` | Optional | Grafana Service Account Token for MCP adapter queries and dashboard metrics. |
| `PARALLEL_API_KEY` | Optional | Parallel Search MCP endpoint (`https://search-mcp.parallel.ai/mcp`) for live cultural research and idiom context lookups. |
| `CLICKHOUSE_URL` | Optional | ClickHouse endpoint for post-production analytics and defect telemetry persistence. |

---

## 📹 Video Input Guidelines: Best Results

For the highest quality localization, speech recognition, and automated QA demonstration:

| Criteria | Recommended Specification | Why It Matters |
|----------|---------------------------|----------------|
| **Container & Codec** | `.mp4` or `.mkv` (Video: H.264 / H.265, Audio: AAC / PCM) | Native browser `<video>` playback and direct `ffmpeg` stream copying without re-encoding. |
| **Clip Duration** | **15 seconds to 90 seconds** (Up to 3–5 minutes for full scenes) | Ideal for quick turnaround, interactive review, and crisp live demos of the QA self-repair loop. |
| **Dialogue & Audio Mix** | Clear dialogue with good signal-to-noise ratio | While Demucs separates vocals from background music/effects, clean audio ensures 100% accurate ASR timestamps and pitch tracking. |
| **Speaker Count** | **1 to 3 distinct speakers** | Allows the Story Analyst and Voice Director to cleanly attribute dialogue and cast distinct neural voices. |
| **Dialogue Content** | Conversational scenes with natural idioms or humor | Showcases the Localization Director's cultural adaptation and translation rationale (e.g., *"don't count your chickens before they hatch"*). |
| **Resolution** | 720p or 1080p | Fast upload, responsive browser rendering, and smooth timeline scrubbing. |

> 💡 **Tip for Demos:** Clips with high speaking speed or idioms are great test cases—they showcase the Sync Engineer adjusting tempo and the QA Agent catching and fixing timing overflows!

---

## 🚀 How to Start the Project

### Prerequisites

Ensure you have the following installed on your machine:
1. **Python 3.10+** (with `pip` or `uv`)
2. **Node.js 18+** & `npm`
3. **FFmpeg & FFprobe**: Must be installed and accessible on your system `PATH`.
   - *Windows*: `winget install Gyan.FFmpeg` or download from [ffmpeg.org](https://ffmpeg.org/download.html).
   - *macOS*: `brew install ffmpeg`
   - *Ubuntu/Debian*: `sudo apt update && sudo apt install ffmpeg`

---

### Step 1: Backend Setup & Launch

1. Open a terminal in the project root:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   - Create a `.env` file in `backend/.env` or the project root with your `GEMINI_API_KEY`:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

5. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend will be available at:
   - **API Server**: `http://localhost:8000`
   - **Interactive Swagger Docs**: `http://localhost:8000/docs`
   - **Health Check**: `http://localhost:8000/health`

---

### Step 2: Frontend Setup & Launch

1. Open a second terminal in the project root:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🧪 Running Verification & Tests

LOCALIZE uses **Test-Driven Development (TDD)** across both backend and frontend layers:

- **Backend Pytest Suite** (Engine, Agent Crew, Telemetry, Grafana MCP):
  ```bash
  cd backend
  pytest
  ```

- **Frontend Vitest Suite** (UI components, Agent contracts, Telemetry validators):
  ```bash
  cd frontend
  npm run test
  ```

---

## 🎛️ Post-Production Studio Console Usage

1. **Upload or Select a Video**: Drop an MP4/MKV video into the console or select a pre-loaded scene.
2. **Configure Target Audience**: Select target language (e.g. Hindi, Spanish, French, German) and tone profile.
3. **Execute Crew Pipeline**: Click **Direct Job** to watch the multi-agent crew:
   - Story Analyst identifies characters and emotional tone.
   - Localization Director translates dialogue with explicit rationale.
   - Voice Director assigns neural voices and generates audio stems.
   - Sync Engineer applies `atempo` duration matching.
   - Subtitle Director syncs subtitles.
4. **Inspect QA Self-Repair**: If QA catches a defect (e.g., speech window overflow), view the live targeted retry loop fix the issue automatically.
5. **Compare & Review**: Use the **Before/After Dual Monitor** to toggle between raw audio and the localized cut.
