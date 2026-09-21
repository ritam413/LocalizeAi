"""
Acoustic Mastering Engine Stage (TICKET-13)
Collapses stem timeline positioning, multitrack timeline compositing,
dynamic sidechain ducking (-6dB on background M&E during dialogue),
and EBU R128 (-24 LUFS) broadcast loudness mastering into a unified module.
"""

from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Union


@dataclass
class DialogueSegmentInput:
    audio_path: Union[str, Path]
    start_s: float
    end_s: float
    duration_s: float
    metadata: Dict[str, Any] = field(default_factory=dict)


class AcousticMasteringEngine:
    """
    Unified engine for timeline compositing, dynamic sidechain ducking,
    and broadcast EBU R128 loudness mastering.
    """

    def __init__(self, ffmpeg_bin: Optional[str] = None):
        self.ffmpeg_bin = ffmpeg_bin or shutil.which("ffmpeg") or "ffmpeg"

    async def _run_command(self, cmd: List[str]) -> None:
        """Run an async subprocess command."""
        def _exec():
            return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        res = await asyncio.to_thread(_exec)
        if res.returncode != 0:
            err_msg = res.stderr or "Unknown error"
            raise RuntimeError(f"FFmpeg execution failed (exit code {res.returncode}): {err_msg}")

    def build_composite_dialogue_filtergraph(
        self,
        dialogue_segments: List[Union[Dict[str, Any], DialogueSegmentInput]],
    ) -> tuple[List[str], str]:
        """
        Construct the FFmpeg filtergraph inputs and adelay/amix filter string
        for compositing multiple dialogue segments.
        """
        inputs: List[str] = []
        delay_filters: List[str] = []

        for idx, segment in enumerate(dialogue_segments):
            if isinstance(segment, DialogueSegmentInput):
                path = str(segment.audio_path)
                start_s = segment.start_s
            else:
                path = str(segment.get("audio_path", ""))
                start_s = float(segment.get("start_s", 0.0))

            start_ms = max(0, int(start_s * 1000))
            inputs.extend(["-i", path])
            # adelay format: start_ms|start_ms for stereo/multichannel
            delay_filters.append(f"[{idx}:a]adelay={start_ms}|{start_ms}[d{idx}]")

        n_inputs = len(dialogue_segments)
        if n_inputs == 0:
            return [], ""

        delayed_labels = "".join([f"[d{i}]" for i in range(n_inputs)])
        amix_filter = f"{delayed_labels}amix=inputs={n_inputs}:dropout_transition=0:normalize=0:duration=longest[dialogue_bus]"
        filter_str = ";".join(delay_filters) + ";" + amix_filter

        return inputs, filter_str

    async def composite_dialogue_bus(
        self,
        dialogue_segments: List[Union[Dict[str, Any], DialogueSegmentInput]],
        output_path: Union[str, Path],
    ) -> Path:
        """
        Composite multiple timestamped dialogue audio stems into a single
        continuous dialogue bus using scalable -filter_complex_script.
        """
        import uuid

        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        # 1. Defensively filter for valid, existing stem files
        valid_segments: List[Union[Dict[str, Any], DialogueSegmentInput]] = []
        for s in dialogue_segments:
            path_str = str(s.audio_path if isinstance(s, DialogueSegmentInput) else s.get("audio_path", ""))
            if path_str:
                p = Path(path_str)
                if p.exists() and p.stat().st_size > 0:
                    valid_segments.append(s)

        if not valid_segments:
            # 1.0s silence fallback if empty or all stems invalid
            cmd = [
                self.ffmpeg_bin,
                "-y",
                "-f", "lavfi",
                "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
                "-t", "1.0",
                str(out),
            ]
            await self._run_command(cmd)
            return out

        inputs, filter_str = self.build_composite_dialogue_filtergraph(valid_segments)

        # 2. UUID-isolated temporary script file with strict LF encoding
        script_file = out.parent / f".filtergraph_{uuid.uuid4().hex[:8]}.tmp.txt"
        try:
            with open(script_file, "w", encoding="utf-8", newline="\n") as f:
                f.write(filter_str)

            cmd = [
                self.ffmpeg_bin,
                "-y",
                *inputs,
                "-filter_complex_script", str(script_file),
                "-map", "[dialogue_bus]",
                "-c:a", "pcm_s16le",
                str(out),
            ]
            await self._run_command(cmd)
        finally:
            if script_file.exists():
                script_file.unlink(missing_ok=True)

        return out

    def build_sidechain_ducking_filtergraph(
        self,
        ducking_db: float = -6.0,
    ) -> str:
        """
        Build the sidechain compression filter string to duck background audio
        when dialogue is active.
        """
        # Threshold: 0.05, Ratio: 4:1 (yielding ~ -6dB ducking), attack 20ms, release 250ms
        ratio = max(1.5, abs(ducking_db) / 1.5)
        return (
            f"[0:a][1:a]sidechaincompress="
            f"threshold=0.05:"
            f"ratio={ratio:.1f}:"
            f"attack=20:"
            f"release=250:"
            f"level_in=1[ducked_bg]"
        )

    async def apply_sidechain_ducking(
        self,
        background_audio_path: Optional[Union[str, Path]],
        dialogue_bus_path: Union[str, Path],
        output_path: Union[str, Path],
        ducking_db: float = -6.0,
    ) -> Path:
        """
        Ducks background audio using dialogue bus as sidechain control signal,
        and mixes dialogue with ducked background.
        """
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        if not background_audio_path or not Path(background_audio_path).exists():
            # If no background track, copy/transcode dialogue bus directly
            shutil.copyfile(str(dialogue_bus_path), str(out))
            return out

        sidechain_filter = self.build_sidechain_ducking_filtergraph(ducking_db=ducking_db)
        filter_complex = (
            f"{sidechain_filter};"
            f"[ducked_bg][1:a]amix=inputs=2:dropout_transition=0:normalize=0:duration=first[mixed]"
        )

        cmd = [
            self.ffmpeg_bin,
            "-y",
            "-i", str(background_audio_path),
            "-i", str(dialogue_bus_path),
            "-filter_complex", filter_complex,
            "-map", "[mixed]",
            "-c:a", "pcm_s16le",
            str(out),
        ]
        await self._run_command(cmd)
        return out

    async def master_ebu_r128(
        self,
        input_audio_path: Union[str, Path],
        output_path: Union[str, Path],
        target_lufs: float = -24.0,
        true_peak: float = -2.0,
    ) -> Path:
        """
        Master audio track to EBU R128 broadcast standard (-24.0 LUFS ±0.5 LUFS).
        """
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        loudnorm_filter = f"loudnorm=I={target_lufs:.1f}:LRA=7.0:TP={true_peak:.1f}"
        cmd = [
            self.ffmpeg_bin,
            "-y",
            "-i", str(input_audio_path),
            "-filter:a", loudnorm_filter,
            "-c:a", "pcm_s16le",
            str(out),
        ]
        await self._run_command(cmd)
        return out

    async def master_mix(
        self,
        job_id: str,
        background_audio_path: Optional[Union[str, Path]],
        dialogue_segments: List[Union[Dict[str, Any], DialogueSegmentInput]],
        output_path: Union[str, Path],
        ducking_db: float = -6.0,
        target_lufs: float = -24.0,
    ) -> Path:
        """
        Main high-leverage entry point:
        1. Composites dialogue segments into dialogue bus.
        2. Dynamically ducks background M&E track (-6dB during speech).
        3. Normalizes mixed audio to EBU R128 (-24 LUFS).
        """
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        temp_dir = out.parent / f"_temp_mix_{job_id}"
        temp_dir.mkdir(parents=True, exist_ok=True)

        try:
            dialogue_bus_file = temp_dir / "dialogue_bus.wav"
            mixed_bus_file = temp_dir / "mixed_unmastered.wav"

            # 1. Composite dialogue bus
            await self.composite_dialogue_bus(dialogue_segments, dialogue_bus_file)

            # 2. Apply sidechain ducking and mix with background M&E
            await self.apply_sidechain_ducking(
                background_audio_path=background_audio_path,
                dialogue_bus_path=dialogue_bus_file,
                output_path=mixed_bus_file,
                ducking_db=ducking_db,
            )

            # 3. Apply EBU R128 broadcast mastering
            await self.master_ebu_r128(
                input_audio_path=mixed_bus_file,
                output_path=out,
                target_lufs=target_lufs,
            )

            return out
        finally:
            if temp_dir.exists():
                shutil.rmtree(temp_dir, ignore_errors=True)


