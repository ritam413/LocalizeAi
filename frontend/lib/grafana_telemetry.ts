import { TelemetryEvent } from './telemetry';

export interface GrafanaTelemetryRecord {
  agent: string;
  value: number;
  timestamp?: number;
}

export function formatPrometheusMetrics(events: TelemetryEvent[]): string {
  const lines: string[] = [
    '# HELP agent_latency_seconds Latency per agent execution',
    '# TYPE agent_latency_seconds gauge',
  ];

  for (const event of events) {
    const latencySec = (event.latency_ms / 1000).toFixed(2);
    lines.push(`agent_latency_seconds{agent="${event.agent}",job_id="${event.job_id}"} ${latencySec}`);
  }

  lines.push('# HELP agent_quality_score Quality score evaluated per stage (0-100)');
  lines.push('# TYPE agent_quality_score gauge');

  for (const event of events) {
    lines.push(`agent_quality_score{agent="${event.agent}",job_id="${event.job_id}"} ${event.quality_score}`);
  }

  return lines.join('\n');
}

export function parseGrafanaQueryResponse(response: any): GrafanaTelemetryRecord[] {
  if (!response || response.status !== 'success' || !response.data || !Array.isArray(response.data.result)) {
    return [];
  }

  const records: GrafanaTelemetryRecord[] = [];
  for (const item of response.data.result) {
    const agent = item.metric?.agent || 'unknown';
    const latestValPair = item.values ? item.values[item.values.length - 1] : null;
    if (latestValPair && Array.isArray(latestValPair)) {
      records.push({
        agent,
        timestamp: Number(latestValPair[0]),
        value: parseFloat(latestValPair[1]),
      });
    }
  }

  return records;
}
