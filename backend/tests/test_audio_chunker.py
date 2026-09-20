import pytest
import wave
import struct
from pathlib import Path
from app.engine.audio_chunker import AudioChunker, AudioChunk

def create_test_wav(path: Path, duration_s: float, sample_rate: int = 16000, num_channels: int = 1):
    path.parent.mkdir(parents=True, exist_ok=True)
    n_frames = int(duration_s * sample_rate)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(num_channels)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        # Write quiet dummy sine/silence audio
        data = struct.pack(f"<{n_frames}h", *[0] * n_frames)
        wf.writeframes(data)

def test_audio_chunker_short_audio_single_chunk(tmp_path: Path):
    audio_path = tmp_path / "short.wav"
    create_test_wav(audio_path, duration_s=15.0)
    chunks_dir = tmp_path / "chunks"
    
    chunks = AudioChunker.split_audio(str(audio_path), str(chunks_dir), target_chunk_s=60.0)
    assert len(chunks) == 1
    assert chunks[0].index == 0
    assert chunks[0].start_offset_s == 0.0
    assert chunks[0].end_offset_s == pytest.approx(15.0, rel=0.05)
    assert Path(chunks[0].path).exists()

def test_audio_chunker_multi_chunk_division(tmp_path: Path):
    audio_path = tmp_path / "long.wav"
    create_test_wav(audio_path, duration_s=150.0)
    chunks_dir = tmp_path / "chunks"
    
    chunks = AudioChunker.split_audio(str(audio_path), str(chunks_dir), target_chunk_s=60.0)
    assert len(chunks) == 3
    assert chunks[0].index == 0
    assert chunks[0].start_offset_s == 0.0
    assert chunks[0].end_offset_s == pytest.approx(60.0, rel=0.05)
    
    assert chunks[1].index == 1
    assert chunks[1].start_offset_s == pytest.approx(60.0, rel=0.05)
    assert chunks[1].end_offset_s == pytest.approx(120.0, rel=0.05)
    
    assert chunks[2].index == 2
    assert chunks[2].start_offset_s == pytest.approx(120.0, rel=0.05)
    assert chunks[2].end_offset_s == pytest.approx(150.0, rel=0.05)
    
    for c in chunks:
        assert Path(c.path).exists()
        assert Path(c.path).stat().st_size > 44  # WAV header + data
