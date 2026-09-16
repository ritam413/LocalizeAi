import pytest
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.agents.story_analyst import (
    StoryAnalystAgent,
    DiarizationAdapter,
    HeuristicDiarizationAdapter,
    PyAnnoteDiarizationAdapter,
    SpeakerSegment,
)
from app.telemetry.events import telemetry_logger


class CustomMockDiarizer(DiarizationAdapter):
    """Custom test adapter returning predetermined speaker labels."""
    def diarize(
        self,
        audio_path: Optional[Path],
        transcript_segments: List[Dict[str, Any]],
        speaker_overrides: Optional[Dict[str, str]] = None,
    ) -> List[SpeakerSegment]:
        res = []
        for idx, s in enumerate(transcript_segments):
            res.append(
                SpeakerSegment(
                    segment_id=idx + 1,
                    speaker_id="NARRATOR_HERO",
                    start_s=float(s.get("start_s", 0.0)),
                    end_s=float(s.get("end_s", 1.0)),
                    confidence=0.99,
                    gender="male",
                    detected_emotion="authoritative",
                )
            )
        return res


def test_heuristic_diarization_adapter_offline_and_overrides():
    adapter = HeuristicDiarizationAdapter()
    segments = [
        {"start_s": 0.0, "end_s": 2.0, "source_text": "Hey there!"},
        {"start_s": 2.5, "end_s": 4.5, "source_text": "Hello, how are you?"},
        {"start_s": 5.0, "end_s": 7.0, "source_text": "I am doing well."},
    ]
    overrides = {"speaker_1": "Alvaro", "speaker_2": "Beatriz"}

    results = adapter.diarize(
        audio_path=None,
        transcript_segments=segments,
        speaker_overrides=overrides,
    )

    assert len(results) == 3
    assert results[0].speaker_id == "Alvaro"
    assert results[1].speaker_id == "Beatriz"
    assert results[2].speaker_id == "Alvaro"
    assert results[0].confidence == 1.0


def test_pyannote_diarization_adapter_graceful_fallback(tmp_path):
    adapter = PyAnnoteDiarizationAdapter()
    segments = [
        {"start_s": 0.0, "end_s": 3.0, "source_text": "Test speech for fallback."}
    ]

    # Without pyannote installed / mock audio, falls back cleanly to heuristic
    results = adapter.diarize(
        audio_path=tmp_path / "non_existent.wav",
        transcript_segments=segments,
    )

    assert len(results) == 1
    assert results[0].speaker_id in ("speaker_1", "speaker_0")


@pytest.mark.asyncio
async def test_story_analyst_with_custom_adapter_injection():
    custom_adapter = CustomMockDiarizer()
    agent = StoryAnalystAgent(adapter=custom_adapter)

    context = {
        "segments": [
            {"start_s": 1.0, "end_s": 4.0, "source_text": "Injected adapter test line."}
        ]
    }

    result = await agent.run(job_id="test-diar-inject", scene_id="scene-01", context=context)

    assert "annotated_segments" in result
    assert result["annotated_segments"][0]["speaker_id"] == "NARRATOR_HERO"
    assert any(s["speaker_id"] == "NARRATOR_HERO" for s in result["speakers"])

    # Telemetry includes adapter name
    events = await telemetry_logger.get_events("test-diar-inject")
    assert any("CustomMockDiarizer" in e.decision or "custom" in e.decision.lower() for e in events)


@pytest.mark.asyncio
async def test_story_analyst_adapter_selection_string():
    agent = StoryAnalystAgent(adapter_type="heuristic")
    context = {
        "segments": [
            {"start_s": 0.0, "end_s": 2.0, "source_text": "Line one"},
            {"start_s": 2.0, "end_s": 4.0, "source_text": "Line two"},
        ],
        "speaker_overrides": {"speaker_1": "Carlos"}
    }

    result = await agent.run(job_id="test-diar-str", scene_id="scene-01", context=context)
    assert result["annotated_segments"][0]["speaker_id"] == "Carlos"
    assert result["adapter_used"] == "heuristic"
