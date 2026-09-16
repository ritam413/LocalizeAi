import { useState, useEffect, useRef } from 'react';
import { AgentName } from '../telemetry';
import { CrewMemberStatus } from '../agents/director';

export interface StagePredictionConfig {
  baseOverheadSec: number;
  multiplierModeA: number;
  multiplierModeB: number;
  multiplierModeC: number;
  label: string;
  activeStatusText: string;
  overrunStatusText: string;
}

export const STAGE_PREDICTION_CONFIGS: Record<AgentName, StagePredictionConfig> = {
  director: {
    baseOverheadSec: 2.0,
    multiplierModeA: 0.05,
    multiplierModeB: 0.05,
    multiplierModeC: 0.02,
    label: 'Director Agent',
    activeStatusText: 'Orchestrating autonomous pipeline…',
    overrunStatusText: 'Synthesizing crew deliverables…',
  },
  story_analyst: {
    baseOverheadSec: 3.5,
    multiplierModeA: 0.25,
    multiplierModeB: 0.18,
    multiplierModeC: 0.10,
    label: 'Story Analyst',
    activeStatusText: 'Extracting speech stems & diarization…',
    overrunStatusText: 'Deep acoustic parsing in progress…',
  },
  localization_director: {
    baseOverheadSec: 4.0,
    multiplierModeA: 0.20,
    multiplierModeB: 0.12,
    multiplierModeC: 0.05,
    label: 'Localization Director',
    activeStatusText: 'Adapting cultural idioms & dialogue…',
    overrunStatusText: 'Refining metric syllable locks…',
  },
  voice_director: {
    baseOverheadSec: 3.0,
    multiplierModeA: 0.35,
    multiplierModeB: 0.25,
    multiplierModeC: 0.00,
    label: 'Voice Director',
    activeStatusText: 'Synthesizing neural voice stems…',
    overrunStatusText: 'Rendering multi-speaker vocal track…',
  },
  sync_engineer: {
    baseOverheadSec: 2.5,
    multiplierModeA: 0.15,
    multiplierModeB: 0.10,
    multiplierModeC: 0.00,
    label: 'Sync Engineer',
    activeStatusText: 'Reconciling speech window & atempo…',
    overrunStatusText: 'Eliminating phonetic phase drift…',
  },
  subtitle_director: {
    baseOverheadSec: 2.0,
    multiplierModeA: 0.08,
    multiplierModeB: 0.05,
    multiplierModeC: 0.05,
    label: 'Subtitle Director',
    activeStatusText: 'Formatting timed SRT & VTT masters…',
    overrunStatusText: 'Verifying Netflix CPS compliance…',
  },
  qa_agent: {
    baseOverheadSec: 3.0,
    multiplierModeA: 0.12,
    multiplierModeB: 0.08,
    multiplierModeC: 0.05,
    label: 'QA Continuity Agent',
    activeStatusText: 'Auditing perceptual release candidate…',
    overrunStatusText: 'Verifying acoustic loudness balance…',
  },
};

/**
 * Calculates predicted target duration in seconds for an agent given video duration and project mode.
 */
export function calculatePredictedDuration(
  agent: AgentName,
  videoDurationSec: number = 35.0,
  projectMode: string = 'A'
): number {
  const cfg = STAGE_PREDICTION_CONFIGS[agent] || STAGE_PREDICTION_CONFIGS.story_analyst;
  const mode = (projectMode || 'A').toUpperCase();
  const mult =
    mode === 'C'
      ? cfg.multiplierModeC
      : mode === 'B'
      ? cfg.multiplierModeB
      : cfg.multiplierModeA;

  const validVideoDuration = Math.max(2.0, videoDurationSec || 35.0);
  const rawPredicted = cfg.baseOverheadSec + mult * validVideoDuration;
  // Enforce a sensible minimum floor of 2.5s and maximum sanity ceiling
  return Math.max(2.5, Math.min(1800, rawPredicted));
}

/**
 * Monotonic Hermite cubic blend on normalized u in [0, 1] yielding progress from 0% to 90%.
 */
