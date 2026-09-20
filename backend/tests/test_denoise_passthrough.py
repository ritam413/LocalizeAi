import pytest
import wave
import struct
from pathlib import Path
from app.engine.stages.denoise import DenoiseStage

def create_test_wav(path: Path, duration_s: float = 2.0, sample_rate: int = 16000):
    path.parent.mkdir(parents=True, exist_ok=True)
    n_frames = int(duration_s * sample_rate)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(struct.pack(f"<{n_frames}h", *[0] * n_frames))

@pytest.mark.asyncio
async def test_denoise_stage_direct_passthrough(tmp_path: Path):
    stage = DenoiseStage()
    run_dir = tmp_path / "run_test"
    run_dir.mkdir()
    audio_in = run_dir / "extracted_audio.wav"
    create_test_wav(audio_in, duration_s=3.0)

    logs = []
    async def log_cb(level, msg):
        logs.append(msg)
    async def progress_cb(pct, msg):
        pass

    result = await stage.execute(
        input_artifacts={"audio_path": str(audio_in)},
        config={"run_dir": str(run_dir)},
        progress_cb=progress_cb,
        log_cb=log_cb,
    )

    assert result["status"] == "success"
    assert Path(result["vocals_path"]).exists()
    assert Path(result["background_path"]).exists()
    assert Path(result["audio_path"]).exists()
    assert any("direct audio pass-through" in l.lower() or "direct" in l.lower() or "denoisestage" in l.lower() for l in logs)
