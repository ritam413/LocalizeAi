# TICKET-32: Translation Stage Disk Persistence & Multi-Language JSON Manifests

## Status
- **State**: Completed (Wayfinder Map Child Issue)
- **Primary Seams**: `backend/app/engine/stages/translation.py` (`TranslationStage.execute`)
- **Verification**: Pytest (`backend/tests/test_translation_persistence.py` - 3/3 Passed)
- **Blocking Dependencies**: None
- **Downstream Unblocked**: TICKET-33, TICKET-34

## Objective
Persist translated dialogue segments containing `translated_text`, `target_language`, and subtitle QA metrics back into `transcript.json` and `transcript_{target_lang}.json` atomically on disk. This prevents `TTSStage` and downstream retry operations from falling back to English `source_text`.

## Seams & Interfaces
- Python: `backend/app/engine/stages/translation.py`:
  - After line 297, write `transcript.json` and `transcript_{target_lang}.json` atomically via `.tmp` file replacement:
    ```python
    transcript_path = run_dir / "transcript.json"
    lang_transcript_path = run_dir / f"transcript_{target_lang}.json"

    tmp_transcript = run_dir / "transcript.tmp.json"
    tmp_transcript.write_text(json.dumps(qa_segments, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp_transcript, transcript_path)

    tmp_lang = run_dir / f"transcript_{target_lang}.tmp.json"
    tmp_lang.write_text(json.dumps(qa_segments, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp_lang, lang_transcript_path)
    ```

## TDD Test Specification (Red -> Green)
Test Seam: `backend/tests/test_translation_persistence.py`
```python
import json
import pytest
from pathlib import Path
from app.engine.stages.translation import TranslationStage

@pytest.mark.asyncio
async def test_translation_stage_persists_transcript_json_with_translated_text(tmp_path):
    stage = TranslationStage()
    input_artifacts = {
        "segments": [
            {"segment_id": 1, "start_s": 0.0, "end_s": 2.0, "source_text": "Hello world"}
        ]
    }
    config = {
        "run_dir": str(tmp_path),
        "target_language": "hi",
        "stub_mode": True
    }

    async def noop_progress(pct, msg): pass
    async def noop_log(lvl, msg): pass

    res = await stage.execute(input_artifacts, config, noop_progress, noop_log)
    assert res["status"] == "success"

    transcript_file = tmp_path / "transcript.json"
    assert transcript_file.exists(), "transcript.json must be written to run_dir"
    
    saved_data = json.loads(transcript_file.read_text(encoding="utf-8"))
    assert len(saved_data) == 1
    assert "translated_text" in saved_data[0]
    assert saved_data[0]["translated_text"] != ""
```

## Acceptance Criteria
1. `TranslationStage.execute()` persists `transcript.json` containing `translated_text` for every segment.
2. An isolated `transcript_{target_lang}.json` file is also created for multi-language run integrity.
3. Disk writes use atomic `.tmp.json` + `os.replace` to eliminate partial-write race conditions.
