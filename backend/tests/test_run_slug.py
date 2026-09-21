import pytest
import re
from datetime import datetime
from app.api.runs import generate_run_slug

def test_generate_run_slug_standard_filename():
    slug = generate_run_slug("trial1.mp4")
    assert slug.startswith("trial1_")
    suffix = slug.split("_")[-1]
    assert len(suffix) == 6
    assert re.match(r"^[a-zA-Z0-9]+$", suffix)

def test_generate_run_slug_with_special_characters_and_spaces():
    slug = generate_run_slug("My Video (Final Cut) #1 [1080p].mov")
    assert slug.startswith("My_Video_Final_Cut_1_1080p_")
    assert "__" not in slug
    suffix = slug.split("_")[-1]
    assert len(suffix) == 6

def test_generate_run_slug_truncates_long_filenames():
    long_name = "A" * 100 + ".mp4"
    slug = generate_run_slug(long_name)
    parts = slug.rsplit("_", 1)
    stem_part = parts[0]
    assert len(stem_part) <= 32
    assert len(parts[1]) == 6

def test_generate_run_slug_fallback_when_non_ascii_or_empty():
    # Non-Latin / emoji filename collapses to timestamp fallback
    slug = generate_run_slug("हिंदी_संवाद.mp4")
    suffix = slug.split("_")[-1]
    assert len(suffix) == 6
    assert ":" not in slug  # Windows NTFS safety: zero colons

def test_generate_run_slug_fallback_when_none():
    slug = generate_run_slug(None)
    suffix = slug.split("_")[-1]
    assert len(suffix) == 6
    assert ":" not in slug


@pytest.mark.asyncio
async def test_create_run_uses_custom_slug(tmp_path, monkeypatch):
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from app.db.database import Base
    from app.db.models import Clip, Run
    from app.api.runs import create_run
    from fastapi import BackgroundTasks

    db_path = tmp_path / "test_slug_api.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        clip = Clip(
            id="clip_test_123",
            source_path="/storage/uploads/trial1.mp4",
            filename="trial1.mp4",
            duration_s=10.0
        )
        session.add(clip)
        await session.commit()

        bg_tasks = BackgroundTasks()
        payload = {
            "clip_id": "clip_test_123",
            "target_languages": ["hi"],
            "project_mode": "C"
        }
        
        # Monkeypatch executor so background task doesn't execute full pipeline in unit test
        monkeypatch.setattr("app.api.runs.RunExecutor.execute_run", lambda *args, **kwargs: None)

        run = await create_run(payload=payload, background_tasks=bg_tasks, db=session)
        assert run.id.startswith("trial1_")
        suffix = run.id.split("_")[-1]
        assert len(suffix) == 6
