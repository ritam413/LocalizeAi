from pathlib import Path
from typing import Dict, Any, List
from app.engine.stage import BaseStage, ProgressCallback, LogCallback
from app.agents.voice_director import VoiceDirectorAgent


class TTSStage(BaseStage):
    """
    Autonomous speech synthesis stage converting translated dialogue segments
    into character-consistent acoustic WAV stems.
    """

    def __init__(self):
        super().__init__("tts", gpu_required=False)

    @staticmethod
    def _build_localized_lines(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transforms raw segment dictionaries into structured localized dialogue lines."""
        return [
            {
                "segment_id": segment.get("segment_id", idx + 1),
                "speaker_id": segment.get("speaker_id", f"speaker_{(idx % 2) + 1}"),
                "start_s": float(segment.get("start_s", 0.0)),
                "end_s": float(segment.get("end_s", 1.0)),
                "translated_text": segment.get("translated_text", segment.get("source_text", "")),
            }
            for idx, segment in enumerate(segments)
        ]

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

        adapter_type = config.get("tts_adapter", "edge_tts")
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

        await log_cb("INFO", f"Successfully synthesized {len(stems)} dialogue stems.")
        await progress_cb(100.0, "TTS Speech Synthesis complete")

        return {
            "status": "success",
            "synthesized_stems": stems,
            "voice_cast": voice_result.get("voice_cast", []),
            "artifacts": [
                {"type": "audio", "label": "Dialogue Stems", "path": str(stems_dir)}
            ]
        }
