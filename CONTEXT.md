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
- **Execution Scaffolding**: Video & audio extraction via `ffmpeg`, Demucs HTDemucs vocal stem separation, Faster-Whisper ASR transcription with Silero VAD, and subtitle formatter.
- **Autonomous Multi-Agent Crew (`backend/app/agents/` & `frontend/lib/agents/`)**:
  - `StoryAnalyst`: Character speaker attribution via pluggable diarization (`HeuristicDiarizationAdapter` & `PyAnnoteDiarizationAdapter` - TICKET-18), scene boundaries, emotional tone tags, and cultural idiom detection.
  - `LocalizationDirector`: Culturally adapted script translation with required rationale per line, Isometric Dialogue Engine with strict syllable quotas (TICKET-11), English proper noun preservation (`EntityPreserver`), and colloquial numeral localization (`NumeralLocalizer` - TICKET-15).
  - `VoiceDirector`: Neural voice selection & segment speech audio synthesis via pluggable synthesis adapters (`EdgeTTSAdapter` for 300+ Microsoft neural voices, `MockAudioAdapter` - TICKET-12).
  - `SyncEngineer`: `atempo` duration reconciliation (1.25x max, silence compression, timing shifts).
  - `SubtitleDirector`: Drift-free SRT/VTT formatting aligned with final audio durations.
  - `QAAgent`: Defect detection (`TIMING_OVERFLOW`, `SUBTITLE_DRIFT`, `AUDIO_CLIPPING`), release readiness scoring (0–100), digital signal clipping detection, quantitative syllable delta deficits, and structured fix proposals.
  - `Director`: Orchestrator driving the pipeline graph with a **quantitative targeted retry loop** that triggers self-repair on upstream agents without restarting the whole pipeline. High-leverage `DirectorAgent.run_pipeline` end-to-end runner (TICKET-16).
- **Post-QA Acoustic Master Mixdown & Sidechain Bus Integration (TICKET-17)**: Post-QA timeline positioning (`adelay`), dialogue bus compositing (`amix`), dynamic -6dB M&E sidechain ducking, and EBU R128 (-24 LUFS) broadcast loudness mastering.
- **Broadcast Video Multiplexing & Deliverables Exporter (TICKET-19)**: Studio deliverables packaging into release candidate MP4 (H.264 + AAC 192k + `mov_text` soft subtitles), dialogue bus WAV, composite soundtrack WAV, timed SRT/VTT, and `deliverables.json` manifest with SHA-256 checksums and REST endpoints (`/api/v1/runs/{id}/deliverables`).
- **Section 6 Event Schema & Telemetry**: Emits structured JSON events, aggregated metrics, and Grafana MCP adapter query support (`/api/v1/telemetry/`).
- **Master Studio & Landing Page (`/`)**: Reconstructed full aidubbing.io studio and landing experience with model selector (`Mode C · Festival Subtitle Master`, `Mode B · Broadcast Streaming Dub`, `Mode A · Theatrical Cinema Dub`), drag-and-drop workbench, 4 film explainer/festival landing sections, genre video showcase, creator testimonials, ecosystem tools, and FAQ.
- **Live Judge Demo (`/runs/demo`) & Studio Console**: 35-second autonomous crew execution demo with live dynamic latency tickers, progressive reveals, YouTube-style Multi-Audio Player with stem switching, before/after comparison monitor, QA repair cards, and full WCAG 2.1 AA/AAA contrast compliance.
- **Canonical Design System (`DESIGN.md`)**: Electric Violet (`#7248EA`), Secondary Mint (`#00D4AA`), high-contrast dark foundations (`#1A1A1A`), paper canvas (`#FBFBFD`), and Emil Kowalski tactile micro-interactions (`active:scale-[0.97]`).
- **Testing**: 74 Pytest tests passing (backend) and 95 Vitest tests across 18 test files passing 100% (frontend).

## 4. Current Configuration & Access Points
- **Backend API & Docs**: `http://localhost:8000` (Swagger docs at `/docs`, health check at `/health`, telemetry at `/api/v1/telemetry/events`, deliverables at `/api/v1/runs/{id}/deliverables`).
- **Frontend Studio Console**: `http://localhost:3000` (Master studio landing at `/`, judge demo at `/runs/demo`, run monitor at `/runs/[id]`).
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
- **ADR-006**: High-contrast, WCAG 2.1 AA/AAA compliant color pairings for all UI status indicators, eliminating unreadable dark-on-vibrant text and stabilizing layout counters with `tabular-nums`.

