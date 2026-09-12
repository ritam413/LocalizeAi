import { describe, it, expect } from 'vitest';
import {
  LocalizationInput,
  LocalizationOutput,
  validateLocalizationOutput,
  parseLocalizationOutput,
  estimateSyllables,
  calculateSyllableBudget,
} from '../lib/agents/localization_director';

describe('TICKET-11: Isometric Dialogue Engine & Syllable Quotas', () => {
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

  it('estimates syllables across English, Spanish, French, German, and Hindi', () => {
    expect(estimateSyllables('Hello world', 'en')).toBe(3);
    expect(estimateSyllables('No vendas la piel del oso', 'es')).toBe(8);
    expect(estimateSyllables('Ne vends pas la mèche', 'fr')).toBeGreaterThanOrEqual(5);
    expect(estimateSyllables('Plaudere nicht alles aus', 'de')).toBeGreaterThanOrEqual(6);
    expect(estimateSyllables('हवा में महल मत बनाओ', 'hi')).toBeGreaterThanOrEqual(7);
    expect(estimateSyllables('', 'en')).toBe(0);
  });

  it('calculates target and maximum syllable budget from duration window', () => {
    const [target1s, max1s] = calculateSyllableBudget(0.0, 1.0, 3.2);
    expect(target1s).toBe(3);
    expect(max1s).toBe(4);

    const [target3s, max3s] = calculateSyllableBudget(0.5, 3.8, 3.2);
    expect(target3s).toBe(11);
    expect(max3s).toBe(12);
  });

  it('validates a valid Localization Director output schema with isometric syllable quotas', () => {
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
          syllable_count: 12,
          target_budget: 10,
          isochrony_ratio: 1.2,
        },
      ],
      adaptation_notes: 'Retained tense confrontational dynamic while using colloquial Hindi idioms.',
      isochrony_score: 95.0,
      decision: 'Isometric Dialogue Engine adapted 1 lines with syllable quotas.',
      quality_score: 94.0,
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
          syllable_count: 3,
          target_budget: 10,
          isochrony_ratio: 0.3,
        },
      ],
    };
    expect(validateLocalizationOutput(invalidOutput)).toBe(false);
  });

  it('parses raw localization response and populates syllable budgets and isochrony ratio', () => {
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
      isochrony_score: 92.5,
    };

    const parsed = parseLocalizationOutput(raw);
    expect(parsed.localized_lines[0].translated_text).toBe('Ten mucho cuidado.');
    expect(parsed.localized_lines[0].character_count).toBe('Ten mucho cuidado.'.length);
    expect(parsed.localized_lines[0].target_budget).toBe(10); // 3.0s * 3.2 = 9.6 -> 10
    expect(parsed.localized_lines[0].syllable_count).toBeGreaterThan(0);
    expect(parsed.localized_lines[0].isochrony_ratio).toBeGreaterThan(0);
    expect(parsed.localized_lines[0].rationale).toContain('concise Spanish delivery');
    expect(parsed.isochrony_score).toBe(92.5);
  });
});

