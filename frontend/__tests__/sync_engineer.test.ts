import { describe, it, expect } from 'vitest';
import {
  SyncEngineerInput,
  SyncEngineerOutput,
  validateSyncEngineerOutput,
  calculateSyncAdjustment,
} from '../lib/agents/sync_engineer';

describe('TICKET-05: Sync Engineer Agent Contract & Timing Reconciliation', () => {
  it('calculates atempo speed factor when speech duration exceeds visual window', () => {
    const raw_synthesized_s = 4.0;
    const target_duration_s = 3.2; // 0.8s overflow!
    const adjustment = calculateSyncAdjustment(1, raw_synthesized_s, target_duration_s);

    expect(adjustment.strategy).toBe('speed_adjust_atempo');
    expect(adjustment.atempo_factor).toBeCloseTo(1.25, 2);
    expect(adjustment.final_duration_s).toBeCloseTo(3.2, 1);
    expect(adjustment.rationale).toContain('atempo');
  });

  it('keeps factor 1.0 when difference is within tolerance threshold', () => {
    const raw_synthesized_s = 3.02;
    const target_duration_s = 3.0; // 0.02s difference <= 0.05s tolerance
    const adjustment = calculateSyncAdjustment(2, raw_synthesized_s, target_duration_s, 0.05);

    expect(adjustment.strategy).toBe('passthrough');
    expect(adjustment.atempo_factor).toBe(1.0);
    expect(adjustment.final_duration_s).toBe(3.02);
  });

  it('validates a complete Sync Engineer output schema', () => {
    const validOutput: SyncEngineerOutput = {
      job_id: 'job-sync-01',
      sync_adjustments: [
        {
          segment_id: 1,
          original_window_s: 3.2,
          raw_synthesized_s: 4.0,
          strategy: 'speed_adjust_atempo',
          atempo_factor: 1.25,
          final_duration_s: 3.2,
          rationale: 'Accelerated dialogue by 1.25x via ffmpeg atempo to fit 3.2s visual window.',
          aligned_audio_path: '/storage/runs/job-sync-01/aligned/seg_1.wav',
        },
      ],
    };

    expect(validateSyncEngineerOutput(validOutput)).toBe(true);
  });
});
