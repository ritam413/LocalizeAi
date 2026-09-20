import pytest
from pathlib import Path
from app.agents.voice_director import (
    VoiceDirectorAgent,
    SpeechSynthesisAdapter,
    MockAudioAdapter,
    EdgeTTSAdapter,
    KokoroTTSAdapter,
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
        async def synthesize(self, text: str, voice_id: str, output_path: Path, target_duration_s: float = 3.0, retry_count: int = 0, target_lang: str = "en") -> float:
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


@pytest.mark.asyncio
async def test_kokoro_tts_adapter_chunk_aggregation(tmp_path, monkeypatch):
    adapter = KokoroTTSAdapter(sample_rate=24000)
    output_wav = tmp_path / "kokoro_concat.wav"

    # Mock KPipeline returning multiple chunks
    import numpy as np
    chunk1 = np.ones(2400, dtype=np.float32) * 0.1
    chunk2 = np.ones(4800, dtype=np.float32) * 0.2

    class MockPipeline:
        def __call__(self, text, voice=None, speed=1.0, split_pattern=None):
            return [
                ("Sentence one.", "phonemes_1", chunk1),
                ("Sentence two.", "phonemes_2", chunk2),
            ]

    monkeypatch.setattr(adapter, "_get_pipeline", lambda lang: MockPipeline())

    duration = await adapter.synthesize(
        text="Sentence one. Sentence two.",
        voice_id="af_heart",
        output_path=output_wav,
        target_duration_s=0.3,
        target_lang="en"
    )

    assert output_wav.exists()
    assert duration == round((2400 + 4800) / 24000.0, 3)

    # Verify 16-bit PCM WAV readable by Python stdlib wave module
    import wave
    with wave.open(str(output_wav), "r") as wf:
        assert wf.getframerate() == 24000
        assert wf.getnchannels() == 1
        assert wf.getsampwidth() == 2
        assert wf.getnframes() == 2400 + 4800


@pytest.mark.asyncio
async def test_kokoro_tts_adapter_pause_silence(tmp_path):
    adapter = KokoroTTSAdapter(sample_rate=24000)
    output_wav = tmp_path / "pause_silence.wav"

    duration = await adapter.synthesize(
        text="...",
        voice_id="af_heart",
        output_path=output_wav,
        target_duration_s=1.5,
        target_lang="en"
    )

    assert output_wav.exists()
    assert duration == 1.5

    import wave
    with wave.open(str(output_wav), "r") as wf:
        assert wf.getframerate() == 24000
        assert wf.getsampwidth() == 2
        assert wf.getnframes() == int(1.5 * 24000)


@pytest.mark.asyncio
async def test_kokoro_tts_adapter_unsupported_language_fallback(tmp_path, monkeypatch):
    adapter = KokoroTTSAdapter(sample_rate=24000)
    output_wav = tmp_path / "german_fallback.wav"

    # German has kokoro_lang_code=None -> triggers EdgeTTS fallback
    # Mock EdgeTTSAdapter.synthesize to return deterministic duration
    async def mock_edge_synthesize(self, text, voice_id, output_path, target_duration_s=3.0, retry_count=0, target_lang="de"):
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
        assert "Katja" in voice_id or "Conrad" in voice_id
        return 2.5

    monkeypatch.setattr(EdgeTTSAdapter, "synthesize", mock_edge_synthesize)

    duration = await adapter.synthesize(
        text="Guten Tag",
        voice_id="de-DE-KatjaNeural",
        output_path=output_wav,
        target_duration_s=2.5,
        target_lang="de"
    )
    assert duration == 2.5
    assert output_wav.exists()


@pytest.mark.asyncio
async def test_kokoro_tts_adapter_exception_fallback(tmp_path, monkeypatch):
    adapter = KokoroTTSAdapter(sample_rate=24000)
    output_wav = tmp_path / "exception_fallback.wav"

    def faulty_pipeline(lang):
        raise RuntimeError("espeak-ng not installed on your system")

    monkeypatch.setattr(adapter, "_get_pipeline", faulty_pipeline)

    async def mock_edge_synthesize(self, text, voice_id, output_path, target_duration_s=3.0, retry_count=0, target_lang="hi"):
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
        return target_duration_s

    monkeypatch.setattr(EdgeTTSAdapter, "synthesize", mock_edge_synthesize)

    duration = await adapter.synthesize(
        text="नमस्ते दोस्त",
        voice_id="hf_alpha",
        output_path=output_wav,
        target_duration_s=3.0,
        target_lang="hi"
    )
    assert duration == 3.0
    assert output_wav.exists()


@pytest.mark.asyncio
async def test_voice_director_agent_kokoro_wiring(tmp_path, monkeypatch):
    agent = VoiceDirectorAgent(base_storage_dir=str(tmp_path), adapter_type="kokoro")
    assert agent.adapter_type == "kokoro"
    assert isinstance(agent.adapter, KokoroTTSAdapter)

    # Mock synthesize to avoid real inference in test
    async def mock_synthesize(text, voice_id, output_path, target_duration_s=3.0, retry_count=0, target_lang="en"):
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
        return target_duration_s

    monkeypatch.setattr(agent.adapter, "synthesize", mock_synthesize)

    context = {
        "target_language": "hi",
        "speakers": [
            {"speaker_id": "spk_1", "gender": "male"},
            {"speaker_id": "spk_2", "gender": "female"}
        ],
        "localized_lines": [
            {"segment_id": 1, "speaker_id": "spk_1", "start_s": 0.0, "end_s": 3.0, "translated_text": "नमस्ते दोस्त"}
        ]
    }

    result = await agent.run(job_id="test-job-kokoro", scene_id="scene-01", context=context)
    assert result["adapter_used"] == "kokoro"
    assert result["target_language"] == "hi"
    assert result["voice_cast"][0]["voice_id"] == "hm_omega"
    assert result["voice_cast"][1]["voice_id"] == "hf_alpha"
    assert len(result["synthesized_stems"]) == 1


