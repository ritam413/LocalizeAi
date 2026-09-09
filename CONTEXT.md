# LOCALIZE — Domain Model & Project Context
Last updated: 2026-09-06

## 1. Project Purpose & Vision
**LOCALIZE** is an Autonomous AI Post-Production Crew for Film & Video Localization. Given a source video, target language, and cultural audience constraints, an autonomous multi-agent crew analyzes narrative context, produces natural in-character translations, synthesizes character-consistent voices, synchronizes speech windows, formats subtitles, and conducts automated QA.

**Core Differentiator**: LOCALIZE does not simply generate dubs; it **operates a complete post-production workflow, detects its own quality defects, and repairs them via targeted retries** while exposing real-time observability in Grafana and running all reasoning on Google Cloud AI (Gemini).

---

## 2. Ubiquitous Language & Domain Glossary (`/domain-modeling`)

### The Post-Production Agent Crew
- **Director Agent**: The orchestrating agent holding overall job state, dispatching tasks to crew members, evaluating QA reports, and executing targeted retries.
- **Story Analyst**: Understands what is spoken, by whom, emotional tone, and cultural references prior to translation. Generates speaker maps, scene lists, and tonal tags.
- **Localization Director**: Produces natural, in-character localized scripts with explicit translation rationale per line (adapting idioms, jokes, and cultural context).
- **Voice Director**: Selects character-consistent voices and synthesizes localized speech audio per dialogue segment.
- **Sync Engineer**: Reconciles translated speech duration against original dialogue timing windows using speed adjustment (atempo), timing shifts, or line shortening.
- **Subtitle Director**: Generates synchronized subtitle files (.srt/.vtt) aligned with final adjusted audio timing and character limits.
- **QA / Continuity Agent**: Human-like reviewer inspecting assembled release candidates. Evaluates release readiness (0–100 score), detects defect classes (timing overflow, subtitle drift, audio clipping), and produces structured fix proposals.

### Workflow & Quality Artifacts
- **Release Candidate (RC)**: An assembled cut of video, synthesized dub stems, and subtitles submitted to the QA Agent for inspection.
- **Targeted Retry**: A closed feedback loop where the Director re-routes a defective scene or segment back to a specific upstream agent with instructions and fix proposals, without restarting the whole pipeline.
- **Telemetry Event**: A structured event emitted by every agent action following the Section 6 schema (`job_id`, `scene_id`, `agent`, `action`, `decision`, `latency_ms`, `retry_count`, `quality_score`, `status`, `timestamp`).
- **Control Tower**: The real-time Grafana observability layer tracking agent latencies, quality trends, failure counts, and retry iterations.

---

## 3. What Works Right Now
The complete LOCALIZE autonomous post-production crew architecture is fully implemented and tested across both backend and frontend:
- **Execution Scaffolding**: Video & audio extraction via `ffmpeg`, Demucs HTDemucs vocal stem separation, Faster-Whisper ASR transcription with VAD, and subtitle formatter.
- **Autonomous Multi-Agent Crew (`backend/app/agents/` & `frontend/lib/agents/`)**:
  - `StoryAnalyst`: Character speaker diarization, scene boundaries, emotional tone tags, and cultural idiom detection.
  - `LocalizationDirector`: Culturally adapted script translation with required rationale per line.
  - `VoiceDirector`: Neural voice selection & segment speech audio synthesis.
  - `SyncEngineer`: `atempo` duration reconciliation (1.25x max, silence compression, timing shifts).
  - `SubtitleDirector`: Drift-free SRT/VTT formatting aligned with final audio durations.
  - `QAAgent`: Defect detection (`TIMING_OVERFLOW`, `SUBTITLE_DRIFT`, `AUDIO_CLIPPING`), release readiness scoring (0–100), and structured fix proposals.
  - `Director`: Orchestrator driving the pipeline graph with a **targeted retry loop** that triggers self-repair on upstream agents without restarting the whole pipeline.
- **Section 6 Event Schema & Telemetry**: Emits structured JSON events, aggregated metrics, and Grafana MCP adapter query support (`/api/v1/telemetry/`).
- **Post-Production Studio Console UI (`frontend/components/studio/`)**: Live crew status, QA repair cards, readiness gauge, decision feed, and before/after comparison monitor.
- **Testing**: 32 Pytest suites (backend) and 29 Vitest suites (frontend) passing 100%.

## 4. Current Configuration & Access Points
- **Backend API & Docs**: `http://localhost:8000` (Swagger docs at `/docs`, health check at `/health`, telemetry at `/api/v1/telemetry/events`).
- **Frontend Studio Console**: `http://localhost:3000` (Next.js dashboard at `/`, run monitor at `/runs/[id]`).
- **MCP Observability**: Configured with Grafana MCP (`uvx mcp-grafana`) via `~/.gemini/config/mcp_config.json`.
- **Environment**: `.env` and `backend/.env` configured with `GEMINI_API_KEY` for Google Cloud AI reasoning, `CORS_ORIGINS`, `BACKEND_URL`, and optional Grafana service credentials.
- **Docker Compose**: Production orchestration via `docker-compose.yml` (CPU) and `docker-compose.gpu.yml` (NVIDIA CUDA passthrough).
- **Production Runbook**: Documented in `DEPLOYMENT.md`.

## 6. Key Decisions Already Made
- **ADR-001**: Use Gemini structured outputs (Pydantic schema) for all agent reasoning to guarantee deterministic routing.
- **ADR-002**: Use Section 6 JSON event schema as the single source of truth for disk logs, WebSocket broadcasts, and Grafana telemetry.
- **ADR-003**: Deep module design (`/codebase-design`) with small interfaces (`execute(context) -> result`) across all agent seams.
- **ADR-004**: Vitest for frontend & contract tests, Pytest for backend unit/integration tests (`/tdd`).
- **ADR-005**: Multi-stage standalone Next.js container build and Python 3.11 slim backend container with FFmpeg & PyTorch for production reproducibility.

