"""
cancel_registry.py
==================
Process-wide registry mapping run_id -> asyncio.Event and tracking active subprocesses.

The RunExecutor sets an event per run before starting and checks it
between stage transitions and during progress updates. The /runs/{id}/cancel API endpoint sets
the event to signal cancellation and kills any running child subprocesses.
"""
import asyncio
from typing import Dict, Set, Any, Optional

_registry: Dict[str, asyncio.Event] = {}
_active_processes: Dict[str, Any] = {}
_cancelled_set: Set[str] = set()


def register(run_id: str) -> asyncio.Event:
    """Create and register a cancel event for *run_id*. Returns the event."""
    event = asyncio.Event()
    _registry[run_id] = event
    if run_id in _cancelled_set:
        event.set()
    return event


def register_process(run_id: str, proc: Any) -> None:
    """Register an active subprocess for immediate termination upon cancellation."""
    _active_processes[run_id] = proc
    # If run was already cancelled, kill process immediately
    if is_cancelled(run_id):
        try:
            proc.kill()
        except Exception:
            pass


def unregister_process(run_id: str) -> None:
    """Remove active process registration."""
    _active_processes.pop(run_id, None)


def signal_cancel(run_id: str) -> bool:
    """
    Signal cancellation for *run_id*.
    Returns True if the run was registered or active, False otherwise.
    """
    _cancelled_set.add(run_id)
    event = _registry.get(run_id)
    if event:
        event.set()

    proc = _active_processes.get(run_id)
    if proc:
        try:
            proc.kill()
        except Exception:
            pass

    return event is not None or run_id in _cancelled_set


def is_cancelled(run_id: str) -> bool:
    """Return True if the cancel event or signal for *run_id* has been set."""
    if run_id in _cancelled_set:
        return True
    event = _registry.get(run_id)
    return event is not None and event.is_set()


def unregister(run_id: str) -> None:
    """Remove the cancel event and process tracking after a run finishes."""
    _registry.pop(run_id, None)
    _active_processes.pop(run_id, None)
    _cancelled_set.discard(run_id)

