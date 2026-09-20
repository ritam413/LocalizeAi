import { AudioTrackOption } from '@/components/studio/MultiAudioPlayer';

export interface LanguageMetadata {
  name: string;
  flag: string;
  voice: string;
}

const GPU_ACCELERATED_STAGES = new Set(['denoise', 'transcription', 'translation', 'tts']);

const LANGUAGE_METADATA_DIRECTORY: Record<string, LanguageMetadata> = {
  hi: { name: 'Hindi (Bollywood Studio Dub)', flag: '🇮🇳', voice: 'Madhur Neural (hi-IN)' },
  es: { name: 'Spanish (Castilian Studio Dub)', flag: '🇪🇸', voice: 'Alvaro Neural (es-ES)' },
  fr: { name: 'French (Parisian Studio Dub)', flag: '🇫🇷', voice: 'Henri Neural (fr-FR)' },
  de: { name: 'German (Studio Dub)', flag: '🇩🇪', voice: 'Conrad Neural (de-DE)' },
  ja: { name: 'Japanese (Studio Dub)', flag: '🇯🇵', voice: 'Keita Neural (ja-JP)' },
  en: { name: 'English (Studio Dub)', flag: '🇺🇸', voice: 'Guy Neural (en-US)' },
};

/**
 * Returns whether a pipeline stage executes with GPU hardware acceleration.
 */
export function isGpuAcceleratedStage(stageName: string): boolean {
  return GPU_ACCELERATED_STAGES.has(stageName);
}

/**
 * Constructs a safe preview streaming URL for backend media files, or returns undefined if falsy.
 */
export function getPreviewStreamUrl(filePath?: string | null): string | undefined {
  if (!filePath) return undefined;
  return `/api/v1/clips/preview-stream?path=${encodeURIComponent(filePath)}`;
}

/**
 * Extracts the primary target language code from a serialized JSON string or returns fallback.
 */
export function getPrimaryTargetLanguage(targetLanguagesJson?: string | null, fallback = 'hi'): string {
  if (!targetLanguagesJson) return fallback;
  try {
    const parsed = JSON.parse(targetLanguagesJson);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed[0];
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Resolves user-facing metadata (display name, flag emoji, default voice) for a language code.
 */
export function getLanguageMetadata(languageCode: string): LanguageMetadata {
  return (
    LANGUAGE_METADATA_DIRECTORY[languageCode] || {
      name: `${languageCode.toUpperCase()} (Studio Dub)`,
      flag: '🌐',
      voice: 'Neural Studio Voice',
    }
  );
}

export interface BuildRunAudioTracksOptions {
  sourceVideoPath?: string | null;
  sourceLanguage?: string | null;
  targetLanguagesJson?: string | null;
  artifacts?: Array<{ path?: string }>;
  deliverables?: {
    files?: {
      release_video_mp4?: string;
      mastered_soundtrack_wav?: string;
      subtitles_vtt?: string;
      subtitles_srt?: string;
    };
  } | null;
}

/**
 * Assembles selectable audio track options for the multi-audio player from run details and deliverables.
 */
export function buildRunAudioTracks(options: BuildRunAudioTracksOptions): AudioTrackOption[] {
  const {
    sourceVideoPath,
    sourceLanguage = 'en',
    targetLanguagesJson,
    artifacts = [],
    deliverables,
  } = options;

  if (!sourceVideoPath) return [];

  const sourceVideoUrl = getPreviewStreamUrl(sourceVideoPath)!;
  const vocalsArtifact = artifacts.find((art) => art.path?.includes('vocals.wav'));
  const rawAudioUrl = getPreviewStreamUrl(vocalsArtifact?.path) || sourceVideoUrl;

  const tracks: AudioTrackOption[] = [
    {
      id: 'original',
      language_code: sourceLanguage || 'en',
      language_name: 'English (Original Master)',
      flag: '🇺🇸',
      voice: 'Original Cast (Studio Direct)',
      video_url: sourceVideoUrl,
      audio_url: rawAudioUrl,
      quality_score: 100.0,
      is_original: true,
    },
  ];

  const primaryTargetLang = getPrimaryTargetLanguage(targetLanguagesJson);
  const metadata = getLanguageMetadata(primaryTargetLang);
  const delivFiles = deliverables?.files;

  const releaseVideoPath = delivFiles?.release_video_mp4;
  const masteredAudioPath = delivFiles?.mastered_soundtrack_wav;

  if (releaseVideoPath || masteredAudioPath) {
    tracks.push({
      id: primaryTargetLang,
      language_code: primaryTargetLang,
      language_name: metadata.name,
      flag: metadata.flag,
      voice: metadata.voice,
      video_url: getPreviewStreamUrl(releaseVideoPath) || sourceVideoUrl,
      audio_url: getPreviewStreamUrl(masteredAudioPath) || sourceVideoUrl,
      subtitle_vtt_url: getPreviewStreamUrl(delivFiles?.subtitles_vtt) || null,
      subtitle_srt_url: getPreviewStreamUrl(delivFiles?.subtitles_srt) || null,
      quality_score: 98.0,
      is_original: false,
    });
  }

  return tracks;
}
