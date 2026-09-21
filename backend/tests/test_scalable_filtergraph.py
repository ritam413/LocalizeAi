import pytest
import wave
from pathlib import Path
from app.engine.stages.mixer import AcousticMasteringEngine, DialogueSegmentInput


@pytest.mark.asyncio
async def test_composite_dialogue_bus_handles_150_stems_without_overflow(tmp_path):
    engine = AcousticMasteringEngine()
    stem_file = tmp_path / "mock.wav"
    
    # Generate 0.1s 24kHz mono silence WAV
    with wave.open(str(stem_file), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)
        wf.writeframes(b"\x00" * 4800)

    segments = [
        DialogueSegmentInput(
            audio_path=stem_file,
            start_s=i * 0.2,
            end_s=i * 0.2 + 0.1,
            duration_s=0.1
        )
        for i in range(150)
    ]
    out_path = tmp_path / "composite_out.wav"
    await engine.composite_dialogue_bus(segments, out_path)
    assert out_path.exists()
    assert out_path.stat().st_size > 44
