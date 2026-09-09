import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AccessibleErrorReport,
  diagnoseError,
  ActionableErrorDiagnostic,
} from '../components/ui/AccessibleErrorReport';

describe('AccessibleErrorReport Component & Diagnostic Taxonomy', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('diagnoseError taxonomy parser', () => {
    it('diagnoses backend offline / 500 error correctly with remediation command', () => {
      const diag = diagnoseError('Backend server error (500). Connection refused on port 8000.');
      expect(diag).not.toBeNull();
      expect(diag?.category).toBe('BACKEND_OFFLINE');
      expect(diag?.title).toContain('Backend Service Unreachable');
      expect(diag?.statusCode).toBe(500);
      expect(diag?.remediationSteps.length).toBeGreaterThanOrEqual(2);
      expect(diag?.suggestedCommand).toContain('uvicorn app.main:app --port 8000');
    });

    it('diagnoses missing video path / 404 error with sample reel fallback', () => {
      const diag = diagnoseError('404 Not Found: specify a valid movie file path');
      expect(diag).not.toBeNull();
      expect(diag?.category).toBe('FILE_NOT_FOUND');
      expect(diag?.canUseSample).toBe(true);
      expect(diag?.suggestedActionLabel).toContain('Sample Reel');
    });

    it('diagnoses Gemini API key & quota error correctly', () => {
      const diag = diagnoseError('401 Unauthorized: GEMINI_API_KEY is not configured or quota exhausted');
      expect(diag).not.toBeNull();
      expect(diag?.category).toBe('AUTH_API_KEY');
      expect(diag?.title).toContain('Gemini');
      expect(diag?.remediationSteps[0]).toContain('GEMINI_API_KEY');
    });

    it('diagnoses GPU / FFmpeg scaffolding errors', () => {
      const diag = diagnoseError('Demucs CUDA out of memory: ffmpeg process failed');
      expect(diag).not.toBeNull();
      expect(diag?.category).toBe('GPU_FFMPEG_ENGINE');
      expect(diag?.title).toContain('Audio Processing');
      expect(diag?.remediationSteps[0]).toContain('ffmpeg');
    });

    it('diagnoses video preview / media decode errors', () => {
      const diag = diagnoseError('MEDIA_ERR_SRC_NOT_SUPPORTED', 'video_preview');
      expect(diag).not.toBeNull();
      expect(diag?.category).toBe('MEDIA_DECODE');
      expect(diag?.title).toContain('Codec');
      expect(diag?.suggestedCommand).toContain('ffmpeg -i input.mov');
    });

    it('diagnoses active pipeline stage defects', () => {
      const diag = diagnoseError('Pipeline stage "transcription" failed with exit code 1', 'stage');
      expect(diag).not.toBeNull();
      expect(diag?.category).toBe('STAGE_FAILURE');
      expect(diag?.suggestedActionLabel).toBe('Rerun Stage');
    });
  });

  describe('WCAG 2.2 & WAI-ARIA Accessibility Attributes', () => {
    it('renders with role="alert", aria-live="assertive", and aria-atomic="true"', () => {
      render(
        <AccessibleErrorReport
          error="Failed to connect to backend on port 8000"
          context="dispatch"
        />
      );

      const alertEl = screen.getByRole('alert');
      expect(alertEl).toBeDefined();
      expect(alertEl.getAttribute('aria-live')).toBe('assertive');
      expect(alertEl.getAttribute('aria-atomic')).toBe('true');
    });

    it('links error title with aria-labelledby and cause with aria-describedby', () => {
      render(
        <AccessibleErrorReport
          error="404 File Not Found"
          context="ingestion"
        />
      );

      const alertEl = screen.getByRole('alert');
      const labelledBy = alertEl.getAttribute('aria-labelledby');
      const describedBy = alertEl.getAttribute('aria-describedby');

      expect(labelledBy).toBeTruthy();
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(labelledBy!)).toBeDefined();
      expect(document.getElementById(describedBy!)).toBeDefined();
    });

    it('triggers onRetry callback when Retry button is pressed', () => {
      const onRetryMock = vi.fn();
      render(
        <AccessibleErrorReport
          error="Failed to launch pipeline"
          onRetry={onRetryMock}
        />
      );

      const retryBtn = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);
      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });

    it('triggers onUseSample callback when Sample Reel button is pressed', () => {
      const onSampleMock = vi.fn();
      render(
        <AccessibleErrorReport
          error="404: specify a valid movie file path"
          onUseSample={onSampleMock}
        />
      );

      const sampleBtn = screen.getByRole('button', { name: /use studio sample reel/i });
      fireEvent.click(sampleBtn);
      expect(onSampleMock).toHaveBeenCalledTimes(1);
    });

    it('triggers onDismiss callback when Dismiss button is clicked', () => {
      const onDismissMock = vi.fn();
      render(
        <AccessibleErrorReport
          error="General warning"
          onDismiss={onDismissMock}
        />
      );

      const dismissBtn = screen.getByRole('button', { name: /dismiss error report/i });
      fireEvent.click(dismissBtn);
      expect(onDismissMock).toHaveBeenCalledTimes(1);
    });

    it('toggles technical details with proper aria-expanded and aria-controls', () => {
      render(
        <AccessibleErrorReport
          error="Error with traceback details in Python engine"
        />
      );

      const toggleBtn = screen.getByRole('button', { name: /view raw technical trace/i });
      expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(toggleBtn);
      expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
      const controlsId = toggleBtn.getAttribute('aria-controls');
      expect(controlsId).toBeTruthy();
      expect(document.getElementById(controlsId!)).toBeDefined();
    });

    it('invokes clipboard API on Copy Diagnostic Report click', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <AccessibleErrorReport
          error="500 Internal Server Error"
        />
      );

      const copyBtn = screen.getByRole('button', { name: /copy sanitized diagnostic report/i });
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(writeTextMock).toHaveBeenCalledTimes(1);
      const callArg = JSON.parse(writeTextMock.mock.calls[0][0]);
      expect(callArg.category).toBe('BACKEND_OFFLINE');
    });
  });
});
