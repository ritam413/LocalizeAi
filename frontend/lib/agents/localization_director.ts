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
}

export interface LocalizationInput {
  job_id: string;
  target_language: string;
  audience_profile?: string;
  annotated_segments: AnnotatedSegment[];
}

export interface LocalizationOutput {
  target_language: string;
  localized_lines: LocalizedLine[];
  adaptation_notes?: string;
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
  }
  return true;
}

export function parseLocalizationOutput(raw: any): LocalizationOutput {
  const target_language = String(raw.target_language || 'en');
  const localized_lines = (raw.localized_lines || []).map((line: any) => {
    const translated_text = String(line.translated_text || '');
    return {
      segment_id: Number(line.segment_id || 0),
      speaker_id: String(line.speaker_id || 'speaker_1'),
      start_s: Number(line.start_s || 0.0),
      end_s: Number(line.end_s || 0.0),
      source_text: String(line.source_text || ''),
      translated_text,
      rationale: String(line.rationale || 'Literal translation fallback.'),
      character_count: translated_text.length,
    };
  });

  return {
    target_language,
    localized_lines,
    adaptation_notes: raw.adaptation_notes ? String(raw.adaptation_notes) : undefined,
  };
}
