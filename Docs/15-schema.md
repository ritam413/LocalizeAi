# Schema — DubForge Studio
*Formal SQL DDL companion to `10-database-schema.md` (which explains the design rationale). This is the literal schema to hand to Alembic as the initial migration.*

```sql
CREATE TABLE clips (
    id TEXT PRIMARY KEY,
    source_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    duration_s REAL,
    codec TEXT,
    resolution TEXT,
    audio_channels INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE presets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_mode TEXT NOT NULL CHECK (project_mode IN ('A','B','C')),
    is_builtin BOOLEAN NOT NULL DEFAULT 0,
    stage_config_json TEXT NOT NULL,
    qa_thresholds_json TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE runs (
    id TEXT PRIMARY KEY,
    clip_id TEXT NOT NULL REFERENCES clips(id),
    preset_id TEXT REFERENCES presets(id),
    project_mode TEXT NOT NULL CHECK (project_mode IN ('A','B','C')),
    source_language TEXT,
    target_languages_json TEXT NOT NULL,
    subtitle_only BOOLEAN NOT NULL DEFAULT 0,
    frozen_stage_config_json TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN
        ('queued','running','needs_review','completed','failed','interrupted','cancelled')),
    current_stage TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_created_at ON runs(created_at);

CREATE TABLE stage_runs (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    target_language TEXT,
    model_id TEXT REFERENCES model_registry(id),
    machine TEXT CHECK (machine IN ('gpu_box','laptop') OR machine IS NULL),
    status TEXT NOT NULL CHECK (status IN
        ('pending','queued','running','needs_review','completed','failed','stale')),
    progress_pct REAL NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at DATETIME,
    completed_at DATETIME
);
CREATE INDEX idx_stage_runs_run_stage_lang ON stage_runs(run_id, stage_name, target_language);
CREATE INDEX idx_stage_runs_status ON stage_runs(status);

CREATE TABLE artifacts (
    id TEXT PRIMARY KEY,
    stage_run_id TEXT NOT NULL REFERENCES stage_runs(id) ON DELETE CASCADE,
    run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('audio','video','subtitle','json','log','image')),
    label TEXT NOT NULL,
    path TEXT NOT NULL,
    size_bytes INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_artifacts_run_id ON artifacts(run_id);

CREATE TABLE speakers (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    color_tag TEXT
);

CREATE TABLE reference_clips (
    id TEXT PRIMARY KEY,
    speaker_id TEXT NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    duration_s REAL,
    is_selected BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE segments (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    speaker_id TEXT REFERENCES speakers(id),
    target_language TEXT,
    start_s REAL NOT NULL,
    end_s REAL NOT NULL,
    source_text TEXT,
    translated_text TEXT,
    target_duration_s REAL,
    estimated_speech_duration_s REAL,
    cps REAL,
    gap_before_s REAL,
    edited BOOLEAN NOT NULL DEFAULT 0,
    approved BOOLEAN NOT NULL DEFAULT 0
);
CREATE INDEX idx_segments_run_lang_start ON segments(run_id, target_language, start_s);

CREATE TABLE model_registry (
    id TEXT PRIMARY KEY,
    stage_type TEXT NOT NULL CHECK (stage_type IN
        ('separation','vad','diarization','asr','mt','tts','lip_sync')),
    display_name TEXT NOT NULL,
    license TEXT,
    vram_footprint_mb INTEGER,
    language_coverage_json TEXT,
    entrypoint TEXT NOT NULL,
    weights_path TEXT,
    installed BOOLEAN NOT NULL DEFAULT 0
);

CREATE TABLE workers (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('gpu_worker','preprocessing_worker','either')),
    last_seen_at DATETIME,
    status TEXT NOT NULL CHECK (status IN ('online','offline','busy')) DEFAULT 'offline',
    current_stage_run_id TEXT REFERENCES stage_runs(id)
);

CREATE TABLE settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    working_dir TEXT NOT NULL,
    shared_folder_path TEXT,
    retention_days INTEGER,
    gpu_vram_mb INTEGER NOT NULL DEFAULT 4096,
    cpu_cores INTEGER,
    qa_min_gap_ms INTEGER NOT NULL DEFAULT 100,
    qa_max_cps REAL NOT NULL DEFAULT 17.0,
    qa_min_duration_s REAL NOT NULL DEFAULT 1.0,
    qa_max_line_chars INTEGER NOT NULL DEFAULT 42
);
```

## Seed data (applied on first launch, in the same migration set)
- `settings` — one row, defaults matching the report's hardware (`gpu_vram_mb=4096`)
- `presets` — three `is_builtin=1` rows for Project A / B / C, per `09-feature-implementation-plan.md` (F-39/40/41)
- `model_registry` — one row per model named in the research report (Demucs, UVR5, Silero VAD, pyannote, faster-whisper variants, NLLB-200, XTTS-v2, LuxTTS, CosyVoice2/3, AI4Bharat Indic-TTS, MMS-TTS, Wav2Lip, MuseTalk), `installed=0` until the user installs
- `workers` — two rows, `gpu_box` and `laptop`, `status='offline'` until first heartbeat
