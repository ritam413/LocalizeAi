# Implementation Plan — DubForge Studio
*Phased build order. Each phase produces something runnable/demoable, not just code committed.*

## Phase 0 — Foundations (no UI yet)
- Set up FastAPI project + SQLAlchemy models + Alembic migration from `15-schema.md`
- Set up Next.js project + shadcn/ui + Tailwind + base `AppShell`
- Implement `Stage` base class + `PipelineDefinition` + `RunExecutor` skeleton (no real ML calls yet — stub stages that just sleep and report progress)
- Implement `GpuLock` (F-09) against the stub stages to prove the serialization contract works before any real GPU code exists
- **Exit criteria:** a fake run can be created via API, progresses through stubbed stages, and resumes correctly after a forced process kill (proves F-10 before real complexity is added)

## Phase 1 — Subtitle-only pipeline end to end (Project C subpart, F-13)
*Chosen first because the report itself recommends it as the fastest feedback loop and lightest full vertical slice.*
- Real stage implementations: Extraction (ffmpeg), Denoise (DeepFilterNet), optional Demucs, faster-whisper transcription, NLLB-200 translation, `subtitle_formatter.py` with QA rules (F-27)
- Build: S-03/S-04 (Source, Mode & Languages incl. Subtitle-only toggle), S-07 (Progress/Logs), S-11 (Subtitle Review), S-12 (Output, SRT/VTT only)
- Model registry (F-14) scoped to just ASR + MT + subtitle formatter for this phase
- **Exit criteria:** upload a real clip → get a QA-validated `.srt` out, entirely through the UI, matching the report's "~35–75 min" time budget

## Phase 2 — Full dub pipeline, single machine (Project B baseline)
- Add: Silero VAD segmentation, pyannote diarization, XTTS-v2 TTS stage, duration alignment, remix, remux
- Build: S-05/S-06 (Stage Config, Confirm), S-08/S-09/S-10 (Transcript/Translation/Speaker review), S-12 fully (video output + segment previews)
- Per-stage retry (F-11) and stale-cascade logic
- Model registry expanded to TTS engines; Model Manager screen (S-15) built here since there's now something meaningful to show
- **Exit criteria:** upload a Spanish/Portuguese/Russian clip → get dubbed English/Russian/French MP4 + SRT, entirely single-machine

## Phase 3 — Project A quality path + Bengali handling
- Add alternate TTS engines (LuxTTS, AI4Bharat Indic-TTS, MMS-TTS) via the pluggable registry
- Add `large-v3` (non-turbo) as selectable ASR model, careful VAD chunking preset
- Build Project A preset (F-39) with its specific defaults; surface Bengali quality caveat as an `AlertBanner` in the UI when Bengali is selected as a target
- Reference-clip auditioning (F-25) — this is where voice quality control matters most, so it lands here rather than earlier
- **Exit criteria:** Hindi dub at max-quality settings + Bengali dub via a fallback engine, both reviewable end to end

## Phase 4 — Two-machine split (F-08) + batch (F-06)
- Worker process split: GPU worker on the 1050 Ti box, preprocessing worker on the laptop, both polling via the shared-folder handoff described in `12-techspec.md`
- Workers screen (S-16), worker heartbeat endpoint, machine-assignment UI in Stage Config
- Batch queue (S-18, F-06), Run History filters (F-21) sufficient for the Batcher persona's overnight-run journey
- **Exit criteria:** Journey 2 from `05-user-journey.md` works as written — 8 clips queued, laptop and GPU box working in parallel, one failure recoverable via retry the next morning

## Phase 5 — Polish & Should-haves
- Presets CRUD UI (S-13/S-14), degraded-audio toggle (F-42), duration-aware + context-window translation (F-15/F-16), transcript/speaker inline editing (F-22/F-23), storage retention settings (F-36)
- Download Center completeness (F-31), batch zip export (F-33)
- **Exit criteria:** all Should-have features from `03-moscow.md` complete

## Explicitly deferred (Could/Won't — revisit only after Phase 5)
- A/B TTS engine comparison (F-28), burn-in vs soft-sub export options (F-32), editable global QA thresholds via UI (F-38 — ships hardcoded first), desktop notifications (F-20)

## Sequencing rationale
Subtitle-only first (Phase 1) de-risks the ASR/MT/formatting core — the part every other mode depends on — before the expensive, hardware-constrained TTS work begins. Two-machine orchestration (Phase 4) is deliberately after the single-machine pipeline works, so machine-split bugs aren't debugged at the same time as pipeline-correctness bugs.
