# Features — DubForge Studio
*Every feature the product should have, end to end*

Grouped by area. Each feature has a short ID used later in MoSCoW, Screens, and Feature Implementation Plan.

## A. Ingestion & Project Setup
- **F-01** Upload/import a video file (local file picker, drag-drop)
- **F-02** Import from a local network path (for large clips already on the shared folder)
- **F-03** Auto-probe media (duration, codec, resolution, audio channels) via ffprobe on ingest
- **F-04** Create a "Run" from an ingested clip: pick project mode (A/B/C), source language (or auto-detect), target language(s)
- **F-05** Save a Run configuration as a reusable **Preset** (model choices, chunk settings, QA thresholds)
- **F-06** Batch-queue multiple clips against the same preset

## B. Pipeline Orchestration (Core Engine)
- **F-07** Stage graph execution engine: extraction → denoise → separation → VAD segmentation → diarization → transcription → translation → TTS → duration alignment → remix → remux → (optional) lip-sync
- **F-08** Per-stage machine assignment (GPU box vs. CPU laptop) with a shared-folder handoff (Syncthing/SMB path)
- **F-09** GPU stage serialization guard — refuse to start a second GPU-resident stage while one is active on a 4GB-class device
- **F-10** Resumable runs — persist completed-stage state so a restart continues, not restarts
- **F-11** Per-stage retry (re-run just Stage N with the same or different model/config)
- **F-12** Pipeline templates per project mode (A/B/C) that pre-select stage configs
- **F-13** Subtitle-only fast path (skips diarization depth + TTS entirely, per Project C subpart)
- **F-14** Pluggable model registry per stage (e.g., TTS: XTTS-v2 / LuxTTS / CosyVoice2 / AI4Bharat / MMS-TTS; MT: NLLB-200 / local LLM via Ollama)
- **F-15** Duration-aware translation toggle (prompt MT/LLM to fit target speech duration)
- **F-16** Context-window translation for subtitle mode (prior 1–2 lines fed as context)

## C. Monitoring & Observability
- **F-17** Live run dashboard: stage-by-stage progress bars, current stage, elapsed/ETA
- **F-18** Streaming logs per stage (tail-able, filterable by level)
- **F-19** Worker status panel (GPU box / laptop: online, current job, VRAM/CPU load if reportable)
- **F-20** Notifications on stage completion / failure (in-app; optional desktop notification)
- **F-21** Run history with filters (status, project mode, target language, date)

## D. Quality Review & Human-in-the-loop
- **F-22** Transcript review screen — edit ASR text/timestamps before translation
- **F-23** Speaker/diarization review — merge or relabel misassigned speaker segments, assign reference clip per speaker
- **F-24** Translation review screen — edit translated script per line before TTS, with duration-fit indicator (over/under budget)
- **F-25** Reference-clip picker for voice cloning — audition candidate 3–6s clips per speaker, pick the cleanest
- **F-26** Dubbed-audio preview per segment before final remix (play cloned line vs. original)
- **F-27** Subtitle preview/editor with gap, duration, and CPS (chars-per-second) validation against the rules in the report
- **F-28** A/B compare two TTS engine outputs for the same line

## E. Output & Delivery
- **F-29** Per-language output package: dubbed MP4 + matching SRT/VTT
- **F-30** Subtitle-only export (SRT/VTT without audio pipeline)
- **F-31** Download center — browse/download all artifacts (intermediate and final) for a run
- **F-32** Re-export with different burn-in / soft-sub subtitle options
- **F-33** Batch export all target languages for a run as a zip

## F. Configuration & System
- **F-34** Model manager — see installed/available local models per stage, disk footprint, license flag (e.g., XTTS CPML non-commercial warning)
- **F-35** Hardware profile settings (declare GPU VRAM, CPU cores, worker roles) used to drive F-09 and F-08
- **F-36** Storage settings — working dir, shared folder path, retention policy for intermediate artifacts
- **F-37** Language pack settings — default MT/TTS engine per language pair, editable
- **F-38** Global QA thresholds (min gap, max CPS, max/min subtitle duration, target reference clip length)

## G. Presets by Project Mode (encodes the report's three modes as product features)
- **F-39** **Project A preset** — Hindi/Bengali, max-quality (`large-v3` Whisper, XTTS-v2 fp16 / AI4Bharat for Bengali, careful VAD chunking)
- **F-40** **Project B preset** — Spanish(CO)/Portuguese(BR)/Russian → English/Russian/French, throughput-tuned (`large-v3-turbo`, NLLB-200 + local LLM for EU languages)
- **F-41** **Project C preset** — universal source language (auto-detect) → English, with subtitle-only toggle
- **F-42** Degraded-audio mode toggle — enables DeepFilterNet denoise pass + Whisper hallucination mitigations (`condition_on_previous_text=False`) automatically
