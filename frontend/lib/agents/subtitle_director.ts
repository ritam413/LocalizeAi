export interface SubtitleCue {
  cue_index: number;
  segment_id: number;
  speaker_id: string;
  start_s: number;
  end_s: number;
  duration_s: number;
  text: string;
  cps: number;
  drift_detected: boolean;
}

export interface SubtitleDirectorInput {
  job_id: string;
  target_language: string;
  localized_lines: Array<{
    segment_id: number;
    speaker_id: string;
    start_s: number;
    end_s: number;
    translated_text: string;
  }>;
  sync_adjustments?: Array<{
    segment_id: number;
    final_duration_s: number;
  }>;
}

export interface SubtitleDirectorOutput {
  job_id: string;
  target_language: string;
  srt_path: string;
  vtt_path: string;
  total_cues: number;
  max_cps: number;
  drift_detected: boolean;
}

function formatTimestamp(seconds: number, separator: ',' | '.'): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const hh = String(hrs).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const mmm = String(ms).padStart(3, '0');

  return `${hh}:${mm}:${ss}${separator}${mmm}`;
}

export function generateSubtitleCues(
  localized_lines: SubtitleDirectorInput['localized_lines'],
  sync_adjustments?: SubtitleDirectorInput['sync_adjustments']
): SubtitleCue[] {
  const syncMap = new Map<number, number>();
  if (sync_adjustments) {
    for (const adj of sync_adjustments) {
      syncMap.set(adj.segment_id, adj.final_duration_s);
    }
  }

  return localized_lines.map((line, idx) => {
    const adjustedDuration = syncMap.get(line.segment_id) || (line.end_s - line.start_s);
    const start_s = Number(line.start_s.toFixed(3));
    const end_s = Number((start_s + adjustedDuration).toFixed(3));
    const duration_s = Number(adjustedDuration.toFixed(3));
    const text = line.translated_text.trim();
    const cps = duration_s > 0 ? Number((text.length / duration_s).toFixed(1)) : 0;

    return {
      cue_index: idx + 1,
      segment_id: line.segment_id,
      speaker_id: line.speaker_id,
      start_s,
      end_s,
      duration_s,
      text,
      cps,
      drift_detected: false,
    };
  });
}

export function formatSrt(cues: SubtitleCue[]): string {
  return cues
    .map(
      (cue) =>
        `${cue.cue_index}\n${formatTimestamp(cue.start_s, ',')} --> ${formatTimestamp(cue.end_s, ',')}\n${cue.text}\n`
    )
    .join('\n');
}

export function formatVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map(
      (cue) =>
        `${cue.cue_index}\n${formatTimestamp(cue.start_s, '.')} --> ${formatTimestamp(cue.end_s, '.')}\n${cue.text}\n`
    )
    .join('\n');
  return `WEBVTT\n\n${body}`;
}

export function validateSubtitleDirectorOutput(output: any): output is SubtitleDirectorOutput {
  if (!output || typeof output !== 'object') return false;
  if (typeof output.job_id !== 'string') return false;
  if (typeof output.target_language !== 'string') return false;
  if (typeof output.srt_path !== 'string') return false;
  if (typeof output.vtt_path !== 'string') return false;
  if (typeof output.total_cues !== 'number') return false;
  if (typeof output.max_cps !== 'number') return false;
  if (typeof output.drift_detected !== 'boolean') return false;
  return true;
}
