# Tech Spec — DubForge Studio

## Overview
Local-first web app: Next.js frontend talking to a Python/FastAPI backend that orchestrates existing open-source ML CLI tools/libraries. No cloud dependency required for the core pipeline (NLLB-200 default; local LLM via Ollama optional).

## Frontend
| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router), TypeScript | Matches user preference; good fit for a dashboard-style app with server components for data-heavy tables |
| Styling | Tailwind CSS | Fast iteration, pairs with shadcn/ui |
| Components | shadcn/ui | Accessible primitives (`Button`, `Select`, `Switch`, `AlertDialog`, `Tabs`) as the base layer under the component inventory in `08-components.md` |
| Data fetching | TanStack Query | Caching/refetch for REST endpoints |
| Tables | TanStack Table | Sortable/filterable `RunTable`, `ModelTable`, `TranslationLineTable` |
| Live updates | native WebSocket client, wrapped in a `useRunProgress` / `useWorkerStatus` hook | Matches the single `/ws/runs/{id}` and `/ws/workers` channels in the API design |
| Forms | react-hook-form + zod | Wizard steps, Settings forms |
| Media | HTML5 `<video>`/`<audio>` + a lightweight waveform lib (e.g. wavesurfer.js) for `AudioPlayerScrubber` / `SubtitleTimeline` |

## Backend
| Concern | Choice | Why |
|---|---|---|
| Framework | FastAPI (Python 3.11) | Async-friendly, native WebSocket support, matches the Python ML ecosystem being orchestrated |
| ORM | SQLAlchemy (async) + Alembic for migrations | |
| DB | SQLite | Single-user local scale; matches report's "no heavyweight job queue" recommendation |
| Task execution | In-process `asyncio` task runner reading a SQLite-backed job table; separate worker process(es) on the GPU box and laptop poll for stage jobs assigned to them | Avoids Redis/Celery overhead for a 2-machine personal setup |
| File handoff between machines | Shared folder via Syncthing (or SMB share) — per-segment WAV, translated-text JSON, reference clips | Matches report §17 recommendation directly |
| Media processing | ffmpeg (CLI, via `subprocess`) | Extraction, remix, remux |
| Denoising | DeepFilterNet | Report-recommended, CPU-friendly |
| Source separation | Demucs (primary), UVR5 (optional alt) | |
| VAD / segmentation | Silero VAD | |
| Diarization | pyannote.audio | |
| ASR | faster-whisper (`large-v3`, `large-v3-turbo`, `medium` per mode) | |
| Translation | NLLB-200 (default), optional local LLM via Ollama (Gemma 3 12B class) for EU languages | |
| Voice cloning TTS | XTTS-v2 (primary), LuxTTS (CPU/speed fallback), CosyVoice2, AI4Bharat Indic-TTS / MMS-TTS (Bengali fallback) | Pluggable via the model registry (F-14) |
| Lip-sync (optional) | Wav2Lip / MuseTalk | Only invoked if the `lip_sync` stage is enabled in a preset |

## Deployment topology
- **API server + SQLite + frontend**: runs on either machine (recommend the always-on one); Next.js served via `next start` or built static export served by FastAPI, whichever is simpler at build time — decide at implementation start, not a blocking architectural choice
- **GPU worker process**: runs on the GTX 1050 Ti box, polls SQLite (or a small REST poll endpoint) for stages tagged `gpu_required` and assigned to it
- **Preprocessing worker process**: runs on the CPU laptop, polls for non-GPU stages
- Both workers write outputs to the shared Syncthing folder; the API server reads artifact paths from there

## Cross-cutting
- **Logging:** Python `logging`, per-stage file handlers under `runs/{id}/logs/`
- **Config:** `.env` for paths/ports; `model_registry` seeded via Alembic data migration
- **Testing:** pytest for backend (especially `subtitle_formatter.py` QA-rule unit tests — deterministic and high-value to test), Playwright for frontend E2E on the New Run → Run Detail happy path
- **No auth in v1** (single-user, local network) — flagged explicitly so it's a conscious decision, not an oversight, should the network exposure ever change
