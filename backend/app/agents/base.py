import os
import time
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.telemetry.events import TelemetryEvent, AgentName, telemetry_logger

logger = logging.getLogger("localize.agents")

class BaseAgent(ABC):
    def __init__(self, agent_name: AgentName):
        self.agent_name = agent_name
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY", "")

    async def run(self, job_id: str, scene_id: str, context: Dict[str, Any], retry_count: int = 0) -> Dict[str, Any]:
        start_time = time.perf_counter()
        status = "ok"
        decision = ""
        quality_score = 90.0
        result = {}

        try:
            result = await self._execute(job_id, scene_id, context, retry_count)
            decision = result.get("decision", f"{self.agent_name} executed successfully.")
            quality_score = float(result.get("quality_score", 90.0))
            if retry_count > 0:
                status = "fixed"
        except Exception as e:
            status = "failed"
            decision = f"Error during {self.agent_name} execution: {str(e)}"
            quality_score = 40.0
            logger.error(f"Agent {self.agent_name} failed on job {job_id}: {e}", exc_info=True)
            raise e
        finally:
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            event = TelemetryEvent(
                job_id=job_id,
                scene_id=scene_id,
                agent=self.agent_name,
                action=f"{self.agent_name}_step",
                decision=decision,
                latency_ms=elapsed_ms,
                retry_count=retry_count,
                quality_score=quality_score,
                status=status
            )
            await telemetry_logger.log_event(event)

        return result

    @abstractmethod
    async def _execute(self, job_id: str, scene_id: str, context: Dict[str, Any], retry_count: int) -> Dict[str, Any]:
        """Subclasses implement this method with agent-specific logic."""
        pass
