# Component Inventory — DubForge Studio
*The reusable component library every screen pulls from. Built on shadcn/ui + Tailwind primitives (see `12-techspec.md`).*

## Layout
| Component | Purpose | Built from |
|---|---|---|
| `AppShell` | Sidebar nav + topbar + content slot, used on every screen | shadcn `Sheet`/custom flex layout |
| `WizardShell` | Step indicator + content slot + nav footer, used across New Run steps | custom, step state from wizard context |
| `EmptyState` | Generic "nothing here yet" block with icon + CTA | custom |

## Status & Feedback
| Component | Purpose |
|---|---|
| `StatusBadge` | Colored pill: queued / running / needs review / completed / failed / interrupted |
| `ReviewGateBadge` | Highlights which review gate a run is waiting on |
| `AlertBanner` | Dismissible warning/error banner (e.g., failed runs, Bengali quality warning) |
| `LicenseBadge` | Flags non-commercial/CPML models distinctly from permissive ones |
| `InstalledStatusPill` | Installed / Not Installed / Downloading, for Model Manager |
| `GapViolationMarker` / `CPSViolationMarker` | Inline flags on subtitle timeline for QA rule breaches |
| `DurationFitIndicator` | Green/amber/red indicator showing translated-line duration vs. original slot |

## Run/Pipeline-specific
| Component | Purpose |
|---|---|
| `ActiveRunCard` | Dashboard card: clip thumbnail, progress bar, current stage, ETA |
| `PipelineStageTimeline` | Horizontal graph of all stages with `StageNode` children, highlights current/failed stage |
| `StageNode` | Single stage icon+label in the timeline, clickable to jump to detail |
| `StageDetailPanel` | Status, duration, assigned machine, retry control for one stage |
| `StageConfigRow` | One row in stage configuration: stage name + `ModelSelect` + `MachineAssignSelect` |
| `StageConfigList` | Ordered list of `StageConfigRow`, drives both New Run Step 3 and Preset Editor |
| `RunActionsBar` | Pause / Resume / Cancel / Retry action group |
| `RunSummaryCard` | Recap block on New Run confirm step |
| `WorkerStatusPill` | Compact online/busy/offline indicator for a worker |
| `WorkerStatusStrip` | Row of `WorkerStatusPill` for dashboard |
| `WorkerCard` | Full worker detail card (Workers screen) |

## Tables & Lists
| Component | Purpose |
|---|---|
| `RunTable` | Sortable/filterable table of runs (full and compact variants) |
| `FilterBar` | Status/mode/date filter controls above a table |
| `PresetTable` | List of saved presets |
| `ModelTable` | List of models for a given stage type |
| `BatchClipTable` | Editable table of clips queued in batch mode |
| `SegmentPreviewList` | List of dubbed-vs-original segment preview pairs |

## Media & Editing
| Component | Purpose |
|---|---|
| `FileDropzone` | Drag-drop/upload target for video ingestion |
| `MediaProbeCard` | Shows ffprobe results after ingest |
| `AudioPlayerScrubber` | Waveform/scrubber synced to transcript/subtitle lines |
| `TranscriptLineList` / `TranscriptLineEditor` | Review and inline-edit ASR output |
| `TranslationLineTable` / `InlineTextEditor` | Review and inline-edit MT output |
| `SpeakerCard` | One detected speaker with segment count and avatar-style color tag |
| `SegmentReassignControl` | Move a segment between speakers |
| `ReferenceClipAuditioner` | Play + select candidate voice-cloning reference clips |
| `SubtitleTimeline` | Visual subtitle track with violation markers |
| `SubtitleLineEditor` | Edit one subtitle line's text/timing |
| `SubtitlePreviewPlayer` | Video preview with burned-in subtitle toggle |
| `OutputVideoPlayer` | Final output playback |
| `OutputLanguageTabs` | Tab switcher across target-language outputs |
| `PlayButton` | Small reusable play/pause control used across auditioners/previews |

## Forms & Inputs
| Component | Purpose |
|---|---|
| `LanguageSelect` / `LanguageMultiSelect` | Language pickers with "Auto-detect" support |
| `ModelSelect` | Per-stage model dropdown, pulls from Model Manager registry |
| `MachineAssignSelect` | GPU box / Laptop / Auto assignment dropdown |
| `PresetPicker` | Select an existing preset to prefill a run |
| `NetworkPathInput` | Path input with validation for shared-folder imports |
| `SettingsSection` | Titled card grouping a set of related settings fields |
| `PrimaryButton` / `SecondaryButton` / `DeleteConfirmDialog` / `SaveButton` | Generic action components (shadcn `Button`/`AlertDialog` wrappers) |
| `SubtitleOnlyToggle` / `DegradedAudioToggle` / `DurationAwareTranslationToggle` / `AddToBatchQueueToggle` / `SaveAsPresetCheckbox` | Named boolean switches (shadcn `Switch`/`Checkbox`) tied to specific run-config flags |

## Logging
| Component | Purpose |
|---|---|
| `LogViewer` | Streaming, filterable log pane, per-stage tabs, auto-scroll with pause-on-scroll-up |

## Design principle
Every domain-specific component (prefixed by concept, e.g. `Stage*`, `Worker*`, `Subtitle*`) wraps a generic shadcn/ui primitive rather than being built from scratch — this keeps the visual language consistent while keeping pipeline-specific logic (progress %, violation detection, machine assignment) out of the primitive layer.
