import pytest
import asyncio
import json
import wave
import math
import struct
from pathlib import Path
from sqlalchemy.future import select

from app.db.database import Base, engine, AsyncSessionLocal
from app.db.models import Clip, Run, StageRun, Preset, Artifact
from app.engine.executor import RunExecutor, STAGE_CLASSES


def _generate_synthetic_test_wav(output_path: Path, duration_s: float = 1.0, freq_hz: float = 440.0, sample_rate: int = 16000):
    """Generates a clean synthetic PCM WAV file for deterministic test execution."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    num_samples = int(duration_s * sample_rate)
    with wave.open(str(output_path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        data = bytearray()
        for i in range(num_samples):
            value = int(8000.0 * math.sin(2.0 * math.pi * freq_hz * (i / sample_rate)))
            data.extend(struct.pack("<h", value))
        wf.writeframes(data)


@pytest.mark.asyncio
async def test_stage_classes_registry_contains_all_dubbing_stages():
    """
    [RED TEST] Asserts that STAGE_CLASSES in app.engine.executor registers all 8 post-production stages:
    extraction, denoise, transcription, translation, tts, duration_align, remix, remux.
    """
    required_stages = [
        "extraction",
        "denoise",
        "transcription",
        "translation",
        "tts",
        "duration_align",
        "remix",
        "remux"
    ]
    for stage_name in required_stages:
        assert stage_name in STAGE_CLASSES, f"Missing required stage '{stage_name}' in STAGE_CLASSES registry"


@pytest.mark.asyncio
async def test_tts_stage_execution(tmp_path):
    """
    [RED TEST] Asserts that TTSStage synthesizes dialogue segments into wav stems using VoiceDirectorAgent.
    """
    from app.engine.stages.tts import TTSStage

    stage = TTSStage()
    assert stage.stage_name == "tts"
    assert not stage.gpu_required

    run_dir = tmp_path / "run_tts_test"
    run_dir.mkdir(parents=True, exist_ok=True)

    input_artifacts = {
        "segments": [
            {
                "segment_id": 1,
                "speaker_id": "speaker_1",
                "start_s": 0.0,
                "end_s": 2.0,
                "source_text": "Hello world",
                "translated_text": "Hola mundo"
            }
        ]
    }
    config = {
        "run_dir": str(run_dir),
        "target_language": "es",
        "tts_adapter": "mock"
    }

    async def noop_prog(pct: float, msg: str): pass
    async def noop_log(level: str, msg: str): pass

    res = await stage.execute(input_artifacts, config, noop_prog, noop_log)

    assert res["status"] == "success"
    assert "synthesized_stems" in res
    assert len(res["synthesized_stems"]) == 1
    stem_path = Path(res["synthesized_stems"][0]["audio_path"])
    assert stem_path.exists()
    assert stem_path.stat().st_size > 44


@pytest.mark.asyncio
async def test_duration_align_stage_execution(tmp_path):
    """
    [RED TEST] Asserts that DurationAlignStage aligns synthesized stems to target dialogue windows.
    """
    from app.engine.stages.duration_align import DurationAlignStage

    stage = DurationAlignStage()
    assert stage.stage_name == "duration_align"
    assert not stage.gpu_required

    run_dir = tmp_path / "run_align_test"
    run_dir.mkdir(parents=True, exist_ok=True)
    raw_stem = run_dir / "stems" / "seg_1.wav"
    _generate_synthetic_test_wav(raw_stem, duration_s=2.5)

    input_artifacts = {
        "synthesized_stems": [
            {
                "segment_id": 1,
                "speaker_id": "speaker_1",
                "audio_path": str(raw_stem),
                "synthesized_duration_s": 2.5,
                "target_duration_s": 2.0,
                "start_s": 0.0,
                "end_s": 2.0
            }
        ]
    }
    config = {
        "run_dir": str(run_dir),
        "tolerance_s": 0.05
    }

    async def noop_prog(pct: float, msg: str): pass
    async def noop_log(level: str, msg: str): pass

    res = await stage.execute(input_artifacts, config, noop_prog, noop_log)

    assert res["status"] == "success"
    assert "aligned_stems" in res
    aligned_stem = res["aligned_stems"][0]
    aligned_path = Path(aligned_stem["aligned_path"])
    assert aligned_path.exists()


@pytest.mark.asyncio
async def test_mastering_stage_execution(tmp_path):
    """
    [RED TEST] Asserts that MasteringStage composites dialogue bus and normalizes to EBU R128 (-24 LUFS).
    """
    from app.engine.stages.mixer import MasteringStage

    stage = MasteringStage()
    assert stage.stage_name == "remix"

    run_dir = tmp_path / "run_mastering_test"
    run_dir.mkdir(parents=True, exist_ok=True)

    aligned_stem = run_dir / "aligned" / "aligned_seg_1.wav"
    _generate_synthetic_test_wav(aligned_stem, duration_s=1.5)

    bg_track = run_dir / "background.wav"
    _generate_synthetic_test_wav(bg_track, duration_s=3.0, freq_hz=220.0)

    input_artifacts = {
        "aligned_stems": [
            {
                "segment_id": 1,
                "audio_path": str(aligned_stem),
                "start_s": 0.5,
                "end_s": 2.0,
                "final_duration_s": 1.5
            }
        ],
        "background_path": str(bg_track)
    }
    config = {
        "run_dir": str(run_dir),
        "ducking_db": -6.0,
        "target_lufs": -24.0
    }

    async def noop_prog(pct: float, msg: str): pass
    async def noop_log(level: str, msg: str): pass

    res = await stage.execute(input_artifacts, config, noop_prog, noop_log)

    assert res["status"] == "success"
    mastered_p = Path(res["mastered_audio_path"])
    bus_p = Path(res["dialogue_bus_path"])
    assert mastered_p.exists()
    assert bus_p.exists()


@pytest.mark.asyncio
async def test_remux_stage_execution(tmp_path):
    """
    [RED TEST] Asserts that RemuxStage packages final broadcast Release Candidate MP4 and deliverables.json.
    """
    from app.engine.stages.exporter import RemuxStage

    stage = RemuxStage()
    assert stage.stage_name == "remux"

    run_dir = tmp_path / "run_remux_test"
    run_dir.mkdir(parents=True, exist_ok=True)

    dummy_video = run_dir / "source.mp4"
    dummy_video.write_bytes(b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2mp41")

    mastered_audio = run_dir / "mastered_audio.wav"
    _generate_synthetic_test_wav(mastered_audio, duration_s=2.0)

    dialogue_bus = run_dir / "dialogue_bus.wav"
    _generate_synthetic_test_wav(dialogue_bus, duration_s=2.0)

    srt_p = run_dir / "subtitles_es.srt"
    srt_p.write_text("1\n00:00:00,000 --> 00:00:02,000\nHola mundo\n", encoding="utf-8")

    input_artifacts = {
        "source_path": str(dummy_video),
        "mastered_audio_path": str(mastered_audio),
        "dialogue_bus_path": str(dialogue_bus)
    }
    config = {
        "run_dir": str(run_dir),
        "target_language": "es"
    }

    async def noop_prog(pct: float, msg: str): pass
    async def noop_log(level: str, msg: str): pass

    res = await stage.execute(input_artifacts, config, noop_prog, noop_log)

    assert res["status"] == "success"
    assert "manifest_path" in res
    manifest_file = Path(res["manifest_path"])
    assert manifest_file.exists()


@pytest.mark.asyncio
async def test_end_to_end_dubbing_executor_mode_b(tmp_path):
    """
    [RED TEST] Integration test: Asserts that RunExecutor executes full 8-stage dubbing pipeline for Mode B.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    run_dir = Path("./storage/runs/test_dub_mode_b")
    run_dir.mkdir(parents=True, exist_ok=True)

    # Seed mock extracted audio & denoise artifacts
    vocals_p = run_dir / "vocals.wav"
    bg_p = run_dir / "background.wav"
    _generate_synthetic_test_wav(vocals_p, duration_s=2.0, freq_hz=440.0)
    _generate_synthetic_test_wav(bg_p, duration_s=2.0, freq_hz=220.0)

    transcript_p = run_dir / "transcript.json"
    transcript_p.write_text(json.dumps([
        {
            "start_s": 0.0,
            "end_s": 2.0,
            "source_text": "Welcome to Localize AI.",
            "speaker_id": "speaker_1"
        }
    ]), encoding="utf-8")

    async with AsyncSessionLocal() as session:
        clip = Clip(source_path=str(run_dir / "mock_video.mp4"), filename="mock_video.mp4", duration_s=2.0)
        preset = Preset(
            name="Dubbing 2.0 Neural",
            project_mode="B",
            stage_config_json='{"stages": ["translation", "tts", "duration_align", "remix", "remux"]}'
        )
        session.add(clip)
        session.add(preset)
        await session.commit()

        run = Run(
            id="test_dub_mode_b",
            clip_id=clip.id,
            preset_id=preset.id,
            project_mode="B",
            target_languages_json='["es"]',
            subtitle_only=False,
            frozen_stage_config_json=json.dumps({
                "stages": ["translation", "tts", "duration_align", "remix", "remux"],
                "subtitle_only": False,
                "tts_adapter": "mock"
            }),
            status="queued"
        )
        session.add(run)
        await session.commit()

    executor = RunExecutor()
    await executor.execute_run(run_id="test_dub_mode_b", force_resume=True)

    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Run).where(Run.id == "test_dub_mode_b"))
        completed_run = res.scalar_one_or_none()
        assert completed_run is not None
        assert completed_run.status == "completed"

    assert (run_dir / "subtitles_es.srt").exists()
    assert (run_dir / "stems" / "seg_1.wav").exists()
    assert (run_dir / "aligned" / "aligned_seg_1.wav").exists()
    assert (run_dir / "dialogue_bus.wav").exists()
    assert (run_dir / "mastered_audio.wav").exists()
    assert (run_dir / "deliverables.json").exists()
