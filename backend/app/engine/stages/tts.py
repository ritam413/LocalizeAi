import json
import os
from pathlib import Path
from typing import Dict, Any, List
from app.engine.stage import BaseStage, ProgressCallback, LogCallback
from app.agents.voice_director import VoiceDirectorAgent

ALLOWED_TTS_ADAPTERS = {"kokoro", "edge_tts", "mock"}


def sanitize_tts_adapter(adapter: Any) -> str:
    """Sanitizes incoming TTS adapter input, defaulting safely to 'kokoro'."""
    if not adapter or not isinstance(adapter, str):
        return "kokoro"
    cleaned = adapter.strip().lower()
    return cleaned if cleaned in ALLOWED_TTS_ADAPTERS else "kokoro"


def _atomic_write_json(path: Path, data: Any) -> None:
    """Atomically writes JSON payload to disk to prevent file lock crashes."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(".tmp.json")
    tmp_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp_path, path)


class TTSStage(BaseStage):
    """
    Autonomous speech synthesis stage converting translated dialogue segments
    into character-consistent acoustic WAV stems.
    """

    def __init__(self, adapter_type: str = "kokoro"):
        adapter = sanitize_tts_adapter(adapter_type)
        gpu_active = False
        if adapter == "kokoro":
            try:
                import torch
                gpu_active = bool(torch.cuda.is_available())
            except Exception:
                gpu_active = False
        super().__init__("tts", gpu_required=gpu_active)

    @staticmethod
    def _build_localized_lines(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transforms raw segment dictionaries into structured localized dialogue lines."""
        lines = []
        for idx, segment in enumerate(segments):
            raw_seg_id = segment.get("segment_id", idx + 1)
            seg_id = int(raw_seg_id) if str(raw_seg_id).isdigit() else (idx + 1)
            start_s = round(max(0.0, float(segment.get("start_s", 0.0))), 3)
            raw_end = float(segment.get("end_s", start_s + 2.0))
            end_s = round(max(start_s + 0.1, raw_end), 3)

            lines.append({
                "segment_id": seg_id,
                "speaker_id": segment.get("speaker_id", f"speaker_{(idx % 2) + 1}"),
                "start_s": start_s,
                "end_s": end_s,
                "translated_text": segment.get("translated_text", segment.get("source_text", "")),
            })
        return lines

    async def execute(
        self,
        input_artifacts: Dict[str, Any],
        config: Dict[str, Any],
        progress_cb: ProgressCallback,
        log_cb: LogCallback
    ) -> Dict[str, Any]:
        run_dir = Path(config.get("run_dir", "./storage/runs/default"))
        target_lang = config.get("target_language", "en")
        segments = input_artifacts.get("segments", [])

        if not segments:
            raise RuntimeError("No translated dialogue segments found for TTS synthesis.")

        await log_cb("INFO", f"Starting TTS Speech Synthesis for {len(segments)} segments (lang={target_lang})")
        await progress_cb(10.0, "Initializing Neural Voice Director")

        adapter_type = sanitize_tts_adapter(config.get("tts_adapter"))
        voice_agent = VoiceDirectorAgent(base_storage_dir=str(run_dir.parent), adapter_type=adapter_type)

        localized_lines = self._build_localized_lines(segments)
        voice_result = await voice_agent._execute(
            job_id=run_dir.name,
            scene_id="global",
            context={
                "target_language": target_lang,
                "localized_lines": localized_lines,
                "speakers": [
                    {"speaker_id": "speaker_1", "gender": "male"},
                    {"speaker_id": "speaker_2", "gender": "female"},
                ]
            },
            retry_count=0
        )

        stems = voice_result.get("synthesized_stems", [])
        stems_dir = run_dir / "stems"

        # Atomically persist stems.json manifest
        stems_manifest_path = run_dir / "stems.json"
        _atomic_write_json(stems_manifest_path, stems)

        await log_cb("INFO", f"Successfully synthesized {len(stems)} dialogue stems and wrote stems.json manifest.")
        await progress_cb(100.0, "TTS Speech Synthesis complete")

        return {
            "status": "success",
            "synthesized_stems": stems,
            "voice_cast": voice_result.get("voice_cast", []),
            "artifacts": [
                {"type": "audio", "label": "Dialogue Stems", "path": str(stems_dir)},
                {"type": "manifest", "label": "Stems Manifest", "path": str(stems_manifest_path)},
            ]
        }
