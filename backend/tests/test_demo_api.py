import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_get_demo_tracks():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/demo/tracks")
        assert response.status_code == 200
        data = response.json()
        assert "tracks" in data
        assert len(data["tracks"]) >= 4
        track_ids = [t["id"] for t in data["tracks"]]
        assert "original" in track_ids
        assert "spanish" in track_ids
        assert "hindi" in track_ids
        assert "french" in track_ids

@pytest.mark.asyncio
async def test_get_demo_sequence_timeline():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/demo/sequence-timeline")
        assert response.status_code == 200
        data = response.json()
        assert "total_duration_s" in data
        assert data["total_duration_s"] == 35.0
        assert len(data["stages"]) == 6
        assert data["stages"][0]["agent_key"] == "story_analyst"
        assert data["stages"][5]["agent_key"] == "qa_agent"
