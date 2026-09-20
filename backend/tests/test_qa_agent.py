import math
import struct
import wave
from pathlib import Path
import pytest
import numpy as np

from app.agents.qa_agent import QAContinuityAgent, check_audio_clipping, inspect_stems_with_signal
from app.telemetry.events import telemetry_logger


def create_test_wav(file_path: Path, max_amplitude: float = 0.5, duration_s: float = 0.1, sample_rate: int = 16000):
    """Helper to synthesize PCM WAV file with controlled amplitude."""
    t = np.linspace(0, duration_s, int(sample_rate * duration_s), endpoint=False)
    samples = (max_amplitude * np.sin(2 * np.pi * 440 * t)).astype(np.float32)
    int_samples = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16)

    with wave.open(str(file_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(int_samples.tobytes())


def test_check_audio_clipping_clean_and_clipped(tmp_path):
    clean_wav = tmp_path / "clean.wav"
    clipped_wav = tmp_path / "clipped.wav"

    create_test_wav(clean_wav, max_amplitude=0.7)
    create_test_wav(clipped_wav, max_amplitude=1.0)  # Hits 1.0 / 0 dBFS

    is_clean_clipped, clean_count, clean_peak = check_audio_clipping(clean_wav)
    assert not is_clean_clipped
    assert clean_count == 0
    assert clean_peak < 0.999

    is_hot_clipped, hot_count, hot_peak = check_audio_clipping(clipped_wav)
    assert is_hot_clipped
    assert hot_count > 0
    assert hot_peak >= 0.999

    # Non-existent file
    missing_clipped, missing_count, missing_peak = check_audio_clipping(tmp_path / "nonexistent.wav")
    assert not missing_clipped
    assert missing_count == 0
    assert missing_peak == 0.0


@pytest.mark.asyncio
async def test_qa_agent_defect_detection_and_quantitative_syllable_delta():
    agent = QAContinuityAgent(min_readiness_threshold=85.0)
    context = {
        "stems": [
            {
                "segment_id": 7,
                "duration_s": 4.6,
                "target_window_s": 3.2  # 1.4s overflow
            }
        ]
    }

    result = await agent.run(job_id="test-job-qa", scene_id="scene_07", context=context)

    assert result["verdict"] == "rework_required"
    assert result["defect_count"] == 1
    assert result["release_readiness_score"] < 80.0

    finding = result["findings"][0]
    assert finding["defect_type"] == "TIMING_OVERFLOW"
    assert finding["target_agent"] == "localization_director"  # 1.4s > 0.5s routes to script reduction
    assert finding["syllables_to_reduce"] == math.ceil(1.4 * 3.2)  # 5 syllables
    assert "exceeds speech window by 1.40s" in finding["description"]
    assert "5 syllable(s)" in finding["fix_proposal"]

    events = await telemetry_logger.get_events("test-job-qa")
    assert len(events) >= 1
    assert events[-1].agent == "qa_agent"
    assert events[-1].status == "ok"


@pytest.mark.asyncio
async def test_qa_agent_audio_clipping_detection(tmp_path):
    clipped_wav = tmp_path / "distorted_voice.wav"
    create_test_wav(clipped_wav, max_amplitude=1.0)

    agent = QAContinuityAgent(min_readiness_threshold=85.0)
    context = {
        "stems": [
            {
                "segment_id": 3,
                "duration_s": 2.0,
                "target_window_s": 2.0,
                "audio_path": str(clipped_wav)
            }
        ]
    }

    result = await agent.run(job_id="test-job-clip-qa", scene_id="scene_03", context=context)

    assert result["verdict"] == "rework_required"
    assert result["defect_count"] == 1
    finding = result["findings"][0]
    assert finding["defect_type"] == "AUDIO_CLIPPING"
    assert finding["target_agent"] == "voice_director"
    assert finding["peak_amplitude"] >= 0.999
    assert "Digital audio clipping detected" in finding["description"]
    assert "-2.0 dB" in finding["recommended_fix"]


@pytest.mark.asyncio
async def test_qa_agent_clean_pass(tmp_path):
    clean_wav = tmp_path / "perfect_stem.wav"
    create_test_wav(clean_wav, max_amplitude=0.6)

    agent = QAContinuityAgent(min_readiness_threshold=85.0)
    context = {
        "stems": [
            {
                "segment_id": 1,
                "duration_s": 3.0,
                "target_window_s": 3.0,
                "audio_path": str(clean_wav)
            }
        ],
        "subtitles": [
            {
                "cue_index": 1,
                "cps": 14.0,
                "drift_detected": False
            }
        ]
    }

    result = await agent.run(job_id="test-job-clean-qa", scene_id="scene_01", context=context)

    assert result["verdict"] == "pass"
    assert result["defect_count"] == 0
    assert result["release_readiness_score"] >= 85.0
    assert len(result["findings"]) == 0


def test_check_audio_clipping_on_24khz_pcm16(tmp_path):
    wav_path = tmp_path / "kokoro_sample_24k.wav"
    sample_rate = 24000
    duration_s = 0.5
    t = np.linspace(0, duration_s, int(sample_rate * duration_s), endpoint=False)
    samples = (0.8 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)
    int_samples = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16)

    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(int_samples.tobytes())

    is_clipped, clipped_count, peak_amp = check_audio_clipping(wav_path)
    assert not is_clipped
    assert clipped_count == 0
    assert 0.79 <= peak_amp <= 0.81

