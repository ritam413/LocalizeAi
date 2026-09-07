export type DefectType =
  | 'TIMING_OVERFLOW'
  | 'SUBTITLE_DRIFT'
  | 'VOICE_INCONSISTENCY'
  | 'AUDIO_CLIPPING';

export type DefectSeverity = 'critical' | 'major' | 'minor';

export interface QAFinding {
  finding_id: string;
  scene_id: string;
  segment_id: number;
  timestamp_s: number;
  defect_type: DefectType;
  severity: DefectSeverity;
  description: string;
  recommended_fix: string;
  target_agent: 'sync_engineer' | 'localization_director' | 'voice_director';
  fix_applied: boolean;
}

export interface QAInput {
  job_id: string;
  scene_id: string;
  target_language: string;
  stems: Array<{
    segment_id: number;
    speaker_id: string;
    duration_s: number;
    target_window_s: number;
  }>;
  subtitles?: Array<{
    cue_index: number;
    cps: number;
    drift_detected: boolean;
  }>;
  min_readiness_threshold?: number;
}

export interface QAOutput {
  job_id: string;
  release_readiness_score: number;
  verdict: 'pass' | 'rework_required';
  defect_count: number;
  findings: QAFinding[];
}

export function inspectCutForDefects(input: QAInput): QAOutput {
  const threshold = input.min_readiness_threshold ?? 85.0;
  const findings: QAFinding[] = [];
  let score = 98.0;

  // 1. Inspect audio stem durations against visual dialogue timing windows
  for (const stem of input.stems) {
    const overflow_s = stem.duration_s - stem.target_window_s;
    if (overflow_s > 0.3) {
      const isCritical = overflow_s > 1.0;
      const severity: DefectSeverity = isCritical ? 'critical' : 'major';
      const penalty = isCritical ? 25.0 : 12.0;
      score -= penalty;

      findings.push({
        finding_id: `finding-${input.job_id}-${stem.segment_id}`,
        scene_id: input.scene_id,
        segment_id: stem.segment_id,
        timestamp_s: stem.target_window_s,
        defect_type: 'TIMING_OVERFLOW',
        severity,
        description: `Scene ${input.scene_id} exceeds dialogue window by ${overflow_s.toFixed(2)}s (Duration: ${stem.duration_s}s, Target: ${stem.target_window_s}s).`,
        recommended_fix: `Dispatch targeted retry to Sync Engineer: apply atempo speed factor (${(stem.duration_s / stem.target_window_s).toFixed(2)}x) or trim trailing silence.`,
        target_agent: 'sync_engineer',
        fix_applied: false,
      });
    }
  }

  // 2. Inspect subtitle reading speeds and drift
  if (input.subtitles) {
    for (const sub of input.subtitles) {
      if (sub.drift_detected) {
        score -= 10.0;
        findings.push({
          finding_id: `finding-${input.job_id}-sub-${sub.cue_index}`,
          scene_id: input.scene_id,
          segment_id: sub.cue_index,
          timestamp_s: 0.0,
          defect_type: 'SUBTITLE_DRIFT',
          severity: 'major',
          description: `Subtitle cue #${sub.cue_index} drifts beyond audio boundary.`,
          recommended_fix: 'Re-align cue timestamps using final Sync Engineer duration markers.',
          target_agent: 'sync_engineer',
          fix_applied: false,
        });
      }
    }
  }

  const finalScore = Math.max(0.0, Math.min(100.0, Number(score.toFixed(1))));
  const verdict = finalScore >= threshold && findings.length === 0 ? 'pass' : 'rework_required';

  return {
    job_id: input.job_id,
    release_readiness_score: finalScore,
    verdict,
    defect_count: findings.length,
    findings,
  };
}

export function validateQAOutput(output: any): output is QAOutput {
  if (!output || typeof output !== 'object') return false;
  if (typeof output.job_id !== 'string') return false;
  if (typeof output.release_readiness_score !== 'number') return false;
  if (output.verdict !== 'pass' && output.verdict !== 'rework_required') return false;
  if (typeof output.defect_count !== 'number') return false;
  if (!Array.isArray(output.findings)) return false;
  return true;
}
