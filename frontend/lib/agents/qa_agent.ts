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
  target_segment_id?: number;
  timestamp_s: number;
  defect_type: DefectType;
  severity: DefectSeverity;
  description: string;
  recommended_fix: string;
  fix_proposal?: string;
  target_agent: 'sync_engineer' | 'localization_director' | 'voice_director' | 'subtitle_director';
  syllables_to_reduce?: number;
  peak_amplitude?: number;
  clipped_samples?: number;
  overflow_s?: number;
  fix_applied: boolean;
}

export interface QAInput {
  job_id: string;
  scene_id: string;
  target_language: string;
  stems: Array<{
    segment_id: number;
    speaker_id?: string;
    duration_s: number;
    target_window_s: number;
    audio_path?: string;
    clipping_detected?: boolean;
    clipped_samples?: number;
    peak_amplitude?: number;
    target_agent?: 'sync_engineer' | 'localization_director' | 'voice_director';
    prefer_script_rework?: boolean;
  }>;
  subtitles?: Array<{
    cue_index: number;
    cps: number;
    drift_detected: boolean;
    timestamp_s?: number;
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

  // 1. Inspect audio stem durations and signal clipping
  for (const stem of input.stems) {
    // 1a. Clipping inspection
    if (stem.clipping_detected || (stem.peak_amplitude !== undefined && stem.peak_amplitude >= 0.999)) {
      const peak = stem.peak_amplitude ?? 1.0;
      const clippedCount = stem.clipped_samples ?? 1;
      const isCritical = peak >= 1.0 || clippedCount >= 10;
      score -= isCritical ? 25.0 : 15.0;

      findings.push({
        finding_id: `finding-${input.job_id}-clip-${stem.segment_id}`,
        scene_id: input.scene_id,
        segment_id: stem.segment_id,
        target_segment_id: stem.segment_id,
        timestamp_s: stem.target_window_s,
        defect_type: 'AUDIO_CLIPPING',
        severity: isCritical ? 'critical' : 'major',
        peak_amplitude: peak,
        clipped_samples: clippedCount,
        description: `Digital audio clipping detected in stem for segment ${stem.segment_id}: ${clippedCount} clipped samples, peak amplitude ${peak.toFixed(3)} >= 0.999.`,
        recommended_fix: 'Reduce synthesis gain by -2.0 dB or apply peak limiter during voice mastering.',
        fix_proposal: 'Reduce synthesis gain by -2.0 dB or apply peak limiter during voice mastering.',
        target_agent: 'voice_director',
        syllables_to_reduce: 0,
        fix_applied: false,
      });
    }

    // 1b. Timing overflow inspection & quantitative syllable delta
    const overflow_s = stem.duration_s - stem.target_window_s;
    if (overflow_s > 0.3) {
      const isCritical = overflow_s > 1.0;
      const severity: DefectSeverity = isCritical ? 'critical' : 'major';
      const penalty = isCritical ? 25.0 : 12.0;
      score -= penalty;

      const syllablesToReduce = Math.ceil(overflow_s * 3.2);
      const targetAgent = stem.target_agent ?? (stem.prefer_script_rework ? 'localization_director' : 'sync_engineer');
      const speedFactor = (stem.duration_s / stem.target_window_s).toFixed(2);
      const fixProposal =
        targetAgent === 'localization_director'
          ? `Shorten localized line by ${syllablesToReduce} syllable(s) to fit ${stem.target_window_s.toFixed(2)}s dialogue window.`
          : `Dispatch targeted retry to Sync Engineer: apply atempo speed factor (${speedFactor}x) or trim trailing silence.`;

      findings.push({
        finding_id: `finding-${input.job_id}-${stem.segment_id}`,
        scene_id: input.scene_id,
        segment_id: stem.segment_id,
        target_segment_id: stem.segment_id,
        timestamp_s: stem.target_window_s,
        defect_type: 'TIMING_OVERFLOW',
        severity,
        overflow_s: Number(overflow_s.toFixed(3)),
        syllables_to_reduce: syllablesToReduce,
        description: `Scene ${input.scene_id} exceeds dialogue window by ${overflow_s.toFixed(2)}s (Duration: ${stem.duration_s}s, Target: ${stem.target_window_s}s).`,
        recommended_fix: fixProposal,
        fix_proposal: fixProposal,
        target_agent: targetAgent,
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
          target_segment_id: sub.cue_index,
          timestamp_s: sub.timestamp_s ?? 0.0,
          defect_type: 'SUBTITLE_DRIFT',
          severity: 'major',
          description: `Subtitle cue #${sub.cue_index} drifts beyond audio boundary.`,
          recommended_fix: 'Re-align cue timestamps using final Sync Engineer duration markers.',
          fix_proposal: 'Re-align cue timestamps using final Sync Engineer duration markers.',
          target_agent: 'sync_engineer',
          syllables_to_reduce: 0,
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
