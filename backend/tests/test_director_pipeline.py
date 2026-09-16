import os
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, patch
from app.agents.director import DirectorAgent, PipelineJobSpec, PipelineReleaseResult
from app.telemetry.events import telemetry_logger

@pytest.fixture
def sample_video_path(tmp_path):
    video_file = tmp_path / "sample_input.mp4"
    video_file.write_bytes(b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2mp41")
    return video_file

@pytest.mark.asyncio
async def test_run_pipeline_end_to_end_fast_path(tmp_path, sample_video_path):
    output_dir = tmp_path / "job_fast_out"
    director = DirectorAgent(base_storage_dir=str(tmp_path / "runs"))

    sample_segments = [
        {"start_s": 0.5, "end_s": 3.5, "source_text": "Welcome to the studio director pipeline."}
    ]

    spec = PipelineJobSpec(
        job_id="test-e2e-fast-job",
        video_path=sample_video_path,
        target_language="es",
        source_language="en",
        output_dir=output_dir,
        use_demucs=False,
        whisper_model="small",
        tts_adapter="mock",
        scene_batch_size=30,
        ducking_db=-6.0,
        min_readiness_threshold=85.0
    )

    with patch.object(director.transcription_stage, "execute", new_callable=AsyncMock) as mock_transcribe:
        mock_transcribe.return_value = {
            "status": "success",
            "segments": sample_segments,
            "audio_path": str(output_dir / "extracted_audio.wav"),
            "artifacts": []
        }

        result = await director.run_pipeline(spec)

        assert isinstance(result, PipelineReleaseResult)
        assert result.job_id == "test-e2e-fast-job"
        assert result.status == "completed"
        assert result.readiness_score >= 85.0
        assert result.total_latency_ms > 0
        assert result.mastered_audio_path is not None and result.mastered_audio_path.exists()
        assert result.dialogue_bus_path is not None and result.dialogue_bus_path.exists()
        assert result.subtitles_srt_path is not None and result.subtitles_srt_path.exists()
        assert result.subtitles_vtt_path is not None and result.subtitles_vtt_path.exists()
        assert result.release_candidate_video is not None and result.release_candidate_video.exists()

        # Telemetry verification
        events = await telemetry_logger.get_events("test-e2e-fast-job")
        actions = {e.action for e in events}
        assert "extraction" in actions or any("extract" in a.lower() for a in actions)
        assert "transcription" in actions or any("transcript" in a.lower() for a in actions)
        assert "mastering" in actions or any("master" in a.lower() for a in actions)


@pytest.mark.asyncio
async def test_run_pipeline_scene_batching(tmp_path, sample_video_path):
    output_dir = tmp_path / "job_batch_out"
    director = DirectorAgent(base_storage_dir=str(tmp_path / "runs"))

    # Generate 5 test segments with a scene_batch_size of 2 (should produce 3 scene batches)
    test_segments = [
        {"start_s": i * 3.0, "end_s": i * 3.0 + 2.5, "source_text": f"Line {i}: This is dialogue line number {i}."}
        for i in range(5)
    ]

    spec = PipelineJobSpec(
        job_id="test-batching-job",
        video_path=sample_video_path,
        target_language="hi",
        output_dir=output_dir,
        use_demucs=False,
        tts_adapter="mock",
        scene_batch_size=2,
    )

    with patch.object(director.transcription_stage, "execute", new_callable=AsyncMock) as mock_transcribe:
        mock_transcribe.return_value = {
            "status": "success",
            "segments": test_segments,
            "audio_path": str(output_dir / "extracted_audio.wav"),
            "artifacts": []
        }

        result = await director.run_pipeline(spec)

        assert result.status == "completed"
        assert result.release_candidate_video is not None
        assert result.subtitles_srt_path is not None and result.subtitles_srt_path.exists()
        srt_content = result.subtitles_srt_path.read_text(encoding="utf-8")
        assert len(srt_content) > 0


@pytest.mark.asyncio
async def test_run_pipeline_targeted_self_repair(tmp_path, sample_video_path, monkeypatch):
    output_dir = tmp_path / "job_repair_out"
    director = DirectorAgent(base_storage_dir=str(tmp_path / "runs"))

    sample_segments = [
        {"start_s": 0.5, "end_s": 3.8, "source_text": "Don't count your chickens before they hatch."}
    ]

    # Mock initial QA run to return a TIMING_OVERFLOW defect on first pass, pass on second
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
                        "timestamp_s": 2.0,
                        "defect_type": "TIMING_OVERFLOW",
                        "severity": "critical",
                        "syllables_to_reduce": 3,
                        "target_agent": "localization_director",
                        "description": "Dialogue overflow",
                        "recommended_fix": "Shorten by 3 syllables",
                        "fix_applied": False,
                    }
                ],
                "decision": "Defect flagged",
                "quality_score": 70.0
            }
        return {
            "job_id": job_id,
            "release_readiness_score": 95.0,
            "verdict": "pass",
            "defect_count": 0,
            "findings": [],
            "decision": "Approved",
            "quality_score": 95.0
        }

    monkeypatch.setattr(director.qa_agent, "run", mock_qa_run)

    spec = PipelineJobSpec(
        job_id="test-repair-job",
        video_path=sample_video_path,
        target_language="es",
        output_dir=output_dir,
        use_demucs=False,
        tts_adapter="mock",
    )

    with patch.object(director.transcription_stage, "execute", new_callable=AsyncMock) as mock_transcribe:
        mock_transcribe.return_value = {
            "status": "success",
            "segments": sample_segments,
            "audio_path": str(output_dir / "extracted_audio.wav"),
            "artifacts": []
        }

        result = await director.run_pipeline(spec)

        assert result.status == "completed"
        assert result.readiness_score == 95.0
        assert len(result.repaired_defects) >= 1
        assert result.repaired_defects[0]["fix_applied"] is True


