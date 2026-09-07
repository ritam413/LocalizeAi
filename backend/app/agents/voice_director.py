import wave
import struct
import math
from pathlib import Path
from typing import Dict, Any, List
from app.agents.base import BaseAgent

DEFAULT_VOICE_MAP = {
    "hi": {"male": "hi-IN-MadhurNeural", "female": "hi-IN-SwaraNeural"},
    "es": {"male": "es-ES-AlvaroNeural", "female": "es-ES-ElviraNeural"},
    "fr": {"male": "fr-FR-HenriNeural", "female": "fr-FR-DeniseNeural"},
    "de": {"male": "de-DE-ConradNeural", "female": "de-DE-KatjaNeural"},
    "ja": {"male": "ja-JP-KeitaNeural", "female": "ja-JP-NanamiNeural"},
    "en": {"male": "en-US-GuyNeural", "female": "en-US-JennyNeural"},
}

def generate_synthetic_wav(output_path: Path, duration_s: float, freq_hz: float = 440.0, sample_rate: int = 16000):
    """Generates a clean synthetic PCM WAV file with an audible tone."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    num_samples = int(duration_s * sample_rate)
    with wave.open(str(output_path), "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        data = bytearray()
        for i in range(num_samples):
            value = int(10000.0 * math.sin(2.0 * math.pi * freq_hz * (i / sample_rate)))
            data.extend(struct.pack("<h", value))
        wav_file.writeframes(data)

class VoiceDirectorAgent(BaseAgent):
    def __init__(self, base_storage_dir: str = "./storage/runs"):
        super().__init__("voice_director")
        self.base_storage_dir = Path(base_storage_dir)

    async def _execute(self, job_id: str, scene_id: str, context: Dict[str, Any], retry_count: int) -> Dict[str, Any]:
        target_lang = context.get("target_language", "en").lower().split("-")[0]
        speakers = context.get("speakers", [
            {"speaker_id": "speaker_1", "gender": "male"},
            {"speaker_id": "speaker_2", "gender": "female"}
        ])
        localized_lines = context.get("localized_lines", [
            {
                "segment_id": 1,
                "speaker_id": "speaker_1",
                "start_s": 0.5,
                "end_s": 3.8,
                "translated_text": "पहले से ही हवा में महल मत बनाओ, दोस्त।"
            }
        ])

        voice_map = DEFAULT_VOICE_MAP.get(target_lang, DEFAULT_VOICE_MAP["en"])
        voice_cast = []
        for idx, spk in enumerate(speakers):
            gender = spk.get("gender", "male")
            if gender not in ("male", "female"):
                gender = "female" if idx % 2 == 1 else "male"
            voice_id = voice_map["female"] if gender == "female" else voice_map["male"]
            voice_cast.append({
                "speaker_id": spk.get("speaker_id", f"speaker_{idx+1}"),
                "voice_id": voice_id,
                "gender": gender,
                "pitch": 1.0,
                "rate": 1.0
            })

        stems_dir = self.base_storage_dir / job_id / "stems"
        stems_dir.mkdir(parents=True, exist_ok=True)
        synthesized_stems = []

        for line in localized_lines:
            seg_id = line.get("segment_id", 1)
            speaker_id = line.get("speaker_id", "speaker_1")
            target_duration_s = max(0.5, line.get("end_s", 2.0) - line.get("start_s", 0.0))
            
            # Simulate slight language expansion or compression typical of dubbing (e.g. 1.05x to 1.15x)
            # When retry_count is 0, generate slight overflow to demonstrate QA defect detection
            duration_multiplier = 1.12 if retry_count == 0 else 0.98
            synthesized_duration_s = round(target_duration_s * duration_multiplier, 3)

            stem_path = stems_dir / f"seg_{seg_id}.wav"
            freq = 440.0 if speaker_id == "speaker_1" else 550.0
            generate_synthetic_wav(stem_path, synthesized_duration_s, freq_hz=freq)

            synthesized_stems.append({
                "segment_id": seg_id,
                "speaker_id": speaker_id,
                "audio_path": str(stem_path),
                "synthesized_duration_s": synthesized_duration_s,
                "target_duration_s": round(target_duration_s, 3)
            })

        decision = (
            f"Voice Director cast {len(voice_cast)} character voices and synthesized {len(synthesized_stems)} audio stem(s) "
            f"for language '{target_lang.upper()}'."
        )

        return {
            "target_language": target_lang,
            "voice_cast": voice_cast,
            "synthesized_stems": synthesized_stems,
            "decision": decision,
            "quality_score": 92.0
        }
