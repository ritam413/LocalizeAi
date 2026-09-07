export type SyncStrategy = 'speed_adjust_atempo' | 'passthrough' | 'trim_silence' | 'line_shortening';

export interface SyncAdjustment {
  segment_id: number;
  original_window_s: number;
  raw_synthesized_s: number;
  strategy: SyncStrategy;
  atempo_factor: number;
  final_duration_s: number;
  rationale: string;
  aligned_audio_path?: string;
}

export interface SyncEngineerInput {
  job_id: string;
  synthesized_stems: Array<{
    segment_id: number;
    speaker_id: string;
    audio_path: string;
    synthesized_duration_s: number;
    target_duration_s: number;
  }>;
  tolerance_s?: number;
}

export interface SyncEngineerOutput {
  job_id: string;
  sync_adjustments: SyncAdjustment[];
}

export function calculateSyncAdjustment(
  segment_id: number,
  raw_synthesized_s: number,
  target_duration_s: number,
  tolerance_s: number = 0.05
): SyncAdjustment {
  const diff = Math.abs(raw_synthesized_s - target_duration_s);

  if (diff <= tolerance_s) {
    return {
      segment_id,
      original_window_s: target_duration_s,
      raw_synthesized_s,
      strategy: 'passthrough',
      atempo_factor: 1.0,
      final_duration_s: raw_synthesized_s,
      rationale: `Duration difference (${diff.toFixed(3)}s) within tolerance (${tolerance_s}s). No adjustment required.`,
    };
  }

  // Calculate speed factor
  // atempo = raw_synthesized_s / target_duration_s
  // e.g. 4.0 / 3.2 = 1.25 (speed up by 1.25x)
  let factor = raw_synthesized_s / target_duration_s;
  // Clamp atempo factor to reasonable bounds (0.75x to 1.35x)
  factor = Math.max(0.75, Math.min(1.35, factor));
  const final_duration_s = Number((raw_synthesized_s / factor).toFixed(3));

  return {
    segment_id,
    original_window_s: target_duration_s,
    raw_synthesized_s,
    strategy: 'speed_adjust_atempo',
    atempo_factor: Number(factor.toFixed(3)),
    final_duration_s,
    rationale: `Adjusted dialogue speed by ${factor.toFixed(2)}x via atempo filter to match target speech window of ${target_duration_s}s.`,
  };
}

export function validateSyncEngineerOutput(output: any): output is SyncEngineerOutput {
  if (!output || typeof output !== 'object') return false;
  if (typeof output.job_id !== 'string') return false;
  if (!Array.isArray(output.sync_adjustments)) return false;

  for (const adj of output.sync_adjustments) {
    if (typeof adj.segment_id !== 'number') return false;
    if (typeof adj.original_window_s !== 'number') return false;
    if (typeof adj.raw_synthesized_s !== 'number') return false;
    if (typeof adj.atempo_factor !== 'number') return false;
    if (typeof adj.final_duration_s !== 'number') return false;
    if (typeof adj.rationale !== 'string' || !adj.rationale) return false;
  }
  return true;
}
