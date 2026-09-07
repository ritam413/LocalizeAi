import pytest
from pathlib import Path
from app.agents.sync_engineer import SyncEngineerAgent
from app.telemetry.events import telemetry_logger

@pytest.mark.asyncio
async def test_sync_engineer_timing_reconciliation(tmp_path):
    agent = SyncEngineerAgent(base_storage_dir=str(tmp_path))
    context = {
        "tolerance_s": 0.05,
        "synthesized_stems": [
            {
                "segment_id": 1,
                "speaker_id": "spk_1",
                "audio_path": "/fake/path/seg_1.wav",
                "synthesized_duration_s": 4.0,
                "target_duration_s": 3.2 # 0.8s overflow!
            },
            {
                "segment_id": 2,
                "speaker_id": "spk_2",
                "audio_path": "/fake/path/seg_2.wav",
                "synthesized_duration_s": 2.01,
                "target_duration_s": 2.0 # within tolerance
            }
        ]
    }

    result = await agent.run(job_id="test-job-sync", scene_id="scene-01", context=context)

    assert len(result["sync_adjustments"]) == 2
    adj1 = result["sync_adjustments"][0]
    assert adj1["strategy"] == "speed_adjust_atempo"
    assert adj1["atempo_factor"] == 1.25
    assert adj1["final_duration_s"] == 3.2
    assert Path(adj1["aligned_audio_path"]).exists()

    adj2 = result["sync_adjustments"][1]
    assert adj2["strategy"] == "passthrough"
    assert adj2["atempo_factor"] == 1.0

    events = await telemetry_logger.get_events("test-job-sync")
    assert len(events) >= 1
    assert events[-1].agent == "sync_engineer"
