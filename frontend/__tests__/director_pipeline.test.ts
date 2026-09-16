import { describe, it, expect } from 'vitest';
import {
  PipelineJobSpec,
  PipelineReleaseResult,
  validatePipelineReleaseResult,
} from '../lib/agents/director';

describe('Director Pipeline Runner Contract Tests', () => {
  it('validates valid PipelineReleaseResult structure', () => {
    const validResult: PipelineReleaseResult = {
      job_id: 'job-123',
      status: 'completed',
      readiness_score: 95.5,
      total_latency_ms: 3200,
      release_candidate_video: '/storage/runs/job-123/release_candidate.mp4',
      mastered_audio_path: '/storage/runs/job-123/mastered_audio.wav',
      dialogue_bus_path: '/storage/runs/job-123/dialogue_bus.wav',
      background_me_path: '/storage/runs/job-123/background.wav',
      subtitles_srt_path: '/storage/runs/job-123/subtitles.srt',
      subtitles_vtt_path: '/storage/runs/job-123/subtitles.vtt',
      repaired_defects: [],
      telemetry_events: [
        { agent: 'director', action: 'extraction', status: 'ok' },
        { agent: 'director', action: 'denoise', status: 'ok' },
        { agent: 'director', action: 'transcription', status: 'ok' },
        { agent: 'director', action: 'mastering', status: 'ok' },
        { agent: 'director', action: 'muxing', status: 'ok' },
      ],
    };

    expect(validatePipelineReleaseResult(validResult)).toBe(true);
  });

  it('rejects invalid or incomplete PipelineReleaseResult objects', () => {
    expect(validatePipelineReleaseResult(null)).toBe(false);
    expect(validatePipelineReleaseResult({})).toBe(false);
    expect(validatePipelineReleaseResult({ job_id: '123' })).toBe(false);
    expect(
      validatePipelineReleaseResult({
        job_id: '123',
        status: 'invalid_status',
        readiness_score: 90,
        total_latency_ms: 1000,
      })
    ).toBe(false);
  });

  it('supports PipelineJobSpec configuration with 50-minute optimization defaults', () => {
    const spec: PipelineJobSpec = {
      job_id: 'job-50min',
      video_path: '/videos/feature_film_50m.mp4',
      target_language: 'es',
      source_language: 'en',
      use_demucs: false,
      whisper_model: 'small',
      whisper_compute_type: 'int8',
      llm_provider: 'gemini',
      tts_adapter: 'edge_tts',
      scene_batch_size: 30,
      ducking_db: -6.0,
      min_readiness_threshold: 85.0,
      glossary_locks: ['Claude Code', 'Antigravity'],
    };

    expect(spec.use_demucs).toBe(false);
    expect(spec.scene_batch_size).toBe(30);
    expect(spec.tts_adapter).toBe('edge_tts');
    expect(spec.glossary_locks?.length).toBe(2);
  });
});
