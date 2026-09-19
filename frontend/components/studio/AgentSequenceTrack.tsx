'use client';

import React, { useState } from 'react';
import { AgentName, TelemetryEvent } from '../../lib/telemetry';
import { CrewMemberStatus } from '../../lib/agents/director';
import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Zap } from 'lucide-react';
import { useStageProgress } from '../../lib/hooks/useStageProgress';

export interface AgentNodeConfig {
  id: AgentName;
  stepNumber: string;
  stepLabel: string;
  role: string;
  techStack: string;
  inputDesc: string;
  outputDesc: string;
  defaultLatency: number;
  row: 1 | 2;
  positionInRow: number;
  footerLeft?: string;
  footerRight?: string;
}

const SPLINE_KEYFRAMES: [number, number][] = [
  [0.00, 0.00],
  [0.08, 0.16],
  [0.18, 0.28],
  [0.32, 0.38],
  [0.48, 0.65],
  [0.65, 0.77],
  [0.80, 0.89],
  [0.92, 0.96],
  [1.00, 1.00],
];

export function getOrganicProgress(u: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;

  for (let i = 0; i < SPLINE_KEYFRAMES.length - 1; i++) {
    const [u0, p0] = SPLINE_KEYFRAMES[i];
    const [u1, p1] = SPLINE_KEYFRAMES[i + 1];

    if (u >= u0 && u <= u1) {
      const segRatio = (u - u0) / (u1 - u0);
      const smoothStep = segRatio * segRatio * (3 - 2 * segRatio);
      return p0 + (p1 - p0) * smoothStep;
    }
  }

  return 1;
}

export const AGENT_NODES: AgentNodeConfig[] = [
  {
    id: 'story_analyst',
    stepNumber: '01',
    stepLabel: 'Story Analyst',
    role: 'Narrative Tone & Dialogue Extraction',
    techStack: 'Demucs v4 + Whisper Large-v3 + Diarization',
    inputDesc: 'Raw 4K Cinema MP4 Audio Track (5.1 Stem)',
    outputDesc: 'Diarized Speakers + Character Sentiment + Formality Map',
    defaultLatency: 4820,
    row: 1,
    positionInRow: 0,
    footerLeft: 'Diarization',
    footerRight: '0 retries',
  },
  {
    id: 'localization_director',
    stepNumber: '02',
    stepLabel: 'Localization Director',
    role: 'Cultural Adaptation & Intent Alignment',
    techStack: 'Gemini 2.5 Pro + Idiom Adaptation Guardrails',
    inputDesc: 'Source Transcript + Tone & Emotional Arc Map',
    outputDesc: 'Culturally Adapted Spanish/Hindi Dub Script with Rationale',
    defaultLatency: 5910,
    row: 1,
    positionInRow: 1,
    footerLeft: 'Syllables',
    footerRight: '0 retries',
  },
  {
    id: 'voice_director',
    stepNumber: '03',
    stepLabel: 'Voice Director',
    role: 'Neural Voice Casting & TTS Synthesis',
    techStack: 'Edge-TTS 300+ Voices / Kokoro-82M',
    inputDesc: 'Adapted Dialogue Script + Speaker Timestamps',
    outputDesc: 'Raw Synthesized Speech Stems (.wav 48kHz)',
    defaultLatency: 6840,
    row: 1,
    positionInRow: 2,
    footerLeft: 'Edge-TTS',
    footerRight: '0 retries',
  },
  {
    id: 'sync_engineer',
    stepNumber: '04',
    stepLabel: 'Sync Engineer',
    role: 'Phonetic Alignment & Drift Correction',
    techStack: 'RubberBand Atempo 1.25x + Silence Compaction',
    inputDesc: 'Raw Voice Stems + Original Cinema Audio Waveform',
    outputDesc: 'Time-Stretched Audio Stems (<18ms lip-sync deviation)',
    defaultLatency: 5780,
    row: 2,
    positionInRow: 2,
    footerLeft: 'Atempo 1.25x',
    footerRight: 'Loop 1',
  },
  {
    id: 'subtitle_director',
    stepNumber: '05',
    stepLabel: 'Subtitle Director',
    role: 'Burn-in Sync & CPS Timing Compliance',
    techStack: 'Netflix Subtitle Standard (Max 20 CPS / 42 CPL)',
    inputDesc: 'Phonetically Aligned Speech Stems + Translated Script',
    outputDesc: 'Master SRT/VTT Subtitles + Multi-Language Tracks',
    defaultLatency: 4650,
    row: 2,
    positionInRow: 1,
    footerLeft: '16.2 CPS',
    footerRight: 'SRT / VTT',
  },
  {
    id: 'qa_agent',
    stepNumber: '06',
    stepLabel: 'QA Continuity Agent',
    role: 'Defect Scanner & Automated Self-Repair',
    techStack: 'Continuous Metric Verifier + Auto-Repair Dispatcher',
    inputDesc: 'Final Subtitled Master Video + Multi-track Stems',
    outputDesc: 'Readiness Audit (PASS 98.0%) + Distribution Certification',
    defaultLatency: 5990,
    row: 2,
    positionInRow: 0,
    footerLeft: 'Release Ready',
    footerRight: '0 Defects',
  },
];

