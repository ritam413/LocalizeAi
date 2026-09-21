import pytest
import asyncio
from pathlib import Path
from unittest.mock import AsyncMock, patch
from app.engine.stages.translation import TranslationStage


@pytest.fixture
def translation_stage():
    return TranslationStage()


@pytest.mark.asyncio
async def test_translation_en_to_hi_pipeline(translation_stage, tmp_path):
    segments = [
        {"start_s": 0.5, "end_s": 2.0, "source_text": "Hello, how are you today?"},
        {"start_s": 2.2, "end_s": 4.5, "source_text": "I got 2.4k followers on YouTube."},
    ]
    input_artifacts = {"segments": segments}
    config = {
        "run_dir": str(tmp_path),
        "source_language": "en",
        "target_language": "hi",
    }
    progress_cb = AsyncMock()
    log_cb = AsyncMock()

    with patch.object(translation_stage, "_call_ollama_translation", return_value=[
        {"start_s": 0.5, "end_s": 2.0, "source_text": "Hello, how are you today?", "translated_text": "नमस्ते, आज आप कैसे हैं?", "target_language": "hi"},
        {"start_s": 2.2, "end_s": 4.5, "source_text": "I got 2.4k followers on YouTube.", "translated_text": "मुझे YouTube पर 2.4 hazar फॉलोअर्स मिले।", "target_language": "hi"},
    ]):
        result = await translation_stage.execute(input_artifacts, config, progress_cb, log_cb)

    assert result["status"] == "success"
    assert len(result["segments"]) == 2
    assert "नमस्ते" in result["segments"][0]["translated_text"]
    assert (tmp_path / "subtitles_hi.srt").exists()
    assert (tmp_path / "subtitles_hi.vtt").exists()


@pytest.mark.asyncio
async def test_translation_hi_to_ja_subtitle_pipeline(translation_stage, tmp_path):
    segments = [
        {"start_s": 1.0, "end_s": 3.0, "source_text": "यह एक बहुत ही महत्वपूर्ण प्रोजेक्ट है।"},
    ]
    input_artifacts = {"segments": segments}
    config = {
        "run_dir": str(tmp_path),
        "source_language": "hi",
        "target_language": "ja",
    }
    progress_cb = AsyncMock()
    log_cb = AsyncMock()

    with patch.object(translation_stage, "_call_ollama_translation", return_value=[
        {"start_s": 1.0, "end_s": 3.0, "source_text": "यह एक बहुत ही महत्वपूर्ण प्रोजेक्ट है।", "translated_text": "これは非常に重要なプロジェクトです。", "target_language": "ja"},
    ]):
        result = await translation_stage.execute(input_artifacts, config, progress_cb, log_cb)

    assert result["status"] == "success"
    assert "プロジェクト" in result["segments"][0]["translated_text"]
    assert (tmp_path / "subtitles_ja.srt").exists()
    assert (tmp_path / "subtitles_ja.vtt").exists()


@pytest.mark.asyncio
async def test_translation_alias_normalization(translation_stage, tmp_path):
    segments = [
        {"start_s": 0.0, "end_s": 1.5, "source_text": "Bienvenido al sistema."},
    ]
    input_artifacts = {"segments": segments}
    config = {
        "run_dir": str(tmp_path),
        "source_language": "sp",  # Alias for 'es'
        "target_language": "jp",  # Alias for 'ja'
    }
    progress_cb = AsyncMock()
    log_cb = AsyncMock()

    with patch.object(translation_stage, "_call_ollama_translation", return_value=[
        {"start_s": 0.0, "end_s": 1.5, "source_text": "Bienvenido al sistema.", "translated_text": "システムへようこそ。", "target_language": "ja"},
    ]):
        result = await translation_stage.execute(input_artifacts, config, progress_cb, log_cb)

    assert result["status"] == "success"
    assert (tmp_path / "subtitles_ja.srt").exists()
    assert (tmp_path / "subtitles_ja.vtt").exists()
