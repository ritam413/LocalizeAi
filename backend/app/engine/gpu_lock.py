import asyncio
import logging
from contextlib import asynccontextmanager

logger = logging.getLogger("dubforge.gpu_lock")

class GpuLockManager:
    def __init__(self):
        self._lock = asyncio.Lock()
        self._current_holder: str | None = None

    @asynccontextmanager
    async def acquire(self, stage_identifier: str):
        logger.info(f"[GpuLock] Requesting lock for stage: {stage_identifier}")
        async with self._lock:
            self._current_holder = stage_identifier
            logger.info(f"[GpuLock] Acquired lock for stage: {stage_identifier}")
            try:
                yield
            finally:
                logger.info(f"[GpuLock] Releasing lock for stage: {stage_identifier}")
                # Clear CUDA cache if torch is installed
                try:
                    import torch
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                except ImportError:
                    pass
                self._current_holder = None

    @property
    def is_locked(self) -> bool:
        return self._lock.locked()

    @property
    def current_holder(self) -> str | None:
        return self._current_holder

gpu_lock = GpuLockManager()
