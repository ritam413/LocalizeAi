# Information Architecture — DubForge Studio

## Top-level navigation (persistent sidebar)
1. **Dashboard** — home
2. **Runs** — run history/list
3. **New Run** — wizard entry point (also a persistent primary button, not just a nav item)
4. **Presets** — saved run configurations
5. **Models** — model manager
6. **Workers** — hardware/machine status and assignment
7. **Settings** — storage, hardware profile, QA thresholds, language defaults

## What each top-level page must surface

### Dashboard
Answers "what's happening right now and what needs me?" — must give **all available options** at a glance:
- Active runs (progress bars, current stage) — top, most prominent
- Runs awaiting review (transcript/translation/speaker review gates) — needs-attention list, visually distinct
- Quick action: **New Run** button
- Worker status strip (GPU box online/busy, laptop online/busy)
- Recent completed runs (last 5) with quick download links
- Failed runs banner if any exist, linking to Run History filtered to Failed

### Runs (history)
- Filterable/sortable table: clip name, project mode, target language(s), status, started, duration
- Filters: status (queued/running/needs review/completed/failed/interrupted), project mode (A/B/C), date range
- Row click → Run Detail

### New Run (wizard)
- Step 1: Source (upload or network path) + auto-probe result
- Step 2: Mode & languages (A/B/C preset, source/target language, or load a saved Preset)
- Step 3: Stage configuration review (editable model choices per stage, defaulted from preset)
- Step 4: Confirm & start (or "Add to batch queue")

### Run Detail
- Stage timeline (visual pipeline graph, current stage highlighted)
- Tabs: **Progress/Logs**, **Review** (context-sensitive: Transcript / Translation / Speakers / Subtitles, only shown when relevant), **Output**
- Per-stage: status, duration, machine it ran/will run on, retry button
- Global actions: Pause, Resume, Cancel, Re-run stage

### Presets
- List of saved presets (name, based-on mode, last used) + Create/Edit/Delete
- Preset editor mirrors the New Run wizard's Step 3 (stage/model configuration)

### Models
- Table per stage type (Separation, VAD, Diarization, ASR, MT, TTS, Lip-sync) listing available models, license flag, VRAM footprint, installed/not-installed

### Workers
- Two worker cards (GPU box, Laptop): online status, current job, assigned role (preprocessing vs GPU), VRAM/CPU indicator if available
- Manual override: force-assign a stage to a specific worker

### Settings
- Storage: working directory, shared folder path, retention policy (auto-delete intermediates after N days)
- Hardware profile: declared VRAM, CPU cores (drives GPU serialization guard)
- QA thresholds: min gap, max CPS, min/max subtitle duration, reference clip length
- Language defaults: default MT/TTS engine per language pair

## Content hierarchy principle
Every screen follows: **status/state first, actions second, detail/logs third** — the user should never have to scroll past raw logs to find out whether something needs their input.
