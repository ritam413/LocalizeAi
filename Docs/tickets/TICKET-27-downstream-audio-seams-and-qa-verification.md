# TICKET-27: Downstream Audio Seams & Acoustic QA Verification

## Status
- **State**: Completed
- **Primary Seams**: 
  - `backend/app/agents/qa_agent.py` (`check_audio_clipping`, `QAContinuityAgent`)
  - `backend/app/engine/stages/duration_align.py` (`DurationAlignStage`)
  - `backend/app/agents/sync_engineer.py` (`SyncEngineerAgent`)
  - `backend/app/engine/stages/mixer.py` (`MasteringStage`, `AcousticMasteringEngine`)
- **Verification**: Pytest (`backend/tests/test_qa_agent.py`, `backend/tests/test_downstream_audio_seams.py` — 9/9 Passed)
- **Blocking Dependencies**: TICKET-25, TICKET-26
- **Downstream Blocked**: None (All Unblocked)

## Objective
Verify that 24,000 Hz 16-bit PCM WAV stems synthesized by Kokoro integrate seamlessly across all downstream post-production pipeline stages without sample-rate conversion errors, clipping false-positives, or duration reconciliation failures.

## Seams & Invariants
- Python: `backend/app/agents/qa_agent.py`:
  - `check_audio_clipping()` must successfully inspect 24kHz PCM_16 WAVs via Python standard library `wave.open()`.
  - Invariant: Maximum peak amplitude must be accurately computed without integer overflow or float rounding errors.
- Python: `backend/app/agents/sync_engineer.py`:
  - `SyncEngineerAgent` calculates duration ratio $R = \frac{T_{\text{synth}}}{T_{\text{target}}}$ and applies FFmpeg `atempo`.
  - Invariant: Must handle 24kHz inputs without failing `ffprobe` format inspection.
- Python: `backend/app/engine/stages/mixer.py`:
  - `MasteringStage` compositing (`amix`, `adelay`, `loudnorm`).
  - Invariant: EBU R128 (-24 LUFS) broadcast loudness mastering must output standard 48kHz release soundtrack.

## TDD Test Specification (Red -> Green)
Test Seam: `backend/tests/test_qa_agent.py`
```python
import pytest
import numpy as np
import soundfile as sf
from app.agents.qa_agent import check_audio_clipping

def test_check_audio_clipping_on_24khz_pcm16(tmp_path):
    wav_path = tmp_path / "kokoro_sample_24k.wav"
    # Generate clean 24kHz test tone at 0.8 amplitude (non-clipped)
    samples = (0.8 * 32767 * np.sin(2 * np.pi * 440 * np.linspace(0, 1, 24000))).astype(np.int16)
    sf.write(str(wav_path), samples, 24000, subtype="PCM_16")

    is_clipped, clipped_count, peak_amp = check_audio_clipping(wav_path)
    assert not is_clipped
    assert clipped_count == 0
    assert 0.79 <= peak_amp <= 0.81
```

## Acceptance Criteria
1. `check_audio_clipping()` parses Kokoro 24kHz PCM_16 audio stems without raising `wave.Error`.
2. Peak amplitude is correctly calculated; stems below 0.999 amplitude are marked unclipped.
3. `SyncEngineer` probes duration accurately on 24kHz stems.
4. Downstream mixer handles multitrack alignment without sample rate mismatch errors.
