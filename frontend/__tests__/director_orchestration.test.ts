import { describe, it, expect } from 'vitest';
import {
  DirectorJobConfig,
  DirectorJobState,
  createDirectorJobState,
  applyTargetedRepair,
  validateDirectorJobState,
} from '../lib/agents/director';

describe('TICKET-08: Director Orchestrator & Targeted Retry Loop', () => {
  const jobConfig: DirectorJobConfig = {
    job_id: 'job-director-demo',
    source_video_path: '/videos/sample_scene.mp4',
    target_language: 'hi',
    audience_profile: 'Colloquial Hindi urban youth',
  };

  it('initializes job state with task graph, crew statuses, and iteration 0', () => {
    const state = createDirectorJobState(jobConfig);
    expect(state.job_id).toBe('job-director-demo');
    expect(state.status).toBe('pending');
    expect(state.iterations).toBe(0);
    expect(state.crew_statuses.director).toBe('ready');
    expect(state.crew_statuses.qa_agent).toBe('pending');
  });

  it('simulates targeted retry: when QA flags defect in scene 7, re-routes to Sync Engineer and increments retry count', () => {
    let state = createDirectorJobState(jobConfig);
    state.status = 'rework_in_progress';
    state.iterations = 1;

    const qaFinding = {
      finding_id: 'qa-finding-01',
      scene_id: 'scene_07',
      segment_id: 7,
      timestamp_s: 3.2,
      defect_type: 'TIMING_OVERFLOW' as const,
      severity: 'critical' as const,
      description: 'Dialogue exceeds window by 1.4s',
      recommended_fix: 'Apply 1.25x atempo speed adjust',
      target_agent: 'sync_engineer' as const,
      fix_applied: false,
    };

    // Apply targeted repair
    state = applyTargetedRepair(state, qaFinding, {
      resolved_duration_s: 3.2,
      strategy: 'speed_adjust_atempo',
      atempo_factor: 1.25,
    });

    expect(state.iterations).toBe(2);
    expect(state.retries_by_agent.sync_engineer).toBe(1);
    expect(state.repaired_findings.length).toBe(1);
    expect(state.repaired_findings[0].fix_applied).toBe(true);
    expect(state.status).toBe('completed');
    expect(state.release_readiness_score).toBeGreaterThanOrEqual(90);
  });

  it('validates a complete DirectorJobState schema', () => {
    const state = createDirectorJobState(jobConfig);
    expect(validateDirectorJobState(state)).toBe(true);
  });
});
