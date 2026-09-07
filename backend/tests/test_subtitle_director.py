import pytest
from pathlib import Path
from app.agents.subtitle_director import SubtitleDirectorAgent
from app.telemetry.events import telemetry_logger

@pytest.mark.asyncio
async def test_subtitle_director_generation(tmp_path):
    agent = SubtitleDirectorAgent(base_storage_dir=str(tmp_path))
    context = {
        "target_language": "hi",
        "localized_lines": [
            {
                "segment_id": 1,
                "speaker_id": "spk_1",
                "start_s": 1.0,
                "end_s": 4.0,
                "translated_text": "पहले से ही हवा में महल मत बनाओ"
            }
        ],
        "sync_adjustments": [
            {
                "segment_id": 1,
                "final_duration_s": 3.0
            }
        ]
    }

    result = await agent.run(job_id="test-job-sub", scene_id="scene-01", context=context)

    assert result["total_cues"] == 1
    assert result["drift_detected"] is False
    assert Path(result["srt_path"]).exists()
    assert Path(result["vtt_path"]).exists()

    with open(result["srt_path"], "r", encoding="utf-8") as f:
        srt_data = f.read()
    assert "00:00:01,000 --> 00:00:04,000" in srt_data
    assert "पहले से ही हवा में महल मत बनाओ" in srt_data

    events = await telemetry_logger.get_events("test-job-sub")
    assert len(events) >= 1
    assert events[-1].agent == "subtitle_director"
