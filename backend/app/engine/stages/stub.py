import asyncio
from typing import Dict, Any
from app.engine.stage import BaseStage, ProgressCallback, LogCallback

class StubStage(BaseStage):
    def __init__(self, stage_name: str, gpu_required: bool = False, sleep_duration: float = 0.5):
        super().__init__(stage_name, gpu_required)
        self.sleep_duration = sleep_duration

    async def execute(
        self,
        input_artifacts: Dict[str, Any],
        config: Dict[str, Any],
        progress_cb: ProgressCallback,
        log_cb: LogCallback
    ) -> Dict[str, Any]:
        await log_cb("INFO", f"Starting stub stage: {self.stage_name} (gpu={self.gpu_required})")
        steps = 5
        for i in range(1, steps + 1):
            await asyncio.sleep(self.sleep_duration / steps)
            pct = (i / steps) * 100.0
            await progress_cb(pct, f"Step {i}/{steps} completed")
            await log_cb("DEBUG", f"Progress {pct:.0f}%")

        await log_cb("INFO", f"Completed stub stage: {self.stage_name}")
        return {
            "status": "success",
            "stage": self.stage_name,
            "artifacts": [
                {
                    "type": "json",
                    "label": f"Stub {self.stage_name.capitalize()} Data",
                    "path": f"/storage/stub_{self.stage_name}.json"
                }
            ]
        }