@pytest.mark.asyncio
async def test_run_pipeline_vram_cleanup(tmp_path, sample_video_path):
    output_dir = tmp_path / "job_vram_out"
    director = DirectorAgent(base_storage_dir=str(tmp_path / "runs"))

    sample_segments = [
        {"start_s": 0.5, "end_s": 3.0, "source_text": "Sample text for cleanup test."}
    ]

    spec = PipelineJobSpec(
        job_id="test-vram-cleanup-job",
        video_path=sample_video_path,
        target_language="fr",
        output_dir=output_dir,
        use_demucs=False,
        tts_adapter="mock"
    )

    cleanup_called = False
    def mock_cleanup():
        nonlocal cleanup_called
        cleanup_called = True

    with patch.object(director, "_cleanup_vram", side_effect=mock_cleanup), \
         patch.object(director.transcription_stage, "execute", new_callable=AsyncMock) as mock_transcribe:
        mock_transcribe.return_value = {
            "status": "success",
            "segments": sample_segments,
            "audio_path": str(output_dir / "extracted_audio.wav"),
            "artifacts": []
        }

        result = await director.run_pipeline(spec)
        assert cleanup_called is True
        assert result.status == "completed"


@pytest.mark.asyncio
async def test_run_pipeline_checkpoint_resumption(tmp_path, sample_video_path):
    output_dir = tmp_path / "job_checkpoint_out"
    director = DirectorAgent(base_storage_dir=str(tmp_path / "runs"))

    test_segments = [
        {"start_s": i * 3.0, "end_s": i * 3.0 + 2.5, "source_text": f"Line {i} dialogue"}
        for i in range(4)
    ]

    spec = PipelineJobSpec(
        job_id="test-checkpoint-job",
        video_path=sample_video_path,
        target_language="hi",
        output_dir=output_dir,
        use_demucs=False,
        tts_adapter="mock",
        scene_batch_size=2,
    )

    with patch.object(director.transcription_stage, "execute", new_callable=AsyncMock) as mock_transcribe:
        mock_transcribe.return_value = {
            "status": "success",
            "segments": test_segments,
            "audio_path": str(output_dir / "extracted_audio.wav"),
            "artifacts": []
        }

        # 1. Run pipeline first time -> creates scenes_checkpoint.json
        res1 = await director.run_pipeline(spec)
        assert res1.status == "completed"
        checkpoint_file = output_dir / "scenes_checkpoint.json"
        assert checkpoint_file.exists()

        # 2. Run pipeline second time with pre-populated checkpoint -> should load from checkpoint
        with patch.object(director, "run", new_callable=AsyncMock) as mock_scene_run:
            res2 = await director.run_pipeline(spec)
            assert res2.status == "completed"
            # Since both scenes are in checkpoint, director.run should not be called again
            assert mock_scene_run.call_count == 0

