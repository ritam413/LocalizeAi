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
| [TICKET-11](./TICKET-11-isometric-dialogue-engine.md) | Isometric Dialogue Engine & Syllable Quotas | Completed | `backend/app/agents/localization_director.py` | Pytest + Vitest | TICKET-03 |
| [TICKET-12](./TICKET-12-speech-synthesis-adapter.md) | Pluggable Speech Synthesis Adapter (Edge-TTS) | Completed | `backend/app/agents/voice_director.py` | Pytest + Vitest | TICKET-04, TICKET-11 |
| [TICKET-13](./TICKET-13-acoustic-mastering-engine.md) | Deep Acoustic Mastering Engine (Sidechain Ducking) | Completed | `backend/app/engine/stages/mixer.py` | Pytest | TICKET-05, TICKET-12 |
| [TICKET-14](./TICKET-14-perceptual-acoustic-qa-repair.md) | Perceptual Acoustic QA & Quantitative Retries | Completed | `backend/app/agents/qa_agent.py` | Pytest + Vitest | TICKET-07, TICKET-08, TICKET-11, TICKET-13 |
| [TICKET-15](./TICKET-15-proper-noun-and-numeral-localization.md) | English Proper Noun Preservation & Colloquial Numeral Localization | Completed | `backend/app/agents/localization_director.py` | Pytest + Vitest | TICKET-03 |
| [TICKET-16](./TICKET-16-director-end-to-end-pipeline.md) | End-to-End Post-Production Director Pipeline Runner | Completed | `backend/app/agents/director.py` | Pytest + Vitest | TICKET-08, TICKET-13, TICKET-14, TICKET-15 |
| [TICKET-17](./TICKET-17-post-qa-acoustic-mixdown.md) | Post-QA Acoustic Master Mixdown & Sidechain Bus Integration | Completed | `backend/app/agents/director.py` | Pytest | TICKET-08, TICKET-13, TICKET-14 |
| [TICKET-18](./TICKET-18-pluggable-diarization-adapter.md) | Pluggable Speaker Diarization Adapter & Voiceprint Mapping | Completed | `backend/app/agents/story_analyst.py` | Pytest + Vitest | TICKET-02 |
| [TICKET-19](./TICKET-19-broadcast-deliverables-exporter.md) | Broadcast Video Multiplexing & Studio Deliverables Exporter | Completed | `backend/app/engine/stages/exporter.py` | Pytest | TICKET-06, TICKET-13, TICKET-16, TICKET-17 |


