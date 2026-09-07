import pytest
import asyncio
from app.engine.gpu_lock import gpu_lock
from app.db.database import Base, engine, AsyncSessionLocal
from app.db.models import Clip, Run, StageRun, Preset
from app.engine.executor import RunExecutor

@pytest.mark.asyncio
async def test_gpu_lock_concurrency():
    execution_order = []

    async def worker(worker_id: str, duration: float):
        async with gpu_lock.acquire(worker_id):
            execution_order.append(f"{worker_id}_start")
            await asyncio.sleep(duration)
            execution_order.append(f"{worker_id}_end")

    # Launch two GPU workers concurrently
    await asyncio.gather(
        worker("w1", 0.1),
        worker("w2", 0.1)
    )

    # Assert lock enforced strict serialization
    assert len(execution_order) == 4
    # w1 must complete before w2 starts OR w2 must complete before w1 starts
    if execution_order[0] == "w1_start":
        assert execution_order == ["w1_start", "w1_end", "w2_start", "w2_end"]
    else:
        assert execution_order == ["w2_start", "w2_end", "w1_start", "w1_end"]

@pytest.mark.asyncio
async def test_run_executor_resumption():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        clip = Clip(source_path="/fake/movie.mp4", filename="movie.mp4", duration_s=120.0)
        preset = Preset(
            name="Test Preset",
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
            status="queued"
        )
        session.add(run)
        await session.commit()
        run_id = run.id

    executor = RunExecutor()
    await executor.execute_run(run_id)

    async with AsyncSessionLocal() as session:
        completed_run = await session.get(Run, run_id)
        assert completed_run.status == "completed"

        stages = (await session.execute(
            StageRun.__table__.select().where(StageRun.run_id == run_id)
        )).fetchall()
        assert len(stages) == 2
        for s in stages:
            assert s.status == "completed"

@pytest.mark.asyncio
async def test_resume_skips_completed_stages():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        clip = Clip(source_path="/fake/movie.mp4", filename="movie.mp4", duration_s=120.0)
        preset = Preset(
            name="Test Preset Resume",
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
            status="running"
        )
        session.add(run)
        await session.commit()
        run_id = run.id

        # Mark extraction stage as completed, denoise as pending
        s1 = StageRun(run_id=run_id, stage_name="extraction", status="completed", progress_pct=100.0)
        s2 = StageRun(run_id=run_id, stage_name="denoise", status="pending", progress_pct=0.0)
        session.add(s1)
        session.add(s2)
        await session.commit()

    executor = RunExecutor()
    # Execute with force_resume=False (what POST /runs/{id}/resume now uses)
    await executor.execute_run(run_id, force_resume=False)

    async with AsyncSessionLocal() as session:
        completed_run = await session.get(Run, run_id)
        assert completed_run.status == "completed"

        s1_db = (await session.execute(
            StageRun.__table__.select().where(StageRun.run_id == run_id, StageRun.stage_name == "extraction")
        )).fetchone()
        s2_db = (await session.execute(
            StageRun.__table__.select().where(StageRun.run_id == run_id, StageRun.stage_name == "denoise")
        )).fetchone()
        
        assert s1_db.status == "completed"
        assert s2_db.status == "completed"

