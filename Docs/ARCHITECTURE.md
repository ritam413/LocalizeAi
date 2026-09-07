# LOCALIZE — System Architecture

## Overview
LOCALIZE is an Autonomous AI Post-Production Crew for Film/Video Localization. Unlike standard sequential pipelines, LOCALIZE operates as a stateful, defect-aware multi-agent team orchestrated by the Director Agent, supported by an end-to-end observability layer (Grafana) and runtime reasoning powered by Google Cloud AI (Gemini).

```
                         ┌───────────────────┐
                         │   DIRECTOR AGENT   │  (orchestrator, holds job state)
                         └─────────┬──────────┘
           ┌───────────┬───────────┼───────────┬────────────┬─────────────┐
           ▼           ▼           ▼            ▼            ▼             ▼
     Story Analyst  Localization  Voice      Sync         Subtitle      QA / Continuity
                     Director     Director   Engineer     Director      Agent
           │           │           │            │            │             │
           └───────────┴───────────┴────────────┴────────────┴──────┬──────┘
                                                                      ▼
                                                          release candidate + score
                                                                      │
                                                        score < threshold? ── yes ──► back to relevant agent (targeted retry)
                                                                      │
                                                                     no
                                                                      ▼
                                                              FINAL CUT + report
```

---

## Agent Boundaries & Seam Rationale (`/codebase-design`)

1. **Why Story Analyst is separated from Localization Director**:
   - *Rationale*: Understanding context, speaker attribution, emotional tone, and cultural references must occur *before* linguistic translation begins. Separating them prevents the translator from confusing speech stems, misidentifying character attitudes, or hallucinating speaker labels.

2. **Why Voice Director is separated from Sync Engineer**:
   - *Rationale*: Voice selection and TTS synthesis prioritize character performance and phonetic realism. The Sync Engineer reconciles speech duration against visual/audio timing windows without modifying voice timbre or actor identity.

3. **Why Sync Engineer is separated from Subtitle Director**:
   - *Rationale*: Sync adjustments (e.g., speed compression via `ffmpeg atempo`, micro-pauses) shift speech timestamps. The Subtitle Director generates subtitles *after* timing adjustments are finalized, eliminating subtitle drift.

4. **Why QA / Continuity Agent is an autonomous reviewer**:
   - *Rationale*: To avoid pass-through failure modes, the QA Agent reviews the assembled cut independently. It outputs itemized findings (defect classification, offending timestamp, confidence score, and remediation strategy) allowing the Director to route targeted retries rather than full pipeline restarts.

---

## Observability & Control Tower (Grafana Primary Track)

Every agent action emits structured Section 6 events:
- Streamed directly to `storage/runs/{job_id}/events.jsonl`.
- Broadcasted in real-time across WebSocket connections to the frontend.
- Exposed via `/api/v1/telemetry/events` for Grafana scraping (Loki/Prometheus) and the Grafana MCP server.
- The Director Agent queries this telemetry at runtime to detect bottlenecks and verify repair resolution.
