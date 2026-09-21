# TICKET-35: Scalable Filtergraph Script Generation & Windows 8k-Char Buffer Defense

## Status
- **State**: Implemented & Verified (Wayfinder Map Child Issue)
- **Primary Seams**: `backend/app/engine/stages/mixer.py` (`AcousticMasteringEngine`)
- **Verification**: Pytest (`backend/tests/test_scalable_filtergraph.py`)
- **Blocking Dependencies**: TICKET-33, TICKET-34
- **Downstream Blocked**: TICKET-36

## Objective
Prevent Windows `CreateProcess` command-line length overflow (`[WinError 206]`, >8,191 chars) when compositing large dialogue stem collections (e.g. 142+ stems) by writing the FFmpeg filtergraph into a temporary `-filter_complex_script` file.

## Seams & Interfaces
- Python: `backend/app/engine/stages/mixer.py`:
  - Update `composite_dialogue_bus` to write complex filter strings to `filtergraph.tmp.txt` when executing FFmpeg.
  - Replace `-filter_complex "<string>"` with `-filter_complex_script "path/to/filtergraph.tmp.txt"`.

## TDD Test Specification (Red -> Green)
Test Seam: `backend/tests/test_scalable_filtergraph.py`
```python
import pytest
from pathlib import Path
from app.engine.stages.mixer import AcousticMasteringEngine, DialogueSegmentInput

@pytest.mark.asyncio
async def test_composite_dialogue_bus_handles_150_stems_without_overflow(tmp_path):
    engine = AcousticMasteringEngine()
    stem_file = tmp_path / "mock.wav"
    # Generate 0.1s silence WAV
    import wave
    with wave.open(str(stem_file), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(b"\x00" * 4800)

    segments = [
        DialogueSegmentInput(
            audio_path=stem_file,
            start_s=i * 1.5,
            end_s=i * 1.5 + 0.1,
            duration_s=0.1
        )
        for i in range(150)
    ]
    out_path = tmp_path / "composite_out.wav"
    await engine.composite_dialogue_bus(segments, out_path)
    assert out_path.exists()
    assert out_path.stat().st_size > 44
```

## Acceptance Criteria
1. `AcousticMasteringEngine.composite_dialogue_bus` seamlessly composites 150+ stems without exceeding OS command-line limits.
2. Temporary filter script files are cleaned up reliably in a `finally` block.
