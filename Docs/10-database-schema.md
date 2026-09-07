# Database Design — DubForge Studio

**Engine:** SQLite (single-user, local — matches the report's "no heavyweight job queue for a two-machine personal setup" guidance). Accessed via SQLAlchemy (async).
**File:** `dubforge.db`, lives in the configured working directory (see Settings).

## ER overview (text)

```
projects ──< clips ──< runs ──< stage_runs ──< artifacts
                          │            │
                          │            └──< logs
                          ├──< segments (speaker/transcript/translation/subtitle rows)
                          └──< speakers ──< reference_clips
presets (standalone, referenced by runs.preset_id)
settings (single-row config table)
model_registry (seeded + installed-state tracking)
workers (GPU box, laptop)
```

## Tables

### `clips`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK (uuid) | |
| source_path | TEXT | original ingested file path |
| filename | TEXT | |
| duration_s | REAL | from ffprobe |
| codec | TEXT | |
| resolution | TEXT | |
| audio_channels | INTEGER | |
| created_at | DATETIME | |

### `presets`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| name | TEXT | |
| project_mode | TEXT | 'A' \| 'B' \| 'C' |
| is_builtin | BOOLEAN | true for shipped A/B/C defaults, not user-deletable |
| stage_config_json | TEXT | JSON: ordered list of {stage_name, model_id, machine_assignment, params} |
| qa_thresholds_json | TEXT | JSON override of global QA thresholds, nullable |
| created_at | DATETIME | |

### `runs`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| clip_id | TEXT FK → clips.id | |
| preset_id | TEXT FK → presets.id | snapshot reference; run also stores a frozen copy below |
| project_mode | TEXT | 'A' \| 'B' \| 'C' |
| source_language | TEXT | ISO code, nullable if auto-detect |
| target_languages_json | TEXT | JSON array of ISO codes |
| subtitle_only | BOOLEAN | |
| frozen_stage_config_json | TEXT | snapshot of preset config at run start, so later preset edits don't retroactively change a running job |
| status | TEXT | queued \| running \| needs_review \| completed \| failed \| interrupted \| cancelled |
| current_stage | TEXT | nullable |
| started_at | DATETIME | |
| completed_at | DATETIME | nullable |
| created_at | DATETIME | |

### `stage_runs`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| run_id | TEXT FK → runs.id | |
| stage_name | TEXT | e.g. 'extraction', 'denoise', 'separation', 'vad', 'diarization', 'transcription', 'translation', 'tts', 'duration_align', 'remix', 'remux', 'lip_sync' |
| target_language | TEXT | nullable — set for per-language stages (translation, tts, remix, remux) |
| model_id | TEXT | resolved model used, FK → model_registry.id |
| machine | TEXT | 'gpu_box' \| 'laptop' \| nullable (not yet assigned) |
| status | TEXT | pending \| queued \| running \| needs_review \| completed \| failed \| stale |
| progress_pct | REAL | 0–100 |
| error_message | TEXT | nullable |
| started_at | DATETIME | nullable |
| completed_at | DATETIME | nullable |

Index: `(run_id, stage_name, target_language)` unique-ish composite for lookup; index on `status`.

### `artifacts`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| stage_run_id | TEXT FK → stage_runs.id | |
| run_id | TEXT FK → runs.id | denormalized for fast Download Center queries |
| type | TEXT | 'audio' \| 'video' \| 'subtitle' \| 'json' \| 'log' \| 'image' |
| label | TEXT | e.g. "vocals.wav", "Hindi.mp4", "Hindi.srt" |
| path | TEXT | filesystem path (shared folder or local working dir) |
| size_bytes | INTEGER | |
| created_at | DATETIME | |

### `speakers`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| run_id | TEXT FK → runs.id | |
| label | TEXT | e.g. "Speaker 1", user-renameable |
| color_tag | TEXT | hex, for UI |

### `reference_clips`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| speaker_id | TEXT FK → speakers.id | |
| path | TEXT | |
| duration_s | REAL | |
| is_selected | BOOLEAN | which candidate is chosen for cloning |

### `segments`
Unified table for transcript/translation/subtitle line-level data, one row per speech segment per run.
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| run_id | TEXT FK → runs.id | |
| speaker_id | TEXT FK → speakers.id | nullable |
| target_language | TEXT | nullable for source-language transcript rows |
| start_s | REAL | |
| end_s | REAL | |
| source_text | TEXT | ASR output |
| translated_text | TEXT | nullable until translation stage runs |
| target_duration_s | REAL | = end_s - start_s, the slot to fit |
| estimated_speech_duration_s | REAL | nullable, heuristic estimate pre-TTS |
| cps | REAL | nullable, computed for subtitle QA |
| gap_before_s | REAL | nullable, computed for subtitle QA |
| edited | BOOLEAN | true if user hand-edited this row |
| approved | BOOLEAN | |

Index: `(run_id, target_language, start_s)`.

### `model_registry`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | e.g. 'xtts-v2', 'nllb-200-3.3b' |
| stage_type | TEXT | 'separation' \| 'vad' \| 'diarization' \| 'asr' \| 'mt' \| 'tts' \| 'lip_sync' |
| display_name | TEXT | |
| license | TEXT | e.g. 'CPML (non-commercial)', 'Apache-2.0', 'MIT' |
| vram_footprint_mb | INTEGER | nullable if CPU-only |
| language_coverage_json | TEXT | JSON array of supported ISO codes, nullable if universal |
| entrypoint | TEXT | Python module path for dynamic loading |
| weights_path | TEXT | nullable |
| installed | BOOLEAN | |

### `workers`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | 'gpu_box' \| 'laptop' |
| display_name | TEXT | |
| role | TEXT | 'gpu_worker' \| 'preprocessing_worker' \| 'either' |
| last_seen_at | DATETIME | nullable |
| status | TEXT | 'online' \| 'offline' \| 'busy' |
| current_stage_run_id | TEXT FK → stage_runs.id | nullable |

### `settings`
Single-row table (id always = 1).
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | always 1 |
| working_dir | TEXT | |
| shared_folder_path | TEXT | Syncthing/SMB path |
| retention_days | INTEGER | nullable = never delete |
| gpu_vram_mb | INTEGER | drives F-09 guard |
| cpu_cores | INTEGER | |
| qa_min_gap_ms | INTEGER | default 100 |
| qa_max_cps | REAL | default 17 |
| qa_min_duration_s | REAL | default 1.0 |
| qa_max_line_chars | INTEGER | default 42 |

## Design notes
- SQLite is sufficient at single-user scale; if multi-user is ever added (explicitly out of scope, see PRD Non-Goals), migrate to Postgres — schema is written to translate directly (all FKs, no SQLite-only features used).
- `frozen_stage_config_json` on `runs` exists specifically so editing a Preset never mutates an in-flight or historical run's actual configuration — this matters for reproducibility when comparing two runs' outputs.
- `segments` is intentionally one wide table rather than three (transcript/translation/subtitle) because the same row's timing data flows through all three stages and needs a single source of truth for the duration-fit and CPS calculations.
