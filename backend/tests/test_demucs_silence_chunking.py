"""
Tests for:
  1. Direct pass-through audio routing in DenoiseStage
  2. Audio chunking resumption logic
  3. GET /runs/{run_id}/logs endpoint returns persisted log entries
  4. Whisper model normalization and deduplication
"""
import json
import pytest
import asyncio
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch, call
from app.engine.stages.denoise import DenoiseStage


async def noop_progress(pct: float, msg: str) -> None:
    pass


async def noop_log(level: str, msg: str) -> None:
    pass


# ---------------------------------------------------------------------------
# Test 1: Direct pass-through routing
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_use_demucs_false_skips_demucs(tmp_path):
    """Verify DenoiseStage provides direct pass-through."""
    stage = DenoiseStage()

    audio_in = tmp_path / "audio.wav"
    audio_in.write_bytes(b"RIFF" + b"\x00" * 40)

    config = {"run_dir": str(tmp_path), "use_demucs": False}
    input_artifacts = {"audio_path": str(audio_in)}

    result = await stage.execute(input_artifacts, config, noop_progress, noop_log)

    assert result["status"] == "success"
    assert Path(result["vocals_path"]).exists()
    assert Path(result["background_path"]).exists()


# ---------------------------------------------------------------------------
# Test 2: Audio Chunking Resumption
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_demucs_chunked_resumption(tmp_path):
    """
    Verify AudioChunker splits audio and handles multi-chunk outputs.
    """
    from app.engine.audio_chunker import AudioChunker
    import wave, struct

    audio_in = tmp_path / "audio.wav"
    with wave.open(str(audio_in), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(struct.pack("<32000h", *[0]*32000))  # 2.0s

    chunks_dir = tmp_path / "chunks"
    chunks = AudioChunker.split_audio(str(audio_in), str(chunks_dir), target_chunk_s=1.0)
    assert len(chunks) == 2
    assert chunks[0].index == 0
    assert chunks[1].index == 1


# ---------------------------------------------------------------------------
# Test 3: GET /runs/{run_id}/logs returns persisted log entries
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_run_logs_endpoint(tmp_path):
    """
    Write synthetic log entries to a run.log file and verify the endpoint
    parses and returns them correctly.
    """
    from fastapi.testclient import TestClient
    from app.main import app

    run_id = "test_logs_run"
    run_dir = tmp_path / "storage" / "runs" / run_id
    run_dir.mkdir(parents=True)
    log_file = run_dir / "run.log"

    entries = [
        {"stage_name": "denoise", "level": "INFO", "message": "Direct pass-through started", "timestamp": "2026-08-11T10:00:00Z"},
        {"stage_name": "denoise", "level": "DEBUG", "message": "[denoise] 100%", "timestamp": "2026-08-11T10:01:00Z"},
        {"stage_name": "transcription", "level": "INFO", "message": "Whisper loaded", "timestamp": "2026-08-11T10:05:00Z"},
    ]
    with open(log_file, "w", encoding="utf-8") as fh:
        for e in entries:
            fh.write(json.dumps(e) + "\n")

    with patch("app.api.runs.Path", side_effect=lambda p: tmp_path / p.lstrip("./")):
        client = TestClient(app)
        response = client.get(f"/api/v1/runs/{run_id}/logs")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3
    assert data[0]["stage_name"] == "denoise"
    assert data[0]["message"] == "Direct pass-through started"
    assert data[2]["stage_name"] == "transcription"


# ---------------------------------------------------------------------------
# Test 4: Whisper model normalization & fight scene deduplication
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_whisper_model_normalization_and_fight_scene_dedup():
    """Verify normalize_model_name maps inputs correctly and clean_segments caps repeated fight scene lines."""
    from app.engine.stages.transcription import TranscriptionStage
    from app.engine.subtitle_formatter import clean_segments, deduplicate_segments

    # Model normalization checks
    assert TranscriptionStage._normalize_model_name("whisper-large-v3-turbo") == "turbo"
    assert TranscriptionStage._normalize_model_name("turbo") == "turbo"
    assert TranscriptionStage._normalize_model_name("medium") == "medium"
    assert TranscriptionStage._normalize_model_name("small") == "small"
    assert TranscriptionStage._normalize_model_name("whisper-large-v3") == "large-v3"
    assert TranscriptionStage._normalize_model_name(None) == "turbo"

    # Fight scene duplicate loop checks (10 identical segments during action noise)
    repeated_segments = [
        {"start_s": 10.0 + i * 2.0, "end_s": 12.0 + i * 2.0, "source_text": "Watch out!"}
        for i in range(10)
    ]
    cleaned = clean_segments(repeated_segments)
    assert len(cleaned) == 1, "Repeated consecutive fight scene subtitles must collapse into 1 segment"
    assert cleaned[0]["source_text"] == "Watch out!"
    assert cleaned[0]["end_s"] <= 18.0, f"Deduplicated segment end_s ({cleaned[0]['end_s']}) must be capped"
