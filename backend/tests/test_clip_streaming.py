import pytest
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.database import Base, engine, AsyncSessionLocal
from app.db.models import Clip
from app.config import settings

@pytest.mark.asyncio
async def test_clip_streaming_endpoints(tmp_path):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create a dummy video file in tmp_path
    dummy_video = tmp_path / "test_preview_sample.mp4"
    dummy_video.write_bytes(b"FAKE_MP4_HEADER_AND_STREAM_CONTENT_FOR_TESTING_1234567890")

    async with AsyncSessionLocal() as session:
        clip = Clip(
            source_path=str(dummy_video),
            filename="test_preview_sample.mp4",
            duration_s=15.0,
            codec="h264",
            resolution="1920x1080",
            audio_channels=2
        )
        session.add(clip)
        await session.commit()
        await session.refresh(clip)
        clip_id = clip.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Test clip stream endpoint by ID
        res = await ac.get(f"/api/v1/clips/{clip_id}/stream")
        assert res.status_code == 200
        assert res.headers["content-type"] == "video/mp4"
        assert res.content == b"FAKE_MP4_HEADER_AND_STREAM_CONTENT_FOR_TESTING_1234567890"

        # 2. Test preview stream endpoint with explicit disk path
        preview_res = await ac.get("/api/v1/clips/preview-stream", params={"path": str(dummy_video)})
        assert preview_res.status_code == 200
        assert preview_res.headers["content-type"] == "video/mp4"
        assert preview_res.content == b"FAKE_MP4_HEADER_AND_STREAM_CONTENT_FOR_TESTING_1234567890"

        # 3. Test non-existent clip stream returns 404
        bad_clip_res = await ac.get("/api/v1/clips/non-existent-clip-id-12345/stream")
        assert bad_clip_res.status_code == 404

        # 4. Test non-existent path returns 404
        bad_path_res = await ac.get("/api/v1/clips/preview-stream", params={"path": "/non/existent/file.mp4"})
        assert bad_path_res.status_code == 404
