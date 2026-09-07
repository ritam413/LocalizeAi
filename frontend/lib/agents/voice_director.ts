import { SpeakerProfile } from './story_analyst';
import { LocalizedLine } from './localization_director';

export interface VoiceAssignment {
  speaker_id: string;
  voice_id: string;
  gender: 'male' | 'female' | 'unspecified';
  pitch: number;
  rate: number;
}

export interface SynthesizedStem {
  segment_id: number;
  speaker_id: string;
  audio_path: string;
  synthesized_duration_s: number;
  target_duration_s: number;
}

export interface VoiceDirectorInput {
  job_id: string;
  target_language: string;
  speakers: SpeakerProfile[];
  localized_lines: LocalizedLine[];
}

export interface VoiceDirectorOutput {
  target_language: string;
  voice_cast: VoiceAssignment[];
  synthesized_stems: SynthesizedStem[];
}

const DEFAULT_VOICES: Record<string, { male: string; female: string }> = {
  hi: { male: 'hi-IN-MadhurNeural', female: 'hi-IN-SwaraNeural' },
  es: { male: 'es-ES-AlvaroNeural', female: 'es-ES-ElviraNeural' },
  fr: { male: 'fr-FR-HenriNeural', female: 'fr-FR-DeniseNeural' },
  de: { male: 'de-DE-ConradNeural', female: 'de-DE-KatjaNeural' },
  ja: { male: 'ja-JP-KeitaNeural', female: 'ja-JP-NanamiNeural' },
  en: { male: 'en-US-GuyNeural', female: 'en-US-JennyNeural' },
};

export function assignVoiceProfiles(speakers: SpeakerProfile[], targetLanguage: string): VoiceAssignment[] {
  const langKey = targetLanguage.toLowerCase().slice(0, 2);
  const voiceMap = DEFAULT_VOICES[langKey] || DEFAULT_VOICES['en'];

  return speakers.map((spk, idx) => {
    const isFemale = spk.gender === 'female' || (spk.gender === 'unspecified' && idx % 2 === 1);
    const gender = isFemale ? 'female' : 'male';
    const voice_id = isFemale ? voiceMap.female : voiceMap.male;

    return {
      speaker_id: spk.speaker_id,
      voice_id,
      gender,
      pitch: 1.0,
      rate: 1.0,
    };
  });
}

export function validateVoiceDirectorOutput(output: any): output is VoiceDirectorOutput {
  if (!output || typeof output !== 'object') return false;
  if (typeof output.target_language !== 'string' || !output.target_language) return false;
  if (!Array.isArray(output.voice_cast)) return false;
  if (!Array.isArray(output.synthesized_stems)) return false;

  for (const cast of output.voice_cast) {
    if (typeof cast.speaker_id !== 'string') return false;
    if (typeof cast.voice_id !== 'string') return false;
    if (cast.gender !== 'male' && cast.gender !== 'female' && cast.gender !== 'unspecified') return false;
  }

  for (const stem of output.synthesized_stems) {
    if (typeof stem.segment_id !== 'number') return false;
    if (typeof stem.speaker_id !== 'string') return false;
    if (typeof stem.audio_path !== 'string') return false;
    if (typeof stem.synthesized_duration_s !== 'number') return false;
    if (typeof stem.target_duration_s !== 'number') return false;
  }

  return true;
}
