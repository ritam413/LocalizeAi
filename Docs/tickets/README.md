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
| [TICKET-20](./TICKET-20-windowed-demucs-splicer.md) | Windowed Demucs Splicer & Equal-Power Crossfade DSP Engine | Planned | `backend/app/engine/stages/chunked_demucs.py` | Pytest | None |
| [TICKET-21](./TICKET-21-hybrid-demucs-window-planner.md) | Hybrid Speech Clustering & VAD-Guided Macro-Window Generator | Planned | `backend/app/engine/stages/demucs_window_planner.py` | Pytest | TICKET-20 |
| [TICKET-22](./TICKET-22-director-demucs-pipeline-integration.md) | Director Pipeline Integration & Telemetry Savings Exporter | Planned | `backend/app/agents/director.py` | Pytest | TICKET-20, TICKET-21 |
| [TICKET-23](./TICKET-23-studio-demucs-timeline-selector-ui.md) | Studio Console Advanced Timeline Marker & Compute Savings HUD | Planned | `frontend/components/studio/WorkbenchCard.tsx` | Vitest | TICKET-22 |
| [TICKET-24](./TICKET-24-centralized-language-registry.md) | Centralized Language & Voice Persona Registry | Completed | `backend/app/core/languages.py` | Pytest (4/4 Passed) | None |
| [TICKET-25](./TICKET-25-kokoro-neural-tts-adapter.md) | Hardened Kokoro-82M Neural TTS Adapter | Completed | `backend/app/agents/voice_director.py` | Pytest (13/13 Passed) | None (Unblocked) |
| [TICKET-26](./TICKET-26-tts-stage-executor-gpu-lock-wiring.md) | TTS Stage, Executor Seam & GPU Mutex Wiring | Completed | `backend/app/engine/stages/tts.py` | Pytest (16/16 Passed) | TICKET-24, TICKET-25 |
| [TICKET-27](./TICKET-27-downstream-audio-seams-and-qa-verification.md) | Downstream Audio Seams & Acoustic QA Verification | Completed | `backend/app/agents/qa_agent.py` | Pytest (9/9 Passed) | TICKET-25, TICKET-26 |
| [TICKET-28](./TICKET-28-kokoro-tts-automated-test-harness.md) | Kokoro TTS Automated Test Harness & CI Gatekeeper | Completed | `backend/tests/test_voice_director.py` | Pytest (9/9 Passed) | TICKET-24, TICKET-25, TICKET-26, TICKET-27 |
| [TICKET-29](./TICKET-29-demucs-removal-resumable-asr.md) | Demucs Removal & Resumable Chunked Faster-Whisper ASR | Completed | `backend/app/engine/stages/transcription.py` | Pytest (106/106 Passed) | None |
| [TICKET-30](./TICKET-30-multilingual-translation-audio-duration.md) | Multilingual Translation Engine & Audio Duration Preservation | Completed | `backend/app/engine/stages/translation.py` | Pytest (114/114 Passed) | None |
| [TICKET-31](./TICKET-31-japanese-neural-voiceover.md) | Japanese Neural Voiceover & Phonemizer Integration | Deferred | `backend/app/agents/voice_director.py` | Pytest | TICKET-30 |
| [TICKET-32](./TICKET-32-translation-stage-disk-persistence.md) | Translation Stage Disk Persistence & Multi-Language Manifests | Planned | `backend/app/engine/stages/translation.py` | Pytest | None (Unblocked) |
| [TICKET-33](./TICKET-33-voice-director-timeline-and-stems-manifest.md) | Voice Director Timeline Preservation & Stems Manifest | Planned | `backend/app/agents/voice_director.py` | Pytest | TICKET-32 |
| [TICKET-34](./TICKET-34-executor-state-rehydration-and-mutex.md) | Executor State Rehydration & Single-Flight Stage Mutex | Planned | `backend/app/engine/executor.py` | Pytest | TICKET-32, TICKET-33 |
| [TICKET-35](./TICKET-35-scalable-filtergraph-script-generation.md) | Scalable Filtergraph Script Generation & Windows 8k Buffer Defense | Planned | `backend/app/engine/stages/mixer.py` | Pytest | TICKET-33, TICKET-34 |
| [TICKET-36](./TICKET-36-frontend-preview-stream-object-bridge.md) | Frontend Deliverables File Object Streaming Bridge | Planned | `frontend/lib/mediaTrackHelpers.ts` | Vitest | None (Unblocked) |
| [TICKET-39](./TICKET-39-asr-overlapping-speech-vad-tuning.md) | ASR Overlapping Speech & VAD Tuning | Completed | `backend/app/engine/stages/transcription.py` | Pytest | None |
| [TICKET-40](./TICKET-40-multispeaker-dialogue-stacking-formatter.md) | Multi-Speaker Overlapping Dialogue Stacking Formatter | Ready | `backend/app/engine/subtitle_formatter.py` | Pytest | None |
| [TICKET-41](./TICKET-41-voice-director-audio-invariant.md) | Voice Director Audio Invariant Metadata (`inv_005`) | Completed | `frontend/components/studio/AgentSequenceTrack.tsx` | Vitest (2/2 Passed) | None |
| [TICKET-42](./TICKET-42-boustrophedon-serpentine-grid-layout.md) | 2-Row Boustrophedon Grid Layout & SVG Turn Conduit | Completed | `frontend/components/studio/AgentSequenceTrack.tsx` | Vitest (4/4 Passed) | None |
| [TICKET-43](./TICKET-43-parent-boundary-compatibility.md) | Parent Invocation Boundary & Interface Compatibility | ✅ Completed | `frontend/app/runs/demo/page.tsx` & `[id]/page.tsx` | Vitest (9/9 Passed) | TICKET-42 |
| [TICKET-44](./TICKET-44-serpentine-track-unit-test-suite.md) | Serpentine Agent Sequence Track Unit Test Suite | ✅ Completed | `frontend/__tests__/AgentSequenceTrack.test.tsx` | Vitest (13/13 Passed) | TICKET-42 |
| [TICKET-45](./TICKET-45-regression-and-memory-handoff.md) | Automated Regression Suite & Persistent Memory Handoff | ✅ Completed | `TRACKER.md` & `features_implemented.md` | Vitest (134/134 Passed) | TICKET-43, TICKET-44 |

## Active Wayfinder Maps
- [WAYFINDER MAP: Hindi TTS Localization & Resilient Stem Persistence Pipeline](./WAYFINDER_MAP_HINDI_TTS_AND_STEM_PERSISTENCE.md)
- [WAYFINDER MAP: Overlapping Speech & Subtitle Stacking](./WAYFINDER_MAP_OVERLAPPING_SPEECH_AND_SUBTITLE_STACKING.md)
- [WAYFINDER MAP: Restoring Serpentine Agent Workflow Route (2-Row Boustrophedon)](./WAYFINDER_MAP_SERPENTINE_AGENT_WORKFLOW.md)
