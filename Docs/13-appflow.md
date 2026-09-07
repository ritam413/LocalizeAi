# App Flow — DubForge Studio
*Navigation flow between screens, referencing IDs from `07-screens.md`.*

```
S-01 Dashboard
 ├─(New Run)→ S-03 New Run: Source
 │              └→ S-04 New Run: Mode & Languages
 │                   ├─(Batch toggle)→ S-18 Batch Queue → [Queue All] → S-02 Runs (History)
 │                   └→ S-05 New Run: Stage Config
 │                        └→ S-06 New Run: Confirm & Start
 │                             └─(Start Run)→ S-07 Run Detail: Progress/Logs
 │
 ├─(click Active Run card)→ S-07 Run Detail: Progress/Logs
 ├─(click Needs-Attention item)→ context-sensitive review screen (S-08/S-09/S-10/S-11)
 ├─(Recent Runs → View)→ S-12 Run Detail: Output
 └─(nav: Runs)→ S-02 Runs (History)
                  └─(row click)→ S-07 Run Detail: Progress/Logs

S-07 Run Detail: Progress/Logs
 ├─(stage reaches needs_review)→ auto-surfaces tab for S-08/S-09/S-10/S-11
 ├─(Retry on a stage)→ stays on S-07, stage resets to running
 └─(all stages complete)→ tab switches to S-12 Run Detail: Output

S-08 Review: Transcript ──(Approve)──> next stage runs ──> S-09 Review: Translation (when ready)
S-09 Review: Translation ──(Approve)──> next stage runs ──> S-10 Review: Speakers (when ready)
S-10 Review: Speakers ──(Approve)──> TTS stage runs ──> S-11 Review: Subtitles (in parallel/after, for subtitle output) 
S-11 Review: Subtitles ──(Export)──> S-12 Run Detail: Output

S-12 Run Detail: Output
 ├─(Download)→ file stream (no navigation)
 └─(nav: Runs)→ S-02 Runs (History)

nav: Presets → S-13 Presets (list)
 └─(New/Edit)→ S-14 Preset Editor → [Save] → S-13 Presets (list)

nav: Models → S-15 Models
nav: Workers → S-16 Workers
nav: Settings → S-17 Settings
```

## Flow notes
- **Review gates are non-blocking to navigation** — the user can leave a run mid-review and come back; the run simply sits in `needs_review` status and reappears in the Dashboard's Needs-Attention list.
- **Subtitle-only runs (F-13)** skip S-10 (Speakers) entirely and go Transcript → Translation → Subtitle Review → Output, since there is no diarization-for-cloning need (diarization for subtitle speaker labels, if used, is lighter-weight and not gated).
- **Batch-created runs** each get their own S-07 instance; the Batch Queue screen (S-18) is a one-time setup step, not a persistent view — ongoing batch monitoring happens through S-02 Runs (History) filtered by a batch tag.
- **Preset editing (S-14) never affects in-flight runs** — enforced by the `frozen_stage_config_json` snapshot described in `10-database-schema.md`.