export interface StageProgressInfo {
  elapsedSeconds: number;
  targetDuration: number;
}

export interface AgentSequenceTrackProps {
  crewStatuses: Record<AgentName, CrewMemberStatus>;
  retries: Record<AgentName, number>;
  telemetryEvents: TelemetryEvent[];
  onSelectAgent?: (agent: AgentName) => void;
  selectedAgent?: AgentName | null;
  runStatus?: string;
  stageProgressMap?: Partial<Record<AgentName, StageProgressInfo>>;
  videoDurationSeconds?: number;
  projectMode?: string;
}

interface AgentCardProps {
  node: AgentNodeConfig;
  status: CrewMemberStatus;
  isSelected: boolean;
  retryCount: number;
  latencyMs: number;
  progressInfo?: StageProgressInfo;
  videoDurationSec?: number;
  projectMode?: string;
  onClick: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  node,
  status,
  isSelected,
  retryCount,
  latencyMs,
  progressInfo,
  videoDurationSec = 35.0,
  projectMode = 'A',
  onClick,
}) => {
  const {
    elapsedSec: hookElapsedSec,
    predictedDurationSec: hookPredictedDurationSec,
    progressPct: hookProgressPct,
    isOverrun,
    statusMessage,
  } = useStageProgress(
    node.id,
    status,
    videoDurationSec,
    projectMode,
    latencyMs !== node.defaultLatency ? latencyMs : undefined
  );

  const targetSeconds = progressInfo ? progressInfo.targetDuration : hookPredictedDurationSec;
  const displayedSeconds = progressInfo ? progressInfo.elapsedSeconds : hookElapsedSec;
  const progressPct = progressInfo
    ? Math.min(100, (progressInfo.elapsedSeconds / (progressInfo.targetDuration || 1)) * 100)
    : hookProgressPct;

  const isActive = status === 'running' || status === 'retrying';
  const isRepaired = node.id === 'sync_engineer' && (retryCount > 0 || status === 'retrying');

  return (
    <div
      id={`agent-card-${node.id}`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`p-3 rounded-[8px] border transition-all duration-200 select-none cursor-pointer flex flex-col justify-between gap-2 btn-spring ${
        isRepaired
          ? 'bg-[#FFFBEB] border-[#FDE68A] hover:border-[#D97706]'
          : status === 'completed' && node.id === 'qa_agent'
          ? 'bg-[#F0FDF4] border-2 border-[#15803D]'
          : isSelected
          ? 'bg-white border-[#2B7FFF] shadow-sm ring-1 ring-[#2B7FFF]/30'
          : 'bg-[#F0F6FC] border-[#D0DFEE] hover:border-[#2B7FFF]/60'
      }`}
    >
      {/* Top Header Step & Status Pill */}
      <div className="flex items-center justify-between">
        <span
          className={`font-mono text-[10px] font-bold flex items-center gap-1 ${
            isRepaired ? 'text-[#B45309]' : 'text-[#64748B]'
          }`}
        >
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#2B7FFF] animate-pulse" />}
          {node.stepNumber} {node.stepLabel.toUpperCase()}
        </span>
        <span
          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-[4px] uppercase tracking-wider ${
            status === 'completed'
              ? 'bg-[#F0FDF4] text-[#15803D]'
              : isRepaired
              ? 'bg-[#FEF3C7] text-[#B45309]'
              : status === 'running'
              ? 'bg-[#E2EDF8] text-[#2B7FFF] animate-pulse'
              : 'bg-white text-[#64748B]'
          }`}
        >
          {status === 'completed'
            ? node.id === 'qa_agent'
              ? '98.0%'
              : 'PASS'
            : isRepaired
            ? 'REPAIRED'
            : status === 'running'
            ? 'ACTIVE'
            : status}
        </span>
      </div>

      {/* Role and Label */}
      <div className="my-0.5">
        <h3 className="text-xs font-bold text-[#0F172A] truncate">{node.stepLabel}</h3>
      </div>

      {/* Dynamic Linear / Asymptotic Counter */}
      <div className="font-mono text-[10px] text-[#64748B] flex items-center justify-between tabular-nums">
        <span className="font-bold text-[#0F172A]">{`${displayedSeconds.toFixed(2)}s`}</span>
        <span className={isRepaired ? 'text-[#B45309] font-bold' : 'text-[#64748B]'}>
          {node.footerLeft || 'Gemini Core'}
        </span>
      </div>

      {/* Progress Bar with GPU Transform */}
      <div className="h-1 w-full bg-[#D0DFEE] rounded-[2px] overflow-hidden">
        <div
          className={`h-full origin-left transition-transform duration-300 ${
            status === 'completed'
              ? 'bg-[#15803D]'
              : isRepaired
              ? 'bg-[#F59E0B]'
              : 'bg-[#2B7FFF]'
          }`}
          style={{ transform: `scaleX(${progressPct / 100})` }}
        />
      </div>
    </div>
  );
};

export const AgentSequenceTrack: React.FC<AgentSequenceTrackProps> = ({
  crewStatuses,
  retries,
  telemetryEvents,
  onSelectAgent,
  selectedAgent: controlledSelectedAgent,
  runStatus = 'running',
  stageProgressMap,
  videoDurationSeconds = 35.0,
  projectMode = 'A',
}) => {
  const [internalSelectedAgent, setInternalSelectedAgent] = useState<AgentName>('story_analyst');
  const activeAgent = controlledSelectedAgent || internalSelectedAgent;

  const handleSelect = (agent: AgentName) => {
    setInternalSelectedAgent(agent);
    if (onSelectAgent) onSelectAgent(agent);
  };

  const getAgentStatus = (agentId: AgentName): CrewMemberStatus => {
    return crewStatuses[agentId] || 'pending';
  };

  const getAgentEvent = (agentId: AgentName): TelemetryEvent | undefined => {
    return [...telemetryEvents].reverse().find((e) => e.agent === agentId);
  };

  const getAgentLatency = (node: AgentNodeConfig): number => {
    const ev = getAgentEvent(node.id);
    return ev ? ev.latency_ms : node.defaultLatency;
  };

  const displayNodes = projectMode === 'C'
    ? AGENT_NODES.filter((n) => n.id === 'story_analyst' || n.id === 'localization_director' || n.id === 'subtitle_director' || n.id === 'qa_agent')
    : AGENT_NODES;

  return (
    <section className="bg-white border border-[#D0DFEE] rounded-[16px] p-5 shadow-sm space-y-3 font-sans">
      {/* Header with Title and Live Execution Indicator */}
      <div className="flex items-center justify-between text-xs border-b border-[#F0F6FC] pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#2B7FFF] animate-pulse" />
          <h2 className="font-bold uppercase tracking-wider text-[#0F172A]">
            Serpentine Agent Workflow Route
          </h2>
        </div>
        <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
          Mode {projectMode} · {displayNodes.length} Stages · 1 Closed-Loop Repair
        </span>
      </div>

      {/* Grid of Agent Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {displayNodes.map((node) => {
          const status = getAgentStatus(node.id);
          const isSelected = activeAgent === node.id;
          const latency = getAgentLatency(node);
          const retryCount = retries[node.id] || 0;
          const progressInfo = stageProgressMap?.[node.id];

          return (
            <AgentCard
              key={node.id}
              node={node}
              status={status}
              isSelected={isSelected}
              retryCount={retryCount}
              latencyMs={latency}
              progressInfo={progressInfo}
              videoDurationSec={videoDurationSeconds}
              projectMode={projectMode}
              onClick={() => handleSelect(node.id)}
            />
          );
        })}
      </div>
    </section>
  );
};
