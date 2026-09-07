# Screens — DubForge Studio
*Every screen the app needs, and the components each one is built from (see `08-components.md` for the component inventory).*

## S-01 Dashboard
- `AppShell` (sidebar nav + topbar)
- `ActiveRunCard` (progress bar, current stage badge, ETA) × N
- `NeedsAttentionList` (uses `ReviewGateBadge`)
- `WorkerStatusStrip` (uses `WorkerStatusPill` × 2)
- `RecentRunsTable` (compact `RunTable` variant)
- `PrimaryButton` ("New Run")
- `FailedRunsBanner` (conditional `AlertBanner`)

## S-02 Runs (History)
- `AppShell`
- `RunTable` (sortable, filterable)
- `FilterBar` (status `Select`, mode `Select`, `DateRangePicker`)
- `StatusBadge` (per row)
- `EmptyState` (no runs yet)

## S-03 New Run — Step 1: Source
- `WizardShell` (step indicator)
- `FileDropzone`
- `NetworkPathInput`
- `MediaProbeCard` (duration, codec, resolution, audio channels — populated after ffprobe)
- `WizardNavButtons`

## S-04 New Run — Step 2: Mode & Languages
- `WizardShell`
- `ModeSelectorCards` (Project A / B / C, each with description + "recommended for" tag)
- `LanguageSelect` (source, with "Auto-detect" option)
- `LanguageMultiSelect` (targets)
- `PresetPicker` (optional — load saved preset instead of manual config)
- `SubtitleOnlyToggle` (Project C only)
- `WizardNavButtons`

## S-05 New Run — Step 3: Stage Configuration
- `WizardShell`
- `StageConfigList` (one `StageConfigRow` per pipeline stage)
  - `StageConfigRow`: stage name, `ModelSelect` (per-stage model dropdown), `MachineAssignSelect` (GPU box / Laptop / Auto)
- `DegradedAudioToggle`
- `DurationAwareTranslationToggle`
- `WizardNavButtons`

## S-06 New Run — Step 4: Confirm & Start
- `WizardShell`
- `RunSummaryCard` (recap of steps 1–3)
- `SaveAsPresetCheckbox`
- `AddToBatchQueueToggle`
- `PrimaryButton` ("Start Run" / "Add to Queue")

## S-07 Run Detail — Progress/Logs (tab)
- `AppShell`
- `PipelineStageTimeline` (visual graph, current stage highlighted, uses `StageNode`)
- `StageDetailPanel` (status, duration, machine, `RetryButton`)
- `LogViewer` (streaming, filterable by level, per-stage tabs)
- `RunActionsBar` (Pause, Resume, Cancel)

## S-08 Run Detail — Review: Transcript
- `AppShell`
- `AudioPlayerScrubber` synced to `TranscriptLineList`
- `TranscriptLineEditor` (inline edit per line, timestamp shown)
- `ApproveButton` / `SendBackButton`

## S-09 Run Detail — Review: Translation
- `AppShell`
- `TranslationLineTable` (source line | translated line | `DurationFitIndicator`)
- `InlineTextEditor` per row
- `ApproveButton`

## S-10 Run Detail — Review: Speakers
- `AppShell`
- `SpeakerCard` × N (detected speaker, segment count)
- `SegmentReassignControl` (move a misassigned segment to another speaker)
- `ReferenceClipAuditioner` (candidate clips, `PlayButton` per candidate, `SelectAsReferenceButton`)
- `ApproveButton`

## S-11 Run Detail — Review: Subtitles (subtitle-only + full-dub subtitle output)
- `AppShell`
- `SubtitleTimeline` (visual, with `GapViolationMarker`, `CPSViolationMarker`)
- `SubtitleLineEditor`
- `SubtitlePreviewPlayer` (burned-in preview toggle)
- `ExportButton`

## S-12 Run Detail — Output
- `AppShell`
- `OutputLanguageTabs` (one tab per target language)
- `OutputVideoPlayer`
- `SegmentPreviewList` (dubbed vs. original A/B `PlayButton` pairs)
- `DownloadButton` (per file) + `DownloadAllZipButton`

## S-13 Presets (list)
- `AppShell`
- `PresetTable` (name, based-on mode, last used)
- `PrimaryButton` ("New Preset")
- `DeleteConfirmDialog`

## S-14 Preset Editor
- Same components as S-05 (`StageConfigList`) plus `PresetNameInput`, `SaveButton`

## S-15 Models
- `AppShell`
- `ModelStageTabs` (Separation / VAD / Diarization / ASR / MT / TTS / Lip-sync)
- `ModelTable` (name, license `LicenseBadge`, VRAM footprint, `InstalledStatusPill`)

## S-16 Workers
- `AppShell`
- `WorkerCard` × 2 (status, current job, role, `AssignRoleSelect`)
- `SharedFolderPathDisplay`

## S-17 Settings
- `AppShell`
- `SettingsSection` × 4 (Storage, Hardware Profile, QA Thresholds, Language Defaults)
- `SaveButton` per section

## S-18 Batch Queue (part of New Run when Batch mode toggled)
- `WizardShell`
- `BatchClipTable` (editable per-row target language)
- `PrimaryButton` ("Queue All")
