import json
import pytest
from pathlib import Path
from app.engine.stages.exporter import BroadcastDeliverablesExporter, DeliverablesManifest


@pytest.fixture
def sample_media_bundle(tmp_path):
    bundle_dir = tmp_path / "sample_bundle"
    bundle_dir.mkdir(parents=True, exist_ok=True)

    # 1. Source video stub
    video_path = bundle_dir / "input_video.mp4"
    video_path.write_bytes(b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2mp41")

    # 2. Mastered audio WAV
    audio_path = bundle_dir / "mastered_audio.wav"
    import wave, struct
    with wave.open(str(audio_path), "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(16000)
        for _ in range(16000):  # 1 sec
            f.writeframes(struct.pack("<h", 0))

    # 3. Dialogue bus WAV
    dialogue_path = bundle_dir / "dialogue_bus.wav"
    with wave.open(str(dialogue_path), "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(16000)
        for _ in range(16000):
            f.writeframes(struct.pack("<h", 0))

    # 4. Timed subtitles
    srt_path = bundle_dir / "subtitles.srt"
    srt_path.write_text("1\n00:00:00,000 --> 00:00:01,000\nHello studio release.\n", encoding="utf-8")

    vtt_path = bundle_dir / "subtitles.vtt"
    vtt_path.write_text("WEBVTT\n\n1\n00:00:00.000 --> 00:00:01.000\nHello studio release.\n", encoding="utf-8")

    return {
        "video": video_path,
        "mastered_audio": audio_path,
        "dialogue_bus": dialogue_path,
        "srt": srt_path,
        "vtt": vtt_path,
        "output_dir": tmp_path / "export_out",
    }


@pytest.mark.asyncio
async def test_package_release_complete_bundle(sample_media_bundle):
    exporter = BroadcastDeliverablesExporter()

    manifest = await exporter.package_release(
        job_id="test-release-001",
        source_video_path=sample_media_bundle["video"],
        mastered_audio_path=sample_media_bundle["mastered_audio"],
        dialogue_bus_path=sample_media_bundle["dialogue_bus"],
        subtitles_vtt_path=sample_media_bundle["vtt"],
        subtitles_srt_path=sample_media_bundle["srt"],
        output_dir=sample_media_bundle["output_dir"],
        target_language="es",
    )

    assert isinstance(manifest, DeliverablesManifest)
    assert manifest.job_id == "test-release-001"
    assert manifest.release_video_mp4 is not None and manifest.release_video_mp4.exists()
    assert manifest.mastered_soundtrack_wav is not None and manifest.mastered_soundtrack_wav.exists()
    assert manifest.dialogue_bus_wav is not None and manifest.dialogue_bus_wav.exists()
    assert manifest.subtitles_srt is not None and manifest.subtitles_srt.exists()
    assert manifest.subtitles_vtt is not None and manifest.subtitles_vtt.exists()
    assert manifest.manifest_path is not None and manifest.manifest_path.exists()

    # Verify JSON manifest content & checksums
    manifest_data = json.loads(manifest.manifest_path.read_text(encoding="utf-8"))
    assert manifest_data["job_id"] == "test-release-001"
    assert manifest_data["target_language"] == "es"
    assert "checksums" in manifest_data["metadata"]
    assert "files" in manifest_data
    assert "storage_path" in manifest_data["files"]["mastered_soundtrack_wav"]
    assert manifest_data["files"]["mastered_soundtrack_wav"]["storage_path"] == "storage/runs/test-release-001/deliverables/mastered_audio.wav"


@pytest.mark.asyncio
async def test_package_release_missing_video_graceful_export(tmp_path, sample_media_bundle):
    exporter = BroadcastDeliverablesExporter()
    out_dir = tmp_path / "no_video_export"

    manifest = await exporter.package_release(
        job_id="test-no-video-job",
        source_video_path=None,
        mastered_audio_path=sample_media_bundle["mastered_audio"],
        dialogue_bus_path=sample_media_bundle["dialogue_bus"],
        subtitles_vtt_path=sample_media_bundle["vtt"],
        subtitles_srt_path=sample_media_bundle["srt"],
        output_dir=out_dir,
        target_language="hi",
    )

    assert manifest.job_id == "test-no-video-job"
    assert manifest.mastered_soundtrack_wav.exists()
    assert manifest.dialogue_bus_wav.exists()
    assert manifest.subtitles_srt.exists()
    assert manifest.subtitles_vtt.exists()
    assert manifest.manifest_path.exists()


def test_deliverables_api_endpoints(tmp_path, monkeypatch):
    try:
        from fastapi.testclient import TestClient
        from app.main import app
    except ImportError:
        pytest.skip("FastAPI not installed in current environment")

    run_dir = Path("./storage/runs/test_api_deliverable_run")
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "mastered_audio.wav").write_bytes(b"RIFFdummywav")

    client = TestClient(app)
    resp = client.get("/api/v1/runs/test_api_deliverable_run/deliverables")
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data
    assert data["job_id"] == "test_api_deliverable_run"

    # Cleanup test dir
    import shutil
    shutil.rmtree(run_dir, ignore_errors=True)
