from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import StageRun, Run
from app.engine.executor import RunExecutor
from app.api.websocket import manager

stages_router = APIRouter(prefix="/runs/{run_id}/stages", tags=["Stages"])

@stages_router.get("")
async def list_stage_runs(run_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(StageRun).where(StageRun.run_id == run_id))
    return res.scalars().all()

@stages_router.post("/{stage_name}/run")
async def run_single_stage(
    run_id: str,
    stage_name: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Execute ONLY the specified stage_name for run_id.
    Prevents re-running prior completed stages (like denoise).
    """
    run = await db.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    res = await db.execute(
        select(StageRun).where(StageRun.run_id == run_id, StageRun.stage_name == stage_name)
    )
    stage_run = res.scalar_one_or_none()
    if not stage_run:
        stage_run = StageRun(run_id=run_id, stage_name=stage_name, status="pending", progress_pct=0.0)
        db.add(stage_run)
    else:
        stage_run.status = "pending"
        stage_run.progress_pct = 0.0

    run.status = "running"
    await db.commit()

    executor = RunExecutor(websocket_broadcast=manager.broadcast)
    background_tasks.add_task(executor.execute_run, run_id=run_id, force_resume=False, single_stage=stage_name)

    return {"message": f"Single stage '{stage_name}' execution queued", "run_id": run_id, "stage": stage_name}

@stages_router.post("/{stage_name}/retry")
async def retry_stage(
    run_id: str,
    stage_name: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Re-run ONLY stage_name without re-running earlier completed stages.
    """
    res = await db.execute(
        select(StageRun).where(StageRun.run_id == run_id, StageRun.stage_name == stage_name)
    )
    stage_run = res.scalar_one_or_none()
    if not stage_run:
        raise HTTPException(status_code=404, detail="Stage run not found")

    stage_run.status = "pending"
    stage_run.progress_pct = 0.0
    
    run = await db.get(Run, run_id)
    if run:
        run.status = "running"
    await db.commit()

    executor = RunExecutor(websocket_broadcast=manager.broadcast)
    background_tasks.add_task(executor.execute_run, run_id=run_id, force_resume=False, single_stage=stage_name)

    return {"message": f"Stage {stage_name} set to retry", "run_id": run_id}
