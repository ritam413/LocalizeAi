import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path
from app.engine.stages.transcription import TranscriptionStage

@pytest.mark.asyncio
async def test_transcription_stage_uses_large_v3_turbo_default():
    stage = TranscriptionStage()
    assert stage.MODEL_SIZE == "turbo"
    assert stage._normalize_model_name(None) == "turbo"
    assert stage._normalize_model_name("") == "turbo"
    assert stage._normalize_model_name("large-v3-turbo") == "turbo"
    assert stage._normalize_model_name("turbo") == "turbo"

@pytest.mark.asyncio
async def test_transcription_stage_uses_relaxed_overlap_vad_parameters(tmp_path):
    stage = TranscriptionStage()
    
    mock_model = MagicMock()
    mock_segment = MagicMock()
    mock_segment.start = 0.5
    mock_segment.end = 2.5
    mock_segment.text = "Hello there! How are you?"
    mock_segment.words = []
    
    mock_info = MagicMock()
    mock_info.language = "en"
    
    mock_model.transcribe.return_value = ([mock_segment], mock_info)
    
    with patch("faster_whisper.WhisperModel", return_value=mock_model):
        results, lang = await stage._transcribe_single_chunk(
            chunk_path=str(tmp_path / "dummy.wav"),
            source_lang="en",
            model_name="turbo",
        )
        
        assert mock_model.transcribe.called
        call_kwargs = mock_model.transcribe.call_args.kwargs
        
        # Verify relaxed thresholds for overlapping speech & VAD
        assert call_kwargs.get("no_speech_threshold") >= 0.8
        assert call_kwargs.get("log_prob_threshold") <= -1.0
        vad_params = call_kwargs.get("vad_parameters", {})
        assert vad_params.get("threshold") <= 0.35
        assert vad_params.get("min_speech_duration_ms") <= 200
        assert vad_params.get("speech_pad_ms") >= 150
        assert call_kwargs.get("word_timestamps") is True
