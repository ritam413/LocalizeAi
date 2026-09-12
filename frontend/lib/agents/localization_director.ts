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
}

export interface LocalizationInput {
  job_id: string;
  target_language: string;
  audience_profile?: string;
  rework_instructions?: string | Record<string, any>;
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

