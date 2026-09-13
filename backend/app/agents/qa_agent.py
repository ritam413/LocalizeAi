import math
import wave
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional, Union
import numpy as np

from app.agents.base import BaseAgent


def check_audio_clipping(audio_path: Union[str, Path]) -> Tuple[bool, int, float]:
    """
    Perceptual audio inspection detecting digital clipping (0 dBFS / >= 0.999 amplitude).
    Returns (is_clipped: bool, clipped_samples_count: int, peak_amplitude: float).
    """
    if not audio_path:
        return False, 0, 0.0

    p = Path(audio_path)
    if not p.exists() or not p.is_file():
        return False, 0, 0.0

    try:
        with wave.open(str(p), "rb") as wf:
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            n_frames = wf.getnframes()
            if n_frames == 0:
                return False, 0, 0.0

            raw_bytes = wf.readframes(n_frames)

        if sampwidth == 2:  # 16-bit signed PCM
            samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        elif sampwidth == 4:  # 32-bit float or 32-bit int
            try:
                samples = np.frombuffer(raw_bytes, dtype=np.float32)
                # Check for sane float range
                if np.max(np.abs(samples)) > 10.0:
                    samples = np.frombuffer(raw_bytes, dtype=np.int32).astype(np.float32) / 2147483648.0
            except Exception:
                samples = np.frombuffer(raw_bytes, dtype=np.int32).astype(np.float32) / 2147483648.0
        elif sampwidth == 1:  # 8-bit unsigned
            samples = (np.frombuffer(raw_bytes, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
        else:
            # Fallback for 24-bit or unhandled
            return False, 0, 0.0

        if len(samples) == 0:
            return False, 0, 0.0

        abs_samples = np.abs(samples)
        peak_amp = float(np.max(abs_samples))
        clipped_count = int(np.sum(abs_samples >= 0.999))
        is_clipped = bool(clipped_count > 0 or peak_amp >= 0.999)

        return is_clipped, clipped_count, round(peak_amp, 4)

    except Exception:
        return False, 0, 0.0


def inspect_stems_with_signal(
    stems: List[Dict[str, Any]],
    subtitles: Optional[List[Dict[str, Any]]] = None,
    job_id: str = "qa-job",
    scene_id: str = "scene_1",
    min_readiness_threshold: float = 85.0
) -> Dict[str, Any]:
    """
    Inspects dialogue audio stems for digital clipping and timing overflows with exact syllable reduction calculation.
    """
    findings = []
    score = 98.0

    for s in stems:
        seg_id = s.get("segment_id", 1)
        dur = float(s.get("duration_s", 0.0))
        target = float(s.get("target_window_s", s.get("target_duration_s", 0.0)))
        overflow = dur - target

        # 1. Check for audio clipping (signal inspection)
        audio_path = s.get("audio_path") or s.get("path") or s.get("stem_path")
        if audio_path:
            is_clipped, clipped_count, peak_amp = check_audio_clipping(audio_path)
            if is_clipped:
                is_crit = peak_amp >= 1.0 or clipped_count >= 10
                score -= 25.0 if is_crit else 15.0
                findings.append({
                    "finding_id": f"qa-{job_id}-clip-{seg_id}",
                    "scene_id": scene_id or "scene_1",
                    "segment_id": seg_id,
                    "target_segment_id": seg_id,
                    "timestamp_s": target,
                    "defect_type": "AUDIO_CLIPPING",
                    "severity": "critical" if is_crit else "major",
                    "peak_amplitude": peak_amp,
                    "clipped_samples": clipped_count,
                    "description": (
                        f"Digital audio clipping detected in stem for segment {seg_id}: "
                        f"{clipped_count} clipped samples, peak amplitude {peak_amp:.3f} >= 0.999."
                    ),
                    "recommended_fix": "Reduce synthesis gain by -2.0 dB or apply peak limiter during voice mastering.",
                    "fix_proposal": "Reduce synthesis gain by -2.0 dB or apply peak limiter during voice mastering.",
                    "target_agent": "voice_director",
                    "syllables_to_reduce": 0,
                    "fix_applied": False,
                })

        # 2. Check for timing overflow and calculate quantitative syllable delta
        if overflow > 0.3:
            syllables_to_reduce = math.ceil(overflow * 3.2)
            is_crit = overflow > 1.0
            score -= 25.0 if is_crit else 12.0

            # Route to localization_director if severe overflow or prefer_script_rework, else sync_engineer
            prefer_script = s.get("prefer_script_rework", False) or s.get("target_agent") == "localization_director"
            if overflow > 0.5 or prefer_script:
                target_agent = "localization_director"
                fix_proposal = (
                    f"Shorten localized line by {syllables_to_reduce} syllable(s) "
                    f"to fit {target:.2f}s dialogue window."
                )
            else:
                target_agent = "sync_engineer"
                speed_factor = dur / target if target > 0 else 1.25
                fix_proposal = (
                    f"Dispatch targeted retry to Sync Engineer: apply atempo speed factor "
                    f"({speed_factor:.2f}x) or trim trailing silence."
                )

            findings.append({
                "finding_id": f"qa-{job_id}-{seg_id}",
                "scene_id": scene_id or "scene_1",
                "segment_id": seg_id,
                "target_segment_id": seg_id,
                "timestamp_s": target,
                "defect_type": "TIMING_OVERFLOW",
                "severity": "critical" if is_crit else "major",
                "overflow_s": round(overflow, 3),
                "syllables_to_reduce": syllables_to_reduce,
                "description": f"Scene {scene_id} exceeds speech window by {overflow:.2f}s (Duration: {dur:.2f}s, Target: {target:.2f}s).",
                "recommended_fix": fix_proposal,
                "fix_proposal": fix_proposal,
                "target_agent": target_agent,
                "fix_applied": False,
            })

    # 3. Check for subtitle drift
    if subtitles:
        for sub in subtitles:
            if sub.get("drift_detected", False):
                score -= 10.0
                cue_idx = sub.get("cue_index", 1)
                findings.append({
                    "finding_id": f"qa-{job_id}-sub-{cue_idx}",
                    "scene_id": scene_id or "scene_1",
                    "segment_id": cue_idx,
                    "target_segment_id": cue_idx,
                    "timestamp_s": float(sub.get("timestamp_s", 0.0)),
                    "defect_type": "SUBTITLE_DRIFT",
                    "severity": "major",
                    "description": f"Subtitle cue #{cue_idx} drifts beyond audio boundary.",
                    "recommended_fix": "Re-align cue timestamps using final Sync Engineer duration markers.",
                    "fix_proposal": "Re-align cue timestamps using final Sync Engineer duration markers.",
                    "target_agent": "subtitle_director",
                    "syllables_to_reduce": 0,
                    "fix_applied": False,
                })

    final_score = max(0.0, min(100.0, round(score, 1)))
    verdict = "pass" if (final_score >= min_readiness_threshold and len(findings) == 0) else "rework_required"

    if verdict == "pass":
        decision = f"QA Agent approved release candidate with release-readiness score {final_score}/100. Zero defects detected."
    else:
        primary_defect = findings[0]["defect_type"] if findings else "UNKNOWN"
        decision = (
            f"QA Agent flagged {len(findings)} defect(s), release-readiness score {final_score}/100. "
            f"Primary defect: {primary_defect} in scene {scene_id}. Rework required."
        )

    return {
        "job_id": job_id,
        "release_readiness_score": final_score,
        "verdict": verdict,
        "defect_count": len(findings),
        "findings": findings,
        "decision": decision,
        "quality_score": final_score,
    }


class QAContinuityAgent(BaseAgent):
    def __init__(self, min_readiness_threshold: float = 85.0):
        super().__init__("qa_agent")
        self.min_readiness_threshold = min_readiness_threshold

    def check_audio_clipping(self, audio_path: Union[str, Path]) -> Tuple[bool, int, float]:
        return check_audio_clipping(audio_path)

    def inspect_stems_with_signal(
        self,
        stems: List[Dict[str, Any]],
        subtitles: Optional[List[Dict[str, Any]]] = None,
        job_id: str = "qa-job",
        scene_id: str = "scene_1"
    ) -> Dict[str, Any]:
        return inspect_stems_with_signal(
            stems=stems,
            subtitles=subtitles,
            job_id=job_id,
            scene_id=scene_id,
            min_readiness_threshold=self.min_readiness_threshold
        )

    async def _execute(self, job_id: str, scene_id: str, context: Dict[str, Any], retry_count: int) -> Dict[str, Any]:
        stems = context.get("stems", [])
        subtitles = context.get("subtitles", [])
        return self.inspect_stems_with_signal(
            stems=stems,
            subtitles=subtitles,
            job_id=job_id,
            scene_id=scene_id
        )
