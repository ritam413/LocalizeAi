# Custom Run Slug Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate human-readable run slugs and storage directory names based on the uploaded file's stem plus a 6-character unique identifier (e.g., `trial1.mp4` -> `trial1_u4522k` -> `/runs/trial1_u4522k`) instead of raw generic UUIDs.

**Architecture:** Refactor run ID generation in `backend/app/api/runs.py` to inspect the associated `Clip.filename`, sanitize its stem to safe filesystem/URL characters, append a 6-character hex suffix from `uuid4().hex[:6]`, and guarantee uniqueness with a DB check. Downstream execution, database persistence, and frontend navigation naturally adopt this identifier with zero breaking changes.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy (AsyncSession), Pytest, TypeScript / Next.js.

## Global Constraints
- Target format: `{clean_filename_stem}_{6char_uuid}` (e.g., `trial1_u4522k`).
- Slug character whitelist: alphanumeric, underscores, hyphens (`[a-zA-Z0-9_-]`).
- Fallback behavior: if `Clip` has no filename or `clip_id` is raw UUID, use sanitized `clip_id` or `"run"` fallback prefix.
- Idempotency & safety: collision resolution via DB existence check loop.
- No changes required to storage directory layout contracts (`storage/runs/{run_id}`).

---

### Task 1: Slug Generation Helper & Unit Test Suite

**Files:**
- Create: `backend/tests/test_run_slug.py`
- Modify: `backend/app/api/runs.py:50-80`

**Interfaces:**
- Consumes: `Clip.filename: Optional[str]`, `Clip.id: str`
- Produces: `generate_run_slug(filename: Optional[str], fallback_id: Optional[str] = None) -> str`

- [ ] **Step 1: Write the failing unit test**

Create `backend/tests/test_run_slug.py`:
```python
import pytest
import re
from app.api.runs import generate_run_slug

def test_generate_run_slug_standard_filename():
    slug = generate_run_slug("trial1.mp4")
    assert slug.startswith("trial1_")
    parts = slug.split("_")
    assert len(parts[-1]) == 6
    assert re.match(r"^[a-zA-Z0-9]+$", parts[-1])

def test_generate_run_slug_with_special_characters_and_spaces():
    slug = generate_run_slug("My Video (Final Cut) #1.mov")
    assert slug.startswith("My_Video__Final_Cut___1_")
    suffix = slug.split("_")[-1]
    assert len(suffix) == 6

def test_generate_run_slug_fallback_when_no_filename():
    slug = generate_run_slug(None, fallback_id="clip_abc123")
    assert slug.startswith("clip_abc123_")
    suffix = slug.split("_")[-1]
    assert len(suffix) == 6

def test_generate_run_slug_empty_fallback():
    slug = generate_run_slug("", fallback_id="")
    assert slug.startswith("run_")
    suffix = slug.split("_")[-1]
    assert len(suffix) == 6
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_run_slug.py -v`
Expected: FAIL with `ImportError: cannot import name 'generate_run_slug'`

- [ ] **Step 3: Implement `generate_run_slug` in `backend/app/api/runs.py`**

In `backend/app/api/runs.py`:
```python
import uuid
import re
from pathlib import Path
from typing import Optional

def generate_run_slug(filename: Optional[str], fallback_id: Optional[str] = None) -> str:
    """
    Generates a deterministic, human-readable run slug: {clean_stem}_{6char_uuid}
    Example: 'trial1.mp4' -> 'trial1_a1b2c3'
    """
    stem = ""
    if filename:
        raw_stem = Path(filename).stem.strip()
        stem = re.sub(r'[^a-zA-Z0-9_-]', '_', raw_stem)
    
    if not stem:
        if fallback_id:
            clean_fallback = re.sub(r'[^a-zA-Z0-9_-]', '_', str(fallback_id).strip())
            stem = clean_fallback or "run"
        else:
            stem = "run"
            
    short_uid = uuid.uuid4().hex[:6]
    return f"{stem}_{short_uid}"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_run_slug.py -v`
Expected: PASS (4/4 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/runs.py backend/tests/test_run_slug.py
git commit -m "feat(runs): add generate_run_slug helper and unit test suite"
```

---

### Task 2: Integrate Slug Generation into `POST /runs` Endpoint

**Files:**
- Modify: `backend/app/api/runs.py:56-75`
- Test: `backend/tests/test_run_slug.py`

**Interfaces:**
- Consumes: `POST /runs` payload `{clip_id, project_mode, target_languages, ...}`
- Produces: `Run(id="{filename_stem}_{6char_uuid}")` persisted to SQLite database and queued to `RunExecutor`

- [ ] **Step 1: Write integration test for `create_run` endpoint ID format**

Add to `backend/tests/test_run_slug.py`:
```python
@pytest.mark.asyncio
async def test_create_run_uses_custom_slug(tmp_path, monkeypatch):
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from app.db.database import Base
    from app.db.models import Clip, Run
    from app.api.runs import create_run
    from fastapi import BackgroundTasks

    db_path = tmp_path / "test_slug.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        clip = Clip(
            id="clip_123",
            source_path="/storage/uploads/trial1.mp4",
            filename="trial1.mp4",
            duration_s=10.0
        )
        session.add(clip)
        await session.commit()

        bg_tasks = BackgroundTasks()
        payload = {
            "clip_id": "clip_123",
            "target_languages": ["hi"],
            "project_mode": "C"
        }
        
        # Monkeypatch executor so background task doesn't execute full pipeline
        monkeypatch.setattr("app.api.runs.RunExecutor.execute_run", lambda *args, **kwargs: None)

        run = await create_run(payload=payload, background_tasks=bg_tasks, db=session)
        assert run.id.startswith("trial1_")
        assert len(run.id.split("_")[-1]) == 6
```

- [ ] **Step 2: Run test to verify it fails with old `_dub_hi_01` format**

Run: `pytest backend/tests/test_run_slug.py::test_create_run_uses_custom_slug -v`
Expected: FAIL (run.id is `clip_123_dub_hi_01` instead of `trial1_<6chars>`)

- [ ] **Step 3: Update `create_run` in `backend/app/api/runs.py`**

In `backend/app/api/runs.py` (lines 56-70):
```python
    # Fetch clip to obtain original uploaded filename
    clip_res = await db.get(Clip, clip_id) if clip_id else None
    clip_filename = clip_res.filename if clip_res else None

    # Generate unique slug: {filename_stem}_{6char_uuid}
    while True:
        candidate_id = generate_run_slug(clip_filename, fallback_id=clip_id)
        existing = await db.execute(select(Run).where(Run.id == candidate_id))
        if not existing.scalar_one_or_none():
            break

    run_id = candidate_id
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_run_slug.py -v`
Expected: PASS (5/5 passed)

- [ ] **Step 5: Run full backend test suite to verify zero regressions**

Run: `pytest backend/tests/ -v`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/runs.py backend/tests/test_run_slug.py
git commit -m "feat(runs): wire filename-based short slug generation into create_run endpoint"
```

---

### Task 3: Update Tracking & Handoff Documentation

**Files:**
- Modify: `context.md`
- Modify: `features_implemented.md`
- Modify: `TRACKER.md`

- [ ] **Step 1: Update persistent memory files**
Record the new slug structure `{clean_stem}_{6char_uuid}` in `context.md`, `features_implemented.md`, and add an agent handoff log entry in `TRACKER.md`.

- [ ] **Step 2: Commit documentation changes**
```bash
git add context.md features_implemented.md TRACKER.md
git commit -m "docs: update context, features, and tracker for custom run slug format"
```
