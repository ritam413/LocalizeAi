import json
from datetime import datetime
from sqlalchemy.future import select
from app.db.database import AsyncSessionLocal, Base, engine
from app.db.models import Setting, Preset, ModelRegistry, Worker, Run
from app.config import settings

INITIAL_PRESETS = [
    {
        "id": "preset_project_a",
        "name": "Project A — Max-Quality Dubbing (Hindi/Bengali)",
        "project_mode": "A",
        "is_builtin": True,
        "stage_config_json": json.dumps({
            "stages": ["extraction", "denoise", "separation", "vad", "diarization", "transcription", "translation", "tts", "duration_align", "remix", "remux"],
            "asr_model": "whisper-large-v3",
            "mt_model": "nllb-200-3.3b",
            "tts_model": "xtts-v2",
            "bengali_fallback_tts": "ai4bharat-indic-tts"
        })
    },
    {
        "id": "preset_project_b",
        "name": "Project B — Bulk High-Throughput Dubbing",
        "project_mode": "B",
        "is_builtin": True,
        "stage_config_json": json.dumps({
            "stages": ["extraction", "denoise", "separation", "vad", "diarization", "transcription", "translation", "tts", "duration_align", "remix", "remux"],
            "asr_model": "whisper-large-v3-turbo",
            "mt_model": "nllb-200-1.3b",
            "tts_model": "xtts-v2"
        })
    },
    {
        "id": "preset_project_c",
        "name": "Project C — Universal Subtitle & Fast Dub",
        "project_mode": "C",
        "is_builtin": True,
        "stage_config_json": json.dumps({
            "stages": ["extraction", "denoise", "transcription", "translation"],
            "asr_model": "whisper-large-v3-turbo",
            "mt_model": "nllb-200-1.3b",
            "subtitle_only": True
        })
    }
]

INITIAL_MODELS = [
    {
        "id": "demucs-v4",
        "stage_type": "separation",
        "display_name": "Demucs v4 (Hybrid Spectrogram)",
        "license": "MIT",
        "vram_footprint_mb": 2048,
        "entrypoint": "app.engine.stages.separation.DemucsAdapter",
        "installed": True
    },
    {
        "id": "deepfilternet3",
        "stage_type": "denoise",
        "display_name": "DeepFilterNet3",
        "license": "MIT",
        "vram_footprint_mb": 512,
        "entrypoint": "app.engine.stages.denoise.DeepFilterNetAdapter",
        "installed": True
    },
    {
        "id": "silero-vad",
        "stage_type": "vad",
        "display_name": "Silero VAD v4",
        "license": "MIT",
        "vram_footprint_mb": 256,
        "entrypoint": "app.engine.stages.vad.SileroVadAdapter",
        "installed": True
    },
    {
        "id": "whisper-large-v3-turbo",
        "stage_type": "asr",
        "display_name": "Faster-Whisper Large v3 Turbo",
        "license": "MIT",
        "vram_footprint_mb": 3072,
        "entrypoint": "app.engine.stages.transcription.FasterWhisperAdapter",
        "installed": True
    },
    {
        "id": "nllb-200-1.3b",
        "stage_type": "mt",
        "display_name": "NLLB-200 (1.3B)",
        "license": "CC-BY-NC-4.0",
        "vram_footprint_mb": 2560,
        "entrypoint": "app.engine.stages.translation.NLLBAdapter",
        "installed": True
    },
    {
        "id": "xtts-v2",
        "stage_type": "tts",
        "display_name": "Coqui XTTS-v2",
        "license": "CPML (Non-Commercial)",
        "vram_footprint_mb": 3800,
        "entrypoint": "app.engine.stages.tts.XTTSAdapter",
        "installed": True
    }
]

INITIAL_WORKERS = [
    {
        "id": "gpu_box",
        "display_name": "GTX 1050 Ti GPU Box",
        "role": "gpu_worker",
        "status": "online"
    },
    {
        "id": "laptop",
        "display_name": "i5 CPU Laptop",
        "role": "preprocessing_worker",
        "status": "online"
    }
]

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check settings
        res = await session.execute(select(Setting).where(Setting.id == 1))
        if not res.scalar_one_or_none():
            setting_row = Setting(
                id=1,
                working_dir=settings.STORAGE_DIR.as_posix(),
                shared_folder_path=settings.SHARED_FOLDER_PATH.as_posix(),
                gpu_vram_mb=settings.GPU_VRAM_MB,
                qa_min_gap_ms=settings.QA_MIN_GAP_MS,
                qa_max_cps=settings.QA_MAX_CPS,
                qa_min_duration_s=settings.QA_MIN_DURATION_S,
                qa_max_line_chars=settings.QA_MAX_LINE_CHARS
            )
            session.add(setting_row)

        # Check presets
        for pdata in INITIAL_PRESETS:
            res = await session.execute(select(Preset).where(Preset.id == pdata["id"]))
            if not res.scalar_one_or_none():
                session.add(Preset(**pdata))

        # Check models
        for mdata in INITIAL_MODELS:
            res = await session.execute(select(ModelRegistry).where(ModelRegistry.id == mdata["id"]))
            if not res.scalar_one_or_none():
                session.add(ModelRegistry(**mdata))

        # Check workers
        for wdata in INITIAL_WORKERS:
            res = await session.execute(select(Worker).where(Worker.id == wdata["id"]))
            if not res.scalar_one_or_none():
                session.add(Worker(**wdata))

        # Clean up any orphaned cancelling runs on startup
        res = await session.execute(select(Run).where(Run.status == "cancelling"))
        cancelling_runs = res.scalars().all()
        for r in cancelling_runs:
            r.status = "cancelled"
            r.completed_at = r.completed_at or datetime.utcnow()

        await session.commit()

