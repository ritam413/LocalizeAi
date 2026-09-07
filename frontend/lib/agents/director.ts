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
