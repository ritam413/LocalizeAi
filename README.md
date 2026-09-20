# LOCALIZE: Autonomous AI Post-Production Crew for Film & Video Localization

> Turn a finished video and a target audience prompt into a release-ready, localized dub with synchronized speech windows, character-consistent voices, and automated QA self-repair.

<div align="center">

![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Python](https://img.shields.io/badge/Python%203.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana%20MCP-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![Pytest](https://img.shields.io/badge/Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

</div>

---

## Inspiration

Most automated dubbing tools treat localization like an assembly line: audio gets transcribed to text, translated by a generic LLM, pushed through text-to-speech, and slapped back onto video. If a translated phrase takes two seconds longer to speak than the original actor's mouth movement, or if an idiom translates literally into nonsense, the pipeline still outputs the file without checking the result.

https://localize-ai-8sy1.vercel.app/


Human dubbing studios do not work this way. Directors, script translators, voice actors, sound engineers, and QA reviewers work together. When a translated sentence runs too long, the team rewrites the line or adjusts speech cadence to fit the dialogue window before publishing. We wanted to build an autonomous crew that behaves like a real post-production room, complete with automated quality control and targeted repair loops.

## What it does

LOCALIZE takes an input video (MP4 or MKV) and a target language or cultural tone prompt, then turns it into a synchronized, localized dub.

Instead of running a one-way script, it coordinates seven specialized agents:

1. **Director Agent**: Manages state, coordinates handoffs between agents, and handles targeted retries when defects are caught.
2. **Story Analyst**: Maps out characters, extracts scene boundaries, tags emotional tone, and spots cultural idioms.
3. **Localization Director**: Translates dialogue while preserving character personality and jokes, writing down the translation rationale for every line.
4. **Voice Director**: Matches distinct character profiles to neural TTS voices and generates clean speech stems.
5. **Sync Engineer**: Aligns audio timing to the original dialogue windows using dynamic FFmpeg `atempo` speed adjustments and millisecond offset shifts.
6. **Subtitle Director**: Generates timestamped SRT and WebVTT subtitles that match the newly synchronized audio.
7. **QA Continuity Agent**: Audits the resulting cut for timing overflows, subtitle drift, and clipping. If it finds an issue, it sends instructions back to the specific upstream agent to fix that segment without restarting the entire run.

Users can watch the pipeline execute in real time on a dual-monitor studio interface, compare before and after cuts, and inspect agent telemetry.

## How we built it

- **Multi-Agent Reasoning**: Built using Google Gemini structured JSON outputs. Structured schema enforcement ensures reliable data contracts between the Story Analyst, Localization Director, Sync Engineer, and QA Agent.
- **Audio and Video Engine**: Python, FFmpeg, and FFprobe handle stream demuxing, precise millisecond audio slicing, `atempo` filter chaining, and vocal track replacement.
- **Backend Service**: FastAPI with async background job execution, SSE (Server-Sent Events) for live pipeline progress, and Pytest suites for unit and integration testing.
- **Frontend Studio**: Next.js (App Router), TypeScript, and Tailwind CSS. The interface includes an agent sequence track, an interactive timeline player, a before/after split viewer, and a live QA defect log.
- **Observability**: Grafana MCP endpoints and telemetry trackers capture agent latencies, retries, and quality scores across each run.

## Challenges we ran into

- **Syllabic Expansion and Timing Windows**: Some languages naturally use 20% to 35% more syllables to express the same thought. Making the audio fit required a combination of upstream script rewriting and downstream `atempo` time-stretching, without making character voices sound artificially rushed.
- **Targeted Self-Repair**: Building a feedback loop that only reruns the affected dialogue segment instead of recomputing the entire video pipeline required isolating intermediate agent artifacts (scripts, voice stems, sync maps) by dialogue ID.
- **Real-Time Studio Telemetry**: Streaming intermediate agent thoughts, audio generation states, and video render events to the browser without UI lag meant fine-tuning our SSE event dispatchers and state reducers.

## Accomplishments that we're proud of

- **Autonomous QA Feedback Loop**: When the QA agent flags a timing overflow defect, it automatically loops back to the Localization Director or Sync Engineer to re-adjust and re-render only the offending line.
- **Character Voice Consistency**: Distinct speakers in a scene receive consistent neural voice assignments across every cut.
- **Sub-Millisecond Sync Precision**: Clean alignment between vocal delivery, background audio mixing, and subtitle generation.
- **Complete Test Coverage**: Built with test-driven workflows across both backend engines and frontend components.

## What we learned

- Structured JSON constraints on LLMs are essential when chaining multiple reasoning steps. Loose text prompts break pipelines; strict schemas keep agents dependable.
- High-quality dubbing is as much an audio engineering challenge as a translation challenge. Timing, pauses, and background sound preservation matter just as much as word choice.
- Real-time observability makes debugging agent decisions significantly faster during active development.

## What's next for LOCALIZE

- **Lip-Sync Motion Synthesis**: Integrating neural video face-warping models to align visual mouth movements with adjusted speech tracks.
- **Multi-Track Background Isolation**: Direct integration of Demucs separation to preserve complex background ambient audio and musical scores automatically.
- **Team Collaboration Mode**: Letting human dubbing directors approve, override, or tweak individual agent suggestions before the final master render.

---

## Required API Keys & Environment Variables

Create a `.env` file in the root directory (or in `backend/`):

```bash
cp .env.example .env
```

### Core API Keys

| Environment Variable | Required? | Purpose |
|----------------------|-----------|---------|
| `GEMINI_API_KEY` | **Required** | Powers all agent reasoning across the crew (Story Analyst, Localization Director, Sync Engineer, QA Agent) via Google Cloud AI / Gemini structured JSON outputs. |

### Observability & Partner Integrations (Optional)

| Environment Variable | Required? | Purpose |
|----------------------|-----------|---------|
| `GRAFANA_URL` | Optional | URL to your Grafana Cloud or self-hosted instance (e.g. `https://<instance>.grafana.net`). |
| `GRAFANA_SERVICE_ACCOUNT_TOKEN` | Optional | Grafana Service Account Token for MCP adapter queries and dashboard metrics. |
| `PARALLEL_API_KEY` | Optional | Parallel Search MCP endpoint (`https://search-mcp.parallel.ai/mcp`) for live cultural research and idiom context lookups. |
| `CLICKHOUSE_URL` | Optional | ClickHouse endpoint for post-production analytics and defect telemetry persistence. |

---

## Video Input Guidelines

For optimal localization quality and automated QA demonstrations:

| Criteria | Recommended Specification | Why It Matters |
|----------|---------------------------|----------------|
| **Container & Codec** | `.mp4` or `.mkv` (Video: H.264 / H.265, Audio: AAC / PCM) | Native browser `<video>` playback and direct `ffmpeg` stream copying without re-encoding. |
| **Clip Duration** | **15 seconds to 90 seconds** (Up to 3 to 5 minutes for full scenes) | Ideal for quick turnaround, interactive review, and crisp live demos of the QA self-repair loop. |
| **Dialogue & Audio Mix** | Clear dialogue with good signal-to-noise ratio | Ensures 100% accurate ASR timestamps and pitch tracking. |
| **Speaker Count** | **1 to 3 distinct speakers** | Allows the Story Analyst and Voice Director to cleanly attribute dialogue and cast distinct neural voices. |
| **Dialogue Content** | Conversational scenes with natural idioms or humor | Showcases the Localization Director's cultural adaptation and translation rationale. |
| **Resolution** | 720p or 1080p | Fast upload, responsive browser rendering, and smooth timeline scrubbing. |

---

## How to Start the Project

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

1. Open a terminal in the project root (`LocalizeAi`):
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

   - **From the project root (`LocalizeAi`) — Recommended for Windows PowerShell:**
     ```powershell
     $env:PYTHONPATH="backend"
     .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
     ```

   - **From inside the `backend/` directory:**
     ```powershell
     # Using root .venv:
     ..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
     
     # Or inside activated venv:
     uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
     ```

   > [!TIP]
   > **Binding to `0.0.0.0` vs `127.0.0.1`:**
   > Use `--host 0.0.0.0` if you want other devices or clients on your local network (e.g. `http://192.168.x.x:8000`) to connect. Use `--host 127.0.0.1` for local-only development on the same machine.

   The backend will be available at:
   - **API Server**: `http://localhost:8000` (or `http://<your-lan-ip>:8000`)
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

## Running Verification & Tests

LOCALIZE uses test-driven development across both backend and frontend layers:

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

## Studio Console Workflow

1. **Upload or Select a Video**: Drop an MP4/MKV video into the console or select a pre-loaded scene.
2. **Configure Target Audience**: Select target language (e.g., Hindi, Spanish, French, German) and tone profile.
3. **Execute Crew Pipeline**: Click **Direct Job** to watch the multi-agent crew:
   - Story Analyst identifies characters and emotional tone.
   - Localization Director translates dialogue with explicit rationale.
   - Voice Director assigns neural voices and generates audio stems.
   - Sync Engineer applies `atempo` duration matching.
   - Subtitle Director syncs subtitles.
4. **Inspect QA Self-Repair**: If QA catches a defect (e.g., speech window overflow), view the live targeted retry loop fix the issue automatically.
5. **Compare & Review**: Use the **Before/After Dual Monitor** to toggle between raw audio and the localized cut.

---

## License

This project is licensed under the OSI-approved **[MIT License](LICENSE)** - see the [LICENSE](LICENSE) file for details.

