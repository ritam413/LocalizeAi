# Exercise 01.01: Section 6 Event Schema & Telemetry Shim

## Concept
In an autonomous multi-agent localization crew, observability is not an afterthought. Every agent action emits a structured Section 6 telemetry event containing latency, retry iteration count, quality score, and human-readable decision rationale.

## Schema
- `job_id`: string
- `scene_id`: string
- `agent`: AgentName
- `action`: string
- `decision`: string
- `latency_ms`: number
- `retry_count`: number
- `quality_score`: number (0.0 to 100.0)
- `status`: "ok" | "warning" | "failed" | "fixed"
- `timestamp`: ISO8601
