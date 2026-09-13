import { describe, it, expect } from 'vitest';
import {
  QAInput,
  QAOutput,
  QAFinding,
  validateQAOutput,
  inspectCutForDefects,
} from '../lib/agents/qa_agent';

describe('TICKET-07 & TICKET-14: QA Continuity Agent Contract & Defect Detection', () => {
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
    expect(finding.syllables_to_reduce).toBe(Math.ceil(1.4 * 3.2));
  });

  it('calculates quantitative syllable delta and routes to localization_director when prefer_script_rework is true', () => {
    const input: QAInput = {
      job_id: 'job-qa-iso',
      scene_id: 'scene_02',
      target_language: 'hi',
      stems: [
        {
          segment_id: 2,
          speaker_id: 'speaker_1',
          duration_s: 4.2,
          target_window_s: 3.0, // 1.2s overflow -> ceil(1.2 * 3.2) = 4 syllables
          prefer_script_rework: true,
        },
      ],
    };

    const qaReport = inspectCutForDefects(input);
    expect(qaReport.verdict).toBe('rework_required');
    const finding = qaReport.findings[0];
    expect(finding.defect_type).toBe('TIMING_OVERFLOW');
    expect(finding.target_agent).toBe('localization_director');
    expect(finding.syllables_to_reduce).toBe(4);
    expect(finding.fix_proposal).toContain('4 syllable(s)');
  });

  it('detects AUDIO_CLIPPING defect when digital clipping is detected in dialogue stem', () => {
    const input: QAInput = {
      job_id: 'job-qa-clip',
      scene_id: 'scene_03',
      target_language: 'es',
      stems: [
        {
          segment_id: 3,
          duration_s: 2.5,
          target_window_s: 2.5,
          clipping_detected: true,
          clipped_samples: 15,
          peak_amplitude: 1.0,
        },
      ],
    };

    const qaReport = inspectCutForDefects(input);
    expect(qaReport.verdict).toBe('rework_required');
    expect(qaReport.defect_count).toBe(1);
    const finding = qaReport.findings[0];
    expect(finding.defect_type).toBe('AUDIO_CLIPPING');
    expect(finding.target_agent).toBe('voice_director');
    expect(finding.peak_amplitude).toBe(1.0);
    expect(finding.clipped_samples).toBe(15);
    expect(finding.recommended_fix).toContain('-2.0 dB');
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
