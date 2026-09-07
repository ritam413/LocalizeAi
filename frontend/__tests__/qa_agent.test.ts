import { describe, it, expect } from 'vitest';
import {
  QAInput,
  QAOutput,
  QAFinding,
  validateQAOutput,
  inspectCutForDefects,
} from '../lib/agents/qa_agent';

describe('TICKET-07: QA / Continuity Agent Contract & Defect Detection (Hero Feature)', () => {
  it('detects TIMING_OVERFLOW defect when dialogue exceeds window by >1.0s and recommends Sync Engineer fix', () => {
    const input: QAInput = {
      job_id: 'job-qa-01',
      scene_id: 'scene_07',
      target_language: 'hi',
      stems: [
        {
          segment_id: 7,
          speaker_id: 'speaker_1',
          duration_s: 4.6,
          target_window_s: 3.2, // 1.4s overflow!
        },
      ],
      subtitles: [],
    };

    const qaReport = inspectCutForDefects(input);

    expect(qaReport.verdict).toBe('rework_required');
    expect(qaReport.defect_count).toBe(1);
    expect(qaReport.release_readiness_score).toBeLessThan(80);

    const finding = qaReport.findings[0];
    expect(finding.defect_type).toBe('TIMING_OVERFLOW');
    expect(finding.target_agent).toBe('sync_engineer');
    expect(finding.severity).toBe('critical');
    expect(finding.description).toContain('exceeds dialogue window by 1.40s');
    expect(finding.recommended_fix).toContain('atempo');
  });

  it('passes cleanly with high release-readiness score (>90) when no defects are detected', () => {
    const input: QAInput = {
      job_id: 'job-qa-02',
      scene_id: 'scene_01',
      target_language: 'hi',
      stems: [
        {
          segment_id: 1,
          speaker_id: 'speaker_1',
          duration_s: 3.22,
          target_window_s: 3.2, // 0.02s diff (within tolerance)
        },
      ],
      subtitles: [
        {
          cue_index: 1,
          cps: 12.0,
          drift_detected: false,
        },
      ],
    };

    const qaReport = inspectCutForDefects(input);

    expect(qaReport.verdict).toBe('pass');
    expect(qaReport.defect_count).toBe(0);
    expect(qaReport.release_readiness_score).toBeGreaterThanOrEqual(90);
    expect(qaReport.findings.length).toBe(0);
  });

  it('validates a complete QA output schema', () => {
    const validOutput: QAOutput = {
      job_id: 'job-qa-03',
      release_readiness_score: 95.0,
      verdict: 'pass',
      defect_count: 0,
      findings: [],
    };

    expect(validateQAOutput(validOutput)).toBe(true);
  });
});
