export type AgentName =
  | 'story_analyst'
  | 'localization_director'
  | 'voice_director'
  | 'sync_engineer'
  | 'subtitle_director'
  | 'qa_agent'
  | 'director';

export type EventStatus = 'ok' | 'warning' | 'failed' | 'fixed';

export interface TelemetryEvent {
  job_id: string;
  scene_id: string;
  agent: AgentName;
  action: string;
  decision: string;
  latency_ms: number;
  retry_count: number;
  quality_score: number;
  status: EventStatus;
  timestamp: string;
}

export interface TelemetrySummary {
  total_events: number;
  avg_latency_ms: number;
  total_retries: number;
  avg_quality_score: number;
  defects_failed: number;
  defects_fixed: number;
}

const VALID_AGENTS: Set<string> = new Set([
  'story_analyst',
  'localization_director',
  'voice_director',
  'sync_engineer',
  'subtitle_director',
  'qa_agent',
  'director',
]);

const VALID_STATUSES: Set<string> = new Set(['ok', 'warning', 'failed', 'fixed']);

export function createTelemetryEvent(
  params: Omit<TelemetryEvent, 'timestamp'> & { timestamp?: string }
): TelemetryEvent {
  return {
    ...params,
    timestamp: params.timestamp || new Date().toISOString(),
  };
}

export function validateTelemetryEvent(event: any): event is TelemetryEvent {
  if (!event || typeof event !== 'object') return false;
  if (typeof event.job_id !== 'string' || !event.job_id) return false;
  if (typeof event.scene_id !== 'string' || !event.scene_id) return false;
  if (typeof event.agent !== 'string' || !VALID_AGENTS.has(event.agent)) return false;
  if (typeof event.action !== 'string' || !event.action) return false;
  if (typeof event.decision !== 'string') return false;
  if (typeof event.latency_ms !== 'number' || event.latency_ms < 0) return false;
  if (typeof event.retry_count !== 'number' || event.retry_count < 0) return false;
  if (typeof event.quality_score !== 'number' || event.quality_score < 0 || event.quality_score > 100) return false;
  if (typeof event.status !== 'string' || !VALID_STATUSES.has(event.status)) return false;
  if (typeof event.timestamp !== 'string') return false;
  return true;
}

export function summarizeTelemetryEvents(events: TelemetryEvent[]): TelemetrySummary {
  if (events.length === 0) {
    return {
      total_events: 0,
      avg_latency_ms: 0,
      total_retries: 0,
      avg_quality_score: 0,
      defects_failed: 0,
      defects_fixed: 0,
    };
  }

  let totalLatency = 0;
  let totalRetries = 0;
  let totalScore = 0;
  let defectsFailed = 0;
  let defectsFixed = 0;

  for (const event of events) {
    totalLatency += event.latency_ms;
    totalRetries += event.retry_count;
    totalScore += event.quality_score;
    if (event.status === 'failed') defectsFailed++;
    if (event.status === 'fixed') defectsFixed++;
  }

  return {
    total_events: events.length,
    avg_latency_ms: Math.round(totalLatency / events.length),
    total_retries: totalRetries,
    avg_quality_score: totalScore / events.length,
    defects_failed: defectsFailed,
    defects_fixed: defectsFixed,
  };
}
