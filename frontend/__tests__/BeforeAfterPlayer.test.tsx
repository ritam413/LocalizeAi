import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { BeforeAfterPlayer } from '../components/studio/BeforeAfterPlayer';

describe('BeforeAfterPlayer (QA / Test Engineer)', () => {
  beforeEach(() => {
    // Mock HTMLMediaElement prototype methods for JSDOM
    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('renders default stem channels, header, and certifications', () => {
    render(
      <BeforeAfterPlayer
        targetLanguage="hi"
        duckingDb={-6.0}
        lipDriftMs={14}
      />
    );

    expect(screen.getByText(/Demucs Stem Isolation & Sidechain Bus/i)).toBeDefined();
    expect(screen.getByText(/AUTO-DUCKING: -6.0 dB/i)).toBeDefined();
    expect(screen.getByText(/CH 1: Dialogue Dub \(HI\)/i)).toBeDefined();
    expect(screen.getByText(/CH 2: M&E Background Stem/i)).toBeDefined();
    expect(screen.getByText(/MASTER: Composite Mixdown/i)).toBeDefined();
    expect(screen.getByText(/Lip Drift:/i)).toBeDefined();
    expect(screen.getByText(/< 14ms \(Pass\)/i)).toBeDefined();
    expect(screen.getByText(/EBU R128 CERTIFIED/i)).toBeDefined();
  });

  it('reflects custom target language and acoustic parameters in public labels', () => {
    render(
      <BeforeAfterPlayer
        targetLanguage="fr"
        duckingDb={-9.5}
        lipDriftMs={8}
      />
    );

    expect(screen.getByText(/CH 1: Dialogue Dub \(FR\)/i)).toBeDefined();
    expect(screen.getByText(/AUTO-DUCKING: -9.5 dB/i)).toBeDefined();
    expect(screen.getByText(/< 8ms \(Pass\)/i)).toBeDefined();
  });

  it('disables playback and scrubber when no audio streams are provided', () => {
    render(<BeforeAfterPlayer />);

    const playButton = screen.getByRole('button', { name: /Play Audition/i });
    expect(playButton).toHaveProperty('disabled', true);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveProperty('disabled', true);
  });

  it('enables playback controls when audio streams are present and toggles play/pause', async () => {
    render(
      <BeforeAfterPlayer
        sourceAudioUrl="/api/v1/clips/preview-stream?path=sample.mp4"
        localizedAudioUrl="/api/v1/clips/preview-stream?path=mastered.wav"
        dialogueAudioUrl="/api/v1/clips/preview-stream?path=dialogue.wav"
        backgroundAudioUrl="/api/v1/clips/preview-stream?path=background.wav"
      />
    );

    const playButton = screen.getByRole('button', { name: /Play Audition/i });
    expect(playButton).toHaveProperty('disabled', false);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveProperty('disabled', false);

    // Initial click triggers play
    await act(async () => {
      fireEvent.click(playButton);
    });

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('allows user to switch between Dialogue, Background, and Master stem tracks', async () => {
    render(
      <BeforeAfterPlayer
        targetLanguage="es"
        sourceAudioUrl="/api/v1/clips/preview-stream?path=sample.mp4"
        localizedAudioUrl="/api/v1/clips/preview-stream?path=mastered.wav"
        dialogueAudioUrl="/api/v1/clips/preview-stream?path=dialogue.wav"
        backgroundAudioUrl="/api/v1/clips/preview-stream?path=background.wav"
      />
    );

    const dialogueCard = screen.getByText(/CH 1: Dialogue Dub \(ES\)/i).closest('div');
    const backgroundCard = screen.getByText(/CH 2: M&E Background Stem/i).closest('div');
    const masterCard = screen.getByText(/MASTER: Composite Mixdown/i).closest('div');

    expect(dialogueCard).toBeDefined();
    expect(backgroundCard).toBeDefined();
    expect(masterCard).toBeDefined();

    // Switch to dialogue
    await act(async () => {
      fireEvent.click(dialogueCard!);
    });

    // Switch to background
    await act(async () => {
      fireEvent.click(backgroundCard!);
    });

    // Switch back to master
    await act(async () => {
      fireEvent.click(masterCard!);
    });
  });

  it('handles user scrubbing on the timeline slider', () => {
    render(
      <BeforeAfterPlayer
        sourceAudioUrl="/api/v1/clips/preview-stream?path=sample.mp4"
        localizedAudioUrl="/api/v1/clips/preview-stream?path=mastered.wav"
      />
    );

    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '25.5' } });

    expect(slider.value).toBe('25.5');
    expect(screen.getByText(/00:25/i)).toBeDefined();
  });
});
