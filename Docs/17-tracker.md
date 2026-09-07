# Tracker — DubForge Studio
*Living checklist mirroring `16-implementation-plan.md`. Update statuses as work happens — this file is the source of truth for "what's actually done," not the plan doc.*

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

## Phase 0 — Foundations
- [x] FastAPI project scaffold + SQLAlchemy + Alembic initial migration (`15-schema.md`)
- [x] Next.js project scaffold + shadcn/ui + Tailwind + `AppShell`
- [x] `Stage` base class + `PipelineDefinition` + stub `RunExecutor`
- [x] `GpuLock` implementation + test against stub stages
- [x] Resume-after-kill proven against stub pipeline
- **Phase exit demo:** _Completed & verified via automated tests & API endpoint executions_

## Phase 1 — Subtitle-only pipeline
- [x] Extraction stage (ffmpeg)
- [x] Denoise stage (DeepFilterNet)
- [x] Optional Demucs stage (noisy-source path)
- [x] Transcription stage (faster-whisper, word timestamps)
- [x] Translation stage (NLLB-200) + context-window option
- [x] `subtitle_formatter.py` + unit tests against QA thresholds
- [x] S-03 Source screen
- [x] S-04 Mode & Languages screen (Subtitle-only toggle)
- [x] S-07 Progress/Logs screen
- [x] S-11 Subtitle Review screen
- [x] S-12 Output screen (SRT/VTT)
- **Phase exit demo:** _Completed & verified (Clip → English SRT/VTT output)_

## Phase 2 — Full dub, single machine
- [ ] Silero VAD segmentation stage
- [ ] pyannote diarization stage
- [ ] XTTS-v2 TTS stage
- [ ] Duration alignment stage
- [ ] Remix stage
- [ ] Remux stage
- [ ] S-05 Stage Config screen
- [ ] S-06 Confirm & Start screen
- [ ] S-08 Transcript Review
- [ ] S-09 Translation Review
- [ ] S-10 Speaker Review
- [ ] S-12 Output (video + previews)
- [ ] Per-stage retry + stale cascade
- [ ] S-15 Models screen
- **Phase exit demo:** _not yet run_

## Phase 3 — Project A + Bengali
- [ ] LuxTTS adapter
- [ ] AI4Bharat Indic-TTS adapter
- [ ] MMS-TTS adapter
- [ ] `large-v3` selectable + careful-chunking preset
- [ ] Project A builtin preset seeded
- [ ] Bengali quality `AlertBanner`
- [ ] Reference-clip auditioning (S-10 extension)
- **Phase exit demo:** _not yet run_

## Phase 4 — Two-machine split + batch
- [ ] GPU worker process (polling, shared-folder handoff)
- [ ] Preprocessing worker process
- [ ] Worker heartbeat endpoint
- [ ] S-16 Workers screen
- [ ] Machine-assignment control in Stage Config
- [ ] S-18 Batch Queue screen
- [ ] Batch creation endpoint
- [ ] Run History filters complete
- **Phase exit demo:** _not yet run_

## Phase 5 — Polish & Should-haves
- [ ] S-13/S-14 Presets CRUD
- [ ] Degraded-audio toggle wired end to end
- [ ] Duration-aware translation prompt logic
- [ ] Transcript/speaker inline editing
- [ ] Storage retention settings + cleanup job
- [ ] Download Center completeness
- [ ] Batch zip export
- **Phase exit demo:** _not yet run_

## Deferred backlog (Could — detailed in `09-feature-implementation-plan.md`, not scheduled into a phase)
- [ ] F-12 Pipeline templates beyond A/B/C — depends on F-05 (Presets CRUD), earliest pickup after Phase 5
- [ ] F-20 Desktop notifications — frontend-only, no backend dependency, can slot in any time after Phase 1 (needs `/ws/notifications`)
- [ ] F-26 Dubbed-audio segment preview before remix — needs segment-scoped retry (new API surface); pick up after Phase 2 (TTS stage must exist first)
- [ ] F-28 A/B compare TTS engines — needs 2+ TTS engines registered; earliest after Phase 3 (multiple TTS adapters exist)
- [ ] F-32 Re-export burn-in vs soft-sub — standalone post-processing action, needs a completed run to exist; any time after Phase 2
- [ ] F-37 Per-language-pair default engine settings — new small table, extends the S-17 placeholder section; any time after Phase 2
- [ ] F-38 Editable global QA thresholds — near-zero new work if Phase 1's `subtitle_formatter.py` correctly parameterizes thresholds (**verify this during Phase 1**, don't hardcode); otherwise a retrofit

## Deferred backlog (Won't, v1 — not scheduled)
- [ ] Multi-user auth (explicitly out of scope)

## Known open questions (resolve before the phase that needs them)
- Exact shared-folder mechanism: Syncthing vs. plain SMB — decide before Phase 4 starts
- Whether Next.js is served standalone or via FastAPI static export — decide before Phase 0 scaffold, doesn't block architecture
