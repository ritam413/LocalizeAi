from typing import Dict, Any, List
from app.agents.base import BaseAgent

class QAContinuityAgent(BaseAgent):
    def __init__(self, min_readiness_threshold: float = 85.0):
        super().__init__("qa_agent")
        self.min_readiness_threshold = min_readiness_threshold

    async def _execute(self, job_id: str, scene_id: str, context: Dict[str, Any], retry_count: int) -> Dict[str, Any]:
        stems = context.get("stems", [])
        subtitles = context.get("subtitles", [])
        findings = []
        score = 98.0

        for s in stems:
            dur = float(s.get("duration_s", 3.0))
            target = float(s.get("target_window_s", 3.0))
            overflow = dur - target

            if overflow > 0.3:
                is_crit = overflow > 1.0
                score -= 25.0 if is_crit else 12.0
                findings.append({
                    "finding_id": f"qa-{job_id}-{s.get('segment_id', 1)}",
                    "scene_id": scene_id or "scene_1",
                    "segment_id": s.get("segment_id", 1),
                    "timestamp_s": target,
                    "defect_type": "TIMING_OVERFLOW",
                    "severity": "critical" if is_crit else "major",
                    "description": f"Scene {scene_id} exceeds speech window by {overflow:.2f}s (Duration: {dur}s, Target: {target}s).",
                    "recommended_fix": f"Dispatch targeted retry to Sync Engineer: apply atempo speed factor ({dur/target:.2f}x) or trim trailing silence.",
                    "target_agent": "sync_engineer",
                    "fix_applied": False
                })

        final_score = max(0.0, min(100.0, round(score, 1)))
        verdict = "pass" if (final_score >= self.min_readiness_threshold and len(findings) == 0) else "rework_required"

        if verdict == "pass":
            decision = f"QA Agent approved release candidate with release-readiness score {final_score}/100. Zero defects detected."
        else:
            decision = (
                f"QA Agent flagged {len(findings)} defect(s), release-readiness score {final_score}/100. "
                f"Primary defect: {findings[0]['defect_type']} in scene {scene_id}. Rework required."
            )

        return {
            "job_id": job_id,
            "release_readiness_score": final_score,
            "verdict": verdict,
            "defect_count": len(findings),
            "findings": findings,
            "decision": decision,
            "quality_score": final_score
        }
