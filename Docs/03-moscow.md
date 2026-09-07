# MoSCoW Prioritization — DubForge Studio

Scope: v1 (single-user, local). Feature IDs reference `02-features.md`.

## Must Have (v1 cannot ship without these)
- F-01 Upload/import video
- F-03 ffprobe media inspection
- F-04 Create a Run (mode, source/target language)
- F-07 Stage graph execution engine (full pipeline)
- F-09 GPU stage serialization guard (4GB card — this is a correctness requirement, not polish)
- F-10 Resumable runs
- F-11 Per-stage retry
- F-14 Pluggable model registry per stage
- F-17 Live run dashboard (progress + current stage)
- F-18 Streaming logs per stage
- F-21 Run history
- F-24 Translation review screen
- F-27 Subtitle preview/editor with QA rules
- F-29 Per-language output package (MP4 + SRT)
- F-31 Download center
- F-34 Model manager
- F-35 Hardware profile settings
- F-39/F-40/F-41 Project A/B/C presets
- F-13 Subtitle-only fast path

## Should Have (materially improves v1, ship soon after must-haves)
- F-02 Import from network path
- F-05 Save Run as Preset
- F-06 Batch-queue multiple clips
- F-08 Per-stage machine assignment (GPU box vs laptop)
- F-15 Duration-aware translation
- F-16 Context-window translation
- F-19 Worker status panel
- F-22 Transcript review/edit
- F-23 Speaker/diarization review
- F-25 Reference-clip picker for voice cloning
- F-30 Subtitle-only export
- F-33 Batch export as zip
- F-36 Storage/retention settings
- F-42 Degraded-audio mode toggle

## Could Have (nice, defer without blocking core value)
- F-12 Pipeline templates beyond A/B/C (custom saved templates)
- F-20 Desktop notifications
- F-26 Dubbed-audio segment preview before remix
- F-28 A/B compare TTS engines
- F-32 Re-export with burn-in vs soft-sub options
- F-37 Per-language-pair default engine settings
- F-38 Editable global QA thresholds (v1 ships with sane hardcoded defaults)

## Won't Have (explicitly out of scope, v1)
- Multi-user auth/roles
- Cloud hosting / remote access
- Real-time or live dubbing
- Built-in non-linear video editor
- Mobile app
- Automatic model training/fine-tuning UI (e.g., fine-tuning XTTS on Bengali) — command-line only for now

## Rationale notes
- F-09 (GPU serialization) is Must, not Should, because getting it wrong crashes the only GPU worker mid-run — a correctness bug, not a UX gap.
- F-22/F-23 (transcript/diarization editing) are Should, not Must — v1 can ship read-only review with edit deferred, since the pipeline is still usable without inline correction (re-run with better source audio is the v1 fallback).
- F-08 (machine split) is Should, not Must — v1 can run single-machine sequentially; the two-machine split is a throughput optimization the report itself frames as "the single biggest speed win," but not a blocker to a working v1.
