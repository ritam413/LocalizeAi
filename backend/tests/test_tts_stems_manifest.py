import json
import pytest
from pathlib import Path
from app.engine.stages.tts import TTSStage

@pytest.mark.asyncio
async def test_tts_stage_writes_stems_manifest_and_preserves_timings(tmp_path):
    stage = TTSStage(adapter_type="mock")
    input_artifacts = {
        "segments": [
            {
                "segment_id": 1,
                "start_s": 1.5,
                "end_s": 4.5,
                "translated_text": "नमस्ते दुनिया",
                "speaker_id": "speaker_1"
            }
        ]
    }
    config = {
        "run_dir": str(tmp_path),
        "target_language": "hi",
        "tts_adapter": "mock"
    }

    async def noop_progress(pct, msg): pass
    async def noop_log(lvl, msg): pass

    res = await stage.execute(input_artifacts, config, noop_progress, noop_log)
    assert res["status"] == "success"

    # Verify stems.json exists on disk
    stems_manifest = tmp_path / "stems.json"
    assert stems_manifest.exists(), "stems.json manifest must be written to disk"
    
    data = json.loads(stems_manifest.read_text(encoding="utf-8"))
    assert len(data) == 1
    assert data[0]["segment_id"] == 1
    assert data[0]["start_s"] == 1.5
    assert data[0]["end_s"] == 4.5
    assert data[0]["speaker_id"] == "speaker_1"
    assert "audio_path" in data[0]
    assert data[0]["target_duration_s"] == 3.0

    # Verify manifest is registered in artifacts list
    artifact_paths = [art["path"] for art in res.get("artifacts", [])]
    assert str(stems_manifest) in artifact_paths

@pytest.mark.asyncio
async def test_tts_stage_handles_inverted_timestamps_and_string_ids(tmp_path):
    stage = TTSStage(adapter_type="mock")
    input_artifacts = {
        "segments": [
            {
                "segment_id": "42",
                "start_s": 10.0,
                "end_s": 5.0,  # Inverted timestamp
                "translated_text": "सुरक्षा जांच",
                "speaker_id": "speaker_2"
            }
        ]
    }
    config = {
        "run_dir": str(tmp_path),
        "target_language": "hi",
        "tts_adapter": "mock"
    }

    async def noop_progress(pct, msg): pass
    async def noop_log(lvl, msg): pass

    res = await stage.execute(input_artifacts, config, noop_progress, noop_log)
    assert res["status"] == "success"

    data = json.loads((tmp_path / "stems.json").read_text(encoding="utf-8"))
    assert len(data) == 1
    assert data[0]["segment_id"] == 42
    assert data[0]["start_s"] == 10.0
    assert data[0]["end_s"] >= 10.1, "end_s must be clamped strictly after start_s"

@pytest.mark.asyncio
async def test_tts_stage_atomic_write_no_lingering_tmp(tmp_path):
    stage = TTSStage(adapter_type="mock")
    nested_dir = tmp_path / "nested" / "run_01"
    input_artifacts = {
        "segments": [
            {
                "segment_id": 1,
                "start_s": 0.0,
                "end_s": 2.0,
                "translated_text": "Atomic test",
                "speaker_id": "speaker_1"
            }
        ]
    }
    config = {
        "run_dir": str(nested_dir),
        "target_language": "en",
        "tts_adapter": "mock"
    }

    async def noop_progress(pct, msg): pass
    async def noop_log(lvl, msg): pass

    await stage.execute(input_artifacts, config, noop_progress, noop_log)
    
    assert (nested_dir / "stems.json").exists()
    tmp_files = list(nested_dir.glob("*.tmp.json"))
    assert len(tmp_files) == 0, "No lingering .tmp.json files should remain"
