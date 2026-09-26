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


@pytest.mark.asyncio
async def test_translation_en_to_en_skips_ollama_and_prompts_user(translation_stage, tmp_path):
    segments = [
        {"start_s": 0.0, "end_s": 2.0, "source_text": "Welcome to the studio show."},
    ]
    input_artifacts = {"segments": segments}
    config = {
        "run_dir": str(tmp_path),
        "source_language": "en",
        "target_language": "en",
    }
    progress_cb = AsyncMock()
    log_cb = AsyncMock()

    with patch.object(translation_stage, "_call_ollama_translation") as mock_ollama:
        result = await translation_stage.execute(input_artifacts, config, progress_cb, log_cb)

    # Asserts Ollama is NOT called when source and target are both English
    mock_ollama.assert_not_called()
    assert result["status"] == "success"
    assert result["segments"][0]["translated_text"] == "Welcome to the studio show."
    assert (tmp_path / "subtitles_en.srt").exists()
    assert (tmp_path / "subtitles_en.vtt").exists()
    assert (tmp_path / "transcript.json").exists()

    # Asserts prompt log callback was triggered for user checkpoint
    log_calls = [call.args for call in log_cb.call_args_list]
    assert any(args[0] == "PROMPT" for args in log_calls)


@pytest.mark.asyncio
async def test_translation_en_to_en_force_ollama_with_rephrase_enabled(translation_stage, tmp_path):
    segments = [
        {"start_s": 0.0, "end_s": 2.0, "source_text": "Welcome to the studio show."},
    ]
    input_artifacts = {"segments": segments}
    config = {
        "run_dir": str(tmp_path),
        "source_language": "en",
        "target_language": "en",
        "translation_engine": "ollama",
        "rephrase_same_lang": True,
    }
    progress_cb = AsyncMock()
    log_cb = AsyncMock()

    with patch.object(translation_stage, "_call_ollama_translation", return_value=[
        {"start_s": 0.0, "end_s": 2.0, "source_text": "Welcome to the studio show.", "translated_text": "Welcome into our studio broadcast.", "target_language": "en"}
    ]) as mock_ollama:
        result = await translation_stage.execute(input_artifacts, config, progress_cb, log_cb)

    # Asserts Ollama IS called when rephrase is explicitly enabled
    mock_ollama.assert_called_once()
    assert result["status"] == "success"
    assert result["segments"][0]["translated_text"] == "Welcome into our studio broadcast."


@pytest.mark.asyncio
async def test_translation_en_to_en_force_ollama_with_rephrase_skipped(translation_stage, tmp_path):
    segments = [
        {"start_s": 0.0, "end_s": 2.0, "source_text": "Welcome to the studio show."},
    ]
    input_artifacts = {"segments": segments}
    config = {
        "run_dir": str(tmp_path),
        "source_language": "en",
        "target_language": "en",
        "translation_engine": "ollama",
        "rephrase_same_lang": False,  # User clicked Skip
    }
    progress_cb = AsyncMock()
    log_cb = AsyncMock()

    with patch.object(translation_stage, "_call_ollama_translation") as mock_ollama:
        result = await translation_stage.execute(input_artifacts, config, progress_cb, log_cb)

    # Asserts Ollama is NOT called when user clicked skip
    mock_ollama.assert_not_called()
    assert result["status"] == "success"
    assert result["segments"][0]["translated_text"] == "Welcome to the studio show."


@pytest.mark.asyncio
async def test_translation_foreign_to_english_with_ollama_engine(translation_stage, tmp_path):
    segments = [
        {"start_s": 0.0, "end_s": 2.0, "source_text": "Hola amigos, bienvenidos."},
    ]
    input_artifacts = {"segments": segments}
    config = {
        "run_dir": str(tmp_path),
        "source_language": "es",
        "target_language": "en",
        "translation_engine": "ollama",
    }
    progress_cb = AsyncMock()
    log_cb = AsyncMock()

    with patch.object(translation_stage, "_call_ollama_translation", return_value=[
        {"start_s": 0.0, "end_s": 2.0, "source_text": "Hola amigos, bienvenidos.", "translated_text": "Hello friends, welcome.", "target_language": "en"}
    ]) as mock_ollama:
        result = await translation_stage.execute(input_artifacts, config, progress_cb, log_cb)

    # Asserts Ollama IS called for foreign-to-English when translation_engine='ollama'
    mock_ollama.assert_called_once()
    assert result["status"] == "success"
    assert result["segments"][0]["translated_text"] == "Hello friends, welcome."


