import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
from httpx import AsyncClient, ASGITransport

from app.engine.stages.transcription import TranscriptionStage
from app.engine.stages.translation import TranslationStage
from app.main import app
from app.config import settings


@pytest.mark.asyncio
async def test_transcription_stage_cuda_fallback(tmp_path):
    """Verify that TranscriptionStage automatically falls back to CPU when CUDA fails with missing libcublas."""
    stage = TranscriptionStage()
    
    dummy_wav = tmp_path / "vocals.wav"
    dummy_wav.write_bytes(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00")

    mock_segment = MagicMock()
    mock_segment.start = 0.0
    mock_segment.end = 2.5
    mock_segment.text = "Hello world from CPU fallback"
    mock_segment.words = []

    mock_info = MagicMock()
    mock_info.language = "en"

    call_count = {"cuda": 0, "cpu": 0}

    def mock_whisper_init(model_name, device="cpu", compute_type="int8"):
        mock_instance = MagicMock()
        if device == "cuda":
            call_count["cuda"] += 1
            def failing_transcribe(*args, **kwargs):
                raise RuntimeError("Library libcublas.so.12 is not found or cannot be loaded")
            mock_instance.transcribe.side_effect = failing_transcribe
        else:
            call_count["cpu"] += 1
            mock_instance.transcribe.return_value = ([mock_segment], mock_info)
        return mock_instance

    with patch("ctranslate2.get_supported_compute_types", return_value={"float16", "int8"}), \
         patch("faster_whisper.WhisperModel", side_effect=mock_whisper_init):
        
        async def mock_progress(pct, msg):
            pass
        async def mock_log(lvl, msg):
            pass

        result = await stage.execute(
            input_artifacts={"vocals_path": str(dummy_wav)},
            config={"run_dir": str(tmp_path)},
            progress_cb=mock_progress,
            log_cb=mock_log
        )

        assert result["status"] == "success"
        assert len(result["segments"]) == 1
        assert result["segments"][0]["source_text"] == "Hello world from CPU fallback"
        assert call_count["cuda"] == 1
        assert call_count["cpu"] == 1


@pytest.mark.asyncio
async def test_preview_stream_relative_storage_path(tmp_path):
    """Verify that preview-stream correctly resolves 'storage/runs/...' paths."""
    test_file = settings.STORAGE_DIR / "test_sample_subtitle.vtt"
    test_file.write_text("WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nTest subtitle\n")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        try:
            # Test relative path formatted as storage/...
            res = await ac.get("/api/v1/clips/preview-stream", params={"path": "storage/test_sample_subtitle.vtt"})
            assert res.status_code == 200
            assert "WEBVTT" in res.text
            assert res.headers["content-type"].startswith("text/vtt")
        finally:
            if test_file.exists():
                test_file.unlink()
