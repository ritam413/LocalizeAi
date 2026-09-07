import { describe, it, expect } from 'vitest';
import {
  StoryAnalystInput,
  StoryAnalystOutput,
  validateStoryAnalystOutput,
  parseStoryAnalysis,
} from '../lib/agents/story_analyst';

describe('TICKET-02: Story Analyst Agent Contract & Schema', () => {
  const sampleInput: StoryAnalystInput = {
    job_id: 'job-test-01',
    segments: [
      {
        segment_id: 1,
        start_s: 0.5,
        end_s: 3.2,
        source_text: "Don't count your chickens before they hatch, partner.",
      },
      {
        segment_id: 2,
        start_s: 3.5,
        end_s: 6.0,
        source_text: 'I know what I am doing! Back off!',
      },
    ],
    clip_duration_s: 10.0,
  };

  it('validates a valid Story Analyst output schema', () => {
    const validOutput: StoryAnalystOutput = {
      speakers: [
        {
          speaker_id: 'speaker_1',
          name_or_label: 'Detective',
          gender: 'male',
          tone_summary: 'cautious, authoritative',
        },
        {
          speaker_id: 'speaker_2',
          name_or_label: 'Rookie',
          gender: 'female',
          tone_summary: 'defensive, hot-tempered',
        },
      ],
      scenes: [
        {
          scene_id: 'scene_01',
          start_s: 0.0,
          end_s: 10.0,
          mood: 'tense confrontation',
          pacing: 'medium',
        },
      ],
      annotated_segments: [
        {
          segment_id: 1,
          speaker_id: 'speaker_1',
          start_s: 0.5,
          end_s: 3.2,
          source_text: "Don't count your chickens before they hatch, partner.",
          tone_tags: ['cautious', 'warning'],
          cultural_flags: ['idiom: count chickens before they hatch'],
        },
        {
          segment_id: 2,
          speaker_id: 'speaker_2',
          start_s: 3.5,
          end_s: 6.0,
          source_text: 'I know what I am doing! Back off!',
          tone_tags: ['defensive', 'angry'],
          cultural_flags: [],
        },
      ],
    };

    expect(validateStoryAnalystOutput(validOutput)).toBe(true);
  });

  it('rejects incomplete Story Analyst output', () => {
    const incompleteOutput: any = {
      speakers: [],
      scenes: [],
      // annotated_segments missing
    };
    expect(validateStoryAnalystOutput(incompleteOutput)).toBe(false);
  });

  it('parses raw agent response safely and extracts cultural flags and tone tags', () => {
    const rawPayload = {
      speakers: [
        {
          speaker_id: 'spk_1',
          name_or_label: 'Protagonist',
          gender: 'male',
          tone_summary: 'calm',
        },
      ],
      scenes: [
        {
          scene_id: 'sc_1',
          start_s: 0.0,
          end_s: 5.0,
          mood: 'casual',
          pacing: 'slow',
        },
      ],
      annotated_segments: [
        {
          segment_id: 1,
          speaker_id: 'spk_1',
          start_s: 0.0,
          end_s: 4.5,
          source_text: 'It is raining cats and dogs.',
          tone_tags: ['wry'],
          cultural_flags: ['idiom: raining cats and dogs'],
        },
      ],
    };

    const parsed = parseStoryAnalysis(rawPayload);
    expect(parsed.speakers.length).toBe(1);
    expect(parsed.annotated_segments[0].cultural_flags).toContain('idiom: raining cats and dogs');
    expect(parsed.annotated_segments[0].tone_tags).toContain('wry');
  });
});
