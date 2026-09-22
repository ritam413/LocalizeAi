import pytest
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from fastapi import BackgroundTasks

from app.db.database import Base
from app.db.models import Clip, Run
from app.api.runs import create_run


@pytest.mark.asyncio
async def test_mode_c_same_language_skips_translation_and_remux(tmp_path, monkeypatch):
    """
    Asserts that for Mode C (Festival Subtitle Master) when source_language == target_language (e.g., en -> en),
    create_run configures only ['extraction', 'denoise', 'transcription'], skipping translation and all subsequent dubbing/remux stages.
    """
    db_path = tmp_path / "test_mode_c_same_lang.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        clip = Clip(
            id="clip_mode_c_en",
            source_path="/storage/uploads/cinema_en.mp4",
            filename="cinema_en.mp4",
            duration_s=30.0
        )
        session.add(clip)
        await session.commit()

        bg_tasks = BackgroundTasks()
        payload = {
            "clip_id": "clip_mode_c_en",
            "source_language": "en",
            "target_languages": ["en"],
            "project_mode": "C"
        }
        
        monkeypatch.setattr("app.api.runs.RunExecutor.execute_run", lambda *args, **kwargs: None)

        run = await create_run(payload=payload, background_tasks=bg_tasks, db=session)
        assert run.project_mode == "C"
        assert run.subtitle_only is True

        cfg = json.loads(run.frozen_stage_config_json)
        assert cfg["stages"] == ["extraction", "denoise", "transcription"]
        assert cfg["subtitle_only"] is True
        assert cfg["use_demucs"] is False
        assert cfg["whisper_model"] == "large-v3-turbo"


@pytest.mark.asyncio
async def test_mode_c_cross_language_completes_after_translation(tmp_path, monkeypatch):
    """
    Asserts that for Mode C (Festival Subtitle Master) when source_language != target_language (e.g., es -> en or hi -> en),
    create_run configures ['extraction', 'denoise', 'transcription', 'translation'], skipping tts, duration_align, remix, remux.
    """
    db_path = tmp_path / "test_mode_c_cross_lang.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        clip = Clip(
            id="clip_mode_c_es",
            source_path="/storage/uploads/cinema_es.mp4",
            filename="cinema_es.mp4",
            duration_s=30.0
        )
        session.add(clip)
        await session.commit()

        bg_tasks = BackgroundTasks()
        payload = {
            "clip_id": "clip_mode_c_es",
            "source_language": "es",
            "target_languages": ["en"],
            "project_mode": "C"
        }
        
        monkeypatch.setattr("app.api.runs.RunExecutor.execute_run", lambda *args, **kwargs: None)

        run = await create_run(payload=payload, background_tasks=bg_tasks, db=session)
        assert run.project_mode == "C"
        assert run.subtitle_only is True

        cfg = json.loads(run.frozen_stage_config_json)
        assert cfg["stages"] == ["extraction", "denoise", "transcription", "translation"]
        assert cfg["subtitle_only"] is True
        assert cfg["use_demucs"] is False
        assert "tts" not in cfg["stages"]
        assert "remix" not in cfg["stages"]
        assert "remux" not in cfg["stages"]


@pytest.mark.asyncio
async def test_mode_a_b_full_dubbing_stages(tmp_path, monkeypatch):
    """
    Asserts that for Mode A / Mode B dubbing, create_run configures all 8 pipeline stages.
    """
    db_path = tmp_path / "test_mode_a_full.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        clip = Clip(
            id="clip_mode_a",
            source_path="/storage/uploads/theatrical.mp4",
            filename="theatrical.mp4",
            duration_s=45.0
        )
        session.add(clip)
        await session.commit()

        bg_tasks = BackgroundTasks()
        payload = {
            "clip_id": "clip_mode_a",
            "source_language": "en",
            "target_languages": ["hi"],
            "project_mode": "A"
        }
        
        monkeypatch.setattr("app.api.runs.RunExecutor.execute_run", lambda *args, **kwargs: None)

        run = await create_run(payload=payload, background_tasks=bg_tasks, db=session)
        assert run.project_mode == "A"
        assert run.subtitle_only is False

        cfg = json.loads(run.frozen_stage_config_json)
        assert cfg["stages"] == ["extraction", "denoise", "transcription", "translation", "tts", "duration_align", "remix", "remux"]
        assert cfg["subtitle_only"] is False
        assert cfg["use_demucs"] is True
