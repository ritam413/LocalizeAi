# TICKET-22: Director Pipeline Integration & Telemetry Savings Exporter

**Status:** Planned  
**Parent Epic:** Selective Windowed Demucs Vocal Separation  
**Primary Seam:** `backend/app/agents/director.py`, `backend/app/engine/stages/separation.py`  
**Test Suite:** `backend/tests/test_director_chunked_demucs.py`  
**Dependencies:** TICKET-20, TICKET-21  

---

## 1. Context & Motivation
Connect the `ChunkedDemucsProcessor` and `DemucsWindowPlanner` directly into the Director Agent autonomous execution pipeline (`DirectorAgent.run_pipeline`) and the API execution runner (`app/api/runs.py`), ensuring that runtime telemetry and time savings are exported into the database and WebSocket events.

## 2. Specification & Requirements

1. **Pipeline Stage Integration**:
   - In `DirectorAgent.run_pipeline(..., demucs_ranges=None)`:
     - After `transcription` stage completes, call `resolve_demucs_windows()`.
     - Pass computed macro-windows into `ChunkedDemucsProcessor`.
     - Emit Section 6 event: `agent_completed: vocal_separation` with payload:
       ```json
       {
         "demucs_mode": "selective_windowed",
         "audio_duration_sec": 3000.0,
         "demucs_processed_sec": 780.0,
         "time_saved_sec": 2220.0,
         "compute_savings_pct": 74.0,
         "ranges_processed": [[240.0, 510.0], [1320.0, 1830.0]]
       }
       ```

2. **API Request Parameter**:
   - Update `POST /api/v1/runs` and `DirectorPipelineInput` to accept optional `demucs_ranges: Optional[str] = None`.

## 3. Verification Criteria
- [ ] Pytest testing end-to-end pipeline execution with `demucs_ranges` and auto-VAD mode.
- [ ] Telemetry payload emits valid `compute_savings_pct` and `time_saved_sec`.
