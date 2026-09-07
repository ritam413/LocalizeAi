import { describe, it, expect } from 'vitest';
import {
  SubtitleDirectorInput,
  SubtitleDirectorOutput,
  validateSubtitleDirectorOutput,
  generateSubtitleCues,
  formatSrt,
  formatVtt,
} from '../lib/agents/subtitle_director';

describe('TICKET-06: Subtitle Director Agent Contract & Drift Protection', () => {
  const sampleInput: SubtitleDirectorInput = {
    job_id: 'job-sub-01',
    target_language: 'hi',
    localized_lines: [
      {
        segment_id: 1,
        speaker_id: 'speaker_1',
        start_s: 1.0,
        end_s: 4.2,
        translated_text: 'पहले से ही हवा में महल मत बनाओ, दोस्त।',
      },
    ],
    sync_adjustments: [
      {
        segment_id: 1,
        final_duration_s: 3.2, // Adjusted by Sync Engineer!
      },
    ],
  };

  it('aligns subtitle cue timestamps with Sync Engineer adjusted durations', () => {
    const cues = generateSubtitleCues(sampleInput.localized_lines, sampleInput.sync_adjustments);
    expect(cues.length).toBe(1);

    const cue = cues[0];
    expect(cue.start_s).toBe(1.0);
    expect(cue.end_s).toBe(4.2); // 1.0 + 3.2 = 4.2s
    expect(cue.duration_s).toBe(3.2);
    expect(cue.drift_detected).toBe(false);
  });

  it('formats compliant SRT and WebVTT outputs', () => {
    const cues = generateSubtitleCues(sampleInput.localized_lines, sampleInput.sync_adjustments);
    const srt = formatSrt(cues);
    const vtt = formatVtt(cues);

    expect(srt).toContain('1\n00:00:01,000 --> 00:00:04,200');
    expect(srt).toContain('पहले से ही हवा में महल मत बनाओ, दोस्त।');

    expect(vtt).toContain('WEBVTT');
    expect(vtt).toContain('00:00:01.000 --> 00:00:04.200');
  });

  it('validates a complete Subtitle Director output payload', () => {
    const validOutput: SubtitleDirectorOutput = {
      job_id: 'job-sub-01',
      target_language: 'hi',
      srt_path: '/storage/runs/job-sub-01/subtitles_hi.srt',
      vtt_path: '/storage/runs/job-sub-01/subtitles_hi.vtt',
      total_cues: 1,
      max_cps: 11.2,
      drift_detected: false,
    };

    expect(validateSubtitleDirectorOutput(validOutput)).toBe(true);
  });
});
