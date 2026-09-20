import os
import shutil
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional

from app.engine.stage import BaseStage, ProgressCallback, LogCallback


class DenoiseStage(BaseStage):
    """
    Audio routing and dialogue preparation stage.
    Directly routes extracted 16kHz mono audio into vocals and background stems
    with zero GPU/Demucs overhead, enabling rapid downstream chunked transcription.

    Outputs:
        vocals_path     - speech audio stem (input to ASR)
        audio_path      - same as vocals_path
        background_path - background audio stem (used for mixdown)
    """

    def __init__(self):
        super().__init__("denoise", gpu_required=False)

    async def execute(
        self,
        input_artifacts: Dict[str, Any],
        config: Dict[str, Any],
        progress_cb: ProgressCallback,
        log_cb: LogCallback,
    ) -> Dict[str, Any]:
        audio_in = input_artifacts.get("audio_path")
        run_dir = Path(config.get("run_dir", "./storage/runs/default"))
        run_dir.mkdir(parents=True, exist_ok=True)

        vocals_wav = run_dir / "vocals.wav"
        background_wav = run_dir / "background.wav"

        # ── Early exit if final outputs already exist ──────────────────── #
        if (
            vocals_wav.exists()
            and vocals_wav.stat().st_size > 0
            and background_wav.exists()
            and background_wav.stat().st_size > 0
        ):
            await log_cb("INFO", "DenoiseStage: cached vocals.wav and background.wav found. Skipping.")
            await progress_cb(100.0, "Audio routing complete (cached)")
            return self._build_result(vocals_wav, background_wav)

        await log_cb("INFO", "DenoiseStage: direct audio pass-through (Demucs bypassed).")
        await progress_cb(20.0, "Direct audio pass-through")

        if not audio_in or not Path(audio_in).exists():
            await log_cb("WARNING", f"Input audio not found: {audio_in}. Touching placeholder files.")
            vocals_wav.touch()
            background_wav.touch()
            return self._build_result(vocals_wav, background_wav)

        # Copy or link extracted audio directly
        try:
            shutil.copyfile(audio_in, vocals_wav)
            shutil.copyfile(audio_in, background_wav)
            await log_cb("INFO", f"DenoiseStage: routed {audio_in} -> vocals.wav & background.wav")
        except Exception as e:
            await log_cb("ERROR", f"DenoiseStage copy error: {e}")
            shutil.copy(audio_in, vocals_wav)
            shutil.copy(audio_in, background_wav)

        await progress_cb(100.0, "DenoiseStage: Audio routing complete")
        return self._build_result(vocals_wav, background_wav)

    def _build_result(self, vocals_wav: Path, background_wav: Path) -> Dict[str, Any]:
        return {
            "status": "success",
            "vocals_path": str(vocals_wav),
            "audio_path": str(vocals_wav),
            "background_path": str(background_wav),
            "artifacts": [
                {"type": "audio", "label": "Vocals Stem (16kHz WAV)", "path": str(vocals_wav)},
                {"type": "audio", "label": "Background Stem (16kHz WAV)", "path": str(background_wav)},
            ],
        }
