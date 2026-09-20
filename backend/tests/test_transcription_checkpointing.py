import pytest
import json
import wave
import struct
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock, patch
from app.engine.stages.transcription import TranscriptionStage

def create_test_wav(path: Path, duration_s: float = 120.0, sample_rate: int = 16000):
    path.parent.mkdir(parents=True, exist_ok=True)
    n_frames = int(duration_s * sample_rate)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(struct.pack(f"<{n_frames}h", *[0] * n_frames))

@pytest.mark.asyncio
async def test_transcription_persists_checkpoints_per_chunk(tmp_path: Path):
    stage = TranscriptionStage()
    run_dir = tmp_path / "run_resumable"
    run_dir.mkdir()
    audio_path = run_dir / "extracted_audio.wav"
    create_test_wav(audio_path, duration_s=120.0)

    progress_events = []
    async def progress_cb(pct, msg):
        progress_events.append((pct, msg))
    async def log_cb(level, msg):
        pass

    # Mock chunk transcription to simulate transcribing 2 chunks
    with patch.object(stage, "_transcribe_single_chunk") as mock_chunk:
        mock_chunk.side_effect = [
            ([{"start_s": 1.0, "end_s": 4.0, "source_text": "Hello world"}], "en"),
            ([{"start_s": 2.0, "end_s": 5.0, "source_text": "Second chunk text"}], "en"),
        ]
        res = await stage.execute(
            input_artifacts={"audio_path": str(audio_path)},
            config={"run_dir": str(run_dir), "target_chunk_s": 60.0},
            progress_cb=progress_cb,
            log_cb=log_cb,
        )

    checkpoint_file = run_dir / "transcription_checkpoint.json"
    assert checkpoint_file.exists()
    with open(checkpoint_file, "r", encoding="utf-8") as f:
        cp = json.load(f)
    assert cp["completed_chunks"] == [0, 1]
    assert len(cp["accumulated_segments"]) == 2
    # Check that timestamps of second chunk are shifted by 60s
    assert cp["accumulated_segments"][0]["start_s"] == 1.0
    assert cp["accumulated_segments"][1]["start_s"] == pytest.approx(62.0, rel=0.05)

    assert len(res["segments"]) == 2
    assert (run_dir / "transcript.json").exists()

@pytest.mark.asyncio
async def test_transcription_resumes_from_existing_checkpoint(tmp_path: Path):
    stage = TranscriptionStage()
    run_dir = tmp_path / "run_resume_existing"
    run_dir.mkdir()
    audio_path = run_dir / "extracted_audio.wav"
    create_test_wav(audio_path, duration_s=120.0)

    # Pre-populate checkpoint with chunk 0 completed (50% progress)
    checkpoint_file = run_dir / "transcription_checkpoint.json"
    with open(checkpoint_file, "w", encoding="utf-8") as f:
        json.dump({
            "total_chunks": 2,
            "completed_chunks": [0],
            "progress_percent": 50.0,
            "accumulated_segments": [{"start_s": 1.0, "end_s": 4.0, "source_text": "Chunk 0 text"}],
        }, f)

    with patch.object(stage, "_transcribe_single_chunk") as mock_chunk:
        mock_chunk.return_value = ([{"start_s": 2.0, "end_s": 5.0, "source_text": "Chunk 1 text"}], "en")
        res = await stage.execute(
            input_artifacts={"audio_path": str(audio_path)},
            config={"run_dir": str(run_dir), "target_chunk_s": 60.0},
            progress_cb=AsyncMock(),
            log_cb=AsyncMock(),
        )
        # Verify chunk 0 was skipped and only chunk 1 was transcribed
        assert mock_chunk.call_count == 1

    assert len(res["segments"]) == 2
    assert res["segments"][0]["source_text"] == "Chunk 0 text"
    assert res["segments"][1]["source_text"] == "Chunk 1 text"
