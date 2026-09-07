from pathlib import Path
from typing import Dict, Any, List
from app.agents.base import BaseAgent

def format_ts(seconds: float, sep: str = ",") -> str:
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    ms = int((seconds % 1.0) * 1000)
    return f"{hrs:02d}:{mins:02d}:{secs:02d}{sep}{ms:03d}"

class SubtitleDirectorAgent(BaseAgent):
    def __init__(self, base_storage_dir: str = "./storage/runs"):
        super().__init__("subtitle_director")
        self.base_storage_dir = Path(base_storage_dir)

    async def _execute(self, job_id: str, scene_id: str, context: Dict[str, Any], retry_count: int) -> Dict[str, Any]:
        target_lang = context.get("target_language", "en").lower().split("-")[0]
        localized_lines = context.get("localized_lines", [])
        sync_adjustments = context.get("sync_adjustments", [])

        sync_map = {adj["segment_id"]: float(adj["final_duration_s"]) for adj in sync_adjustments}

        cues = []
        max_cps = 0.0
        drift_detected = False

        for idx, line in enumerate(localized_lines):
            seg_id = line.get("segment_id", idx + 1)
            start_s = float(line.get("start_s", 0.0))
            duration_s = sync_map.get(seg_id, float(line.get("end_s", 1.0) - start_s))
            end_s = round(start_s + duration_s, 3)
            text = line.get("translated_text", "").strip()

            cps = round(len(text) / duration_s, 1) if duration_s > 0 else 0.0
            if cps > max_cps:
                max_cps = cps

            # Check drift against original end
            orig_end = float(line.get("end_s", end_s))
            if abs(end_s - orig_end) > 0.5:
                drift_detected = True

            cues.append({
                "cue_index": idx + 1,
                "start_s": start_s,
                "end_s": end_s,
                "text": text,
                "cps": cps
            })

        # Generate SRT
        srt_lines = []
        for c in cues:
            srt_lines.append(f"{c['cue_index']}\n{format_ts(c['start_s'], ',')} --> {format_ts(c['end_s'], ',')}\n{c['text']}\n")
        srt_content = "\n".join(srt_lines)

        # Generate VTT
        vtt_lines = ["WEBVTT\n"]
        for c in cues:
            vtt_lines.append(f"{c['cue_index']}\n{format_ts(c['start_s'], '.')} --> {format_ts(c['end_s'], '.')}\n{c['text']}\n")
        vtt_content = "\n".join(vtt_lines)

        run_dir = self.base_storage_dir / job_id
        run_dir.mkdir(parents=True, exist_ok=True)
        srt_path = run_dir / f"subtitles_{target_lang}.srt"
        vtt_path = run_dir / f"subtitles_{target_lang}.vtt"

        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)
        with open(vtt_path, "w", encoding="utf-8") as f:
            f.write(vtt_content)

        decision = (
            f"Subtitle Director formatted {len(cues)} cues into SRT and VTT for {target_lang.upper()}, "
            f"max CPS: {max_cps}, drift_detected: {drift_detected}."
        )

        return {
            "job_id": job_id,
            "target_language": target_lang,
            "srt_path": str(srt_path),
            "vtt_path": str(vtt_path),
            "total_cues": len(cues),
            "max_cps": max_cps,
            "drift_detected": drift_detected,
            "decision": decision,
            "quality_score": 95.0 if not drift_detected else 82.0
        }
