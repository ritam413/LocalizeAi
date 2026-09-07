import { describe, it, expect } from 'vitest';
import {
  LocalizationInput,
  LocalizationOutput,
  validateLocalizationOutput,
  parseLocalizationOutput,
} from '../lib/agents/localization_director';

describe('TICKET-03: Localization Director Agent Contract & Rationale', () => {
  const sampleInput: LocalizationInput = {
    job_id: 'job-loc-01',
    target_language: 'hi',
    audience_profile: 'Colloquial Hindi urban youth',
    annotated_segments: [
      {
        segment_id: 1,
        speaker_id: 'speaker_1',
        start_s: 0.5,
        end_s: 3.5,
        source_text: "Don't count your chickens before they hatch, partner.",
        tone_tags: ['warning'],
        cultural_flags: ['idiom: count chickens before they hatch'],
      },
    ],
  };

  it('validates a valid Localization Director output schema with translation rationale', () => {
    const validOutput: LocalizationOutput = {
      target_language: 'hi',
      localized_lines: [
        {
          segment_id: 1,
          speaker_id: 'speaker_1',
          start_s: 0.5,
          end_s: 3.5,
          source_text: "Don't count your chickens before they hatch, partner.",
          translated_text: 'पहले से ही हवा में महल मत बनाओ, दोस्त।',
          rationale:
            "Replaced Western agricultural idiom with culturally equivalent Hindi idiom 'hawa mein mahal mat banao' preserving the warning tone.",
          character_count: 36,
        },
      ],
      adaptation_notes: 'Retained tense confrontational dynamic while using colloquial Hindi idioms.',
    };

    expect(validateLocalizationOutput(validOutput)).toBe(true);
  });

  it('rejects output missing translation rationale', () => {
    const invalidOutput: any = {
      target_language: 'hi',
      localized_lines: [
        {
          segment_id: 1,
          speaker_id: 'speaker_1',
          start_s: 0.5,
          end_s: 3.5,
          source_text: 'Hello',
          translated_text: 'नमस्ते',
          // rationale missing!
          character_count: 7,
        },
      ],
    };
    expect(validateLocalizationOutput(invalidOutput)).toBe(false);
  });

  it('parses raw localization response and enforces character counts', () => {
    const raw = {
      target_language: 'es',
      localized_lines: [
        {
          segment_id: 1,
          speaker_id: 'speaker_1',
          start_s: 1.0,
          end_s: 4.0,
          source_text: 'Watch your step.',
          translated_text: 'Ten mucho cuidado.',
          rationale: 'Direct warning adapted for concise Spanish delivery.',
        },
      ],
      adaptation_notes: 'Latin American Spanish localization.',
    };

    const parsed = parseLocalizationOutput(raw);
    expect(parsed.localized_lines[0].translated_text).toBe('Ten mucho cuidado.');
    expect(parsed.localized_lines[0].character_count).toBe('Ten mucho cuidado.'.length);
    expect(parsed.localized_lines[0].rationale).toContain('concise Spanish delivery');
  });
});
