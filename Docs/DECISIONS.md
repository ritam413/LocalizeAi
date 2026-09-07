# LOCALIZE — Architecture Decision Records (ADRs)

## 2026-09-06 — ADR-001: Gemini Structured Output via Pydantic for Agent Reasoning
- **Context**: The multi-agent crew needs deterministic structured data passing between Director, Story Analyst, Localization Director, Voice Director, Sync Engineer, Subtitle Director, and QA Agent.
- **Decision**: All agents use Gemini API with response schema enforcement via Pydantic models. Agents must never output unstructured free text that downstream agents must parse with regex.
- **Consequence**: Guaranteed type safety and routing determinism.

---

## 2026-09-06 — ADR-002: Section 6 Event Schema as Universal Telemetry Format
- **Context**: Grafana dashboards, live agent reasoning cards, ClickHouse analytics, and WebSocket updates need a common telemetry representation.
- **Decision**: Adopt the Section 6 JSON shape (`job_id`, `scene_id`, `agent`, `action`, `decision`, `latency_ms`, `retry_count`, `quality_score`, `status`, `timestamp`) across all agents.
- **Consequence**: One unified data format supports disk logging, live UI feeds, and Grafana Prometheus/Loki ingestion.

---

## 2026-09-06 — ADR-003: Targeted Retries vs Full Pipeline Restarts
- **Context**: When QA identifies a defect in scene 4, running the entire dubbing pipeline from scratch wastes latency, compute, and risks altering previously approved scenes.
- **Decision**: The Director Agent maintains a scene-level execution graph and re-routes only the offending scene/line back to the specific upstream agent with structured QA feedback.
- **Consequence**: Fast targeted repair loops, demonstrable in a 3-minute live demo.

---

## 2026-09-06 — ADR-004: Dual Test Harness (Vitest & Pytest)
- **Context**: Project spans Next.js frontend with UI state & contracts, and Python backend with ML/agent logic.
- **Decision**: Use Vitest for frontend components, contract validators, and UI repair cards; use Pytest for Python backend agent logic and telemetry.
- **Consequence**: Independent ticket verification with red-green TDD loops across both tiers.
