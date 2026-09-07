# API Design — DubForge Studio

**Base:** FastAPI, REST + one WebSocket channel for live progress/logs. Local-only (no auth in v1 — bind to localhost/LAN by default, per PRD Non-Goals).
**Base path:** `/api/v1`

## Clips & Ingestion
| Method | Path | Purpose |
|---|---|---|
| POST | `/clips/upload` | Multipart upload of a video file; runs ffprobe, returns `Clip` |
| POST | `/clips/import` | `{path}` — import from a network/shared path; runs ffprobe |
| GET | `/clips` | List ingested clips |
| GET | `/clips/{id}` | Clip detail (probe info) |

## Presets
| Method | Path | Purpose |
|---|---|---|
| GET | `/presets` | List presets (includes builtin A/B/C) |
| GET | `/presets/{id}` | Preset detail (stage config) |
| POST | `/presets` | Create preset from `{name, project_mode, stage_config}` |
| PATCH | `/presets/{id}` | Update (rejects if `is_builtin`) |
| DELETE | `/presets/{id}` | Delete (rejects if `is_builtin`) |

## Runs
| Method | Path | Purpose |
|---|---|---|
| POST | `/runs` | Create + start a run: `{clip_id, preset_id | stage_config_override, project_mode, source_language, target_languages, subtitle_only}` |
| POST | `/runs/batch` | Create multiple runs from `{clip_ids[], preset_id}` |
| GET | `/runs` | List runs, query params: `status, project_mode, from, to, sort` |
| GET | `/runs/{id}` | Run detail: status, stage list with per-stage status, target languages |
| POST | `/runs/{id}/pause` | Pause after current stage completes |
| POST | `/runs/{id}/resume` | Resume a paused/interrupted run |
| POST | `/runs/{id}/cancel` | Cancel a run |
| DELETE | `/runs/{id}` | Delete a run + its artifacts (with confirm) |

## Stages
| Method | Path | Purpose |
|---|---|---|
| GET | `/runs/{id}/stages` | List stage_runs for a run |
| GET | `/runs/{id}/stages/{stage_name}` | Stage detail (supports `?target_language=` for per-language stages) |
| POST | `/runs/{id}/stages/{stage_name}/retry` | Retry a stage, optional `{model_id, params}` override; cascades "stale" to downstream |
| POST | `/runs/{id}/stages/{stage_name}/approve` | Approve a review-gate stage, allowing pipeline to continue |

## Segments (transcript / translation / subtitle review)
| Method | Path | Purpose |
|---|---|---|
| GET | `/runs/{id}/segments` | List segments, `?target_language=&stage=transcript|translation|subtitle` |
| PATCH | `/runs/{id}/segments/{segment_id}` | Edit `source_text` / `translated_text` / timing; recomputes `cps`, `gap_before_s`, `estimated_speech_duration_s` |
| POST | `/runs/{id}/subtitles/validate` | Validate current segment set against QA thresholds (shared logic with the formatter); returns list of violations — used live by the Subtitle Editor |

## Speakers & Reference Clips
| Method | Path | Purpose |
|---|---|---|
| GET | `/runs/{id}/speakers` | List detected speakers |
| PATCH | `/runs/{id}/speakers/{speaker_id}` | Rename / re-color |
| POST | `/runs/{id}/speakers/{speaker_id}/reassign-segment` | `{segment_id, target_speaker_id}` |
| GET | `/runs/{id}/speakers/{speaker_id}/reference-clips` | List candidate reference clips |
| POST | `/runs/{id}/speakers/{speaker_id}/reference-clips/{clip_id}/select` | Mark as chosen for cloning |

## Artifacts / Output
| Method | Path | Purpose |
|---|---|---|
| GET | `/runs/{id}/artifacts` | List all artifacts, `?type=&stage=` |
| GET | `/runs/{id}/artifacts/{artifact_id}/download` | Stream file download |
| GET | `/runs/{id}/output` | Convenience: final per-language MP4+SRT pairs only |
| GET | `/runs/{id}/output/zip` | Stream a zip of all final outputs |

## Models
| Method | Path | Purpose |
|---|---|---|
| GET | `/models` | List registry entries, `?stage_type=` |
| GET | `/models/{id}` | Model detail |
| POST | `/models/{id}/install` | Trigger local install/download (if supported) — returns a job id, progress over WebSocket |

## Workers
| Method | Path | Purpose |
|---|---|---|
| GET | `/workers` | List worker status |
| PATCH | `/workers/{id}` | Update role/assignment |
| POST | `/workers/{id}/heartbeat` | Worker process calls this periodically; updates `last_seen_at`/status |

## Settings
| Method | Path | Purpose |
|---|---|---|
| GET | `/settings` | Get current settings |
| PATCH | `/settings` | Update settings (storage paths, hardware profile, QA thresholds) |

## WebSocket
| Channel | Purpose |
|---|---|
| `/ws/runs/{id}` | Live events: `stage_status_changed`, `progress_update {stage_name, pct}`, `log_line {stage_name, level, message}`, `needs_review {stage_name}` |
| `/ws/workers` | Live worker status changes (for Dashboard's `WorkerStatusStrip`) |

## Conventions
- All list endpoints support `?page=&page_size=` (default 50)
- All timestamps ISO-8601 UTC
- Error shape: `{error: {code, message, details?}}`
- Stage retry/approve endpoints are idempotent — retrying an already-completed stage requires an explicit `?force=true` to avoid accidental re-runs of expensive stages