export function calculateNormalProgress(u: number): number {
  const clampedU = Math.min(1.0, Math.max(0.0, u));
  const smoothStep = clampedU * clampedU * (3.0 - 2.0 * clampedU);
  return smoothStep * 90.0;
}

/**
 * Asymptotic deceleration curve when t > targetDuration.
 * Creeps smoothly from 90% towards 98.5% using exponential decay.
 */
export function calculateOverrunProgress(deltaSec: number, targetSec: number): number {
  const safeDelta = Math.max(0.0, deltaSec);
  const safeTarget = Math.max(1.0, targetSec);
  const decayFactor = 0.8 * safeTarget;
  const ratio = 1.0 - Math.exp(-safeDelta / decayFactor);
  return 90.0 + 8.5 * ratio;
}

/**
 * Main progress calculation function given status, elapsed seconds, and target predicted seconds.
 */
export function calculateStageProgress(
  status: CrewMemberStatus,
  elapsedSec: number,
  targetSec: number
): { progressPct: number; isOverrun: boolean } {
  if (status === 'completed') {
    return { progressPct: 100.0, isOverrun: false };
  }

  if (status === 'pending' || status === 'ready') {
    return { progressPct: 0.0, isOverrun: false };
  }

  // Active states: 'running' or 'retrying'
  if (elapsedSec <= targetSec) {
    const u = targetSec > 0 ? elapsedSec / targetSec : 0;
    return {
      progressPct: calculateNormalProgress(u),
      isOverrun: false,
    };
  } else {
    const delta = elapsedSec - targetSec;
    return {
      progressPct: calculateOverrunProgress(delta, targetSec),
      isOverrun: true,
    };
  }
}

/**
 * Custom React hook managing real-time tick, smooth progress interpolation,
 * asymptotic deceleration, and seamless completion handoff.
 */
export function useStageProgress(
  agent: AgentName,
  status: CrewMemberStatus,
  videoDurationSec: number = 35.0,
  projectMode: string = 'A',
  customLatencyMs?: number
) {
  const predictedDurationSec = customLatencyMs
    ? customLatencyMs / 1000
    : calculatePredictedDuration(agent, videoDurationSec, projectMode);

  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [completedAnimProgress, setCompletedAnimProgress] = useState<number | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const prevStatusRef = useRef<CrewMemberStatus>(status);

  useEffect(() => {
    // When transitioning from running/retrying to completed, smoothly ramp to 100%
    if (status === 'completed' && (prevStatusRef.current === 'running' || prevStatusRef.current === 'retrying')) {
      setCompletedAnimProgress(100);
      setElapsedSec(predictedDurationSec);
    } else if (status === 'completed') {
      setElapsedSec(predictedDurationSec);
      setCompletedAnimProgress(100);
    } else if (status === 'pending' || status === 'ready') {
      setElapsedSec(0);
      setCompletedAnimProgress(null);
      startTimeRef.current = null;
    }
    prevStatusRef.current = status;
  }, [status, predictedDurationSec]);

  useEffect(() => {
    if (status !== 'running' && status !== 'retrying') return;

    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    let animId: number;
    const tick = () => {
      if (startTimeRef.current !== null) {
        const now = performance.now();
        const currentElapsed = (now - startTimeRef.current) / 1000;
        setElapsedSec(currentElapsed);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [status]);

  const { progressPct, isOverrun } = calculateStageProgress(status, elapsedSec, predictedDurationSec);
  const effectiveProgress = completedAnimProgress !== null ? completedAnimProgress : progressPct;

  const cfg = STAGE_PREDICTION_CONFIGS[agent] || STAGE_PREDICTION_CONFIGS.story_analyst;
  const statusMessage =
    status === 'completed'
      ? 'Step Complete'
      : status === 'retrying'
      ? 'Executing targeted atempo retry…'
      : isOverrun
      ? cfg.overrunStatusText
      : status === 'running'
      ? cfg.activeStatusText
      : 'Queued';

  return {
    elapsedSec: status === 'completed' ? predictedDurationSec : elapsedSec,
    predictedDurationSec,
    progressPct: effectiveProgress,
    isOverrun,
    statusMessage,
  };
}
