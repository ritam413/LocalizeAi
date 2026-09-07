# Feature Implementation Plan — DubForge Studio
*For every Must/Should-have feature: What is it? Why build it? How is it built? What tech stack? How do we build it from scratch?*
Feature IDs reference `02-features.md`. Only Must + Should items are detailed here (Could/Won't are out of v1 scope, see `03-moscow.md`).

---

### F-07 — Stage graph execution engine
**What:** The core orchestrator that runs the fixed pipeline (extraction → denoise → separation → VAD → diarization → transcription → translation → TTS → duration alignment → remix → remux → optional lip-sync) as a directed sequence of jobs, each with defined inputs/outputs.
**Why:** Every other feature (progress, retry, resumability, review gates) depends on stages being discrete, addressable units of work rather than one monolithic script.
**How:** Model the pipeline as a static DAG (linear with optional branches for subtitle-only and lip-sync). Each stage is a Python class implementing `run(input_paths, config) -> output_paths` plus `estimate_progress()`. A `RunExecutor` walks the DAG, persists stage state to SQLite after each transition (`pending → running → needs_review → completed/failed`), and pushes progress events over a WebSocket to the frontend.
**Tech stack:** Python 3.11, FastAPI (HTTP + WebSocket), a lightweight in-process task runner (no Celery/Redis — matches the report's "no heavyweight job queue for a two-machine personal setup" guidance) using `asyncio` + a SQLite-backed job table polled by worker processes.
**Build from scratch:**
1. Define `Stage` base class + concrete subclasses per pipeline step, wrapping the actual CLI/Python calls (ffmpeg, Demucs, faster-whisper, NLLB, XTTS, etc.)
2. Define `PipelineDefinition` per project mode (A/B/C) as an ordered list of `Stage` configs
3. Build `RunExecutor` that persists `Run` + `StageRun` rows, executes stages in order, halts at review-gate stages until UI approval
4. Expose FastAPI endpoints (`POST /runs`, `POST /runs/{id}/stages/{stage}/retry`, etc. — see `11-api-design.md`)
5. Emit progress via WebSocket channel `runs/{id}`

---

### F-09 — GPU stage serialization guard
**What:** A hard rule preventing two GPU-resident models from being loaded simultaneously on the 4GB GPU box.
**Why:** Loading two GPU stages at once on a 4GB card causes OOM crashes mid-run — a correctness bug per the research report's hardware constraints, not a nice-to-have.
**How:** Tag each `Stage` with `gpu_required: bool`. The `RunExecutor` (or a shared `GpuLock` singleton if multiple runs are active) acquires a mutex before starting any GPU-tagged stage across *all* concurrently running pipelines, and releases it (plus explicit `del model; torch.cuda.empty_cache()`) after the stage completes.
**Tech stack:** Python `asyncio.Lock` (single-process) or a SQLite row-based lock if the GPU worker runs as a separate process from the API server.
**Build from scratch:** Add `gpu_required` flag to stage config → implement `GpuLock` → wrap GPU stage execution in `async with gpu_lock:` → surface lock-wait state in the UI as "Queued — waiting for GPU."

---

### F-10 — Resumable runs
**What:** A run interrupted by a crash/restart picks up from its last completed stage instead of restarting.
**Why:** Named directly in the PRD goals (G6) — a multi-hour pipeline that can't resume makes crashes catastrophic.
**How:** Every stage transition writes to a `stage_runs` table (see `10-database-schema.md`) with status and output artifact paths *before* the executor advances. On process start, `RunExecutor` scans for runs in `running`/`interrupted` status and re-attaches, re-deriving the next stage to execute from the last `completed` row.
**Tech stack:** SQLite (via SQLAlchemy), a startup reconciliation routine in the FastAPI app lifespan hook.
**Build from scratch:** Add DB-write-before-advance discipline to `RunExecutor` → add a `reconcile_on_startup()` function → add "Interrupted" status + Resume action in UI (F-11 shares the retry mechanism).

---

### F-11 — Per-stage retry
**What:** Re-run a single failed/unsatisfactory stage (optionally with a different model) without re-running earlier stages.
**Why:** Avoids re-paying for expensive upstream stages (e.g., Demucs, Whisper) when only the TTS model choice needs to change.
**How:** `POST /runs/{id}/stages/{stage_name}/retry` with optional `{config_overrides}`. Executor re-validates that the stage's declared input artifacts still exist, re-runs just that stage, and re-triggers downstream stages that depend on it (marks them `stale`, requiring re-approval if they were already `needs_review`/`completed`).
**Tech stack:** Same executor + SQLAlchemy models.
**Build from scratch:** Define per-stage input/output dependency edges → implement "mark downstream stale" cascade → wire `RetryButton` in `StageDetailPanel`.

---

### F-14 — Pluggable model registry per stage
**What:** A registry mapping stage type → available model implementations (e.g., TTS: XTTS-v2, LuxTTS, CosyVoice2, AI4Bharat, MMS-TTS), selectable per run/preset.
**Why:** Core to G5 — swap models without code changes, and required to support Project A vs B vs C defaults.
**How:** A `model_registry.yaml` (or DB table) lists, per stage type, model id, display name, license, VRAM footprint, install status, and a Python entrypoint (module path + class) implementing a common interface (e.g., `TTSEngine.synthesize(text, ref_clip, lang) -> wav`). Each `Stage` resolves its concrete engine at runtime from the run's config.
**Tech stack:** YAML config + Python `importlib` for dynamic loading; SQLite table mirrors registry state (installed/not) for the Models screen.
**Build from scratch:** Define abstract interfaces per stage type (`SeparationEngine`, `ASREngine`, `MTEngine`, `TTSEngine`, `LipSyncEngine`) → implement one concrete adapter per model from the research report → build registry loader → expose via `GET /models` for the Models screen (S-15).

---

### F-17 — Live run dashboard
**What:** Real-time stage-by-stage progress with current stage and ETA.
**Why:** Core observability goal (G2) — user should never wonder "is it stuck?"
**How:** Each `Stage.run()` periodically reports fractional progress (e.g., "segment 12/40 transcribed") via a callback; `RunExecutor` forwards this over the `runs/{id}` WebSocket channel. Frontend subscribes on `Run Detail` mount and updates `ActiveRunCard`/`PipelineStageTimeline` reactively.
**Tech stack:** FastAPI WebSocket, React state (no need for a heavier state library given single-user scope) — TanStack Query for the initial fetch, WebSocket for live deltas.
**Build from scratch:** Add progress-callback plumbing to each `Stage` implementation → WebSocket broadcast in executor → frontend `useRunProgress(runId)` hook.

---

### F-18 — Streaming logs per stage
**What:** Tail-able, filterable logs for each stage.
**Why:** Debugging is the actual daily use case when a stage fails (e.g., diagnosing why Whisper hallucinated).
**How:** Each stage's subprocess/library output is captured to a per-stage log file (`runs/{id}/logs/{stage}.log`) and tailed to the frontend over the same WebSocket channel, namespaced by stage.
**Tech stack:** Python `logging` with a file handler per stage; frontend `LogViewer` component with virtualized scroll for long logs.
**Build from scratch:** Configure per-stage log file handlers → add log-tail WebSocket messages → build `LogViewer`.

---

### F-21 — Run history
**What:** Filterable list of all past/current runs.
**Why:** Needed by every persona to find a specific run later (Batcher checking overnight results; Archivist re-downloading an old dub).
**How:** `GET /runs?status=&mode=&from=&to=` backed by a SQLite query with indexes on `status` and `created_at`.
**Tech stack:** FastAPI + SQLAlchemy, TanStack Table for the frontend `RunTable`.
**Build from scratch:** Add indexes to `runs` table → build filter query builder → build `RunTable` + `FilterBar`.

---

### F-24 — Translation review screen
**What:** Editable side-by-side source/translated text with a duration-fit indicator per line.
**Why:** The research report calls out duration-aware translation as the practical fix for sync problems — this screen is where the human confirms it worked before TTS runs.
**How:** After the Translation stage completes, it writes per-segment rows (`segment_id, source_text, translated_text, target_duration_s, estimated_speech_duration_s`) to DB. `estimated_speech_duration_s` uses a simple heuristic (chars/lang-specific speaking rate) as a fast proxy pre-TTS. UI colors the indicator green/amber/red based on ratio to `target_duration_s`. Edits are saved via `PATCH /runs/{id}/segments/{segment_id}`.
**Tech stack:** React table (TanStack Table) + inline editable cells; backend heuristic function per language.
**Build from scratch:** Add segment-level DB rows → implement duration-estimate heuristic → build `TranslationLineTable` + `InlineTextEditor` + `DurationFitIndicator`.

---

### F-27 — Subtitle preview/editor with QA rules
**What:** Visual subtitle timeline enforcing the report's formatting rules: min gap (~80–120ms), min duration (~1s), max CPS (~15–17), max 2 lines/~42 chars.
**Why:** Directly named as "the difference between amateur-looking auto-captions and something that reads like a real subtitle track."
**How:** A post-processing function (`subtitle_formatter.py`) takes Whisper word timestamps + translated text and applies the rules (snap to VAD boundaries with 100–300ms padding, split long lines, enforce gaps) to produce a candidate `.srt`. The editor then re-validates on every user edit and flags violations live.
**Tech stack:** Pure Python formatting module (~100–150 lines per the report's own estimate), `pysrt` or hand-rolled SRT writer; React `SubtitleTimeline` with `GapViolationMarker`/`CPSViolationMarker`.
**Build from scratch:** Implement `subtitle_formatter.py` with unit tests against the specific thresholds → wire into Subtitle stage output → build live-validation on edit in the editor (same rule functions, exposed via a `POST /runs/{id}/subtitles/validate` endpoint so frontend and backend share one source of truth).

---

### F-29 — Per-language output package
**What:** Final `{lang}.mp4` + `{lang}.srt` per target language.
**Why:** This is the literal deliverable of the product.
**How:** Remix stage combines dubbed vocals + `background.wav` (ffmpeg `amix`), Remux stage combines with original video (`-c:v copy`), Subtitle stage output is copied alongside. All registered as `Artifact` rows tied to the run.
**Tech stack:** ffmpeg CLI invoked via Python `subprocess`.
**Build from scratch:** Implement Remix/Remux stage classes → register output artifacts in DB → surface in Output tab (S-12).

---

### F-31 — Download center
**What:** Browse/download any artifact (intermediate or final) for a run.
**Why:** Debugging and manual reuse (e.g., grabbing `vocals.wav` for something else).
**How:** All stage outputs are registered as `Artifact` rows with `path, type, stage, run_id`. `GET /runs/{id}/artifacts` lists them; download served via FastAPI `FileResponse` (local-only, no need for signed URLs given single-user local deployment).
**Tech stack:** FastAPI static file serving.
**Build from scratch:** Add `Artifact` table writes to every stage → build listing endpoint → build Download Center UI section within Output tab.

---

### F-34 — Model manager
**What:** See installed/available models per stage with license and VRAM footprint.
**Why:** Users need to know before starting a run whether, e.g., XTTS-v2's CPML license matters for their use, or whether a model needs downloading first.
**How:** Reads from the same `model_registry` used by F-14; adds an `installed` check (file existence check for model weights) and a `LicenseBadge` render rule (flag non-permissive licenses distinctly).
**Tech stack:** Same registry, FastAPI `GET /models`.
**Build from scratch:** Extend registry entries with `license` and `weights_path` → implement installed-check → build Models screen (S-15).

---

### F-35 — Hardware profile settings
**What:** User declares GPU VRAM and CPU core count; this drives the GPU serialization guard (F-09) and default machine assignment (F-08).
**Why:** The guard needs to know the actual constraint (4GB) rather than assuming.
**How:** Simple settings form persisted to a `settings` table, read once at executor startup (and on change via a config-reload endpoint).
**Tech stack:** FastAPI + SQLite, React form with shadcn inputs.
**Build from scratch:** Add `settings` table → settings CRUD endpoints → Settings screen section.

---

### F-39/F-40/F-41 — Project A/B/C presets
**What:** Pre-built `PipelineDefinition` configs matching the report's three modes.
**Why:** Turns the report's hard-won model/setting recommendations into one-click defaults instead of requiring the user to reconstruct them from memory each time.
**How:** Ship as seed data in the `presets` table on first run (A: `large-v3` + XTTS-v2/AI4Bharat + careful VAD; B: `large-v3-turbo` + NLLB/local LLM; C: auto-detect source + English target + subtitle-only toggle available). User can clone and modify but not overwrite the shipped defaults.
**Tech stack:** SQLite seed migration.
**Build from scratch:** Encode each preset as JSON matching the `StageConfigList` shape → seed on first launch → surface in `ModeSelectorCards` (S-04) and `PresetPicker`.

---

### F-13 — Subtitle-only fast path
**What:** A pipeline variant that skips diarization depth, TTS, remix, and remux entirely.
**Why:** Explicitly recommended in the report as "worth building first" — fastest feedback loop, usable deliverable in under an hour.
**How:** A distinct `PipelineDefinition` (Extract+Denoise → optional Demucs → Whisper w/ word timestamps → Translate w/ context window → Subtitle assembly) selected via the `SubtitleOnlyToggle` on Project C.
**Tech stack:** Same executor, shorter DAG.
**Build from scratch:** Define the shortened `PipelineDefinition` → wire toggle in New Run wizard → ensure Output tab shows SRT/VTT-only output cleanly when there's no video re-encode.

---

## Could-Have features (deferred per `03-moscow.md`, detailed here so scope is unambiguous when picked up)

### F-12 — Pipeline templates beyond A/B/C (custom saved templates)
**What:** User-defined `PipelineDefinition` templates beyond the three builtin project modes — e.g., a personal "Project A but with LuxTTS instead of XTTS-v2" template saved and reused like a preset.
**Why:** Presets (F-05) already let a user save a *run's* config; this feature is really about letting a custom template appear alongside A/B/C in `ModeSelectorCards` (S-04) as a first-class mode, not just something loaded via `PresetPicker`. Marginal value over F-05 — why it's Could, not Should.
**How:** Extends the existing `presets` table — no new schema needed. A "Pin to Mode Selector" boolean (`pinned_as_mode: bool`) added to `presets`; when true, the preset renders as an additional card in `ModeSelectorCards` alongside A/B/C instead of only being reachable via `PresetPicker`.
**Tech stack:** Same as Presets (F-05) — additive column, no new table.
**Build from scratch:** Add `pinned_as_mode` column (Alembic migration) → update `ModeSelectorCards` query to include `is_builtin=1 OR pinned_as_mode=1` presets → add a "Pin as mode" toggle in Preset Editor (S-14).
**Dependency:** Requires F-05 (Save as Preset) to already exist — build after Presets CRUD (Phase 5).

### F-20 — Desktop notifications
**What:** OS-level notification when a run needs review or completes/fails, so the user doesn't have to keep the tab open.
**Why:** Convenience for the Batcher persona's "queue overnight, check in the morning" journey — but Run History + Dashboard's Needs-Attention list already cover this without it, hence Could not Should.
**How:** Browser-native `Notification` API, requested permission on first use from Settings. Backend already emits WebSocket events (`needs_review`, stage completion) — frontend just needs a listener that fires `new Notification(...)` when the tab is backgrounded (`document.visibilityState !== 'visible'`).
**Tech stack:** Browser `Notification` API — no backend change needed at all, purely a frontend subscriber on the existing `/ws/runs/{id}` and a new lightweight `/ws/notifications` global channel (needed since per-run channels aren't subscribed to for runs not currently open).
**Build from scratch:** Add `/ws/notifications` broadcast (any run's `needs_review`/`completed`/`failed` transition) → add permission-request UI in Settings → add a global notification listener mounted once in `AppShell`.

### F-26 — Dubbed-audio segment preview before remix
**What:** Play a just-synthesized cloned-voice segment against the original line, per segment, *before* the Remix stage combines everything — catching a bad TTS take early rather than after the full video is assembled.
**Why:** Useful QA, but the review gates already in v1 (Translation Review, Speaker Review) catch most quality problems earlier and cheaper; this is a second, later checkpoint specifically for TTS output quality, which the research report's model matrix suggests is generally reliable for well-supported languages (weakest exactly where Bengali fallback engines already carry an `AlertBanner` warning).
**How:** TTS stage writes each synthesized segment as an individual artifact (`type='audio', label='segment_{n}_{lang}.wav'`) *before* remix begins, and the run pauses at a new optional review gate (`tts_review`, only inserted into the DAG if a `preview_before_remix` flag is set on the preset). `SegmentPreviewList` (already defined in `08-components.md`) plays original vs. cloned per segment; user can flag a segment for re-synthesis (reuses F-11 per-stage retry, scoped to a single segment rather than the whole TTS stage).
**Tech stack:** Same executor + artifact model; needs segment-scoped retry (a narrower variant of F-11 — retry a single `segment_id` within the `tts` stage rather than the whole stage).
**Build from scratch:** Add `preview_before_remix` flag to stage config schema → TTS stage emits per-segment artifacts + optionally halts before remix → build segment-scoped retry endpoint (`POST /runs/{id}/segments/{segment_id}/resynthesize`) → wire `SegmentPreviewList` into a new review tab.
**Note:** This is the one Could-have with real new schema/API surface (segment-scoped retry) — budget it accordingly if pulled forward.

### F-28 — A/B compare TTS engines
**What:** Generate the same line with two different TTS engines (e.g., XTTS-v2 vs. LuxTTS) side by side, for the user to pick a winner before committing to a full-run engine choice.
**Why:** A model-selection aid, not a pipeline necessity — the Model Manager (F-34) already documents each engine's tradeoffs; this feature answers "but which sounds better on *my* speaker's voice," which matters most for Project A's quality focus.
**How:** A lightweight, standalone endpoint independent of the main run DAG — takes `{reference_clip_id, text, target_language, engine_ids: [id1, id2]}`, runs both engines' `TTSEngine.synthesize()` directly (no stage_run/DB persistence needed beyond a temp artifact), returns two playable clips.
**Tech stack:** Reuses the `TTSEngine` interface from the model registry (F-14); no new schema — this is intentionally a stateless utility, not a run.
**Build from scratch:** Add `POST /tts/compare` endpoint calling two engines synchronously → build `ABComparePlayer` component (two `PlayButton`s + "Use this engine" action that pre-fills the New Run wizard's TTS model choice) → surface as an action from the Speaker Review screen (S-10), next to `ReferenceClipAuditioner`.

### F-32 — Re-export with burn-in vs. soft-sub options
**What:** Re-export a completed run's output with subtitles either burned into the video (hardsub) or as a separate soft-sub track/file, without re-running the pipeline.
**Why:** Output flexibility, not core pipeline function — the default (soft-sub `.srt` alongside `.mp4`, per F-29) already satisfies the primary deliverable; burn-in is a convenience for sharing to platforms that don't support external subtitle files.
**How:** A standalone post-processing action on an already-`completed` run: reads the existing final `.mp4` + `.srt` artifacts, runs `ffmpeg -vf subtitles=... ` (burn-in) or `-c:s mov_text` (soft mux into MP4 container) as a lightweight one-off job — not a pipeline stage, doesn't touch `stage_runs`.
**Tech stack:** ffmpeg subprocess call, same pattern as Remux.
**Build from scratch:** Add `POST /runs/{id}/output/re-export` with `{target_language, mode: 'burn_in' | 'soft_mux'}` → registers the new file as an additional `Artifact` (doesn't replace the original) → add `re-export` action button in Output tab (S-12) with a mode selector.

### F-37 — Per-language-pair default engine settings
**What:** Instead of one global default MT/TTS engine, let the user set defaults per language pair (e.g., always use NLLB for →Bengali, always use a local LLM for →French) that pre-fill new runs.
**Why:** A convenience layer over F-14 (pluggable per-run model choice) — v1 already lets you pick per run; this just saves re-picking every time for the same language pair. Nice, not blocking.
**How:** New `language_defaults` table (`source_lang, target_lang, stage_type, model_id`). When a New Run wizard's Step 3 (Stage Config) initializes, it checks this table before falling back to the preset's default model for any per-language stage (translation, TTS).
**Tech stack:** New small table, no new services.
**Build from scratch:** Add `language_defaults` table (Alembic migration) → `GET/PATCH /settings/language-defaults` endpoints → Settings screen section (extends S-17's existing "Language Defaults" `SettingsSection`, which in v1 ships as a stub with no backing table) → Stage Config prefill logic reads this table first.
**Note:** `06-information-architecture.md` already reserves a "Language defaults" section on Settings (S-17) for this — v1 ships that section as a static placeholder; this feature is what makes it functional.

### F-38 — Editable global QA thresholds
**What:** Let the user change the hardcoded subtitle QA defaults (min gap, max CPS, min/max duration, max line chars) from Settings instead of code.
**Why:** v1 ships with the research report's recommended defaults hardcoded (100ms gap, 17 CPS, 1s min duration, 42 chars/line) — these are well-researched industry conventions, unlikely to need frequent tuning, so exposing them as editable is polish, not a blocker.
**How:** The `settings` table already has these columns (`qa_min_gap_ms`, `qa_max_cps`, etc. — see `15-schema.md`), and `subtitle_formatter.py` already reads thresholds as parameters rather than constants (per the F-27 implementation note that frontend and backend "share one source of truth" via `/runs/{id}/subtitles/validate`). This feature is purely: expose the existing columns in a Settings form.
**Tech stack:** No backend change beyond the `PATCH /settings` endpoint already specified in `11-api-design.md` — this is a frontend-only feature once Phase 1's formatter correctly parameterizes thresholds.
**Build from scratch:** Add `QAThresholdsForm` to the Settings screen (S-17) bound to existing `PATCH /settings` → confirm `subtitle_formatter.py` never hardcodes a threshold inline (audit during Phase 1, not deferred to this feature, since retrofitting parameterization later is riskier than doing it right the first time).
**Note:** Unlike the other Could-haves, this one has almost no new engineering — it's gated by *discipline during Phase 1* (parameterize, don't hardcode) more than by deferred work. Worth keeping that Phase 1 note in mind even though the feature itself ships later.
