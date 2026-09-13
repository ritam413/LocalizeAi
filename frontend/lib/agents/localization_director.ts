import { AnnotatedSegment } from './story_analyst';

export interface LocalizedLine {
  segment_id: number;
  speaker_id: string;
  start_s: number;
  end_s: number;
  source_text: string;
  translated_text: string;
  rationale: string;
  character_count: number;
  syllable_count?: number;
  target_budget?: number;
  isochrony_ratio?: number;
  preserved_entities?: string[];
  numeral_adaptations?: string[];
}

export interface LocalizationInput {
  job_id: string;
  target_language: string;
  audience_profile?: string;
  rework_instructions?: string | Record<string, any>;
  glossary_locks?: string[];
  annotated_segments: AnnotatedSegment[];
}

export interface LocalizationOutput {
  target_language: string;
  localized_lines: LocalizedLine[];
  adaptation_notes?: string;
  isochrony_score?: number;
  decision?: string;
  quality_score?: number;
}

export const KNOWN_TECH_AND_BRAND_ENTITIES = new Set([
  'Claude Code',
  'Claude',
  'Anthropic',
  'OpenAI',
  'ChatGPT',
  'GitHub',
  'Supabase',
  'Zenith Chat',
  'Afan Mustafa',
  'Playwright',
  'Vitest',
  'Pytest',
  'FFmpeg',
  'Demucs',
  'Faster-Whisper',
  'Whisper',
  'Silero',
  'Grafana',
  'Docker',
  'Next.js',
  'React',
  'TypeScript',
  'Python',
  'FastAPI',
  'SQLite',
  'PostgreSQL',
  'Google Cloud',
  'Gemini',
  'YouTube',
  'Netflix',
  'Localize',
]);

const COMMON_STOPWORDS = new Set([
  'The', 'A', 'An', 'And', 'Or', 'But', 'If', 'When', 'Why', 'How', 'What', 'Who', 'Where',
  'We', 'You', 'He', 'She', 'They', 'It', 'I', 'My', 'Your', 'Our', 'Their', 'His', 'Her',
  'This', 'That', 'These', 'Those', 'There', 'Here', 'Is', 'Are', 'Was', 'Were', 'Be', 'Been',
  'Do', 'Does', 'Did', 'Have', 'Has', 'Had', "Don't", "Doesn't", "Didn't", "Won't", "Can't",
  'Will', 'Would', 'Shall', 'Should', 'Can', 'Could', 'May', 'Might', 'Must', 'Let', "Let's",
  'No', 'Not', 'Yes', 'So', 'Just', 'Also', 'Now', 'Then', 'After', 'Before', 'While', 'In', 'On', 'At'
]);

/**
 * Extracts proper nouns, brand entities, and developer tools from text.
 */
