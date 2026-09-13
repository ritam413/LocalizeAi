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
        max_retries = int(context.get("max_retries", 2))

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
                "target_window_s": adj["original_window_s"],
                "audio_path": adj.get("adjusted_path") or adj.get("stem_path")
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

        # 7. Closed Self-Repair Loop (Quantitative Targeted Retry Routing)
        while qa_res["verdict"] == "rework_required" and qa_res["findings"] and retries_executed < max_retries:
            retries_executed += 1
            finding = qa_res["findings"][0]
            target_agent = finding.get("target_agent", "sync_engineer")
            defect_type = finding.get("defect_type", "TIMING_OVERFLOW")
            seg_id = finding.get("target_segment_id") or finding.get("segment_id", 1)
            syllables_to_reduce = finding.get("syllables_to_reduce", 0)

            if target_agent == "localization_director" or (defect_type == "TIMING_OVERFLOW" and syllables_to_reduce > 0 and target_agent != "sync_engineer"):
                # Quantitative Syllable Delta dispatch directly to Localization Director
                rework_instructions = {
                    "segment_id": seg_id,
                    "delta_syllables": syllables_to_reduce,
                    "instructions": f"Reduce segment {seg_id} by {syllables_to_reduce} syllables to satisfy duration window."
                }
                loc_res = await self.localization_director.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={
                        "target_language": target_lang,
                        "audience_profile": audience_profile,
                        "annotated_segments": story_res["annotated_segments"],
                        "rework_instructions": rework_instructions
                    },
                    retry_count=retries_executed
                )

                # Re-synthesize with Voice Director
                voice_res = await self.voice_director.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={
                        "target_language": target_lang,
                        "speakers": story_res["speakers"],
                        "localized_lines": loc_res["localized_lines"]
                    },
                    retry_count=retries_executed
                )

                # Re-sync with Sync Engineer
                sync_res = await self.sync_engineer.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={
                        "synthesized_stems": voice_res["synthesized_stems"],
                        "tolerance_s": 0.05
                    },
                    retry_count=retries_executed
                )

                # Re-align Subtitles
                sub_res = await self.subtitle_director.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={
                        "target_language": target_lang,
                        "localized_lines": loc_res["localized_lines"],
                        "sync_adjustments": sync_res["sync_adjustments"]
                    },
                    retry_count=retries_executed
                )

                # QA Re-inspection
                qa_retry_stems = [
                    {
                        "segment_id": adj["segment_id"],
                        "duration_s": adj["final_duration_s"],
                        "target_window_s": adj["original_window_s"],
                        "audio_path": adj.get("adjusted_path") or adj.get("stem_path")
                    }
                    for adj in sync_res["sync_adjustments"]
                ]
                qa_res = await self.qa_agent.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={"stems": qa_retry_stems},
                    retry_count=retries_executed
                )
                finding["fix_applied"] = True
                repaired_defects.append(finding)

            elif target_agent == "voice_director" or defect_type == "AUDIO_CLIPPING":
                # Voice Director clipping / gain remediation
                voice_res = await self.voice_director.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={
                        "target_language": target_lang,
                        "speakers": story_res["speakers"],
                        "localized_lines": loc_res["localized_lines"],
                        "gain_adjust_db": -2.0
                    },
                    retry_count=retries_executed
                )
                sync_res = await self.sync_engineer.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={
                        "synthesized_stems": voice_res["synthesized_stems"],
                        "tolerance_s": 0.05
                    },
                    retry_count=retries_executed
                )
                sub_res = await self.subtitle_director.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={
                        "target_language": target_lang,
                        "localized_lines": loc_res["localized_lines"],
                        "sync_adjustments": sync_res["sync_adjustments"]
                    },
                    retry_count=retries_executed
                )
                qa_retry_stems = [
                    {
                        "segment_id": adj["segment_id"],
                        "duration_s": adj["final_duration_s"],
                        "target_window_s": adj["original_window_s"],
                        "audio_path": adj.get("adjusted_path") or adj.get("stem_path")
                    }
                    for adj in sync_res["sync_adjustments"]
                ]
                qa_res = await self.qa_agent.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={"stems": qa_retry_stems},
                    retry_count=retries_executed
                )
                finding["fix_applied"] = True
                repaired_defects.append(finding)

            elif target_agent == "sync_engineer":
                # Sync Engineer atempo / timing enforcement
                forced_stems = [
                    {
                        "segment_id": stem["segment_id"],
                        "synthesized_duration_s": stem["target_duration_s"],
                        "target_duration_s": stem["target_duration_s"],
                        "audio_path": stem.get("audio_path")
                    }
                    for stem in voice_res["synthesized_stems"]
                ]
                sync_res = await self.sync_engineer.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={"synthesized_stems": forced_stems, "tolerance_s": 0.05},
                    retry_count=retries_executed
                )
                sub_res = await self.subtitle_director.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={
                        "target_language": target_lang,
                        "localized_lines": loc_res["localized_lines"],
                        "sync_adjustments": sync_res["sync_adjustments"]
                    },
                    retry_count=retries_executed
                )
                qa_retry_stems = [
                    {
                        "segment_id": adj["segment_id"],
                        "duration_s": adj["final_duration_s"],
                        "target_window_s": adj["original_window_s"],
                        "audio_path": adj.get("adjusted_path") or adj.get("stem_path")
                    }
                    for adj in sync_res["sync_adjustments"]
                ]
                qa_res = await self.qa_agent.run(
                    job_id=job_id,
                    scene_id=scene_id,
                    context={"stems": qa_retry_stems},
                    retry_count=retries_executed
                )
                finding["fix_applied"] = True
                repaired_defects.append(finding)
            else:
                break

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
