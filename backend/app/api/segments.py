from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import Segment, Setting
from app.engine.subtitle_formatter import validate_subtitles, apply_qa_adjustments

segments_router = APIRouter(prefix="/runs/{run_id}", tags=["Segments"])

@segments_router.get("/segments")
async def list_segments(
    run_id: str,
    target_language: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Segment).where(Segment.run_id == run_id)
    if target_language:
        query = query.where(Segment.target_language == target_language)
    query = query.order_by(Segment.start_s.asc())
    res = await db.execute(query)
    return res.scalars().all()

@segments_router.patch("/segments/{segment_id}")
async def update_segment(
    run_id: str,
    segment_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db)
):
    segment = await db.get(Segment, segment_id)
    if not segment or segment.run_id != run_id:
        raise HTTPException(status_code=404, detail="Segment not found")

    if "source_text" in payload:
        segment.source_text = payload["source_text"]
    if "translated_text" in payload:
        segment.translated_text = payload["translated_text"]
    if "start_s" in payload:
        segment.start_s = payload["start_s"]
    if "end_s" in payload:
        segment.end_s = payload["end_s"]

    duration = max(0.1, segment.end_s - segment.start_s)
    text = segment.translated_text or segment.source_text or ""
    segment.cps = round(len(text) / duration, 2)
    segment.edited = True

    await db.commit()
    await db.refresh(segment)
    return segment

@segments_router.post("/subtitles/validate")
async def validate_run_subtitles(
    run_id: str,
    payload: Optional[dict] = None,
    db: AsyncSession = Depends(get_db)
):
    # Fetch settings for QA thresholds
    res_set = await db.execute(select(Setting).where(Setting.id == 1))
    setting = res_set.scalar_one_or_none()

    min_gap_ms = setting.qa_min_gap_ms if setting else 100
    max_cps = setting.qa_max_cps if setting else 17.0
    min_duration_s = setting.qa_min_duration_s if setting else 1.0
    max_line_chars = setting.qa_max_line_chars if setting else 42

    res_seg = await db.execute(
        select(Segment).where(Segment.run_id == run_id).order_by(Segment.start_s.asc())
    )
    segments = res_seg.scalars().all()

    segment_dicts = [
        {
            "id": s.id,
            "start_s": s.start_s,
            "end_s": s.end_s,
            "source_text": s.source_text,
            "translated_text": s.translated_text
        }
        for s in segments
    ]

    violations = validate_subtitles(
        segment_dicts,
        min_gap_ms=min_gap_ms,
        max_cps=max_cps,
        min_duration_s=min_duration_s,
        max_line_chars=max_line_chars
    )

    return {
        "run_id": run_id,
        "valid": len(violations) == 0,
        "violations": violations
    }
