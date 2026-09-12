import pytest
from pathlib import Path
from app.agents.voice_director import (
    VoiceDirectorAgent,
    SpeechSynthesisAdapter,
    MockAudioAdapter,
    EdgeTTSAdapter,
    DEFAULT_VOICE_MAP,
)
from app.telemetry.events import telemetry_logger

@pytest.mark.asyncio
async def test_mock_audio_adapter(tmp_path):
    adapter = MockAudioAdapter()
    wav_path = tmp_path / "mock_test.wav"
    duration = await adapter.synthesize(
        text="Hello world",
        voice_id="en-US-GuyNeural",
        output_path=wav_path,
        target_duration_s=2.5,
        retry_count=0
    )
    assert wav_path.exists()
    assert duration > 0.0
    assert duration == round(2.5 * 1.12, 3)

@pytest.mark.asyncio
async def test_voice_director_casting_and_synthesis(tmp_path):
    agent = VoiceDirectorAgent(base_storage_dir=str(tmp_path), adapter_type="mock")
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
    assert result["adapter_used"] == "mock"
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

@pytest.mark.asyncio
async def test_voice_director_custom_adapter_injection(tmp_path):
    class CustomTestAdapter(SpeechSynthesisAdapter):
        name = "custom_fast"
        async def synthesize(self, text: str, voice_id: str, output_path: Path, target_duration_s: float = 3.0, retry_count: int = 0) -> float:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
            return target_duration_s

    custom_agent = VoiceDirectorAgent(base_storage_dir=str(tmp_path), adapter=CustomTestAdapter())
    context = {
        "target_language": "es",
        "speakers": [{"speaker_id": "spk_1", "gender": "male"}],
        "localized_lines": [{"segment_id": 1, "speaker_id": "spk_1", "start_s": 0.0, "end_s": 4.0, "translated_text": "Hola"}]
    }

    result = await custom_agent.run(job_id="test-job-custom", scene_id="scene-01", context=context)
    assert result["adapter_used"] == "custom_fast"
    assert result["voice_cast"][0]["voice_id"] == "es-ES-AlvaroNeural"
    assert result["synthesized_stems"][0]["synthesized_duration_s"] == 4.0

@pytest.mark.asyncio
async def test_voice_director_multilingual_voice_maps(tmp_path):
    for lang, expected_male, expected_female in [
        ("es", "es-ES-AlvaroNeural", "es-ES-ElviraNeural"),
        ("fr", "fr-FR-HenriNeural", "fr-FR-DeniseNeural"),
        ("de", "de-DE-ConradNeural", "de-DE-KatjaNeural"),
        ("ja", "ja-JP-KeitaNeural", "ja-JP-NanamiNeural"),
        ("en", "en-US-GuyNeural", "en-US-JennyNeural"),
    ]:
        agent = VoiceDirectorAgent(base_storage_dir=str(tmp_path), adapter_type="mock")
        context = {
            "target_language": lang,
            "speakers": [
                {"speaker_id": "m1", "gender": "male"},
                {"speaker_id": "f1", "gender": "female"}
            ],
            "localized_lines": []
        }
        res = await agent.run(job_id=f"test-cast-{lang}", scene_id="scene-01", context=context)
        assert res["voice_cast"][0]["voice_id"] == expected_male
        assert res["voice_cast"][1]["voice_id"] == expected_female

