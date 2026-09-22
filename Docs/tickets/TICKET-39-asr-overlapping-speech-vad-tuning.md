# TICKET-39: ASR Overlapping Speech Sensitivity & VAD Threshold Tuning

## Status
- **State**: Ready for Implementation (Wayfinder Map Frontier)
- **Primary Seams**: `backend/app/engine/stages/transcription.py` (`TranscriptionStage`)
- **Verification**: Pytest (`backend/tests/test_transcription_overlap_vad.py`)
- **Blocking Dependencies**: None
- **Downstream Blocked**: None

---

## Objective
Prevent Whisper from discarding overlapping speech, conversational crosstalk, and low-confidence simultaneous audio by tuning Silero VAD parameters, relaxing `no_speech_threshold`, lowering `logprob_threshold`, and adding fallback temperature sampling.

---

## Background & Root Cause
In `TranscriptionStage._transcribe_single_chunk`:
1. Default Silero VAD `threshold=0.5` marks simultaneous multi-speaker audio as diffuse background noise, dropping audio before it reaches Whisper.
2. `no_speech_threshold=0.6` discards segments when simultaneous speech lowers token certainty.
3. Relaxing VAD threshold to `0.30`, `no_speech_threshold` to `0.85`, `logprob_threshold` to `-1.5`, and configuring `min_speech_duration_ms=150` recovers missing speech on 4GB GPUs with zero VRAM penalty.

---

## Seams & Interfaces
- File: `backend/app/engine/stages/transcription.py`
  - In `_transcribe_single_chunk._transcribe_with_model`:
    ```python
    segments_iter, info = model.transcribe(
        chunk_path,
        language=source_lang,
        task="transcribe",
        beam_size=5,
        no_speech_threshold=0.85,
        logprob_threshold=-1.5,
        compression_ratio_threshold=2.4,
        condition_on_previous_text=False,
        temperature=[0.0, 0.2, 0.4],
        vad_filter=True,
        vad_parameters=dict(
            threshold=0.30,
            min_speech_duration_ms=150,
            min_silence_duration_ms=250,
            speech_pad_ms=200,
        ),
        word_timestamps=True,
    )
    ```

---

## TDD Test Specification (Red -> Green)
Test Seam: `backend/tests/test_transcription_overlap_vad.py`

```python
import pytest
from unittest.mock import MagicMock, patch
from pathlib import Path
from app.engine.stages.transcription import TranscriptionStage

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
        
        # Verify relaxed thresholds
        assert call_kwargs.get("no_speech_threshold") >= 0.8
        assert call_kwargs.get("logprob_threshold") <= -1.0
        vad_params = call_kwargs.get("vad_parameters", {})
        assert vad_params.get("threshold") <= 0.35
        assert vad_params.get("min_speech_duration_ms") <= 200
        assert vad_params.get("speech_pad_ms") >= 150
```

---

## Acceptance Criteria
1. Faster-Whisper `transcribe` is configured with `no_speech_threshold >= 0.8` and VAD `threshold <= 0.35`.
2. Overlapping and conversational crosstalk segments are captured without silent truncation.
3. Unit test `pytest backend/tests/test_transcription_overlap_vad.py` passes 100%.
