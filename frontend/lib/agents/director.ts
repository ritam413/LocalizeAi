import { AgentName } from '../telemetry';
import { QAFinding } from './qa_agent';

export type JobStatus = 'pending' | 'in_progress' | 'rework_in_progress' | 'completed' | 'failed';
export type CrewMemberStatus = 'ready' | 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

export interface DirectorJobConfig {
  job_id: string;
  source_video_path: string;
  target_language: string;
  audience_profile?: string;
  constraints?: {
    max_retries?: number;
    min_readiness_threshold?: number;
  };
}

export interface DirectorJobState {
  job_id: string;
  config: DirectorJobConfig;
  status: JobStatus;
  current_agent: AgentName;
  iterations: number;
  release_readiness_score: number;
  crew_statuses: Record<AgentName, CrewMemberStatus>;
  retries_by_agent: Record<AgentName, number>;
  active_findings: QAFinding[];
  repaired_findings: QAFinding[];
}

export function createDirectorJobState(config: DirectorJobConfig): DirectorJobState {
  const initialCrew: Record<AgentName, CrewMemberStatus> = {
    director: 'ready',
    story_analyst: 'pending',
    localization_director: 'pending',
    voice_director: 'pending',
    sync_engineer: 'pending',
    subtitle_director: 'pending',
    qa_agent: 'pending',
  };

  const initialRetries: Record<AgentName, number> = {
    director: 0,
    story_analyst: 0,
    localization_director: 0,
    voice_director: 0,
    sync_engineer: 0,
    subtitle_director: 0,
    qa_agent: 0,
  };

  return {
    job_id: config.job_id,
    config,
    status: 'pending',
    current_agent: 'director',
    iterations: 0,
    release_readiness_score: 0.0,
    crew_statuses: initialCrew,
    retries_by_agent: initialRetries,
    active_findings: [],
    repaired_findings: [],
  };
}

export function applyTargetedRepair(
  state: DirectorJobState,
  finding: QAFinding,
  repairDetails: {
    resolved_duration_s: number;
    strategy: string;
    atempo_factor: number;
  }
): DirectorJobState {
  const target = finding.target_agent;
  const updatedRetries = {
    ...state.retries_by_agent,
    [target]: (state.retries_by_agent[target] || 0) + 1,
  };

  const repairedFinding: QAFinding = {
    ...finding,
    fix_applied: true,
  };

  const updatedCrew: Record<AgentName, CrewMemberStatus> = {
    ...state.crew_statuses,
    [target]: 'completed',
    qa_agent: 'completed',
    director: 'completed',
  };

  return {
    ...state,
    status: 'completed',
    iterations: state.iterations + 1,
    release_readiness_score: 95.0,
    crew_statuses: updatedCrew,
    retries_by_agent: updatedRetries,
    active_findings: state.active_findings.filter((f) => f.finding_id !== finding.finding_id),
    repaired_findings: [...state.repaired_findings, repairedFinding],
  };
}

export function validateDirectorJobState(state: any): state is DirectorJobState {
  if (!state || typeof state !== 'object') return false;
  if (typeof state.job_id !== 'string') return false;
  if (typeof state.status !== 'string') return false;
  if (typeof state.iterations !== 'number') return false;
  if (!state.crew_statuses || typeof state.crew_statuses !== 'object') return false;
  return true;
}

export interface PipelineJobSpec {
  job_id: string;
  video_path: string;
  target_language: string;
  source_language?: string;
  output_dir?: string;
  use_demucs?: boolean;
  whisper_model?: string;
  whisper_compute_type?: string;
  llm_provider?: 'gemini' | 'ollama';
  tts_adapter?: 'edge_tts' | 'kokoro' | 'mock';
  scene_batch_size?: number;
  ducking_db?: number;
  min_readiness_threshold?: number;
  glossary_locks?: string[];
  speaker_overrides?: Record<string, string>;
}

export interface PipelineReleaseResult {
  job_id: string;
  status: 'completed' | 'failed';
  readiness_score: number;
  total_latency_ms: number;
  release_candidate_video?: string;
  mastered_audio_path?: string;
  dialogue_bus_path?: string;
  background_me_path?: string;
  subtitles_srt_path?: string;
  subtitles_vtt_path?: string;
  repaired_defects: QAFinding[];
  telemetry_events: any[];
  error_message?: string;
}

export function validatePipelineReleaseResult(result: any): result is PipelineReleaseResult {
  if (!result || typeof result !== 'object') return false;
  if (typeof result.job_id !== 'string') return false;
  if (result.status !== 'completed' && result.status !== 'failed') return false;
  if (typeof result.readiness_score !== 'number') return false;
  if (typeof result.total_latency_ms !== 'number') return false;
  return true;
}
