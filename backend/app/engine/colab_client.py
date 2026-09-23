import asyncio
import io
import os
import wave
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import httpx

from app.config import settings

class ColabGPUClient:
    """
    HTTP Transport & Re-aligner Client for Google Colab GPU Worker.
    Provides streaming ASR chunk transcription, Kokoro neural TTS, health checks, and log streaming.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout_s: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        self.base_url = (base_url or settings.COLAB_GPU_WORKER_URL or "").rstrip("/")
        self.timeout_s = timeout_s if timeout_s is not None else settings.COLAB_REQUEST_TIMEOUT_S
        self.max_retries = max_retries if max_retries is not None else settings.COLAB_MAX_RETRIES

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.base_url.strip())

    async def check_health(self) -> Dict[str, Any]:
        """Check status, GPU VRAM, and model readiness of remote Colab worker."""
        if not self.is_configured:
            return {"status": "unconfigured", "gpu": False}
        url = f"{self.base_url}/api/v1/gpu/health"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()

    async def transcribe_chunk(
        self,
        chunk_path: str,
        offset_s: float = 0.0,
        chunk_duration_s: float = 60.0,
        source_lang: Optional[str] = None,
        diarize: bool = False,
        num_speakers: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Stream a single audio chunk (16kHz PCM WAV) to Colab WhisperX worker,
        re-aligning timestamps by +offset_s and guarding against None/overhangs.
        """
        if not self.is_configured:
            raise RuntimeError("ColabGPUClient: Worker URL is not configured.")

        url = f"{self.base_url}/api/v1/gpu/transcribe_chunk"
        p_chunk = Path(chunk_path)
        if not p_chunk.exists():
            raise FileNotFoundError(f"Chunk audio not found: {chunk_path}")

        data = {
            "diarize": str(diarize).lower(),
        }
        if source_lang:
            data["language"] = source_lang
        if num_speakers is not None:
            data["num_speakers"] = str(num_speakers)

        last_err = None
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_s) as client:
                    with open(p_chunk, "rb") as f:
                        files = {"file": (p_chunk.name, f, "audio/wav")}
                        resp = await client.post(url, data=data, files=files)
                        resp.raise_for_status()
                        result = resp.json()

                raw_segments = result.get("segments", [])
                detected_lang = result.get("language") or source_lang

                aligned_segments: List[Dict[str, Any]] = []
                for seg in raw_segments:
                    raw_start = seg.get("start_s") if "start_s" in seg else seg.get("start", 0.0)
                    raw_end = seg.get("end_s") if "end_s" in seg else seg.get("end", 0.0)
                    text = seg.get("source_text") or seg.get("text", "")

                    seg_start = round(float(raw_start) + offset_s, 3)
                    clamped_end = min(float(raw_end), chunk_duration_s)
                    seg_end = round(clamped_end + offset_s, 3)

                    words = []
                    for w in seg.get("words", []):
                        w_raw_start = w.get("start")
                        w_raw_end = w.get("end")
                        w_start = round(float(w_raw_start) + offset_s, 3) if w_raw_start is not None else seg_start
                        w_end = round(min(float(w_raw_end), chunk_duration_s) + offset_s, 3) if w_raw_end is not None else seg_end
                        words.append({
                            "word": w.get("word", ""),
                            "start": w_start,
                            "end": w_end,
                            "score": w.get("score", 1.0),
                        })

                    seg_dict: Dict[str, Any] = {
                        "start_s": seg_start,
                        "end_s": seg_end,
                        "source_text": text.strip(),
                    }
                    if "speaker" in seg:
                        seg_dict["speaker"] = seg["speaker"]
                    if words:
                        seg_dict["words"] = words

                    aligned_segments.append(seg_dict)

                return {
                    "status": "success",
                    "segments": aligned_segments,
                    "language": detected_lang,
                }

            except (httpx.RequestError, httpx.HTTPStatusError) as err:
                last_err = err
                if attempt < self.max_retries - 1:
                    backoff = 2 ** attempt  # 1s, 2s, 4s
                    await asyncio.sleep(backoff)

        raise RuntimeError(f"ColabGPUClient transcribe_chunk failed after {self.max_retries} retries: {last_err}")

    async def synthesize_stem(
        self,
        text: str,
        voice_id: str,
        output_path: Union[str, Path],
        speed: float = 1.0,
        target_lang: str = "en",
    ) -> float:
        """
        Synthesize speech stem via remote Colab Kokoro TTS, validate WAV bytes, and write atomically.
        """
        if not self.is_configured:
            raise RuntimeError("ColabGPUClient: Worker URL is not configured.")

        url = f"{self.base_url}/api/v1/gpu/synthesize_stem"
        p_out = Path(output_path)
        p_out.parent.mkdir(parents=True, exist_ok=True)

        payload = {
            "text": text,
            "voice_id": voice_id,
            "speed": speed,
            "language": target_lang,
        }

        last_err = None
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout_s) as client:
                    resp = await client.post(url, json=payload)
                    resp.raise_for_status()
                    wav_bytes = resp.content

                if len(wav_bytes) <= 1024:
                    raise ValueError(f"Colab TTS returned corrupt/truncated WAV payload: {len(wav_bytes)} bytes")

                # Atomic write to .tmp.wav + replace
                tmp_wav = p_out.with_suffix(".tmp.wav")
                with open(tmp_wav, "wb") as f:
                    f.write(wav_bytes)
                os.replace(tmp_wav, p_out)

                # Compute exact duration
                with wave.open(str(p_out), "rb") as wf:
                    frames = wf.getnframes()
                    rate = wf.getframerate()
                    return round(frames / float(rate), 3)

            except (httpx.RequestError, httpx.HTTPStatusError, ValueError, Exception) as err:
                last_err = err
                if attempt < self.max_retries - 1:
                    backoff = 2 ** attempt
                    await asyncio.sleep(backoff)

        raise RuntimeError(f"ColabGPUClient synthesize_stem failed after {self.max_retries} retries: {last_err}")

    async def get_remote_logs(self, lines: int = 100) -> Dict[str, Any]:
        """Fetch remote execution logs from Colab worker."""
        if not self.is_configured:
            return {"lines": [], "status": "unconfigured"}
        url = f"{self.base_url}/api/v1/gpu/logs?lines={lines}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
