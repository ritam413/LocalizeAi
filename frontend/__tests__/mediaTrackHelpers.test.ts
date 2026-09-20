import { describe, it, expect } from 'vitest';
import {
  isGpuAcceleratedStage,
  getPreviewStreamUrl,
  getPrimaryTargetLanguage,
  getLanguageMetadata,
  buildRunAudioTracks,
} from '../lib/mediaTrackHelpers';

describe('mediaTrackHelpers', () => {
  describe('isGpuAcceleratedStage', () => {
    it('returns true for GPU-accelerated stages', () => {
      expect(isGpuAcceleratedStage('denoise')).toBe(true);
      expect(isGpuAcceleratedStage('transcription')).toBe(true);
      expect(isGpuAcceleratedStage('translation')).toBe(true);
      expect(isGpuAcceleratedStage('tts')).toBe(true);
    });

    it('returns false for CPU stages', () => {
      expect(isGpuAcceleratedStage('extraction')).toBe(false);
      expect(isGpuAcceleratedStage('duration_align')).toBe(false);
      expect(isGpuAcceleratedStage('remix')).toBe(false);
      expect(isGpuAcceleratedStage('remux')).toBe(false);
    });
  });

  describe('getPreviewStreamUrl', () => {
    it('returns formatted URL with properly encoded path', () => {
      const result = getPreviewStreamUrl('storage/media with spaces/video.mp4');
      expect(result).toBe('/api/v1/clips/preview-stream?path=storage%2Fmedia%20with%20spaces%2Fvideo.mp4');
    });

    it('returns undefined when path is null or undefined', () => {
      expect(getPreviewStreamUrl(null)).toBeUndefined();
      expect(getPreviewStreamUrl(undefined)).toBeUndefined();
      expect(getPreviewStreamUrl('')).toBeUndefined();
    });
  });

  describe('getPrimaryTargetLanguage', () => {
    it('parses valid JSON array and extracts the first language', () => {
      expect(getPrimaryTargetLanguage('["es", "fr"]')).toBe('es');
      expect(getPrimaryTargetLanguage('["ja"]')).toBe('ja');
    });

    it('falls back to hi on invalid JSON or empty input', () => {
      expect(getPrimaryTargetLanguage('')).toBe('hi');
      expect(getPrimaryTargetLanguage(null)).toBe('hi');
      expect(getPrimaryTargetLanguage('invalid json')).toBe('hi');
      expect(getPrimaryTargetLanguage('[]')).toBe('hi');
    });
  });

  describe('getLanguageMetadata', () => {
    it('returns known metadata for supported languages', () => {
      const hindi = getLanguageMetadata('hi');
      expect(hindi.name).toContain('Hindi');
      expect(hindi.flag).toBe('🇮🇳');

      const spanish = getLanguageMetadata('es');
      expect(spanish.name).toContain('Spanish');
      expect(spanish.flag).toBe('🇪🇸');
    });

    it('provides sensible fallback for unknown language codes', () => {
      const unknown = getLanguageMetadata('ko');
      expect(unknown.name).toBe('KO (Studio Dub)');
      expect(unknown.flag).toBe('🌐');
    });
  });

  describe('buildRunAudioTracks', () => {
    it('returns empty array if source video path is missing', () => {
      const tracks = buildRunAudioTracks({ sourceVideoPath: null });
      expect(tracks).toEqual([]);
    });

    it('assembles original master track when only source video is provided', () => {
      const tracks = buildRunAudioTracks({
        sourceVideoPath: 'uploads/movie.mp4',
        sourceLanguage: 'en',
      });

      expect(tracks).toHaveLength(1);
      expect(tracks[0].id).toBe('original');
      expect(tracks[0].is_original).toBe(true);
      expect(tracks[0].video_url).toContain('movie.mp4');
    });

    it('appends localized track when deliverables exist', () => {
      const tracks = buildRunAudioTracks({
        sourceVideoPath: 'uploads/movie.mp4',
        sourceLanguage: 'en',
        targetLanguagesJson: '["hi"]',
        deliverables: {
          files: {
            release_video_mp4: 'output/dubbed.mp4',
            mastered_soundtrack_wav: 'output/mastered.wav',
            subtitles_vtt: 'output/subs.vtt',
          },
        },
      });

      expect(tracks).toHaveLength(2);
      expect(tracks[0].id).toBe('original');
      expect(tracks[1].id).toBe('hi');
      expect(tracks[1].video_url).toContain('dubbed.mp4');
      expect(tracks[1].audio_url).toContain('mastered.wav');
      expect(tracks[1].subtitle_vtt_url).toContain('subs.vtt');
    });
  });
});
