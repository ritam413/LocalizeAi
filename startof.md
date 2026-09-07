# DubForge Studio — Startup Guide & Subtitling Walkthrough

Welcome to **DubForge Studio**! This document provides a complete guide on how to launch the application servers and run subtitling pipelines for movie clips (e.g., Spanish or Colombian Spanish clips to English subtitles).

---

## 1. How to Start the Application

DubForge Studio consists of a **FastAPI Backend Orchestrator** and a **Next.js 14 Frontend UI**.

### Step A: Start the Backend Server (FastAPI)
Open a terminal in the project root (`d:\Games\Hckthons\moviedu`) and run:

```powershell
$env:PYTHONPATH="backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- **Health Check URL**: `http://localhost:8000/health` (returns `status: ok`).
- **REST API Base**: `http://localhost:8000/api/v1`
- **WebSocket Channel**: `ws://localhost:8000/ws/runs/{id}`

### Step B: Start the Frontend UI (Next.js)
Open a second terminal, navigate to the `frontend` folder, and run:

```powershell
cd frontend
npm run dev
```
- **Frontend Dashboard URL**: `http://localhost:3000`

---

## 2. How to Ingest Clips & Generate English Subtitles

Follow these simple steps to translate and generate formatted `.srt` and `.vtt` subtitles for any movie clip:

### Step 1: Open the New Run Wizard
1. Open your browser and navigate to `http://localhost:3000/runs/new`.

### Step 2: Provide Your Movie Clip
You can supply your movie clip in one of two ways:
- **Option A (Upload File)**: Click **Upload Local File** and drag & drop your video file (`.mp4`, `.mkv`, `.mov`, `.avi`).
- **Option B (Specify Local Path)**: Click **Specify Shared Path** and enter the absolute file path on your computer (e.g., `D:\MyMovies\SpanishClip.mp4`).

### Step 3: Configure Language Pair & Subtitle Fast Path
1. **Source Language**: Select `Auto-Detect Language (Whisper ASR)` (or explicitly select `Spanish / Colombian Spanish`, etc.). When set to **Auto-Detect**, Whisper automatically identifies the spoken language from the video's audio track!
2. **Target Language**: Select `English` (or your desired output language).
3. **Subtitle-Only Fast Path**: Ensure this toggle is **ENABLED** (green). This skips heavy TTS audio synthesis and executes the fast-path pipeline (Extraction → Denoise → Whisper Transcription → NLLB Translation → Subtitle QA Formatting) to produce formatted subtitle files in minutes.
4. **Preset Mode**: Select **Project C (Universal Subtitle & Fast Path)**.

### Step 4: Launch the Pipeline
Click **Launch DubForge Pipeline**. You will be automatically redirected to the **Live Run Dashboard** (`http://localhost:3000/runs/{id}`).

---

## 3. Monitoring Live Progress & Streaming Logs

On the **Live Run Dashboard** (`/runs/{id}`):
- **Stage Timeline**: Watch the pipeline advance through `extraction` ➔ `denoise` ➔ `transcription` ➔ `translation`.
- **Live WebSocket Progress**: Displays real-time completion percentage for each stage.
- **Streaming Terminal Logs**: View live terminal output captured from each execution stage.

---

## 4. Reviewing & Editing Subtitles (Live QA Validation)

Navigate to the **Subtitle Review & QA Editor** tab (`/runs/{id}/subtitles`):
- **Interactive Segment Table**: View side-by-side source speech and translated English text along with timestamp start/end markers.
- **Live QA Rule Badges**: Automatically validates industry-standard subtitle formatting rules:
  - **Min Gap**: Ensures at least 100ms gap between consecutive subtitle lines.
  - **Min Duration**: Ensures each subtitle line displays for at least 1.0 second.
  - **Max CPS**: Flags lines exceeding 17.0 Characters Per Second.
  - **Max Line Length**: Flags lines exceeding 42 characters or 2 lines.
- **Inline Editing**: Edit text or timing directly in the browser and click **Save** to trigger live QA re-validation.

---

## 5. Downloading Final Deliverables

Navigate to the **Outputs & Deliverables Package** tab (`/runs/{id}/output`):
- Click **Download** next to **Subtitles (EN SRT)** or **Subtitles (EN VTT)** to save your `.srt` and `.vtt` subtitle files directly to your computer.

---

## 6. Running Automated Tests

To run the backend test suite (testing `GpuLock` serialization, `RunExecutor` resumability, and `subtitle_formatter.py` QA rules), execute:

```powershell
$env:PYTHONPATH="backend"
.\.venv\Scripts\python.exe -m pytest backend/tests -v
```
