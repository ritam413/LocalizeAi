import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MultiAudioPlayer, AudioTrackOption } from '../components/studio/MultiAudioPlayer';

const TEST_TRACKS: AudioTrackOption[] = [
  {
    id: 'original',
    language_code: 'en',
    language_name: 'English (Original Master)',
    flag: '🇺🇸',
    voice: 'Original Cast',
    video_url: '/api/v1/clips/preview-stream?path=storage/sample_movie.mp4',
    audio_url: '/api/v1/clips/preview-stream?path=storage/trial1_raw.wav',
    quality_score: 100,
    is_original: true,
  },
  {
    id: 'spanish',
    language_code: 'es',
    language_name: 'Spanish (Castilian Dub)',
    flag: '🇪🇸',
    voice: 'Alvaro Neural (es-ES)',
    video_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/es/trial1_es_dubbed.mp4',
    audio_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/es/master_dub_es.wav',
    subtitle_vtt_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/es/subtitles_es.vtt',
    quality_score: 98,
    is_original: false,
  },
  {
    id: 'hindi',
    language_code: 'hi',
    language_name: 'Hindi (Bollywood Dub)',
    flag: '🇮🇳',
    voice: 'Madhur Neural (hi-IN)',
    video_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/hi/trial1_hi_dubbed.mp4',
    audio_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/hi/master_dub_hi.wav',
    subtitle_vtt_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/hi/subtitles_hi.vtt',
    quality_score: 98,
    is_original: false,
  },
];

describe('MultiAudioPlayer Component', () => {
  it('renders correctly with default audio track', () => {
    render(
      <MultiAudioPlayer
        tracks={TEST_TRACKS}
        defaultTrackId="hindi"
        title="Test Film Dub"
      />
    );

    expect(screen.getByText('Test Film Dub')).toBeDefined();
    expect(screen.getByText('RELEASE READY • QA 98.0')).toBeDefined();
    expect(screen.getAllByText('Hindi (Bollywood Dub)').length).toBeGreaterThan(0);
    expect(screen.getByText('Madhur Neural (hi-IN)')).toBeDefined();
  });

  it('allows switching tracks from quick switcher bar', () => {
    const onTrackChange = vi.fn();
    render(
      <MultiAudioPlayer
        tracks={TEST_TRACKS}
        defaultTrackId="hindi"
        title="Test Film Dub"
        onTrackChange={onTrackChange}
      />
    );

    const spanishBtn = screen.getByRole('button', { name: /Spanish/i });
    fireEvent.click(spanishBtn);

    expect(onTrackChange).toHaveBeenCalledTimes(1);
    expect(onTrackChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'spanish', language_code: 'es' })
    );
  });

  it('renders available tracks in YouTube-style popup menu', () => {
    render(
      <MultiAudioPlayer
        tracks={TEST_TRACKS}
        defaultTrackId="original"
        title="Test Film Dub"
      />
    );

    const audioMenuBtn = screen.getByRole('button', { name: /Select audio track language/i });
    fireEvent.click(audioMenuBtn);

    expect(screen.getByText('Audio Track (Multi-Dub)')).toBeDefined();
    expect(screen.getByText('YouTube Style')).toBeDefined();
  });
});
