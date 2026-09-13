import { describe, it, expect } from 'vitest';
import {
  LocalizationInput,
  LocalizationOutput,
  validateLocalizationOutput,
  parseLocalizationOutput,
  estimateSyllables,
  calculateSyllableBudget,
  extractProperNouns,
  adaptSpokenNumerals,
} from '../lib/agents/localization_director';

describe('TICKET-11 & TICKET-15: Isometric Dialogue Engine, Entity Preservation & Numeral Localization', () => {
  const sampleInput: LocalizationInput = {
    job_id: 'job-loc-01',
    target_language: 'hi',
    audience_profile: 'Colloquial Hindi urban youth',
    glossary_locks: ['Zenith Chat', 'Afan Mustafa'],
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

  it('extracts proper nouns and tech tools while honoring custom glossary locks', () => {
    const text = 'We deployed Claude Code, Supabase, and tested with Vitest.';
    const entities = extractProperNouns(text);
    expect(entities).toContain('Claude Code');
    expect(entities).toContain('Supabase');
    expect(entities).toContain('Vitest');

    const customText = 'Afan Mustafa built Zenith Chat on GitHub.';
    const customEntities = extractProperNouns(customText, ['Zenith Chat', 'Afan Mustafa']);
    expect(customEntities).toContain('Afan Mustafa');
    expect(customEntities).toContain('Zenith Chat');
    expect(customEntities).toContain('GitHub');
  });

  it('adapts spoken numerals into natural colloquial dubbing terms across languages', () => {
    // Hindi
    const [hiAdapted, hiNotes] = adaptSpokenNumerals('2.4k users and 10M views', 'hi');
    expect(hiAdapted).toBe('2.4 hazar users and 10 million views');
    expect(hiNotes.length).toBe(2);

    // Spanish
    const [esAdapted, esNotes] = adaptSpokenNumerals('Tenemos 100k descargas y 1M suscriptores', 'es');
    expect(esAdapted).toBe('Tenemos 100 mil descargas y 1 millón suscriptores');
    expect(esNotes.length).toBe(2);

    // French
    const [frAdapted] = adaptSpokenNumerals('Plus de 2.5m abonnés et 50k membres', 'fr');
    expect(frAdapted).toBe('Plus de 2,5 millions abonnés et 50 mille membres');

    // German
    const [deAdapted] = adaptSpokenNumerals('Über 10M Aufrufe und 2.4k Sterne', 'de');
    expect(deAdapted).toBe('Über 10 Millionen Aufrufe und 2,4 Tausend Sterne');
  });

  it('validates a valid Localization Director output schema with entity and numeral metadata', () => {
    const validOutput: LocalizationOutput = {
      target_language: 'hi',
      localized_lines: [
        {
          segment_id: 1,
          speaker_id: 'speaker_1',
          start_s: 0.5,
          end_s: 3.5,
          source_text: 'Afan Mustafa shipped Claude Code with 2.4k stars.',
          translated_text: 'Afan Mustafa ने Claude Code 2.4 हज़ार सितारों के साथ जारी किया।',
          rationale:
            'Preserved proper nouns: Afan Mustafa, Claude Code. Adapted spoken numerals: 2.4k -> 2.4 हज़ार.',
          character_count: 65,
          syllable_count: 14,
          target_budget: 10,
          isochrony_ratio: 1.4,
          preserved_entities: ['Afan Mustafa', 'Claude Code'],
          numeral_adaptations: ['2.4k -> 2.4 हज़ार'],
        },
      ],
      adaptation_notes: 'Retained tech entities and adapted spoken numerals for Indian tech audience.',
      isochrony_score: 95.0,
      decision: 'Isometric Dialogue Engine adapted 1 lines with proper noun locks and numeral adaptation.',
      quality_score: 96.0,
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
          source_text: 'Watch your step with Supabase and 2.4k queries.',
          translated_text: 'Ten mucho cuidado con Supabase y 2.4 mil consultas.',
          rationale: 'Direct warning adapted for concise Spanish delivery. Preserved: Supabase.',
          preserved_entities: ['Supabase'],
          numeral_adaptations: ['2.4k -> 2.4 mil'],
        },
      ],
      adaptation_notes: 'Latin American Spanish localization.',
      isochrony_score: 92.5,
    };

    const parsed = parseLocalizationOutput(raw);
    expect(parsed.localized_lines[0].translated_text).toBe('Ten mucho cuidado con Supabase y 2.4 mil consultas.');
    expect(parsed.localized_lines[0].character_count).toBe('Ten mucho cuidado con Supabase y 2.4 mil consultas.'.length);
    expect(parsed.localized_lines[0].target_budget).toBe(10);
    expect(parsed.localized_lines[0].syllable_count).toBeGreaterThan(0);
    expect(parsed.localized_lines[0].isochrony_ratio).toBeGreaterThan(0);
    expect(parsed.localized_lines[0].preserved_entities).toEqual(['Supabase']);
    expect(parsed.localized_lines[0].numeral_adaptations).toEqual(['2.4k -> 2.4 mil']);
    expect(parsed.isochrony_score).toBe(92.5);
  });
});
