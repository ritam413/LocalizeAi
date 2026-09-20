import os
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional


@dataclass
class AudioChunk:
    index: int
    path: str
    start_offset_s: float
    end_offset_s: float
    duration_s: float


class AudioChunker:
    """
    Splits audio into windowed chunks with millisecond precision start/end offsets.
    Standardized on 16kHz mono 16-bit PCM WAV.
    """

    @classmethod
    def split_audio(
        cls,
        audio_path: str,
        output_dir: str,
        target_chunk_s: float = 60.0,
    ) -> List[AudioChunk]:
        """
        Splits a WAV audio file into chunks of approximately target_chunk_s duration.
        """
        in_path = Path(audio_path)
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        if not in_path.exists() or in_path.stat().st_size == 0:
            return []

        chunks: List[AudioChunk] = []

        with wave.open(str(in_path), "rb") as wf:
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            total_frames = wf.getnframes()
            total_duration_s = total_frames / float(framerate)

            if total_duration_s <= target_chunk_s:
                chunk_file = out_dir / "chunk_000.wav"
                if not chunk_file.exists():
                    frames = wf.readframes(total_frames)
                    with wave.open(str(chunk_file), "wb") as out_wf:
                        out_wf.setnchannels(n_channels)
                        out_wf.setsampwidth(sampwidth)
                        out_wf.setframerate(framerate)
                        out_wf.writeframes(frames)

                return [
                    AudioChunk(
                        index=0,
                        path=str(chunk_file),
                        start_offset_s=0.0,
                        end_offset_s=round(total_duration_s, 3),
                        duration_s=round(total_duration_s, 3),
                    )
                ]

            frames_per_chunk = int(target_chunk_s * framerate)
            chunk_idx = 0
            curr_frame = 0

            while curr_frame < total_frames:
                remaining_frames = total_frames - curr_frame
                chunk_frames_count = min(frames_per_chunk, remaining_frames)
                start_offset_s = round(curr_frame / float(framerate), 3)
                end_offset_s = round((curr_frame + chunk_frames_count) / float(framerate), 3)
                duration_s = round(end_offset_s - start_offset_s, 3)

                chunk_file = out_dir / f"chunk_{chunk_idx:03d}.wav"
                
                # Seek & read frames
                wf.setpos(curr_frame)
                frames_data = wf.readframes(chunk_frames_count)

                with wave.open(str(chunk_file), "wb") as out_wf:
                    out_wf.setnchannels(n_channels)
                    out_wf.setsampwidth(sampwidth)
                    out_wf.setframerate(framerate)
                    out_wf.writeframes(frames_data)

                chunks.append(
                    AudioChunk(
                        index=chunk_idx,
                        path=str(chunk_file),
                        start_offset_s=start_offset_s,
                        end_offset_s=end_offset_s,
                        duration_s=duration_s,
                    )
                )

                curr_frame += chunk_frames_count
                chunk_idx += 1

        return chunks
