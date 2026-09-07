import os
import shutil
import asyncio
import sys
import re
import json
import wave
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from app.engine.stage import BaseStage, ProgressCallback, LogCallback
from app.engine.cancel_registry import register_process, unregister_process


class DenoiseStage(BaseStage):
    """
    Vocal isolation stage using Demucs HTDemucs with silence-aware resumable chunking.

    Features:
    - User-controllable via config flag `use_demucs` (default: True).
    - For audio > 120s, splits at natural silence boundaries so no words are cut.
    - Chunk-level checkpointing: resumes from the first unprocessed chunk.
    - Falls back to ffmpeg speech-formant enhancement if Demucs is disabled or unavailable.

    Outputs:
        vocals_path     - isolated speech stem  (input to ASR)
        audio_path      - same as vocals_path
        background_path - non-vocal stem (drums + bass + other, used for remix)
    """

    # Minimum audio duration (seconds) before chunking is applied
    CHUNK_THRESHOLD_S: float = 120.0
    # Target chunk duration (seconds); actual cuts happen at the nearest silence
    TARGET_CHUNK_S: float = 180.0
    # ffmpeg silencedetect thresholds
    SILENCE_NOISE_DB: str = "-30dB"
    SILENCE_MIN_DURATION: float = 0.3

    def __init__(self):
        super().__init__("denoise", gpu_required=True)

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
        run_id = run_dir.name
        use_demucs: bool = config.get("use_demucs", True)

        vocals_wav = run_dir / "vocals.wav"
        background_wav = run_dir / "background.wav"

        # ── Early exit if final outputs already exist ──────────────────── #
        if vocals_wav.exists() and vocals_wav.stat().st_size > 0 \
                and background_wav.exists() and background_wav.stat().st_size > 0:
            await log_cb("INFO", "DenoiseStage: cached vocals.wav and background.wav found. Skipping separation.")
            await progress_cb(100.0, "Vocal isolation complete (cached)")
            return self._build_result(vocals_wav, background_wav)

        await log_cb("INFO", "DenoiseStage: starting vocal stem separation")
        await progress_cb(5.0, "Initialising DenoiseStage")

        if not audio_in or not Path(audio_in).exists():
            await log_cb("WARNING", f"Input audio not found: {audio_in}. Touching placeholder files.")
            vocals_wav.touch()
            background_wav.touch()
            return self._build_result(vocals_wav, background_wav)

        # ── Branch: Demucs ON vs OFF ───────────────────────────────────── #
        if not use_demucs:
            await log_cb("INFO", "Demucs disabled by user setting. Using fast ffmpeg dialogue enhancement.")
            success = await self._run_ffmpeg_fallback(
                audio_in, vocals_wav, background_wav, progress_cb, log_cb
            )
        else:
            await log_cb("INFO", "Demucs enabled. Attempting HTDemucs stem separation with silence-aware chunking.")
            success = await self._run_demucs(
                audio_in, run_dir, run_id, vocals_wav, background_wav, progress_cb, log_cb
            )
            if not success:
                await log_cb("INFO", "Demucs unavailable or failed — falling back to ffmpeg dialogue enhancement.")
                success = await self._run_ffmpeg_fallback(
                    audio_in, vocals_wav, background_wav, progress_cb, log_cb
                )

        if not success:
            await log_cb("WARNING", "All denoising methods failed. Copying source audio as vocals.")
            shutil.copy(audio_in, vocals_wav)
            shutil.copy(audio_in, background_wav)

        await progress_cb(100.0, "Vocal isolation complete")
        return self._build_result(vocals_wav, background_wav)

    # ------------------------------------------------------------------ #
    #  Demucs path — silence-aware chunking + resumption                  #
    # ------------------------------------------------------------------ #

    async def _run_demucs(
        self,
        audio_in: str,
        run_dir: Path,
        run_id: str,
        vocals_wav: Path,
        background_wav: Path,
        progress_cb: ProgressCallback,
        log_cb: LogCallback,
    ) -> bool:
        """
        Silence-aware resumable Demucs separation.

        For short clips (≤ CHUNK_THRESHOLD_S): runs Demucs on the full file.
        For long clips: splits at natural silence boundaries, runs Demucs per
        chunk, checkpoints each chunk stem, concatenates at the end.
        """
        duration = await self._get_audio_duration(audio_in)
        await log_cb("INFO", f"Input audio duration: {duration:.1f}s")

        if duration <= self.CHUNK_THRESHOLD_S:
            # ── Short clip: single-pass Demucs ─────────────────────────── #
            await log_cb("INFO", "Short clip — running Demucs in single-pass mode.")
            return await self._demucs_single_file(
                audio_in, run_dir, run_id, vocals_wav, background_wav, progress_cb, log_cb
            )

        # ── Long clip: silence-aware chunking ──────────────────────────── #
        chunks_dir = run_dir / "demucs_chunks"
        chunks_dir.mkdir(parents=True, exist_ok=True)

        await log_cb("INFO", "Long clip — detecting silence boundaries for chunk splitting.")
        await progress_cb(7.0, "Detecting silence boundaries")

        split_points = await self._detect_silence_split_points(audio_in, duration, log_cb)
        await log_cb("INFO", f"Found {len(split_points)} split points for {len(split_points)+1} chunks.")

        # Build segment time ranges
        segments: List[Tuple[float, float]] = []
        prev = 0.0
        for sp in split_points:
            segments.append((prev, sp))
            prev = sp
        segments.append((prev, duration))

        n = len(segments)
        await log_cb("INFO", f"Splitting into {n} chunks.")
        await progress_cb(10.0, f"Splitting audio into {n} chunks")

        # Split audio into chunks
        chunk_paths: List[Path] = []
        for i, (start, end) in enumerate(segments):
            chunk_path = chunks_dir / f"chunk_{i:03d}.wav"
            chunk_paths.append(chunk_path)
            if chunk_path.exists() and chunk_path.stat().st_size > 0:
                await log_cb("INFO", f"Chunk {i+1}/{n} already exists at {chunk_path.name}. Skipping split.")
                continue
            await self._ffmpeg_cut_segment(audio_in, chunk_path, start, end, log_cb)
            await log_cb("INFO", f"Split chunk {i+1}/{n}: {start:.1f}s – {end:.1f}s → {chunk_path.name}")

        # Process each chunk with Demucs (with per-chunk resumption)
        device_flag = await self._detect_device(log_cb)
        completed_before = 0
        for i, chunk_path in enumerate(chunk_paths):
            vocals_chunk = chunks_dir / f"chunk_{i:03d}_vocals.wav"
            no_vocals_chunk = chunks_dir / f"chunk_{i:03d}_no_vocals.wav"

            if vocals_chunk.exists() and vocals_chunk.stat().st_size > 0:
                completed_before = i + 1
                pct_done = round(10.0 + (completed_before / n) * 60.0, 1)
                await log_cb("INFO", f"[demucs] Chunk {i+1}/{n} already separated. Resuming from chunk {completed_before+1}/{n} ({pct_done:.0f}%).")
                await progress_cb(pct_done, f"Resuming Demucs at chunk {i+2}/{n}")
                continue

            if completed_before > 0 and i == completed_before:
                await log_cb("INFO", f"[demucs] Resuming Demucs separation from chunk {i+1}/{n} ({round(10.0 + (i/n)*60.0, 0):.0f}% complete).")

            chunk_success = await self._demucs_single_file(
                str(chunk_path), chunks_dir, run_id,
                vocals_chunk, no_vocals_chunk,
                progress_cb=None, log_cb=log_cb,
                device_flag=device_flag,
                progress_base=10.0 + (i / n) * 60.0,
                progress_range=60.0 / n,
            )
            if not chunk_success:
                await log_cb("WARNING", f"Demucs failed on chunk {i+1}/{n}. Aborting chunked separation.")
                return False

            pct = round(10.0 + ((i + 1) / n) * 60.0, 1)
            await progress_cb(pct, f"Demucs chunk {i+1}/{n} complete")

        # Concatenate chunk stems
        await log_cb("INFO", "Concatenating chunk stems into final vocals.wav and background.wav.")
        await progress_cb(72.0, "Concatenating separated stems")

        vocal_chunks = [chunks_dir / f"chunk_{i:03d}_vocals.wav" for i in range(n)]
        no_vocal_chunks = [chunks_dir / f"chunk_{i:03d}_no_vocals.wav" for i in range(n)]

        ok_v = await self._ffmpeg_concat_wavs(vocal_chunks, vocals_wav, log_cb)
        ok_b = await self._ffmpeg_concat_wavs(no_vocal_chunks, background_wav, log_cb)

        if ok_v:
            await log_cb("INFO", f"vocals.wav → {vocals_wav}")
        if ok_b:
            await log_cb("INFO", f"background.wav → {background_wav}")

        await progress_cb(90.0, "Stems concatenated")
        return ok_v

    # ------------------------------------------------------------------ #
    #  Single-file Demucs subprocess                                      #
    # ------------------------------------------------------------------ #

    async def _demucs_single_file(
        self,
        audio_in: str,
        out_dir: Path,
        run_id: str,
        vocals_out: Path,
        no_vocals_out: Path,
        progress_cb: Optional[ProgressCallback],
        log_cb: LogCallback,
        device_flag: Optional[str] = None,
        progress_base: float = 15.0,
        progress_range: float = 55.0,
    ) -> bool:
        """
        Run Demucs HTDemucs on a single audio file and copy stems to vocals_out / no_vocals_out.
        """
        if device_flag is None:
            device_flag = await self._detect_device(log_cb)

        demucs_out = out_dir / f"_demucs_tmp_{Path(audio_in).stem}"
        demucs_out.mkdir(parents=True, exist_ok=True)
        stem_name = Path(audio_in).stem

        cmd = [
            sys.executable, "-m", "demucs",
            "--two-stems=vocals",
            "-n", "htdemucs",
            "--out", str(demucs_out),
            "--device", device_flag,
            str(audio_in),
        ]

        await log_cb("INFO", f"Demucs command: {' '.join(cmd)}")
        if progress_cb:
            await progress_cb(progress_base, f"Running HTDemucs on {device_flag.upper()}")

        DEMUCS_TIMEOUT_S = 7200

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            register_process(run_id, proc)

            await log_cb(
                "INFO",
                "Demucs started — streaming output. First run downloads model weights (~320 MB), please wait…"
            )

            stderr_lines: list[str] = []

            async def _stream_stderr() -> None:
                assert proc.stderr is not None
                buffer = ""
                last_reported_pct = -1
                is_downloading = False

                while True:
                    chunk = await proc.stderr.read(256)
                    if not chunk:
                        break
                    text = chunk.decode("utf-8", errors="replace")
                    buffer += text

                    lines = re.split(r'[\r\n]+', buffer)
                    buffer = lines.pop() if lines else ""

                    for line in lines:
                        line_str = line.strip()
                        if not line_str:
                            continue

                        stderr_lines.append(line_str)
                        line_lower = line_str.lower()
                        if "download" in line_lower or "downloading" in line_lower:
                            is_downloading = True
                        elif "separating" in line_lower or "it/s" in line_lower or "selected track" in line_lower:
                            is_downloading = False

                        match = re.search(r'(\d+)%\|', line_str)
                        if match and progress_cb:
                            pct = int(match.group(1))
                            if is_downloading and ("mb/s" in line_lower or "320m" in line_lower or "download" in line_lower):
                                stage_pct = progress_base + (pct * 0.05)
                                if pct != last_reported_pct:
                                    last_reported_pct = pct
                                    await progress_cb(round(stage_pct, 1), f"Downloading HTDemucs model ({pct}%)")
                            else:
                                stage_pct = progress_base + (pct / 100.0 * progress_range)
                                if pct != last_reported_pct:
                                    last_reported_pct = pct
                                    await progress_cb(round(stage_pct, 1), f"Running HTDemucs on {device_flag.upper()} ({pct}%)")

                        level = "INFO" if any(
                            kw in line_lower for kw in ("download", "%|", "separating", "model", "loading", "track")
                        ) else "DEBUG"
                        await log_cb(level, f"[demucs] {line_str}")

                if buffer.strip():
                    line_str = buffer.strip()
                    stderr_lines.append(line_str)
                    line_lower = line_str.lower()
                    level = "INFO" if any(
                        kw in line_lower for kw in ("download", "%|", "separating", "model", "loading", "track")
                    ) else "DEBUG"
                    await log_cb(level, f"[demucs] {line_str}")

            async def _stream_stdout() -> None:
                assert proc.stdout is not None
                async for raw in proc.stdout:
                    line = raw.decode(errors="replace").rstrip()
                    if line:
                        await log_cb("DEBUG", f"[demucs stdout] {line}")

            try:
                await asyncio.wait_for(
                    asyncio.gather(_stream_stderr(), _stream_stdout()),
                    timeout=DEMUCS_TIMEOUT_S,
                )
            except asyncio.TimeoutError:
                proc.kill()
                await log_cb(
                    "INFO",
                    f"Demucs process reached {DEMUCS_TIMEOUT_S // 3600}-hour timeout. "
                    "Terminating and switching to ffmpeg fallback."
                )
                return False

            await proc.wait()

            if proc.returncode != 0:
                tail = "\n".join(stderr_lines[-10:])
                await log_cb("INFO", f"Demucs exit code {proc.returncode}:\n{tail}")
                return False

            if progress_cb:
                await progress_cb(round(progress_base + progress_range, 1), "Demucs separation complete — locating stems")

            vocals_src = demucs_out / "htdemucs" / stem_name / "vocals.wav"
            no_vocals_src = demucs_out / "htdemucs" / stem_name / "no_vocals.wav"

            if not vocals_src.exists():
                await log_cb("INFO", f"Expected vocals.wav not found at {vocals_src}")
                return False

            shutil.copy(vocals_src, vocals_out)
            await log_cb("INFO", f"vocals stem → {vocals_out.name}")

            if no_vocals_src.exists():
                shutil.copy(no_vocals_src, no_vocals_out)
                await log_cb("INFO", f"no_vocals stem → {no_vocals_out.name}")
            else:
                shutil.copy(vocals_src, no_vocals_out)

            return True

        except FileNotFoundError:
            await log_cb("INFO", "demucs module not found (not installed). Switching to ffmpeg fallback.")
            return False
        except Exception as exc:
            await log_cb("INFO", f"Demucs subprocess note: {exc}")
            return False
        finally:
            unregister_process(run_id)
            # Clean up the temporary demucs output dir
            try:
                if demucs_out.exists():
                    shutil.rmtree(demucs_out, ignore_errors=True)
            except Exception:
                pass

    # ------------------------------------------------------------------ #
    #  Silence detection & audio splitting                                #
    # ------------------------------------------------------------------ #

    async def _detect_silence_split_points(
        self,
        audio_in: str,
        duration: float,
        log_cb: LogCallback,
    ) -> List[float]:
        """
        Use ffmpeg silencedetect to find natural silence midpoints near every
        TARGET_CHUNK_S interval. Returns a sorted list of cut timestamps (seconds).
        """
        cmd = [
            "ffmpeg", "-y",
            "-i", str(audio_in),
            "-af", f"silencedetect=noise={self.SILENCE_NOISE_DB}:d={self.SILENCE_MIN_DURATION}",
            "-f", "null", "-",
        ]

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.PIPE,
            )
            _, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
            output = stderr.decode("utf-8", errors="replace")
        except Exception as exc:
            await log_cb("WARNING", f"silencedetect failed ({exc}), falling back to fixed chunk cuts.")
            return self._fixed_split_points(duration)

        # Parse silence_end timestamps from ffmpeg output
        silence_ends: List[float] = []
        for m in re.finditer(r'silence_end:\s*([\d.]+)', output):
            silence_ends.append(float(m.group(1)))

        if not silence_ends:
            await log_cb("WARNING", "No silence found in audio. Using fixed chunk cuts.")
            return self._fixed_split_points(duration)

        # Select one silence_end near each TARGET_CHUNK_S boundary
        split_points: List[float] = []
        target = self.TARGET_CHUNK_S
        while target < duration - 10.0:  # don't create a tiny final chunk
            # Find the closest silence_end to `target`
            best = min(silence_ends, key=lambda t: abs(t - target))
            if abs(best - target) < self.TARGET_CHUNK_S * 0.4:  # within 40% of chunk size
                if not split_points or best - split_points[-1] > 30.0:
                    split_points.append(best)
                    target = best + self.TARGET_CHUNK_S
                else:
                    target += self.TARGET_CHUNK_S
            else:
                # No silence near boundary, fall back to hard cut for this segment
                split_points.append(target)
                await log_cb("DEBUG", f"No silence near {target:.0f}s, using hard cut.")
                target += self.TARGET_CHUNK_S

        return sorted(split_points)

    def _fixed_split_points(self, duration: float) -> List[float]:
        """Fallback: evenly spaced split points at TARGET_CHUNK_S intervals."""
        points = []
        t = self.TARGET_CHUNK_S
        while t < duration - 10.0:
            points.append(t)
            t += self.TARGET_CHUNK_S
        return points

    async def _ffmpeg_cut_segment(
        self,
        audio_in: str,
        out_path: Path,
        start: float,
        end: float,
        log_cb: LogCallback,
    ) -> None:
        """Cut a time segment from audio_in using ffmpeg."""
        duration = end - start
        cmd = [
            "ffmpeg", "-y",
            "-ss", f"{start:.3f}",
            "-t", f"{duration:.3f}",
            "-i", str(audio_in),
            "-ar", "44100",
            "-ac", "2",
            str(out_path),
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            await log_cb("WARNING", f"ffmpeg segment cut error: {stderr.decode(errors='replace')[-200:]}")

    async def _ffmpeg_concat_wavs(
        self,
        wav_paths: List[Path],
        out_path: Path,
        log_cb: LogCallback,
    ) -> bool:
        """Concatenate a list of WAV files into out_path using ffmpeg concat demuxer."""
        existing = [p for p in wav_paths if p.exists() and p.stat().st_size > 0]
        if not existing:
            await log_cb("WARNING", f"No valid chunk stems found to concatenate → {out_path.name}")
            return False

        # Write a concat list file — all paths must be absolute so the ffmpeg
        # subprocess can find them regardless of its working directory.
        list_file = (out_path.parent / f"_concat_{out_path.stem}.txt").resolve()
        abs_out = out_path.resolve()

        with open(list_file, "w", encoding="utf-8") as fh:
            for p in existing:
                # ffmpeg concat protocol requires forward slashes on Windows too
                abs_p = str(p.resolve()).replace("\\", "/")
                fh.write(f"file '{abs_p}'\n")

        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(list_file),
            "-c", "copy",
            str(abs_out),
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await proc.communicate()
        try:
            list_file.unlink()
        except Exception:
            pass

        if proc.returncode != 0:
            await log_cb("WARNING", f"ffmpeg concat error: {stderr.decode(errors='replace')[-200:]}")
            return False
        return True

    # ------------------------------------------------------------------ #
    #  ffmpeg speech-enhancement fallback                                 #
    # ------------------------------------------------------------------ #

    async def _run_ffmpeg_fallback(
        self,
        audio_in: str,
        vocals_wav: Path,
        background_wav: Path,
        progress_cb: ProgressCallback,
        log_cb: LogCallback,
    ) -> bool:
        """
        Best-effort dialogue enhancement via ffmpeg filters.
        No true source separation — only used when Demucs is disabled or absent.
        """
        af_filter = (
            "dialoguenhance,"
            "afftdn=nr=15:nf=-35,"
            "highpass=f=150,"
            "lowpass=f=3800,"
            "speechnorm=e=4:r=0.0001:l=1"
        )
        cmd = [
            "ffmpeg", "-y",
            "-i", str(audio_in),
            "-af", af_filter,
            "-ar", "16000",
            "-ac", "1",
            str(vocals_wav),
        ]

        await log_cb("INFO", f"ffmpeg fallback filter: {af_filter}")
        await progress_cb(30.0, "Applying ffmpeg speech-formant enhancement")

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            _, stderr = await proc.communicate()

            if proc.returncode == 0:
                shutil.copy(vocals_wav, background_wav)
                await log_cb("INFO", f"ffmpeg fallback complete → {vocals_wav}")
                await progress_cb(90.0, "ffmpeg denoising complete")
                return True

            err_text = stderr.decode(errors="replace")[-400:]
            await log_cb("WARNING", f"ffmpeg returned code {proc.returncode}: {err_text}")
            return False

        except Exception as exc:
            await log_cb("WARNING", f"ffmpeg fallback error: {exc}")
            return False

    # ------------------------------------------------------------------ #
    #  Helpers                                                            #
    # ------------------------------------------------------------------ #

    @staticmethod
    async def _get_audio_duration(audio_path: str) -> float:
        """
        Return audio duration in seconds via ffprobe.
        Falls back to reading WAV header directly if ffprobe is unavailable.
        """
        try:
            proc = await asyncio.create_subprocess_exec(
                "ffprobe", "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                str(audio_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            stdout, _ = await proc.communicate()
            if proc.returncode == 0:
                info = json.loads(stdout.decode())
                return float(info["format"]["duration"])
        except Exception:
            pass

        # Fallback: read WAV header
        try:
            with wave.open(str(audio_path), "rb") as wf:
                return wf.getnframes() / float(wf.getframerate())
        except Exception:
            return 0.0

    @staticmethod
    async def _detect_device(log_cb: LogCallback) -> str:
        """
        Returns 'cuda' if a CUDA-capable GPU is visible to PyTorch, otherwise 'cpu'.
        Uses a tiny subprocess so we don't import torch in the main process before Whisper.
        """
        try:
            proc = await asyncio.create_subprocess_exec(
                sys.executable, "-c",
                "import torch; print('cuda' if torch.cuda.is_available() else 'cpu')",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await proc.communicate()
            device = stdout.decode().strip()
            if device in ("cuda", "cpu"):
                await log_cb("INFO", f"Demucs device selected: {device}")
                return device
        except Exception:
            pass
        await log_cb("INFO", "Could not detect CUDA — defaulting to cpu for Demucs")
        return "cpu"

    @staticmethod
    def _build_result(vocals_wav: Path, background_wav: Path) -> Dict[str, Any]:
        return {
            "status": "success",
            "audio_path": str(vocals_wav),
            "vocals_path": str(vocals_wav),
            "background_path": str(background_wav),
            "artifacts": [
                {
                    "type": "audio",
                    "label": "Isolated Vocals (HTDemucs)",
                    "path": str(vocals_wav),
                },
                {
                    "type": "audio",
                    "label": "Background / No-Vocals Stem",
                    "path": str(background_wav),
                },
            ],
        }
