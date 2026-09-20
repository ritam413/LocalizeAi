import pytest
import wave
import numpy as np
from pathlib import Path
from app.engine.stages.duration_align import DurationAlignStage
from app.engine.stages.mixer import AcousticMasteringEngine, DialogueSegmentInput


def create_24k_wav(file_path: Path, duration_s: float = 1.0, amplitude: float = 0.6) -> Path:
    sample_rate = 24000
    t = np.linspace(0, duration_s, int(sample_rate * duration_s), endpoint=False)
    samples = (amplitude * np.sin(2 * np.pi * 440 * t)).astype(np.float32)
    int_samples = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16)

    file_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(file_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(int_samples.tobytes())
    return file_path


@pytest.mark.asyncio
async def test_duration_align_stage_24khz_atempo(tmp_path):
    stage = DurationAlignStage()
    raw_wav = create_24k_wav(tmp_path / "raw_24k.wav", duration_s=2.5)

    input_artifacts = {
        "synthesized_stems": [
            {
                "segment_id": 1,
                "synthesized_duration_s": 2.5,
                "target_duration_s": 2.0,
                "audio_path": str(raw_wav)
            }
        ]
    }
    config = {"run_dir": str(tmp_path)}

    async def noop_progress(p, msg=None): pass
    async def noop_log(msg, lvl="info"): pass

    result = await stage.execute(input_artifacts, config, noop_progress, noop_log)
    aligned_stems = result["aligned_stems"]
    assert len(aligned_stems) == 1
    aligned_path = Path(aligned_stems[0]["aligned_path"])
    assert aligned_path.exists()
    assert aligned_stems[0]["strategy"] == "speed_adjust_atempo"
    assert aligned_stems[0]["atempo_factor"] == 1.25


@pytest.mark.asyncio
async def test_duration_align_stage_zero_duration_edge_case(tmp_path):
    stage = DurationAlignStage()
    raw_wav = create_24k_wav(tmp_path / "zero_test.wav", duration_s=0.5)

    input_artifacts = {
        "synthesized_stems": [
            {
                "segment_id": 2,
                "synthesized_duration_s": 0.0,
                "target_duration_s": 0.0,
                "audio_path": str(raw_wav)
            }
        ]
    }
    config = {"run_dir": str(tmp_path)}

    async def noop_progress(p, msg=None): pass
    async def noop_log(msg, lvl="info"): pass

    # Must execute safely without throwing ZeroDivisionError
    result = await stage.execute(input_artifacts, config, noop_progress, noop_log)
    assert len(result["aligned_stems"]) == 1


@pytest.mark.asyncio
async def test_acoustic_mastering_engine_24khz_multitrack_mix(tmp_path):
    engine = AcousticMasteringEngine()
    stem_24k = create_24k_wav(tmp_path / "stem_24k.wav", duration_s=1.0)
    bg_wav = create_24k_wav(tmp_path / "bg.wav", duration_s=2.0, amplitude=0.3)
    out_master = tmp_path / "release_master.wav"

    segments = [
        DialogueSegmentInput(
            audio_path=stem_24k,
            start_s=0.2,
            end_s=1.2,
            duration_s=1.0
        )
    ]

    result_path = await engine.master_mix(
        job_id="test_24k_mix",
        background_audio_path=bg_wav,
        dialogue_segments=segments,
        output_path=out_master,
        ducking_db=-6.0,
        target_lufs=-24.0
    )

    assert result_path.exists()
    assert result_path.stat().st_size > 1000


@pytest.mark.asyncio
async def test_acoustic_mastering_engine_empty_dialogue_graceful_handling(tmp_path):
    engine = AcousticMasteringEngine()
    out_bus = tmp_path / "empty_dialogue_bus.wav"

    # When no dialogue segments are passed, it should not fail
    res = await engine.composite_dialogue_bus([], out_bus)
    assert res.exists()
    assert res.stat().st_size > 100
