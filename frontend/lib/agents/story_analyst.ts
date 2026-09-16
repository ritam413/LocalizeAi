export interface SpeakerProfile {
  speaker_id: string;
  name_or_label: string;
  gender: 'male' | 'female' | 'unspecified';
  tone_summary: string;
}

export interface SceneBoundary {
  scene_id: string;
  start_s: number;
  end_s: number;
  mood: string;
  pacing: string;
}

export interface AnnotatedSegment {
  segment_id: number;
  speaker_id: string;
  start_s: number;
  end_s: number;
  source_text: string;
  tone_tags: string[];
  cultural_flags: string[];
}

export interface StoryAnalystInput {
  job_id: string;
  segments: Array<{
    segment_id: number;
    start_s: number;
    end_s: number;
    source_text: string;
  }>;
  clip_duration_s?: number;
}

export interface SpeakerSegment {
  segment_id: number | string;
  speaker_id: string;
  start_s: number;
  end_s: number;
  confidence?: number;
  gender?: 'male' | 'female' | 'unspecified' | 'neutral';
  detected_emotion?: string;
}

export interface StoryAnalystOutput {
  speakers: SpeakerProfile[];
  scenes: SceneBoundary[];
  annotated_segments: AnnotatedSegment[];
  adapter_used?: string;
  decision?: string;
  quality_score?: number;
}

export function validateStoryAnalystOutput(output: any): output is StoryAnalystOutput {
  if (!output || typeof output !== 'object') return false;
  if (!Array.isArray(output.speakers)) return false;
  if (!Array.isArray(output.scenes)) return false;
  if (!Array.isArray(output.annotated_segments)) return false;
  return true;
}

export function parseStoryAnalysis(raw: any): StoryAnalystOutput {
  if (!validateStoryAnalystOutput(raw)) {
    throw new Error('Invalid Story Analyst output structure');
  }
  return {
    speakers: raw.speakers.map((s: any) => ({
      speaker_id: String(s.speaker_id || 'speaker_unknown'),
      name_or_label: String(s.name_or_label || 'Speaker'),
      gender: s.gender === 'male' || s.gender === 'female' ? s.gender : 'unspecified',
      tone_summary: String(s.tone_summary || 'neutral'),
    })),
    scenes: raw.scenes.map((sc: any) => ({
      scene_id: String(sc.scene_id || 'scene_1'),
      start_s: Number(sc.start_s || 0.0),
      end_s: Number(sc.end_s || 0.0),
      mood: String(sc.mood || 'neutral'),
      pacing: String(sc.pacing || 'medium'),
    })),
    annotated_segments: raw.annotated_segments.map((seg: any) => ({
      segment_id: Number(seg.segment_id || 0),
      speaker_id: String(seg.speaker_id || 'speaker_1'),
      start_s: Number(seg.start_s || 0.0),
      end_s: Number(seg.end_s || 0.0),
      source_text: String(seg.source_text || ''),
      tone_tags: Array.isArray(seg.tone_tags) ? seg.tone_tags.map(String) : [],
      cultural_flags: Array.isArray(seg.cultural_flags) ? seg.cultural_flags.map(String) : [],
    })),
    adapter_used: raw.adapter_used ? String(raw.adapter_used) : undefined,
    decision: raw.decision ? String(raw.decision) : undefined,
    quality_score: typeof raw.quality_score === 'number' ? raw.quality_score : undefined,
  };
}