export function extractProperNouns(text: string, customEntities?: string[]): string[] {
  if (!text || !text.trim()) return [];

  const foundEntities: string[] = [];
  const seenLower = new Set<string>();

  // 1. Custom locks first
  if (customEntities) {
    const sorted = [...customEntities].sort((a, b) => b.length - a.length);
    for (const ent of sorted) {
      if (ent && ent.trim()) {
        const clean = ent.trim();
        const regex = new RegExp(`\\b${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(text) && !seenLower.has(clean.toLowerCase())) {
          foundEntities.push(clean);
          seenLower.add(clean.toLowerCase());
        }
      }
    }
  }

  // 2. Curated tech entities
  const curated = Array.from(KNOWN_TECH_AND_BRAND_ENTITIES).sort((a, b) => b.length - a.length);
  for (const ent of curated) {
    const regex = new RegExp(`\\b${ent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(text) && !seenLower.has(ent.toLowerCase())) {
      if (!foundEntities.some((ex) => ent.toLowerCase().includes(ex.toLowerCase()) && ex.length > ent.length)) {
        foundEntities.push(ent);
        seenLower.add(ent.toLowerCase());
      }
    }
  }

  // 3. Capitalized title-cased sequences
  const titleMatches = text.match(/\b[A-Z][a-zA-Z0-9_.-]+(?:\s+[A-Z][a-zA-Z0-9_.-]+)*\b/g);
  if (titleMatches) {
    for (const candidate of titleMatches) {
      const words = candidate.split(/\s+/);
      if (words.length === 1 && COMMON_STOPWORDS.has(candidate)) {
        continue;
      }
      if (!seenLower.has(candidate.toLowerCase())) {
        if (!foundEntities.some((ex) => candidate.toLowerCase().includes(ex.toLowerCase()))) {
          foundEntities.push(candidate);
          seenLower.add(candidate.toLowerCase());
        }
      }
    }
  }

  return foundEntities;
}

/**
 * Transforms metric abbreviations (2.4k, 100k, 10M, 2.5B) into natural spoken expressions.
 */
export function adaptSpokenNumerals(text: string, targetLang = 'en'): [string, string[]] {
  if (!text || !text.trim()) return [text, []];

  const lang = (targetLang || 'en').toLowerCase();
  const adaptations: string[] = [];
  let adapted = text;

  // 1. Metric thousands: 2.4k, 100k
  adapted = adapted.replace(/\b(\d+(?:[.,]\d+)?)\s*[kK]\b/g, (match, numStr) => {
    const val = parseFloat(numStr.replace(',', '.'));
    const isDevanagari = /[\u0900-\u097F]/.test(text);
    let unit = 'thousand';
    let decimalSep = '.';

    if (lang === 'hi') {
      unit = isDevanagari ? 'हज़ार' : 'hazar';
    } else if (lang === 'es') {
      unit = 'mil';
    } else if (lang === 'fr') {
      unit = 'mille';
      decimalSep = ',';
    } else if (lang === 'de') {
      unit = 'Tausend';
      decimalSep = ',';
    }

    const fmtNum = isNaN(val) ? numStr : String(val).replace('.', decimalSep);
    const replacement = `${fmtNum} ${unit}`;
    adaptations.push(`${match} -> ${replacement}`);
    return replacement;
  });

  // 2. Metric millions: 10M, 2.5m
  adapted = adapted.replace(/\b(\d+(?:[.,]\d+)?)\s*[mM]\b(?!\w)/g, (match, numStr) => {
    const val = parseFloat(numStr.replace(',', '.'));
    const isDevanagari = /[\u0900-\u097F]/.test(text);
    let unit = 'million';
    let decimalSep = '.';

    if (lang === 'hi') {
      unit = isDevanagari ? 'मिलियन' : 'million';
    } else if (lang === 'es') {
      unit = val === 1 ? 'millón' : 'millones';
    } else if (lang === 'fr') {
      unit = val === 1 ? 'million' : 'millions';
      decimalSep = ',';
    } else if (lang === 'de') {
      unit = val === 1 ? 'Million' : 'Millionen';
      decimalSep = ',';
    }

    const fmtNum = isNaN(val) ? numStr : String(val).replace('.', decimalSep);
    const replacement = `${fmtNum} ${unit}`;
    adaptations.push(`${match} -> ${replacement}`);
    return replacement;
  });

  return [adapted, adaptations];
}

/**
 * Heuristic syllable counter for frontend duration validation and UI previews.
 */
export function estimateSyllables(text: string, lang = 'en'): number {
  if (!text || !text.trim()) return 0;
  const clean = text.trim();
  const target = (lang || 'en').toLowerCase();

  // Hindi / Indic Devanagari aksharas
  if (target === 'hi' || /[\u0900-\u097F]/.test(clean)) {
    const aksharas = (clean.match(/[\u0904-\u0939]/g) || []).length;
    const halants = (clean.match(/\u094D/g) || []).length;
    const count = aksharas - halants;
    return count > 0 ? count : Math.max(1, clean.split(/\s+/).length);
  }

  const words = clean.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑäöüßÄÖÜàâäéèêëîïôöùûüÿœæÀÂÄÉÈÊËÎÏÔÖÙÛÜŸŒÆ']+/g);
  if (!words || words.length === 0) {
    return Math.max(1, clean.split(/\s+/).length);
  }

  let totalSyllables = 0;
  for (const word of words) {
    const w = word.toLowerCase().replace(/^'+|'+$/g, '');
    if (!w) continue;

    if (target === 'es') {
      const vowelGroups = w.match(/[aeiouáéíóúü]+/g) || [];
      totalSyllables += Math.max(1, vowelGroups.length);
    } else if (target === 'fr') {
      const vowelGroups = w.match(/[aeiouyàâäéèêëîïôöùûüÿœæ]+/g) || [];
      let syllables = vowelGroups.length;
      if (syllables > 1 && (w.endsWith('e') || w.endsWith('es') || w.endsWith('ent'))) {
        syllables -= 1;
      }
      totalSyllables += Math.max(1, syllables);
    } else if (target === 'de') {
      const vowelGroups = w.match(/[aeiouäöüy]+/g) || [];
      totalSyllables += Math.max(1, vowelGroups.length);
    } else {
      // English / generic
      const vowelGroups = w.match(/[aeiouy]+/g) || [];
      let syllables = vowelGroups.length;
      if (w.endsWith('e') && !w.endsWith('ee') && !w.endsWith('le') && syllables > 1) {
        syllables -= 1;
      }
      if (w.endsWith('ed') && !w.endsWith('ted') && !w.endsWith('ded') && syllables > 1) {
        syllables -= 1;
      }
      totalSyllables += Math.max(1, syllables);
    }
  }

  return Math.max(1, totalSyllables);
}

/**
 * Calculates syllable budget for a dialogue duration window.
 */
export function calculateSyllableBudget(
  start_s: number,
  end_s: number,
  rate = 3.2
): [number, number] {
  const dt = Math.max(0.1, Number(end_s) - Number(start_s));
  const target_budget = Math.max(1, Math.round(dt * rate));
  const max_budget = Math.max(1, Math.round(dt * 3.6));
  return [target_budget, max_budget];
}

export function validateLocalizationOutput(output: any): output is LocalizationOutput {
  if (!output || typeof output !== 'object') return false;
  if (typeof output.target_language !== 'string' || !output.target_language) return false;
  if (!Array.isArray(output.localized_lines)) return false;

  for (const line of output.localized_lines) {
    if (typeof line.segment_id !== 'number') return false;
    if (typeof line.speaker_id !== 'string') return false;
    if (typeof line.start_s !== 'number') return false;
    if (typeof line.end_s !== 'number') return false;
    if (typeof line.source_text !== 'string') return false;
    if (typeof line.translated_text !== 'string') return false;
    if (typeof line.rationale !== 'string' || !line.rationale.trim()) return false;
    if (typeof line.character_count !== 'number') return false;
    if (line.syllable_count !== undefined && typeof line.syllable_count !== 'number') return false;
    if (line.target_budget !== undefined && typeof line.target_budget !== 'number') return false;
    if (line.isochrony_ratio !== undefined && typeof line.isochrony_ratio !== 'number') return false;
    if (line.preserved_entities !== undefined && !Array.isArray(line.preserved_entities)) return false;
    if (line.numeral_adaptations !== undefined && !Array.isArray(line.numeral_adaptations)) return false;
  }
  return true;
}

export function parseLocalizationOutput(raw: any): LocalizationOutput {
  const target_language = String(raw.target_language || 'en');
  const localized_lines: LocalizedLine[] = (raw.localized_lines || []).map((line: any) => {
    const translated_text = String(line.translated_text || '');
    const start_s = Number(line.start_s || 0.0);
    const end_s = Number(line.end_s || 0.0);
    const [calculatedTarget] = calculateSyllableBudget(start_s, end_s);
    const target_budget = line.target_budget !== undefined ? Number(line.target_budget) : calculatedTarget;
    const syllable_count =
      line.syllable_count !== undefined
        ? Number(line.syllable_count)
        : estimateSyllables(translated_text, target_language);
    const isochrony_ratio =
      line.isochrony_ratio !== undefined
        ? Number(line.isochrony_ratio)
        : Number((syllable_count / (target_budget || 1)).toFixed(2));

    return {
      segment_id: Number(line.segment_id || 0),
      speaker_id: String(line.speaker_id || 'speaker_1'),
      start_s,
      end_s,
      source_text: String(line.source_text || ''),
      translated_text,
      rationale: String(line.rationale || 'Literal translation fallback.'),
      character_count: translated_text.length,
      syllable_count,
      target_budget,
      isochrony_ratio,
      preserved_entities: Array.isArray(line.preserved_entities) ? line.preserved_entities : undefined,
      numeral_adaptations: Array.isArray(line.numeral_adaptations) ? line.numeral_adaptations : undefined,
    };
  });

  return {
    target_language,
    localized_lines,
    adaptation_notes: raw.adaptation_notes ? String(raw.adaptation_notes) : undefined,
    isochrony_score: raw.isochrony_score !== undefined ? Number(raw.isochrony_score) : undefined,
    decision: raw.decision ? String(raw.decision) : undefined,
    quality_score: raw.quality_score !== undefined ? Number(raw.quality_score) : undefined,
  };
}
