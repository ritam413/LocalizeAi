import { describe, it, expect } from 'vitest';
import {
  VoiceDirectorInput,
  VoiceDirectorOutput,
  validateVoiceDirectorOutput,
  assignVoiceProfiles,
} from '../lib/agents/voice_director';

describe('TICKET-04: Voice Director Agent Contract & Voice Mapping', () => {
  const sampleInput: VoiceDirectorInput = {
    job_id: 'job-voice-01',
    target_language: 'hi',
    speakers: [
      {
        speaker_id: 'speaker_1',
        name_or_label: 'Detective',
        gender: 'male',
        tone_summary: 'authoritative',
      },
      {
        speaker_id: 'speaker_2',
        name_or_label: 'Rookie',
        gender: 'female',
        tone_summary: 'energetic',
      },
    ],
    localized_lines: [
      {
        segment_id: 1,
        speaker_id: 'speaker_1',
        start_s: 0.5,
        end_s: 3.5,
        source_text: "Don't count your chickens before they hatch.",
        translated_text: 'पहले से ही हवा में महल मत बनाओ, दोस्त।',
        rationale: 'Culturally adapted.',
        character_count: 36,
        syllable_count: 12,
        target_budget: 10,
        isochrony_ratio: 1.2,
      },
    ],
  };

  it('assigns gender-appropriate and distinct voices across characters', () => {
    const cast = assignVoiceProfiles(sampleInput.speakers, sampleInput.target_language);
    expect(cast.length).toBe(2);

    const maleSpeaker = cast.find((c) => c.speaker_id === 'speaker_1');
    const femaleSpeaker = cast.find((c) => c.speaker_id === 'speaker_2');

    expect(maleSpeaker?.gender).toBe('male');
    expect(femaleSpeaker?.gender).toBe('female');
    expect(maleSpeaker?.voice_id).not.toBe(femaleSpeaker?.voice_id);
  });

  it('validates a complete Voice Director output payload', () => {
    const validOutput: VoiceDirectorOutput = {
      target_language: 'hi',
      voice_cast: [
        {
          speaker_id: 'speaker_1',
          voice_id: 'hi-IN-MadhurNeural',
          gender: 'male',
          pitch: 1.0,
          rate: 1.0,
        },
      ],
      synthesized_stems: [
        {
          segment_id: 1,
          speaker_id: 'speaker_1',
          audio_path: '/storage/runs/job-voice-01/stems/seg_1.wav',
          synthesized_duration_s: 3.2,
          target_duration_s: 3.0,
        },
      ],
    };

    expect(validateVoiceDirectorOutput(validOutput)).toBe(true);
  });

  it('rejects invalid voice cast entries', () => {
    const invalidOutput: any = {
      target_language: 'hi',
      voice_cast: [{ speaker_id: 'speaker_1' }], // missing voice_id & gender
      synthesized_stems: [],
    };
    expect(validateVoiceDirectorOutput(invalidOutput)).toBe(false);
  });
});
