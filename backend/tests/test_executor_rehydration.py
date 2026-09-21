import json
import asyncio
import pytest
from pathlib import Path
from app.engine.executor import RunExecutor


@pytest.mark.asyncio
async def test_rehydrate_artifacts_from_disk_by_segment_id(tmp_path):
    run_dir = tmp_path
    stems_dir = run_dir / "stems"
    stems_dir.mkdir()
    (stems_dir / "seg_2.wav").write_bytes(b"RIFFmockwav")  # Segment 2 present, Segment 1 filtered

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
    # Must match Segment 2, NOT Segment 1 index 0
    assert artifacts["synthesized_stems"][0]["segment_id"] == 2
    assert artifacts["synthesized_stems"][0]["start_s"] == 5.0
    assert artifacts["synthesized_stems"][0]["end_s"] == 8.0


@pytest.mark.asyncio
async def test_rehydrate_from_stems_manifest_json(tmp_path):
    run_dir = tmp_path
    manifest_data = [
        {"segment_id": 5, "start_s": 10.0, "end_s": 14.0, "audio_path": str(run_dir / "stems" / "seg_5.wav")}
    ]
    (run_dir / "stems.json").write_text(json.dumps(manifest_data), encoding="utf-8")

    executor = RunExecutor()
    artifacts = {}
    executor._rehydrate_disk_artifacts(run_dir, artifacts)

    assert "synthesized_stems" in artifacts
    assert artifacts["synthesized_stems"][0]["segment_id"] == 5
    assert artifacts["synthesized_stems"][0]["start_s"] == 10.0


@pytest.mark.asyncio
async def test_rehydrate_falls_back_to_stems_dir_when_manifest_empty(tmp_path):
    run_dir = tmp_path
    stems_dir = run_dir / "stems"
    stems_dir.mkdir()
    (stems_dir / "seg_3.wav").write_bytes(b"RIFFmockwav")

    # Empty stems.json
    (run_dir / "stems.json").write_text("[]", encoding="utf-8")

    transcript_data = [
        {"segment_id": 3, "start_s": 12.0, "end_s": 15.0, "translated_text": "नमस्ते"}
    ]
    (run_dir / "transcript.json").write_text(json.dumps(transcript_data), encoding="utf-8")

    executor = RunExecutor()
    artifacts = {}
    executor._rehydrate_disk_artifacts(run_dir, artifacts)

    assert "synthesized_stems" in artifacts
    assert len(artifacts["synthesized_stems"]) == 1
    assert artifacts["synthesized_stems"][0]["segment_id"] == 3


@pytest.mark.asyncio
async def test_rehydrate_aligned_stems_and_busses(tmp_path):
    run_dir = tmp_path
    aligned_dir = run_dir / "aligned"
    aligned_dir.mkdir()
    (aligned_dir / "aligned_seg_2.wav").write_bytes(b"RIFFmockwav")
    (run_dir / "dialogue_bus.wav").write_bytes(b"RIFFbus")
    (run_dir / "mastered_audio.wav").write_bytes(b"RIFFmaster")

    executor = RunExecutor()
    artifacts = {}
    executor._rehydrate_disk_artifacts(run_dir, artifacts)

    assert "aligned_stems" in artifacts
    assert artifacts["aligned_stems"][0]["segment_id"] == 2
    assert artifacts["dialogue_bus_path"] == str(run_dir / "dialogue_bus.wav")
    assert artifacts["mastered_audio_path"] == str(run_dir / "mastered_audio.wav")


@pytest.mark.asyncio
async def test_stage_mutex_serialization():
    lock1 = await RunExecutor.get_stage_lock("run_test_123", "duration_align")
    lock2 = await RunExecutor.get_stage_lock("run_test_123", "duration_align")
    lock3 = await RunExecutor.get_stage_lock("run_test_123", "remix")

    assert lock1 is lock2
    assert lock1 is not lock3

    # Cleanup check
    RunExecutor.cleanup_stage_locks("run_test_123")
    lock_after = await RunExecutor.get_stage_lock("run_test_123", "duration_align")
    assert lock_after is not lock1
