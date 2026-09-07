import abc
import logging
from typing import Dict, Any, Callable, Awaitable

logger = logging.getLogger("dubforge.stage")

ProgressCallback = Callable[[float, str], Awaitable[None]]
LogCallback = Callable[[str, str], Awaitable[None]] # level, message

class BaseStage(abc.ABC):
    stage_name: str
    gpu_required: bool = False

    def __init__(self, stage_name: str, gpu_required: bool = False):
        self.stage_name = stage_name
        self.gpu_required = gpu_required

    @abc.abstractmethod
    async def execute(
        self,
        input_artifacts: Dict[str, Any],
        config: Dict[str, Any],
        progress_cb: ProgressCallback,
        log_cb: LogCallback
    ) -> Dict[str, Any]:
        """
        Executes the stage logic.
        Returns a dict of output artifacts:
        e.g. {"audio": "/path/to/extracted.wav", "segments": [...]}
        """
        pass
