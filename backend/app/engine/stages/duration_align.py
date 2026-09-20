import asyncio
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Tuple
from app.engine.stage import BaseStage, ProgressCallback, LogCallback


class DurationAlignStage(BaseStage):
    """
    Reconciles synthesized speech stem durations against original dialogue windows
    using FFmpeg atempo speed adjustments.
    """

    def __init__(self):
        super().__init__("duration_align", gpu_required=False)
        self.ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"

    async def _run_atempo_filter(self, source_path: Path, dest_path: Path, speed_factor: float) -> None:
        """Executes FFmpeg atempo filter to time-stretch or compress dialogue audio."""
        cmd = [
            self.ffmpeg_bin, "-y",
            "-i", str(source_path),
            "-filter:a", f"atempo={speed_factor}",
            "-c:a", "pcm_s16le",
            str(dest_path)
        ]
        def _run():
            return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        await asyncio.to_thread(_run)

    async def _align_single_stem(
        self,
        stem: Dict[str, Any],
        aligned_dir: Path,
        tolerance_s: float
    ) -> Dict[str, Any]:
        """Reconciles duration for an individual dialogue stem."""
        seg_id = stem.get("segment_id", 1)
        raw_duration_s = max(0.1, float(stem.get("synthesized_duration_s", 3.0)))
        target_duration_s = max(0.1, float(stem.get("target_duration_s", 3.0)))
        source_audio_path = Path(stem.get("audio_path", ""))
        duration_delta = abs(raw_duration_s - target_duration_s)

        aligned_path = aligned_dir / f"aligned_seg_{seg_id}.wav"

        if duration_delta <= tolerance_s or not source_audio_path.exists():
            if source_audio_path.exists():
                shutil.copyfile(str(source_audio_path), str(aligned_path))
            speed_factor = 1.0
            strategy = "passthrough"
        else:
            speed_factor = max(0.75, min(1.35, round(raw_duration_s / target_duration_s, 3)))
            strategy = "speed_adjust_atempo"
            await self._run_atempo_filter(source_audio_path, aligned_path, speed_factor)

        final_duration_s = round(raw_duration_s / speed_factor, 3)
        return {
            **stem,
            "audio_path": str(aligned_path),
            "aligned_path": str(aligned_path),
            "final_duration_s": final_duration_s,
            "strategy": strategy,
            "atempo_factor": speed_factor,
        }

    async def execute(
        self,
        input_artifacts: Dict[str, Any],
        config: Dict[str, Any],
        progress_cb: ProgressCallback,
        log_cb: LogCallback
    ) -> Dict[str, Any]:
        run_dir = Path(config.get("run_dir", "./storage/runs/default"))
        stems = input_artifacts.get("synthesized_stems", [])
        tolerance_s = float(config.get("tolerance_s", 0.05))

        aligned_dir = run_dir / "aligned"
        aligned_dir.mkdir(parents=True, exist_ok=True)

        await log_cb("INFO", f"Reconciling duration for {len(stems)} speech stems...")
        await progress_cb(10.0, "Analyzing timing windows")

        aligned_stems: List[Dict[str, Any]] = []
        for stem in stems:
            aligned_entry = await self._align_single_stem(stem, aligned_dir, tolerance_s)
            aligned_stems.append(aligned_entry)

        await log_cb("INFO", f"Timing reconciliation complete for {len(aligned_stems)} stems.")
        await progress_cb(100.0, "Duration alignment complete")

        return {
            "status": "success",
            "aligned_stems": aligned_stems,
            "sync_adjustments": aligned_stems,
            "artifacts": [
                {"type": "audio", "label": "Aligned Dialogue Stems", "path": str(aligned_dir)}
            ]
        }
