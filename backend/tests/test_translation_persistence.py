import json
import pytest
from pathlib import Path
from app.engine.stages.translation import TranslationStage

@pytest.mark.asyncio
async def test_translation_stage_persists_transcript_json_with_translated_text(tmp_path):
    stage = TranslationStage()
    input_artifacts = {
        "segments": [
            {
                "segment_id": 1,
                "start_s": 0.0,
                "end_s": 2.0,
                "source_text": "Hello world",
                "translated_text": "नमस्ते दुनिया",
                "target_language": "hi"
            }
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

    # 1. Verify transcript.json and transcript_hi.json exist
    transcript_file = tmp_path / "transcript.json"
    lang_file = tmp_path / "transcript_hi.json"

    assert transcript_file.exists(), "transcript.json must be written to run_dir"
    assert lang_file.exists(), "transcript_hi.json must be written to run_dir"

    # 2. Verify JSON contents & UTF-8 Devanagari text preservation
    data = json.loads(transcript_file.read_text(encoding="utf-8"))
    assert len(data) == 1
    assert data[0]["segment_id"] == 1
    assert data[0]["translated_text"] == "नमस्ते दुनिया"
    assert data[0]["target_language"] == "hi"

    # 3. Verify artifacts registration
    artifact_paths = [art["path"] for art in res["artifacts"]]
    assert str(transcript_file) in artifact_paths
    assert str(lang_file) in artifact_paths

@pytest.mark.asyncio
async def test_translation_stage_missing_run_dir_guard(tmp_path):
    stage = TranslationStage()
    nested_dir = tmp_path / "deep" / "nested" / "run_dir"
    assert not nested_dir.exists()

    input_artifacts = {
        "segments": [
            {"segment_id": 1, "start_s": 0.0, "end_s": 1.5, "source_text": "Good morning", "translated_text": "सुप्रभात"}
        ]
    }
    config = {
        "run_dir": str(nested_dir),
        "target_language": "hi",
        "stub_mode": True
    }

    async def noop_progress(pct, msg): pass
    async def noop_log(lvl, msg): pass

    res = await stage.execute(input_artifacts, config, noop_progress, noop_log)
    assert res["status"] == "success"
    assert (nested_dir / "transcript.json").exists()

@pytest.mark.asyncio
async def test_translation_stage_atomic_write_no_lingering_tmp(tmp_path):
    stage = TranslationStage()
    input_artifacts = {
        "segments": [
            {"segment_id": 1, "start_s": 0.0, "end_s": 1.0, "source_text": "Test", "translated_text": "परीक्षण"}
        ]
    }
    config = {
        "run_dir": str(tmp_path),
        "target_language": "hi",
        "stub_mode": True
    }

    async def noop_progress(pct, msg): pass
    async def noop_log(lvl, msg): pass

    await stage.execute(input_artifacts, config, noop_progress, noop_log)
    
    tmp_files = list(tmp_path.glob("*.tmp.json"))
    assert len(tmp_files) == 0, "No temporary .tmp.json files should linger on disk"