from app.engine.stage import BaseStage, ProgressCallback, LogCallback


class MasteringStage(BaseStage):
    """
    Stage wrapper for acoustic mastering, sidechain ducking, and EBU R128 loudness normalization.
    """

    def __init__(self):
        super().__init__("remix", gpu_required=False)
        self.engine = AcousticMasteringEngine()

    @staticmethod
    def _build_dialogue_segment_inputs(stems: List[Dict[str, Any]]) -> List[DialogueSegmentInput]:
        """Maps stem dictionaries to strongly-typed DialogueSegmentInput instances."""
        inputs = []
        for s in stems:
            path = s.get("aligned_path") or s.get("audio_path")
            start_s = float(s.get("start_s", 0.0))
            duration_s = float(s.get("final_duration_s", s.get("synthesized_duration_s", 1.0)))
            end_s = float(s.get("end_s", start_s + duration_s))
            inputs.append(DialogueSegmentInput(
                audio_path=path,
                start_s=start_s,
                end_s=end_s,
                duration_s=duration_s
            ))
        return inputs

    async def execute(
        self,
        input_artifacts: Dict[str, Any],
        config: Dict[str, Any],
        progress_cb: ProgressCallback,
        log_cb: LogCallback
    ) -> Dict[str, Any]:
        run_dir = Path(config.get("run_dir", "./storage/runs/default"))
        stems = input_artifacts.get("aligned_stems") or input_artifacts.get("synthesized_stems", [])
        bg_audio = input_artifacts.get("background_path")
        ducking_db = float(config.get("ducking_db", -6.0))
        target_lufs = float(config.get("target_lufs", -24.0))

        await log_cb("INFO", f"Compositing dialogue bus for {len(stems)} stems...")
        await progress_cb(20.0, "Compositing dialogue stems")

        dialogue_bus = run_dir / "dialogue_bus.wav"
        segments_input = self._build_dialogue_segment_inputs(stems)
        await self.engine.composite_dialogue_bus(segments_input, dialogue_bus)

        mixed_unmastered = run_dir / "mixed_unmastered.wav"
        has_background = bool(bg_audio and Path(bg_audio).exists() and Path(bg_audio).stat().st_size > 0)

        if has_background:
            await log_cb("INFO", f"Applying sidechain ducking ({ducking_db}dB) to background M&E...")
            await progress_cb(50.0, "Applying dynamic ducking")
            await self.engine.apply_sidechain_ducking(bg_audio, dialogue_bus, mixed_unmastered, ducking_db=ducking_db)
        else:
            shutil.copyfile(str(dialogue_bus), str(mixed_unmastered))

        mastered_audio = run_dir / "mastered_audio.wav"
        await log_cb("INFO", f"Mastering final mixdown to EBU R128 ({target_lufs} LUFS)...")
        await progress_cb(80.0, "Mastering loudness")
        await self.engine.master_ebu_r128(mixed_unmastered, mastered_audio, target_lufs=target_lufs)

        await progress_cb(100.0, "Acoustic mastering complete")
        return {
            "status": "success",
            "mastered_audio_path": str(mastered_audio),
            "dialogue_bus_path": str(dialogue_bus),
            "artifacts": [
                {"type": "audio", "label": "Dialogue Bus (WAV)", "path": str(dialogue_bus)},
                {"type": "audio", "label": "Mastered Soundtrack (WAV)", "path": str(mastered_audio)}
            ]
        }


