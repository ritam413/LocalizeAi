"""
Unit and integration tests for AcousticMasteringEngine (TICKET-13).
Verifies multitrack dialogue compositing, dynamic sidechain ducking (-6dB),
and EBU R128 loudness normalization.
"""

from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest

from app.engine.stages.mixer import (
    AcousticMasteringEngine,
    DialogueSegmentInput,
)


@pytest.fixture
def mixer():
    return AcousticMasteringEngine(ffmpeg_bin="ffmpeg")


def test_build_composite_dialogue_filtergraph_empty(mixer):
    inputs, filter_str = mixer.build_composite_dialogue_filtergraph([])
    assert inputs == []
    assert filter_str == ""


def test_build_composite_dialogue_filtergraph_multiple_stems(mixer):
    segments = [
        {"audio_path": "/tmp/stem_0.wav", "start_s": 0.5, "end_s": 2.0},
        {"audio_path": "/tmp/stem_1.wav", "start_s": 3.25, "end_s": 5.0},
    ]
    inputs, filter_str = mixer.build_composite_dialogue_filtergraph(segments)

    assert inputs == ["-i", "/tmp/stem_0.wav", "-i", "/tmp/stem_1.wav"]
    assert "[0:a]adelay=500|500[d0]" in filter_str
    assert "[1:a]adelay=3250|3250[d1]" in filter_str
    assert "amix=inputs=2:dropout_transition=0:normalize=0[dialogue_bus]" in filter_str


def test_build_composite_dialogue_filtergraph_with_dataclass(mixer):
    segments = [
        DialogueSegmentInput(audio_path="/tmp/stem_0.wav", start_s=1.0, end_s=2.5, duration_s=1.5),
    ]
    inputs, filter_str = mixer.build_composite_dialogue_filtergraph(segments)

    assert inputs == ["-i", "/tmp/stem_0.wav"]
    assert "[0:a]adelay=1000|1000[d0]" in filter_str
    assert "amix=inputs=1:dropout_transition=0:normalize=0[dialogue_bus]" in filter_str


def test_build_sidechain_ducking_filtergraph(mixer):
    filter_str = mixer.build_sidechain_ducking_filtergraph(ducking_db=-6.0)
    assert "sidechaincompress=" in filter_str
    assert "threshold=0.05" in filter_str
    assert "attack=20" in filter_str
    assert "release=250" in filter_str
    assert "ratio=4.0" in filter_str
    assert "[ducked_bg]" in filter_str


@pytest.mark.asyncio
async def test_composite_dialogue_bus_empty(mixer, tmp_path):
    out_file = tmp_path / "dialogue_bus.wav"
    with patch.object(mixer, "_run_command", new_callable=AsyncMock) as mock_run:
        res = await mixer.composite_dialogue_bus([], out_file)
        assert res == out_file
        mock_run.assert_awaited_once()
        cmd = mock_run.await_args[0][0]
        assert "anullsrc=" in " ".join(cmd)


@pytest.mark.asyncio
async def test_composite_dialogue_bus_stems(mixer, tmp_path):
    out_file = tmp_path / "dialogue_bus.wav"
    segments = [
        {"audio_path": "/tmp/stem_0.wav", "start_s": 0.5, "end_s": 2.0},
    ]
    with patch.object(mixer, "_run_command", new_callable=AsyncMock) as mock_run:
        res = await mixer.composite_dialogue_bus(segments, out_file)
        assert res == out_file
        mock_run.assert_awaited_once()
        cmd = mock_run.await_args[0][0]
        assert "-filter_complex" in cmd
        assert "[dialogue_bus]" in cmd


@pytest.mark.asyncio
async def test_apply_sidechain_ducking_without_background(mixer, tmp_path):
    dialogue_bus = tmp_path / "dialogue_bus.wav"
    dialogue_bus.write_text("fake_audio_content")
    out_file = tmp_path / "mixed.wav"

    res = await mixer.apply_sidechain_ducking(
        background_audio_path=None,
        dialogue_bus_path=dialogue_bus,
        output_path=out_file,
    )
    assert res == out_file
    assert out_file.exists()
    assert out_file.read_text() == "fake_audio_content"


@pytest.mark.asyncio
async def test_apply_sidechain_ducking_with_background(mixer, tmp_path):
    bg_file = tmp_path / "background.wav"
    bg_file.write_text("fake_bg_audio")
    dialogue_bus = tmp_path / "dialogue_bus.wav"
    dialogue_bus.write_text("fake_dialogue_audio")
    out_file = tmp_path / "mixed.wav"

    with patch.object(mixer, "_run_command", new_callable=AsyncMock) as mock_run:
        res = await mixer.apply_sidechain_ducking(
            background_audio_path=bg_file,
            dialogue_bus_path=dialogue_bus,
            output_path=out_file,
            ducking_db=-6.0,
        )
        assert res == out_file
        mock_run.assert_awaited_once()
        cmd = mock_run.await_args[0][0]
        assert "sidechaincompress=" in " ".join(cmd)
        assert "amix=inputs=2" in " ".join(cmd)


@pytest.mark.asyncio
async def test_master_ebu_r128(mixer, tmp_path):
    in_file = tmp_path / "unmastered.wav"
    out_file = tmp_path / "mastered.wav"

    with patch.object(mixer, "_run_command", new_callable=AsyncMock) as mock_run:
        res = await mixer.master_ebu_r128(
            input_audio_path=in_file,
            output_path=out_file,
            target_lufs=-24.0,
            true_peak=-2.0,
        )
        assert res == out_file
        mock_run.assert_awaited_once()
        cmd = mock_run.await_args[0][0]
        assert "loudnorm=I=-24.0:LRA=7.0:TP=-2.0" in " ".join(cmd)


@pytest.mark.asyncio
async def test_master_mix_end_to_end(mixer, tmp_path):
    bg_file = tmp_path / "background.wav"
    bg_file.write_text("fake_bg")
    out_file = tmp_path / "final_master.wav"
    segments = [
        {"audio_path": "/tmp/stem_0.wav", "start_s": 0.5, "end_s": 2.0},
        {"audio_path": "/tmp/stem_1.wav", "start_s": 3.0, "end_s": 4.5},
    ]

    with patch.object(mixer, "composite_dialogue_bus", new_callable=AsyncMock) as mock_comp, \
         patch.object(mixer, "apply_sidechain_ducking", new_callable=AsyncMock) as mock_duck, \
         patch.object(mixer, "master_ebu_r128", new_callable=AsyncMock) as mock_master:

        mock_comp.return_value = tmp_path / "dialogue_bus.wav"
        mock_duck.return_value = tmp_path / "mixed_unmastered.wav"
        mock_master.return_value = out_file

        res = await mixer.master_mix(
            job_id="job_test_123",
            background_audio_path=bg_file,
            dialogue_segments=segments,
            output_path=out_file,
            ducking_db=-6.0,
            target_lufs=-24.0,
        )

        assert res == out_file
        mock_comp.assert_awaited_once()
        mock_duck.assert_awaited_once()
        mock_master.assert_awaited_once()
