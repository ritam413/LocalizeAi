# PRD — DubForge Studio
*Product Requirements Document*

**Owner:** Yu (single-user, local/self-hosted)
**Stack:** Next.js frontend + Python (FastAPI) backend, running on a 2-machine local network (GTX 1050 Ti 4GB GPU box + i5 CPU laptop)
**Status:** Draft v1

---

## 1. Problem Statement

Manually dubbing or subtitling a movie clip into multiple languages requires chaining together 8–10 separate AI tools (ffmpeg, Demucs, Silero VAD, pyannote, faster-whisper, NLLB-200/LLM, XTTS-v2/LuxTTS, ffmpeg remix) by hand, on the command line, across two machines, for every clip and every target language. This is slow, error-prone, hard to monitor, impossible to resume after a crash, and gives no visibility into *where* a run is, *why* it failed, or *how good* the output is before committing GPU time to the next stage.

There is no single local tool that:
- Lets you queue a clip once and pick target language(s) from a dropdown
- Runs the full pipeline (separation → transcription → translation → voice cloning → remix) unattended, resumably, across two machines
- Shows per-stage progress, logs, and intermediate artifacts (subtitles, separated audio, translated script) for inspection before the expensive TTS stage runs
- Lets you A/B different models per stage (XTTS-v2 vs LuxTTS, NLLB vs local LLM) without editing scripts
- Handles the two very different real workloads: rare high-quality Hindi/Bengali dubs (Project A) vs. bulk Spanish/Portuguese/Russian → English/Russian/French throughput (Project B) vs. universal any-language → English with a fast subtitle-only mode (Project C)

## 2. Solution

**DubForge Studio** is a local-first web application (Next.js UI + Python/FastAPI orchestration backend) that wraps the pipeline architecture defined in the research report into a controllable, observable, resumable dashboard. It does not reinvent the ML models — it orchestrates existing open-source tools (ffmpeg, Demucs, Silero VAD, pyannote, faster-whisper, NLLB-200, XTTS-v2/LuxTTS) as pluggable stages, running against a local SQLite job store and a shared folder (Syncthing/SMB) so work can be split across the GPU box and the CPU laptop as described in the report.

The core UX idea: **a run is a pipeline of stages, each independently inspectable, retryable, and swappable.** You never wait for a black box — you can review the diarized transcript before translation runs, review the translated script before TTS runs, and review the dubbed vocals before the final remux.

## 3. Goals

| # | Goal | Success signal |
|---|---|---|
| G1 | Turn a 15–20 min clip into dubbed output in 1–5 target languages without touching a terminal | Full run launched and completed entirely from the UI |
| G2 | Make every pipeline stage visible, inspectable, and independently retryable | Can view/download intermediate artifact for every stage; can re-run a single failed stage without re-running the whole pipeline |
| G3 | Support the two-machine (GPU box + CPU laptop) split from the research report | Preprocessing stages can be assigned to run on the laptop worker, TTS stages on the GPU worker, via a shared job queue |
| G4 | Support all three project modes (A: max-quality Hindi/Bengali, B: bulk Spanish/Portuguese/Russian, C: universal-to-English + subtitle-only) as first-class presets | Selecting a mode auto-configures model choices, chunk targets, and QA thresholds |
| G5 | Let models be swapped per stage without code changes | Stage config (e.g., TTS engine, MT engine) is a dropdown, stored per-run |
| G6 | Never lose work to a crash | A run resumes from its last completed stage on restart |

## 4. Non-Goals (v1)

- Multi-user auth, roles, or cloud hosting (single-user, local network only)
- Real-time/live dubbing (this is an offline batch pipeline)
- Building new ML models — DubForge orchestrates existing open-source models only
- Full non-linear video editing — output is a straight remux, not an edit suite
- Mobile app

## 5. Target Users

One primary persona (see `03-personas.md`): a technical hobbyist/researcher running this on their own hardware for personal movie-dubbing projects, comfortable with ML tooling but wants a UI instead of shell scripts for day-to-day runs.

## 6. Key Constraints (from research report, carried into this PRD)

- 4GB VRAM GPU box: never load two models on GPU at once — orchestration must serialize GPU-stage execution
- CPU-only laptop as a second worker — orchestration must support stage-level machine assignment
- No hard dependency on cloud LLMs — NLLB-200 is the default translator; local LLM (Ollama) is optional/pluggable
- Bengali has no strong zero-shot voice-cloning option — UI must surface this as a known limitation and offer fallback engines (AI4Bharat Indic-TTS, MMS-TTS) rather than silently degrading quality
