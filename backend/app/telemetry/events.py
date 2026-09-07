import json
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, Optional, List, Dict, Any, Callable, Awaitable
from pydantic import BaseModel, Field

AgentName = Literal[
    "story_analyst",
    "localization_director",
    "voice_director",
    "sync_engineer",
    "subtitle_director",
    "qa_agent",
    "director"
]

EventStatus = Literal["ok", "warning", "failed", "fixed"]

class TelemetryEvent(BaseModel):
    job_id: str
    scene_id: str
    agent: AgentName
    action: str
    decision: str
    latency_ms: int = Field(default=0, ge=0)
    retry_count: int = Field(default=0, ge=0)
    quality_score: float = Field(default=0.0, ge=0.0, le=100.0)
    status: EventStatus
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TelemetryLogger:
    def __init__(self, base_storage_dir: str = "./storage/runs"):
        self.base_storage_dir = Path(base_storage_dir)
        self._memory_events: Dict[str, List[TelemetryEvent]] = {}
        self._listeners: List[Callable[[TelemetryEvent], Awaitable[None]]] = []
        self._lock = asyncio.Lock()

    def add_listener(self, listener: Callable[[TelemetryEvent], Awaitable[None]]):
        self._listeners.append(listener)

    async def log_event(self, event: TelemetryEvent) -> TelemetryEvent:
        async with self._lock:
            # Memory store
            if event.job_id not in self._memory_events:
                self._memory_events[event.job_id] = []
            self._memory_events[event.job_id].append(event)

            # Persist to JSONL file
            run_dir = self.base_storage_dir / event.job_id
            run_dir.mkdir(parents=True, exist_ok=True)
            events_file = run_dir / "events.jsonl"
            
            with open(events_file, "a", encoding="utf-8") as f:
                f.write(event.model_dump_json() + "\n")

        # Broadcast to listeners
        for listener in self._listeners:
            try:
                await listener(event)
            except Exception:
                pass

        return event

    async def get_events(self, job_id: str) -> List[TelemetryEvent]:
        async with self._lock:
            if job_id in self._memory_events and self._memory_events[job_id]:
                return list(self._memory_events[job_id])
            
            events_file = self.base_storage_dir / job_id / "events.jsonl"
            events: List[TelemetryEvent] = []
            if events_file.exists():
                with open(events_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                data = json.loads(line)
                                events.append(TelemetryEvent(**data))
                            except Exception:
                                pass
                self._memory_events[job_id] = events
            return events

    async def get_summary(self, job_id: str) -> Dict[str, Any]:
        events = await self.get_events(job_id)
        if not events:
            return {
                "job_id": job_id,
                "total_events": 0,
                "avg_latency_ms": 0,
                "total_retries": 0,
                "avg_quality_score": 0.0,
                "defects_failed": 0,
                "defects_fixed": 0
            }

        total_latency = sum(e.latency_ms for e in events)
        total_retries = sum(e.retry_count for e in events)
        total_score = sum(e.quality_score for e in events)
        defects_failed = sum(1 for e in events if e.status == "failed")
        defects_fixed = sum(1 for e in events if e.status == "fixed")

        return {
            "job_id": job_id,
            "total_events": len(events),
            "avg_latency_ms": round(total_latency / len(events)),
            "total_retries": total_retries,
            "avg_quality_score": round(total_score / len(events), 2),
            "defects_failed": defects_failed,
            "defects_fixed": defects_fixed
        }

# Global singleton logger
telemetry_logger = TelemetryLogger()
