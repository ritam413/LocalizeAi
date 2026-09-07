import { describe, it, expect } from 'vitest';
import {
  formatPrometheusMetrics,
  parseGrafanaQueryResponse,
  GrafanaTelemetryRecord,
} from '../lib/grafana_telemetry';

describe('TICKET-09: Grafana Telemetry & MCP Runtime Query Adapter', () => {
  const sampleEvents = [
    {
      job_id: 'job-grafana-1',
      scene_id: 'scene-01',
      agent: 'story_analyst' as const,
      action: 'analyze',
      decision: 'Extracted 2 speakers',
      latency_ms: 120,
      retry_count: 0,
      quality_score: 95.0,
      status: 'ok' as const,
      timestamp: '2026-09-06T12:00:00Z',
    },
    {
      job_id: 'job-grafana-1',
      scene_id: 'scene-01',
      agent: 'qa_agent' as const,
      action: 'inspect',
      decision: 'Flagged overflow',
      latency_ms: 180,
      retry_count: 0,
      quality_score: 72.0,
      status: 'failed' as const,
      timestamp: '2026-09-06T12:00:05Z',
    },
  ];

  it('formats telemetry into Prometheus metric exposition format for Grafana', () => {
    const metricsText = formatPrometheusMetrics(sampleEvents);
    expect(metricsText).toContain('# HELP agent_latency_seconds Latency per agent execution');
    expect(metricsText).toContain('# TYPE agent_latency_seconds gauge');
    expect(metricsText).toContain('agent_latency_seconds{agent="story_analyst",job_id="job-grafana-1"} 0.12');
    expect(metricsText).toContain('agent_quality_score{agent="qa_agent",job_id="job-grafana-1"} 72');
  });

  it('parses Grafana query tool responses for Director runtime telemetry reasoning', () => {
    const rawQueryResult = {
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [
          {
            metric: { agent: 'sync_engineer' },
            values: [[1757160000, '0.35']],
          },
        ],
      },
    };

    const parsed: GrafanaTelemetryRecord[] = parseGrafanaQueryResponse(rawQueryResult);
    expect(parsed.length).toBe(1);
    expect(parsed[0].agent).toBe('sync_engineer');
    expect(parsed[0].value).toBe(0.35);
  });
});
