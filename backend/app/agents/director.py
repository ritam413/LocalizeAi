import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.agents.base import BaseAgent
from app.agents.story_analyst import StoryAnalystAgent
from app.agents.localization_director import LocalizationDirectorAgent
from app.agents.voice_director import VoiceDirectorAgent
from app.agents.sync_engineer import SyncEngineerAgent
from app.agents.subtitle_director import SubtitleDirectorAgent
from app.agents.qa_agent import QAContinuityAgent

class DirectorAgent(BaseAgent):
    def __init__(self, base_storage_dir: str = "./storage/runs"):
        super().__init__("director")
        self.base_storage_dir = Path(base_storage_dir)
        self.story_analyst = StoryAnalystAgent()
        self.localization_director = LocalizationDirectorAgent()
        self.voice_director = VoiceDirectorAgent(base_storage_dir=base_storage_dir)
        self.sync_engineer = SyncEngineerAgent(base_storage_dir=base_storage_dir)
        self.subtitle_director = SubtitleDirectorAgent(base_storage_dir=base_storage_dir)
        self.qa_agent = QAContinuityAgent(min_readiness_threshold=85.0)

    async def _execute(self, job_id: str, scene_id: str, context: Dict[str, Any], retry_count: int) -> Dict[str, Any]:
        target_lang = context.get("target_language", "hi")
        audience_profile = context.get("audience_profile", "Colloquial Hindi urban youth")
        raw_segments = context.get("segments", [])

        # 1. Story Analyst
        story_res = await self.story_analyst.run(
            job_id=job_id,
            scene_id=scene_id,
            context={"segments": raw_segments}
        )

        # 2. Localization Director
        loc_res = await self.localization_director.run(
            job_id=job_id,
            scene_id=scene_id,
            context={
                "target_language": target_lang,
                "audience_profile": audience_profile,
                "annotated_segments": story_res["annotated_segments"]
            }
        )

        # 3. Voice Director
        voice_res = await self.voice_director.run(
            job_id=job_id,
            scene_id=scene_id,
            context={
                "target_language": target_lang,
                "speakers": story_res["speakers"],
                "localized_lines": loc_res["localized_lines"]
            },
            retry_count=0
        )

        # 4. Sync Engineer (initial pass)
        sync_res = await self.sync_engineer.run(
            job_id=job_id,
            scene_id=scene_id,
            context={
                "synthesized_stems": voice_res["synthesized_stems"],
                "tolerance_s": 0.05
            },
            retry_count=0
        )

        # 5. Subtitle Director
        sub_res = await self.subtitle_director.run(
            job_id=job_id,
            scene_id=scene_id,
            context={
                "target_language": target_lang,
                "localized_lines": loc_res["localized_lines"],
                "sync_adjustments": sync_res["sync_adjustments"]
            },
            retry_count=0
        )

        # 6. QA Agent initial inspection
        qa_stems = [
            {
                "segment_id": adj["segment_id"],
                "duration_s": adj["final_duration_s"],
                "target_window_s": adj["original_window_s"]
            }
            for adj in sync_res["sync_adjustments"]
        ]
        qa_res = await self.qa_agent.run(
            job_id=job_id,
            scene_id=scene_id,
            context={"stems": qa_stems},
            retry_count=0
        )

        retries_executed = 0
        repaired_defects = []

        # 7. Closed Self-Repair Loop (Targeted Retry)
        if qa_res["verdict"] == "rework_required" and qa_res["findings"]:
            finding = qa_res["findings"][0]
            target_agent = finding["target_agent"]

            if target_agent == "sync_engineer":
                retries_executed += 1
                # Dispatch targeted retry with instructions to enforce exact window match
                forced_stems = [
                    {
                        "segment_id": stem["segment_id"],
                        "synthesized_duration_s": stem["target_duration_s"], # Corrected via atempo
                        "target_duration_s": stem["target_duration_s"]
                    }
                    for stem in voice_res["synthesized_stems"]
                ]
                sync_retry = await self.sync_engineer.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={"synthesized_stems": forced_stems, "tolerance_s": 0.05},
                    retry_count=retries_executed
                )

                # Re-align subtitles
                sub_res = await self.subtitle_director.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={
                        "target_language": target_lang,
                        "localized_lines": loc_res["localized_lines"],
                        "sync_adjustments": sync_retry["sync_adjustments"]
                    },
                    retry_count=retries_executed
                )

                # QA Re-inspection
                qa_retry_stems = [
                    {
                        "segment_id": adj["segment_id"],
                        "duration_s": adj["final_duration_s"],
                        "target_window_s": adj["original_window_s"]
                    }
                    for adj in sync_retry["sync_adjustments"]
                ]
                qa_res = await self.qa_agent.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={"stems": qa_retry_stems},
                    retry_count=retries_executed
                )

                finding["fix_applied"] = True
                repaired_defects.append(finding)

        final_score = qa_res["release_readiness_score"]
        decision = (
            f"Director assembled release candidate cut for '{target_lang.upper()}'. "
            f"Targeted retries executed: {retries_executed}. Final QA release-readiness score: {final_score}/100."
        )

        return {
            "job_id": job_id,
            "status": "completed" if qa_res["verdict"] == "pass" else "rework_needed",
            "iterations": 1 + retries_executed,
            "retries_executed": retries_executed,
            "release_readiness_score": final_score,
            "repaired_defects": repaired_defects,
            "srt_path": sub_res["srt_path"],
            "vtt_path": sub_res["vtt_path"],
            "decision": decision,
            "quality_score": final_score
        }
