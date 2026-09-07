import pytest
from pathlib import Path
from app.agents.voice_director import VoiceDirectorAgent
from app.telemetry.events import telemetry_logger

@pytest.mark.asyncio
async def test_voice_director_casting_and_synthesis(tmp_path):
    agent = VoiceDirectorAgent(base_storage_dir=str(tmp_path))
    context = {
        "target_language": "hi",
        "speakers": [
            {"speaker_id": "spk_1", "gender": "male"},
            {"speaker_id": "spk_2", "gender": "female"}
        ],
        "localized_lines": [
            {
                "segment_id": 1,
                "speaker_id": "spk_1",
                "start_s": 0.0,
                "end_s": 3.0,
                "translated_text": "नमस्ते दोस्त"
            }
        ]
    }

    result = await agent.run(job_id="test-job-voice", scene_id="scene-01", context=context)

    assert result["target_language"] == "hi"
    assert len(result["voice_cast"]) == 2
    assert result["voice_cast"][0]["voice_id"] == "hi-IN-MadhurNeural"
    assert result["voice_cast"][1]["voice_id"] == "hi-IN-SwaraNeural"

    assert len(result["synthesized_stems"]) == 1
    stem = result["synthesized_stems"][0]
    assert stem["target_duration_s"] == 3.0
    assert Path(stem["audio_path"]).exists()

    events = await telemetry_logger.get_events("test-job-voice")
    assert len(events) >= 1
    assert events[-1].agent == "voice_director"
