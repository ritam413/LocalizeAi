"""
Tests for:
  1. use_demucs=False routes to _run_ffmpeg_fallback
  2. Silence-aware split point detection & resumption logic
  3. GET /runs/{run_id}/logs endpoint returns persisted log entries
"""
import json
import pytest
import asyncio
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch, call
from app.engine.stages.denoise import DenoiseStage


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def noop_progress(pct: float, msg: str) -> None:
    pass

async def noop_log(level: str, msg: str) -> None:
    pass


# ---------------------------------------------------------------------------
# Test 1: use_demucs=False routes to _run_ffmpeg_fallback
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_use_demucs_false_skips_demucs(tmp_path):
    """When use_demucs=False, DenoiseStage must call _run_ffmpeg_fallback and
    never invoke _run_demucs."""
    stage = DenoiseStage()

    # Create a minimal WAV file so the stage doesn't bail early
    audio_in = tmp_path / "audio.wav"
    audio_in.write_bytes(b"RIFF" + b"\x00" * 40)  # fake minimal header

    calls = []

    async def fake_ffmpeg_fallback(audio_in, vocals_wav, background_wav, progress_cb, log_cb):
        calls.append("ffmpeg_fallback")
        vocals_wav.write_bytes(b"vocals")
        background_wav.write_bytes(b"bg")
        return True

    async def fake_run_demucs(*args, **kwargs):
        calls.append("demucs")
        return False

    with patch.object(stage, "_run_ffmpeg_fallback", fake_ffmpeg_fallback), \
         patch.object(stage, "_run_demucs", fake_run_demucs), \
         patch.object(DenoiseStage, "_get_audio_duration", AsyncMock(return_value=60.0)):

        config = {"run_dir": str(tmp_path), "use_demucs": False}
        input_artifacts = {"audio_path": str(audio_in)}

        result = await stage.execute(input_artifacts, config, noop_progress, noop_log)

    assert "demucs" not in calls, "Demucs should NOT be called when use_demucs=False"
    assert "ffmpeg_fallback" in calls, "ffmpeg_fallback MUST be called when use_demucs=False"
    assert result["status"] == "success"


# ---------------------------------------------------------------------------
# Test 2: Silence-aware resumption — already-completed chunks are skipped
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_demucs_chunked_resumption(tmp_path):
    """
    Simulate a 5-chunk run where chunks 0,1 are already separated.
    DenoiseStage must skip those chunks and only process chunks 2..4.
    """
    stage = DenoiseStage()
    chunks_dir = tmp_path / "demucs_chunks"
    chunks_dir.mkdir()

    # Create fake audio input
    audio_in = tmp_path / "audio.wav"
    audio_in.write_bytes(b"fake_audio")

    n_chunks = 5
    duration = n_chunks * stage.TARGET_CHUNK_S

    # Pre-create chunk WAV files (as if they exist from a prior run)
    for i in range(n_chunks):
        chunk = chunks_dir / f"chunk_{i:03d}.wav"
        chunk.write_bytes(b"fake_chunk")

    # Pre-create stems for chunk 0 and 1 only (simulating partial completion)
    for i in range(2):
        (chunks_dir / f"chunk_{i:03d}_vocals.wav").write_bytes(b"vocals")
        (chunks_dir / f"chunk_{i:03d}_no_vocals.wav").write_bytes(b"no_vocals")

    processed_chunks = []

    async def fake_demucs_single(audio_in_path, out_dir, run_id, vocals_out, no_vocals_out,
                                  progress_cb=None, log_cb=None, device_flag=None,
                                  progress_base=15.0, progress_range=55.0):
        chunk_name = Path(audio_in_path).stem
        processed_chunks.append(chunk_name)
        vocals_out.write_bytes(b"vocals")
        no_vocals_out.write_bytes(b"no_vocals")
        return True

    async def fake_concat(wav_paths, out_path, log_cb):
        out_path.write_bytes(b"concat")
        return True

    split_points = [stage.TARGET_CHUNK_S * i for i in range(1, n_chunks)]

    with patch.object(stage, "_detect_silence_split_points", AsyncMock(return_value=split_points)), \
         patch.object(stage, "_ffmpeg_cut_segment", AsyncMock()), \
         patch.object(stage, "_demucs_single_file", fake_demucs_single), \
         patch.object(stage, "_ffmpeg_concat_wavs", fake_concat), \
         patch.object(DenoiseStage, "_get_audio_duration", AsyncMock(return_value=duration)), \
         patch.object(DenoiseStage, "_detect_device", AsyncMock(return_value="cpu")):

        config = {"run_dir": str(tmp_path), "use_demucs": True}
        input_artifacts = {"audio_path": str(audio_in)}

        await stage._run_demucs(
            str(audio_in), tmp_path, "test_run",
            tmp_path / "vocals.wav", tmp_path / "background.wav",
            noop_progress, noop_log
        )

    # Only chunks 2, 3, 4 should have been processed through Demucs
    assert "chunk_000" not in processed_chunks, "Chunk 0 already done, should be skipped"
    assert "chunk_001" not in processed_chunks, "Chunk 1 already done, should be skipped"
    assert "chunk_002" in processed_chunks, "Chunk 2 must be processed"
    assert "chunk_003" in processed_chunks, "Chunk 3 must be processed"
    assert "chunk_004" in processed_chunks, "Chunk 4 must be processed"
    assert len(processed_chunks) == 3, f"Expected 3 chunks processed, got {len(processed_chunks)}"


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
        {"stage_name": "denoise", "level": "INFO", "message": "Demucs started", "timestamp": "2026-08-11T10:00:00Z"},
        {"stage_name": "denoise", "level": "DEBUG", "message": "[demucs] 50%", "timestamp": "2026-08-11T10:01:00Z"},
        {"stage_name": "transcription", "level": "INFO", "message": "Whisper loaded", "timestamp": "2026-08-11T10:05:00Z"},
    ]
    with open(log_file, "w", encoding="utf-8") as fh:
        for e in entries:
            fh.write(json.dumps(e) + "\n")

    # Override the storage path the endpoint reads from
    with patch("app.api.runs.Path", side_effect=lambda p: tmp_path / p.lstrip("./")):
        client = TestClient(app)
        response = client.get(f"/api/v1/runs/{run_id}/logs")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3
    assert data[0]["stage_name"] == "denoise"
    assert data[0]["message"] == "Demucs started"
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
    assert TranscriptionStage._normalize_model_name(None) == "medium"

    # Fight scene duplicate loop checks (10 identical segments during action noise)
    repeated_segments = [
        {"start_s": 10.0 + i * 2.0, "end_s": 12.0 + i * 2.0, "source_text": "Watch out!"}
        for i in range(10)
    ]
    cleaned = clean_segments(repeated_segments)
    assert len(cleaned) == 1, "Repeated consecutive fight scene subtitles must collapse into 1 segment"
    assert cleaned[0]["source_text"] == "Watch out!"
    # Ensure end_s is capped at start_s + 8.0 so subtitle doesn't lock on screen for 20+ seconds
    assert cleaned[0]["end_s"] <= 18.0, f"Deduplicated segment end_s ({cleaned[0]['end_s']}) must be capped"
