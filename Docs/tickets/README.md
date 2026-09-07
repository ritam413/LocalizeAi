# LOCALIZE — Tickets Index

This directory contains individual specification and execution tickets for the LOCALIZE build, managed via `/tdd` (Test-Driven Development).

## Ticket Matrix

| Ticket ID | Title | Status | Primary Seam | Test Suites | Blocking Dependencies |
|---|---|---|---|---|---|
| [TICKET-01](./TICKET-01-event-schema-telemetry.md) | Section 6 Event Schema & Telemetry Shim | Completed | `backend/app/telemetry/events.py` | Vitest + Pytest | None |
| [TICKET-02](./TICKET-02-story-analyst-agent.md) | Story Analyst Agent (Speaker/Scene/Tone) | Completed | `backend/app/agents/story_analyst.py` | Vitest + Pytest | TICKET-01 |
| [TICKET-03](./TICKET-03-localization-director-agent.md) | Localization Director Agent (Character Translation) | Completed | `backend/app/agents/localization_director.py` | Vitest + Pytest | TICKET-02 |
| [TICKET-04](./TICKET-04-voice-director-agent.md) | Voice Director Agent (Voice Cast & TTS) | Completed | `backend/app/agents/voice_director.py` | Vitest + Pytest | TICKET-03 |
| [TICKET-05](./TICKET-05-sync-engineer-agent.md) | Sync Engineer Agent (Timing Reconciliation) | Completed | `backend/app/agents/sync_engineer.py` | Vitest + Pytest | TICKET-04 |
| [TICKET-06](./TICKET-06-subtitle-director-agent.md) | Subtitle Director Agent (Drift-Free Subtitles) | Completed | `backend/app/agents/subtitle_director.py` | Vitest + Pytest | TICKET-05 |
| [TICKET-07](./TICKET-07-qa-continuity-agent.md) | QA / Continuity Agent (Hero Defect Detection) | Completed | `backend/app/agents/qa_agent.py` | Vitest + Pytest | TICKET-06 |
| [TICKET-08](./TICKET-08-director-orchestrator-targeted-retry.md) | Director Orchestrator & Targeted Retry Loop | Completed | `backend/app/agents/director.py` | Vitest + Pytest | TICKET-07 |
| [TICKET-09](./TICKET-09-grafana-telemetry-mcp.md) | Grafana Telemetry & MCP Runtime Queries | Completed | `backend/app/telemetry/grafana_mcp.py` | Vitest + Pytest | TICKET-01 |
| [TICKET-10](./TICKET-10-studio-console-ui.md) | Post-Production Studio Console UI | Completed | `frontend/components/studio/` | Vitest | TICKET-08, TICKET-09 |
