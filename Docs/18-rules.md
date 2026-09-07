# Rules — DubForge Studio
*Working rules for anyone (human or AI coding assistant) implementing this project. Keep this file open/loaded alongside the other docs when writing code — it encodes the constraints that aren't obvious from a single file in isolation.*

## Source of truth hierarchy
1. `10-database-schema.md` + `15-schema.md` — the schema is authoritative; if a screen or API doc implies a field that isn't in the schema, the schema wins and the other doc needs updating, not the code.
2. `11-api-design.md` — the API contract; frontend code should never call an endpoint not listed here without updating this doc first.
3. `02-features.md` + `03-moscow.md` — defines what's in scope for v1. Don't build Could/Won't-have features "while you're in there" — note them in `17-tracker.md`'s backlog instead.

## Hard constraints (violating these breaks the product, not just the style)
- **Never load two GPU-resident models at once.** Every stage touching the GPU box must acquire `GpuLock` (see `09-feature-implementation-plan.md`, F-09) before loading model weights, and must `del model; torch.cuda.empty_cache()` (or equivalent) before releasing it. This applies even during development/testing on the actual hardware.
- **Every stage transition writes to `stage_runs` before advancing**, not after. This is what makes resumability (F-10) correct — writing after would lose the last stage's completion state on a crash mid-transition.
- **Preset edits must never mutate an existing run.** Runs store `frozen_stage_config_json` at creation time; always read from the run's frozen copy during execution, never re-read the live preset.
- **Stage retry must cascade "stale" to downstream stages**, not silently leave them showing an outdated "completed" status.

## Naming conventions
- Stage names in code (`stage_name` column, `Stage` subclass identifiers) use the exact snake_case names listed in `10-database-schema.md`'s `stage_runs.stage_name` comment (`extraction`, `denoise`, `separation`, `vad`, `diarization`, `transcription`, `translation`, `tts`, `duration_align`, `remix`, `remux`, `lip_sync`) — don't introduce synonyms.
- Component names in frontend code match `08-components.md` exactly (e.g. `StageConfigRow`, not `StageRow` or `ConfigRow`) so the component inventory doc stays a reliable index of what exists.
- API routes match `11-api-design.md` exactly, including the `/api/v1` prefix.

## Model integration rules
- Every new model adapter implements the shared interface for its stage type (`TTSEngine`, `MTEngine`, etc. — see `09-feature-implementation-plan.md`, F-14) and is registered in `model_registry` via a migration, never hardcoded into a `Stage` class.
- License field on every `model_registry` row is mandatory — don't add a model without checking and recording its actual license (this matters concretely for XTTS-v2's CPML restriction, called out in the source research report).
- If a stage's chosen model doesn't support a requested language (e.g., XTTS-v2 + Bengali), fail with an explicit, specific error surfaced to the UI — never silently fall back to a different model without the user choosing that fallback.

## Review-gate discipline
- Any stage estimated at 20+ minutes of compute must have a review gate before it (per `14-design.md` principle 3). If a new expensive stage is added later, add its review gate at the same time, not as a follow-up.
- Review-gate approval is an explicit user action (`POST .../approve`); a stage must never auto-advance past a `needs_review` status on a timer or default.

## Testing expectations
- `subtitle_formatter.py` (F-27) requires unit tests covering each QA rule independently (min gap, min duration, max CPS, max line length/chars) — these are deterministic, cheap to test, and the most user-visible quality bar in the product per the research report.
- `RunExecutor` resume logic requires a test that kills the process mid-stage and asserts correct resumption from the last completed stage, not stage 0.
- `GpuLock` requires a test proving two GPU-tagged stages cannot run concurrently even across two different `Run` instances.

## Documentation discipline
- Any change to the DB schema updates both `10-database-schema.md` (narrative) and `15-schema.md` (DDL) in the same change.
- Any new/changed API endpoint updates `11-api-design.md` in the same change.
- Completed work is checked off in `17-tracker.md` as it lands, not batched up later — the tracker is only useful if it reflects reality.

## What not to do
- Don't add authentication, multi-user support, or cloud hosting — explicitly out of scope per `01-PRD.md` Non-Goals; if requirements change, that's a new PRD revision, not an incremental addition.
- Don't introduce Celery/Redis or another heavyweight queue — the SQLite-backed in-process/polling approach is a deliberate choice matching the two-machine personal scale (see `12-techspec.md`).
- Don't build a custom video editor — output is a straight remux; anything beyond that is out of scope.
