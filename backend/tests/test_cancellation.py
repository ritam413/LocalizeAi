import pytest
import asyncio
from app.db.database import Base, engine, AsyncSessionLocal
from app.db.models import Clip, Run, StageRun, Preset
from app.engine.executor import RunExecutor
from app.engine.cancel_registry import signal_cancel, is_cancelled, unregister

@pytest.mark.asyncio
async def test_signal_cancel_and_is_cancelled():
    run_id = "test_cancel_run_1"
    assert not is_cancelled(run_id)

    signal_cancel(run_id)
    assert is_cancelled(run_id)

    unregister(run_id)
    assert not is_cancelled(run_id)

@pytest.mark.asyncio
async def test_run_executor_early_cancellation():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        clip = Clip(source_path="/fake/movie.mp4", filename="movie.mp4", duration_s=120.0)
        preset = Preset(
            name="Cancel Test Preset",
            project_mode="C",
            stage_config_json='{"stages": ["extraction", "denoise"]}'
        )
        session.add(clip)
        session.add(preset)
        await session.commit()

        run = Run(
            clip_id=clip.id,
            preset_id=preset.id,
            project_mode="C",
            target_languages_json='["en"]',
            subtitle_only=True,
            frozen_stage_config_json='{"stages": ["extraction", "denoise"]}',
            status="cancelling"
        )
        session.add(run)
        await session.commit()
        run_id = run.id

    executor = RunExecutor()
    await executor.execute_run(run_id)

    async with AsyncSessionLocal() as session:
        cancelled_run = await session.get(Run, run_id)
        assert cancelled_run.status == "cancelled"
