# TICKET-34: Executor State Rehydration & Single-Flight Stage Mutex

## Status
- **State**: Completed
- **Primary Seams**: `backend/app/engine/executor.py` (`RunExecutor`)
- **Verification**: Pytest (`backend/tests/test_executor_rehydration.py` - 5/5 passed)
- **Blocking Dependencies**: TICKET-32, TICKET-33
- **Downstream Blocked**: TICKET-35 (Now Unblocked)

## Objective
Implement resilient artifact rehydration in `RunExecutor` so that single-stage retries and resumed pipelines (`duration_align`, `remix`, `remux`) automatically load `synthesized_stems` and `aligned_stems` from disk manifests or reconstruct them via `segment_id` map lookup. Add single-flight stage mutex locking to eliminate concurrent retry collisions (`[WinError 32]`).

## Seams & Interfaces
- Python: `backend/app/engine/executor.py`:
  - Add `_rehydrate_disk_artifacts(self, run_dir: Path, current_artifacts: Dict[str, Any]) -> None`.
  - Ensure rehydration indexes stems by `seg_id = int(file.stem.split('_')[1])` and looks up `seg_map[seg_id]`, never by loop enumeration index.
  - Add in-memory `_active_stage_locks: Dict[str, asyncio.Lock]` preventing duplicate concurrent executions for the same `(run_id, stage_name)`.

## TDD Test Specification (Red -> Green)
Test Seam: `backend/tests/test_executor_rehydration.py`
```python
import json
import pytest
from pathlib import Path
from app.engine.executor import RunExecutor

@pytest.mark.asyncio
async def test_rehydrate_artifacts_from_disk_by_segment_id(tmp_path):
    run_dir = tmp_path
    stems_dir = run_dir / "stems"
    stems_dir.mkdir()
    (stems_dir / "seg_2.wav").write_bytes(b"RIFFmockwav") # Segment 2 present, Segment 1 filtered

    transcript_data = [
        {"segment_id": 1, "start_s": 0.0, "end_s": 2.0, "source_text": "skip", "translated_text": "skip"},
        {"segment_id": 2, "start_s": 5.0, "end_s": 8.0, "source_text": "keep", "translated_text": "रखो"}
    ]
    (run_dir / "transcript.json").write_text(json.dumps(transcript_data), encoding="utf-8")

    executor = RunExecutor()
    artifacts = {}
    executor._rehydrate_disk_artifacts(run_dir, artifacts)

    assert "synthesized_stems" in artifacts
    assert len(artifacts["synthesized_stems"]) == 1
    # Must match Segment 2, NOT Segment 1 index 0!
    assert artifacts["synthesized_stems"][0]["segment_id"] == 2
    assert artifacts["synthesized_stems"][0]["start_s"] == 5.0
```

## Acceptance Criteria
1. When `stems.json` or `stems/seg_*.wav` exists on disk, `current_artifacts["synthesized_stems"]` is populated with correct segment IDs and timestamps.
2. Rehydration maps stems to segments strictly by `segment_id` key lookup, eliminating desynchronization when segments are pruned.
3. Concurrent duplicate stage retry requests for the same run are serialized safely.
