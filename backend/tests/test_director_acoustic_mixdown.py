import os
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, patch
from app.agents.director import DirectorAgent
from app.engine.stages.mixer import DialogueSegmentInput
from app.telemetry.events import telemetry_logger


@pytest.fixture
def dummy_wav_file(tmp_path):
    wav_path = tmp_path / "test_audio.wav"
    import wave, struct
    with wave.open(str(wav_path), "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(16000)
        for _ in range(16000):  # 1 second
            f.writeframes(struct.pack("<h", 0))
    return wav_path


@pytest.mark.asyncio
async def test_execute_acoustic_mixdown_with_background(tmp_path, dummy_wav_file):
    output_dir = tmp_path / "mixdown_out"
    director = DirectorAgent(base_storage_dir=str(tmp_path / "runs"))

    stems = [
        {
            "audio_path": dummy_wav_file,
            "start_s": 0.5,
            "end_s": 1.5,
            "duration_s": 1.0,
        }
    ]

    result = await director.execute_acoustic_mixdown(
        job_id="test-mixdown-bg",
        scene_id="scene_01",
        repaired_stems=stems,
        background_audio_path=dummy_wav_file,
        output_dir=output_dir,
        ducking_db=-6.0,
    )

    assert "mastered_audio_path" in result
    assert "dialogue_bus_path" in result
    assert result["ducking_applied"] is True
    assert result["integrated_lufs"] == -24.0
    assert Path(result["mastered_audio_path"]).exists()
    assert Path(result["dialogue_bus_path"]).exists()

    # Verify Section 6 telemetry event
    events = await telemetry_logger.get_events("test-mixdown-bg")
    actions = [e.action for e in events]
    assert "acoustic_master_mixdown" in actions


@pytest.mark.asyncio
async def test_execute_acoustic_mixdown_without_background_fallback(tmp_path, dummy_wav_file):
    output_dir = tmp_path / "mixdown_no_bg_out"
    director = DirectorAgent(base_storage_dir=str(tmp_path / "runs"))

    stems = [
        DialogueSegmentInput(
            audio_path=dummy_wav_file,
            start_s=0.0,
            end_s=1.0,
            duration_s=1.0,
        )
    ]

    result = await director.execute_acoustic_mixdown(
        job_id="test-mixdown-no-bg",
        scene_id="scene_01",
        repaired_stems=stems,
        background_audio_path=None,
        output_dir=output_dir,
        ducking_db=-6.0,
    )

    assert result["ducking_applied"] is False
    assert result["integrated_lufs"] == -24.0
    assert Path(result["mastered_audio_path"]).exists()
    assert Path(result["dialogue_bus_path"]).exists()


@pytest.mark.asyncio
async def test_execute_acoustic_mixdown_input_normalization(tmp_path, dummy_wav_file):
    output_dir = tmp_path / "mixdown_norm_out"
    director = DirectorAgent(base_storage_dir=str(tmp_path / "runs"))

    # Test diverse segment formats: adjusted_path / stem_path / final_duration_s
    stems = [
        {
            "adjusted_path": str(dummy_wav_file),
            "start_s": 0.2,
            "final_duration_s": 0.8,
        },
        {
            "stem_path": str(dummy_wav_file),
            "start_s": 1.2,
            "duration_s": 1.0,
        }
    ]

    result = await director.execute_acoustic_mixdown(
        job_id="test-mixdown-norm",
        scene_id="scene_01",
        repaired_stems=stems,
        background_audio_path=dummy_wav_file,
        output_dir=output_dir,
        ducking_db=-6.0,
    )

    assert Path(result["mastered_audio_path"]).exists()
    assert Path(result["dialogue_bus_path"]).exists()


@pytest.mark.asyncio
async def test_acoustic_mixdown_receives_repaired_stems_post_qa(tmp_path, dummy_wav_file, monkeypatch):
    """
    Verify that in the director's lifecycle, if QA flags a defect,
    the targeted self-repair pass runs first, and only the repaired stems
    are submitted for acoustic mastering.
    """
    output_dir = tmp_path / "mixdown_repair_out"
    director = DirectorAgent(base_storage_dir=str(tmp_path / "runs"))

    sample_segments = [
        {"start_s": 0.5, "end_s": 3.8, "source_text": "Sample dialogue requiring syllable reduction."}
    ]

    qa_call_count = 0
    async def mock_qa_run(job_id, scene_id, context, retry_count=0):
        nonlocal qa_call_count
        qa_call_count += 1
        if qa_call_count == 1:
            return {
                "job_id": job_id,
                "release_readiness_score": 70.0,
                "verdict": "rework_required",
                "defect_count": 1,
                "findings": [
                    {
                        "finding_id": f"qa-{job_id}-1",
                        "scene_id": scene_id,
                        "segment_id": 1,
                        "target_segment_id": 1,
                        "defect_type": "TIMING_OVERFLOW",
                        "syllables_to_reduce": 3,
                        "target_agent": "localization_director",
                        "description": "Overflow",
                        "fix_applied": False,
                    }
                ],
                "decision": "Defect flagged",
                "quality_score": 70.0
            }
        return {
            "job_id": job_id,
            "release_readiness_score": 96.0,
            "verdict": "pass",
            "defect_count": 0,
            "findings": [],
            "decision": "Approved",
            "quality_score": 96.0
        }

    monkeypatch.setattr(director.qa_agent, "run", mock_qa_run)

    # Spy on execute_acoustic_mixdown
    mixdown_calls = []
    original_mixdown = director.execute_acoustic_mixdown

    async def spy_mixdown(*args, **kwargs):
        mixdown_calls.append((args, kwargs))
        return await original_mixdown(*args, **kwargs)

    monkeypatch.setattr(director, "execute_acoustic_mixdown", spy_mixdown)

    from app.agents.director import PipelineJobSpec
    spec = PipelineJobSpec(
        job_id="test-post-qa-mixdown",
        video_path=dummy_wav_file,
        target_language="es",
        output_dir=output_dir,
        use_demucs=False,
        tts_adapter="mock",
    )

    with patch.object(director.transcription_stage, "execute", new_callable=AsyncMock) as mock_transcribe:
        mock_transcribe.return_value = {
            "status": "success",
            "segments": sample_segments,
            "audio_path": str(dummy_wav_file),
            "artifacts": []
        }

        result = await director.run_pipeline(spec)

        assert result.status == "completed"
        assert len(mixdown_calls) == 1
        assert qa_call_count == 2  # Proves QA defect occurred, triggered repair, then passed
        assert len(result.repaired_defects) >= 1
