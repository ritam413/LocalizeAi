# TICKET-09: Grafana Telemetry & MCP Runtime Queries

## Status
- **State**: Completed
- **Verification**: Vitest (`frontend/__tests__/grafana_telemetry.test.ts`) + Pytest (`backend/tests/test_grafana_mcp.py`)

## Objective
Establish the primary partner observability track: exposing Grafana-compatible telemetry REST endpoints (`/api/v1/telemetry/events`, `/api/v1/telemetry/summary`, `/api/v1/telemetry/metrics`), Prometheus format exporters, and the `GrafanaMcpAdapter` enabling the Director to query latency and defect metrics live at runtime.

## Seams & Interfaces
- Python: `backend/app/telemetry/grafana_mcp.py` (`GrafanaMcpAdapter`), `backend/app/api/telemetry.py` (`telemetry_router`)
- TypeScript: `frontend/lib/grafana_telemetry.ts` (`formatPrometheusMetrics`, `parseGrafanaQueryResponse`)

## Endpoints
- `GET /api/v1/telemetry/events?job_id={id}`: Section 6 events JSON
- `GET /api/v1/telemetry/summary?job_id={id}`: Aggregated metrics
- `GET /api/v1/telemetry/metrics?job_id={id}`: Prometheus exposition text
- `GET /api/v1/telemetry/defect_rate?job_id={id}`: Defect percentage & repairs

## Verification Results
- Vitest: 2 tests passed
- Pytest: 1 test passed
