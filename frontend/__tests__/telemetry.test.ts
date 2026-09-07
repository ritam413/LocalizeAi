import { describe, it, expect } from 'vitest';
import {
  TelemetryEvent,
  AgentName,
  EventStatus,
  createTelemetryEvent,
  validateTelemetryEvent,
  summarizeTelemetryEvents,
} from '../lib/telemetry';

describe('TICKET-01: Section 6 Event Schema & Telemetry Shim', () => {
  it('creates a valid Section 6 telemetry event with default ISO timestamp and initial counts', () => {
    const event = createTelemetryEvent({
      job_id: 'job-123',
      scene_id: 'scene-01',
      agent: 'story_analyst',
      action: 'analyze_transcript',
      decision: 'Extracted 3 speakers and identified 2 cultural idioms in dialogue.',
      latency_ms: 320,
      retry_count: 0,
      quality_score: 94.5,
      status: 'ok',
    });

    expect(event.job_id).toBe('job-123');
    expect(event.scene_id).toBe('scene-01');
    expect(event.agent).toBe('story_analyst');
    expect(event.action).toBe('analyze_transcript');
    expect(event.decision).toContain('Extracted 3 speakers');
    expect(event.latency_ms).toBe(320);
    expect(event.retry_count).toBe(0);
    expect(event.quality_score).toBe(94.5);
    expect(event.status).toBe('ok');
    expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
  });

  it('validates required fields per Section 6 specification', () => {
    const validPayload: any = {
      job_id: 'job-abc',
      scene_id: 'scene-02',
      agent: 'sync_engineer',
      action: 'speed_adjust',
      decision: 'Accelerated dialogue by 1.15x via atempo filter to conform to 3.2s visual window.',
      latency_ms: 150,
      retry_count: 1,
      quality_score: 88.0,
      status: 'fixed',
      timestamp: new Date().toISOString(),
    };

    expect(validateTelemetryEvent(validPayload)).toBe(true);

    const missingAgent = { ...validPayload, agent: undefined };
    expect(validateTelemetryEvent(missingAgent)).toBe(false);

    const invalidStatus = { ...validPayload, status: 'invalid_status' };
    expect(validateTelemetryEvent(invalidStatus)).toBe(false);
  });

  it('aggregates telemetry summaries (average latency, total retries, min/avg score, defect counts)', () => {
    const events: TelemetryEvent[] = [
      createTelemetryEvent({
        job_id: 'job-1',
        scene_id: 'scene-1',
        agent: 'story_analyst',
        action: 'detect_speakers',
        decision: 'Detected 2 speakers',
        latency_ms: 100,
        retry_count: 0,
        quality_score: 90.0,
        status: 'ok',
      }),
      createTelemetryEvent({
        job_id: 'job-1',
        scene_id: 'scene-1',
        agent: 'qa_agent',
        action: 'inspect_sync',
        decision: 'Detected 1.2s audio overflow beyond dialogue cut point.',
        latency_ms: 200,
        retry_count: 0,
        quality_score: 65.0,
        status: 'failed',
      }),
      createTelemetryEvent({
        job_id: 'job-1',
        scene_id: 'scene-1',
        agent: 'sync_engineer',
        action: 'reconcile_timing',
        decision: 'Applied 1.2x atempo compression and trimmed silence.',
        latency_ms: 300,
        retry_count: 1,
        quality_score: 95.0,
        status: 'fixed',
      }),
    ];

    const summary = summarizeTelemetryEvents(events);
    expect(summary.total_events).toBe(3);
    expect(summary.avg_latency_ms).toBe(200);
    expect(summary.total_retries).toBe(1);
    expect(summary.avg_quality_score).toBeCloseTo(83.33, 1);
    expect(summary.defects_fixed).toBe(1);
    expect(summary.defects_failed).toBe(1);
  });
});
