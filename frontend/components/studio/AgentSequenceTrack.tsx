'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AgentName, TelemetryEvent } from '../../lib/telemetry';
import { CrewMemberStatus } from '../../lib/agents/director';
import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle, ChevronRight, CornerDownLeft, ArrowLeft, ArrowRight, Zap, Play, RotateCcw } from 'lucide-react';

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
  positionInRow: number; // 0, 1, 2
  footerLeft?: string;
  footerRight?: string;
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
    footerLeft: 'Gemini Core',
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
    footerLeft: 'Gemini Core',
    footerRight: '0 retries',
  },
  {
    id: 'voice_director',
    stepNumber: '03',
    stepLabel: 'Voice Director',
    role: 'Neural Voice Casting & TTS Synthesis',
    techStack: 'ElevenLabs Multilingual v2 / StyleTTS2 + Pitch Matching',
    inputDesc: 'Adapted Dialogue Script + Speaker Timestamps',
    outputDesc: 'Raw Synthesized Spanish Speech Stems (.wav 48kHz 24-bit)',
    defaultLatency: 6840,
    row: 1,
    positionInRow: 2,
    footerLeft: 'Neural TTS',
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
    positionInRow: 2, // Right side of Row 2 (under Step 03)
    footerLeft: 'Targeted Retry',
    footerRight: 'Atempo 1.25x',
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
    positionInRow: 1, // Middle of Row 2 (under Step 02)
    footerLeft: 'SRT / VTT Master',
    footerRight: '42 CPL Max',
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
    positionInRow: 0, // Left side of Row 2 (under Step 01)
    footerLeft: 'Self-Repair Loop',
    footerRight: '98.0% Q-Score',
  },
];

/**
 * Monotonic Hermite cubic spline keyframes simulating realistic AI model inference.
 * Features:
 * - Quick initial request dispatch & token ingestion (0 -> 16%)
 * - Deliberate acoustic reasoning / context parsing bumps (pauses / slower slopes)
 * - Explosive neural token / audio synthesis speedups (fast slopes)
 * - Smooth convergence to 100%
 */
const SPLINE_KEYFRAMES: [number, number][] = [
  [0.00, 0.00], // Start: 0%
  [0.08, 0.16], // Rapid dispatch surge (slope ~2.0)
  [0.18, 0.28], // Context ingestion (slope ~1.2)
  [0.32, 0.38], // Deliberate acoustic/idiom processing bump (slope ~0.71)
  [0.48, 0.65], // Neural model inference burst (slope ~1.69)
  [0.65, 0.77], // Audio filtering & CPS validation (slope ~0.70)
  [0.80, 0.89], // Stem compilation speedup (slope ~0.80)
  [0.92, 0.96], // Final QA verification bump (slope ~0.58)
  [1.00, 1.00], // Settle into completion: 100%
];

export function getOrganicProgress(u: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;

  // Find surrounding keyframes
  for (let i = 0; i < SPLINE_KEYFRAMES.length - 1; i++) {
    const [u0, p0] = SPLINE_KEYFRAMES[i];
    const [u1, p1] = SPLINE_KEYFRAMES[i + 1];

    if (u >= u0 && u <= u1) {
      const segRatio = (u - u0) / (u1 - u0);
      // Smooth Hermite blend S-curve on the local segment: 3s^2 - 2s^3
      const smoothStep = segRatio * segRatio * (3 - 2 * segRatio);
      return p0 + (p1 - p0) * smoothStep;
    }
  }

  return 1;
}

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
}

/**
 * Individual Agent Node Card with dynamic 0.00s -> targetDuration counter
 * and organic progress bar with speedups and bumps.
 */
interface AgentCardProps {
  node: AgentNodeConfig;
  status: CrewMemberStatus;
  isSelected: boolean;
  retryCount: number;
  latencyMs: number;
  progressInfo?: StageProgressInfo;
  onClick: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  node,
  status,
  isSelected,
  retryCount,
  latencyMs,
  progressInfo,
  onClick,
}) => {
  // Local fallback timer for running state when no external master clock is passed
  const [localElapsedMs, setLocalElapsedMs] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (progressInfo) return; // Controlled externally

    if (status === 'running' || status === 'retrying') {
      startTimeRef.current = performance.now();
      let animId: number;

      const tick = (now: number) => {
        if (!startTimeRef.current) startTimeRef.current = now;
        const elapsed = now - startTimeRef.current;
        setLocalElapsedMs(elapsed);
        if (elapsed < latencyMs) {
          animId = requestAnimationFrame(tick);
        }
      };

      animId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animId);
    } else if (status === 'completed') {
      setLocalElapsedMs(latencyMs);
    } else {
      setLocalElapsedMs(0);
      startTimeRef.current = null;
    }
  }, [status, latencyMs, progressInfo]);

  // Compute normalized progress and displayed linear timer
  const targetSeconds = (progressInfo ? progressInfo.targetDuration : latencyMs / 1000) || 5.0;
  let currentElapsedSeconds = 0;

  if (progressInfo) {
    currentElapsedSeconds = progressInfo.elapsedSeconds;
  } else {
    currentElapsedSeconds = localElapsedMs / 1000;
  }

  let displayedSeconds = 0;
  let progressPct = 0;

  if (status === 'completed') {
    displayedSeconds = targetSeconds;
    progressPct = 100;
  } else if (status === 'running' || status === 'retrying') {
    const clampedElapsed = Math.min(targetSeconds, Math.max(0, currentElapsedSeconds));
    displayedSeconds = clampedElapsed;
    const u = targetSeconds > 0 ? Math.min(1, clampedElapsed / targetSeconds) : 0;
    progressPct = getOrganicProgress(u) * 100;
  } else {
    displayedSeconds = 0;
    progressPct = 0;
  }

  return (
    <div
      id={`agent-card-${node.id}`}
      onClick={onClick}
      className={`bg-[#f9fbf2] border-[1.5px] rounded-[16px] p-4 flex flex-col gap-2.5 cursor-pointer transition-all duration-200 select-none ${
        isSelected
          ? 'border-[#130e30] shadow-[0_0_0_3px_#ffe228,0_4px_16px_rgba(19,14,48,0.08)]'
          : 'border-[#130e30]/15 hover:border-[#130e30] hover:-translate-y-0.5'
      } ${
        status === 'retrying' || retryCount > 0
          ? 'border-[#e261e5] shadow-[0_0_0_3px_rgba(226,97,229,0.35)]'
          : ''
      }`}
    >
      {/* Top Header Step & Status Pill */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-extrabold text-[#5f5c6e]">
          STEP {node.stepNumber} {node.id === 'qa_agent' ? '(FINAL)' : ''}
        </span>
        <span
          className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors duration-150 ${
            status === 'completed'
              ? 'bg-[#59e25d] text-[#130e30]'
              : status === 'running'
              ? 'bg-[#ffe228] text-[#130e30] border border-[#130e30] animate-pulse-yellow'
              : status === 'retrying'
              ? 'bg-[#e261e5] text-white animate-pulse'
              : 'bg-[#130e30]/5 text-[#5f5c6e]'
          }`}
        >
          {status === 'completed'
            ? node.id === 'qa_agent'
              ? '✓ Mastered'
              : node.id === 'subtitle_director'
              ? '✓ Synced'
              : node.id === 'sync_engineer'
              ? '✓ Fixed'
              : '✓ Ready'
            : status === 'retrying'
            ? '⚡ Atempo Fix'
            : status}
        </span>
      </div>

      {/* Role and Label */}
      <div className="flex flex-col">
        <h3 className="text-sm font-extrabold text-[#130e30] truncate">{node.stepLabel}</h3>
        <p className="text-[11px] text-[#5f5c6e] truncate">{node.role}</p>
      </div>

      {/* Dynamic Linear Counter (starts from 0.00s and linearly reaches target duration) */}
      <div className="font-mono text-base font-extrabold text-[#130e30] flex items-baseline justify-between tabular-nums pt-1">
        <span className="tabular-nums tracking-tight font-black">{displayedSeconds.toFixed(2)}s</span>
        <span className="text-[9px] font-bold uppercase text-[#5f5c6e] font-sans">
          {status === 'running'
            ? 'Active'
            : status === 'retrying'
            ? 'Self-Repair'
            : status === 'completed'
            ? node.id === 'qa_agent'
              ? 'Audit PASS'
              : node.id === 'subtitle_director'
              ? 'CPS Compliant'
              : node.id === 'sync_engineer'
              ? '<18ms Drift'
              : 'Latency'
            : 'Estimated'}
        </span>
      </div>

      {/* Organic Micro Progress Bar with Bumps & Speedups */}
      <div className="h-1.5 w-full bg-[#130e30]/10 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-75 ease-out relative ${
            status === 'completed'
              ? 'bg-[#59e25d]'
              : status === 'running'
              ? 'bg-[#ffe228]'
              : status === 'retrying'
              ? 'bg-[#e261e5]'
              : 'bg-[#130e30]/10'
          }`}
          style={{ width: `${progressPct}%` }}
        >
          {/* Subtle Glowing Head Point on Active Progress */}
          {(status === 'running' || status === 'retrying') && progressPct > 0 && progressPct < 100 && (
            <span
              className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                status === 'retrying'
                  ? 'bg-[#e261e5] shadow-[0_0_8px_#e261e5]'
                  : 'bg-[#130e30] shadow-[0_0_6px_#ffe228]'
              }`}
            />
          )}
        </div>
      </div>

      {/* Footer Specs & Retry Counts */}
      <div className="text-[10px] font-mono text-[#5f5c6e] flex items-center justify-between border-t border-[#130e30]/8 pt-2">
        <span>{node.footerLeft || 'Gemini Core'}</span>
        <span
          className={
            node.id === 'qa_agent'
              ? 'text-[#59e25d] font-bold'
              : status === 'retrying'
              ? 'text-[#e261e5] font-bold'
              : ''
          }
        >
          {retryCount > 0
            ? `Retry #${retryCount}`
            : node.footerRight || '0 retries'}
        </span>
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
}) => {
  const [internalSelectedAgent, setInternalSelectedAgent] = useState<AgentName>('story_analyst');
  const activeAgent = controlledSelectedAgent || internalSelectedAgent;
  const [demoRetryActive, setDemoRetryActive] = useState<boolean>(false);

  const handleSelect = (agent: AgentName) => {
    setInternalSelectedAgent(agent);
    if (onSelectAgent) onSelectAgent(agent);
  };

  const getAgentStatus = (agentId: AgentName): CrewMemberStatus => {
    if (demoRetryActive) {
      if (agentId === 'sync_engineer') return 'retrying';
      if (agentId === 'qa_agent') return 'running';
    }
    return crewStatuses[agentId] || 'pending';
  };

  const getAgentEvent = (agentId: AgentName): TelemetryEvent | undefined => {
    return [...telemetryEvents].reverse().find((e) => e.agent === agentId);
  };

  const getAgentLatency = (node: AgentNodeConfig): number => {
    const ev = getAgentEvent(node.id);
    return ev ? ev.latency_ms : node.defaultLatency;
  };

  const row1Nodes = AGENT_NODES.filter((n) => n.row === 1);

  const voiceDirectorStatus = getAgentStatus('voice_director');
  const isTurnConduitActive =
    voiceDirectorStatus === 'completed' ||
    getAgentStatus('sync_engineer') !== 'pending' ||
    runStatus === 'completed';

  const selectedNodeConfig = AGENT_NODES.find((n) => n.id === activeAgent) || AGENT_NODES[0];
  const selectedEvent = getAgentEvent(activeAgent);

  // Nodes for Row 2 ordered visually (Step 06 on left, Step 05 in middle, Step 04 on right under Step 03)
  const step06Node = AGENT_NODES.find((n) => n.id === 'qa_agent')!;
  const step05Node = AGENT_NODES.find((n) => n.id === 'subtitle_director')!;
  const step04Node = AGENT_NODES.find((n) => n.id === 'sync_engineer')!;

  return (
    <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 rounded-[24px] p-6 text-[#130e30] space-y-5 shadow-sm font-sans">
      {/* Header with Title and Live Execution Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#130e30]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffe228] border-[1.5px] border-[#130e30] animate-pulse" />
          <h2 className="text-sm font-extrabold uppercase tracking-tight text-[#130e30] flex items-center gap-2">
            Serpentine Agent Workflow Route
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f9fbf2] border border-[#130e30] font-bold">
              Ditto × Netflix Sans
            </span>
          </h2>
        </div>

        {/* Self-Repair status indicator */}
        <div className="flex items-center gap-2">
          {retries.sync_engineer > 0 || demoRetryActive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fdf3fe] border border-[#e261e5] text-[11px] font-mono font-bold text-[#e261e5]">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Self-Repair Active (Row 2 ➔ Step 04)</span>
            </div>
          ) : (
            <span className="text-xs text-[#5f5c6e] font-mono font-medium">
              Autonomic 6-Agent Swarm
            </span>
          )}
        </div>
      </div>

      {/* 2-ROW SERPENTINE WORKFLOW GRAPH */}
      <div className="space-y-3 relative">
        {/* ROW 1: Left to Right (Step 01 -> Step 02 -> Step 03) */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_32px_1fr_32px_1fr] items-center gap-2.5">
          {row1Nodes.map((node, index) => {
            const status = getAgentStatus(node.id);
            const isSelected = activeAgent === node.id;
            const latency = getAgentLatency(node);
            const retryCount = retries[node.id] || 0;
            const progressInfo = stageProgressMap?.[node.id];

            return (
              <React.Fragment key={node.id}>
                <AgentCard
                  node={node}
                  status={status}
                  isSelected={isSelected}
                  retryCount={retryCount}
                  latencyMs={latency}
                  progressInfo={progressInfo}
                  onClick={() => handleSelect(node.id)}
                />

                {/* Arrow Connector (Between nodes in row 1) */}
                {index < 2 && (
                  <div className="hidden md:flex items-center justify-center text-[#130e30]/40 font-bold">
                    <ArrowRight
                      className={`w-5 h-5 transition-all ${
                        status === 'completed' ? 'text-[#130e30]' : 'text-[#5f5c6e]/30'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* DOWNWARD CORNER CONDUIT: Row 1 (Step 03) -> Row 2 (Step 04) */}
        <div className="flex items-center justify-end pr-4 md:pr-[12%] h-12 my-[-4px] relative">
          <div className="flex items-center gap-3">
            <span
              className={`text-[10.5px] font-mono font-bold px-3 py-0.5 rounded-full bg-[#f9fbf2] border-[1.5px] border-[#130e30] text-[#130e30] uppercase tracking-wider transition-all duration-200 ${
                isTurnConduitActive ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
              }`}
            >
              Handoff Down to Audio Stems ⤵
            </span>
            <svg className="w-10 h-12 overflow-visible" viewBox="0 0 40 48">
              <path
                d="M 20 0 L 20 28 Q 20 44 4 44"
                fill="none"
                stroke={isTurnConduitActive ? '#130e30' : '#5f5c6e'}
                strokeWidth={isTurnConduitActive ? '3' : '2'}
                strokeLinecap="round"
                className={isTurnConduitActive ? 'animate-dash-flow' : 'opacity-30'}
              />
            </svg>
          </div>
        </div>

        {/* ROW 2: Right to Left (Step 04 <- Step 05 <- Step 06) */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_32px_1fr_32px_1fr] items-center gap-2.5">
          {/* Step 06: QA Continuity Agent (Left) */}
          <AgentCard
            node={step06Node}
            status={getAgentStatus('qa_agent')}
            isSelected={activeAgent === 'qa_agent'}
            retryCount={retries.qa_agent || 0}
            latencyMs={getAgentLatency(step06Node)}
            progressInfo={stageProgressMap?.qa_agent}
            onClick={() => handleSelect('qa_agent')}
          />

          {/* Left Arrow Connector (Step 05 -> Step 06) */}
          <div className="hidden md:flex items-center justify-center text-[#130e30]/40 font-bold">
            <ArrowLeft className="w-5 h-5 text-[#130e30]" />
          </div>

          {/* Step 05: Subtitle Director (Middle) */}
          <AgentCard
            node={step05Node}
            status={getAgentStatus('subtitle_director')}
            isSelected={activeAgent === 'subtitle_director'}
            retryCount={retries.subtitle_director || 0}
            latencyMs={getAgentLatency(step05Node)}
            progressInfo={stageProgressMap?.subtitle_director}
            onClick={() => handleSelect('subtitle_director')}
          />

          {/* Left Arrow Connector (Step 04 -> Step 05) */}
          <div className="hidden md:flex items-center justify-center text-[#130e30]/40 font-bold">
            <ArrowLeft className="w-5 h-5 text-[#130e30]" />
          </div>

          {/* Step 04: Sync Engineer (Right - directly under Step 03) */}
          <AgentCard
            node={step04Node}
            status={getAgentStatus('sync_engineer')}
            isSelected={activeAgent === 'sync_engineer'}
            retryCount={retries.sync_engineer || 0}
            latencyMs={getAgentLatency(step04Node)}
            progressInfo={stageProgressMap?.sync_engineer}
            onClick={() => handleSelect('sync_engineer')}
          />
        </div>
      </div>

      {/* TARGETED SELF-REPAIR FEEDBACK ARC BANNER (Row 2 Feedback) */}
      {(retries.sync_engineer > 0 || demoRetryActive || activeAgent === 'sync_engineer' || activeAgent === 'qa_agent') && (
        <div className="bg-[#fdf3fe] border-[1.5px] border-dashed border-[#e261e5] rounded-[14px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#130e30]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono bg-[#e261e5] text-white px-2.5 py-0.5 rounded-full font-bold text-[10px]">
              AUTONOMIC SELF-REPAIR
            </span>
            <span className="font-medium">
              QA Continuity Agent detected <strong>TIMING_OVERFLOW (+1.40s)</strong> in Scene 07 ➔ Dispatched targeted retry across Row 2 to <strong>Sync Engineer</strong>.
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#e261e5] font-bold whitespace-nowrap">
            atempo=1.25x (Resolved)
          </span>
        </div>
      )}

      {/* EXPANDABLE TELEMETRY DRILLDOWN DRAWER */}
      <div className="bg-[#f9fbf2] border-[1.5px] border-[#130e30] rounded-[16px] p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-[#130e30]/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-extrabold text-[#130e30] bg-[#eff2e5] px-2.5 py-1 rounded-md border border-[#130e30]/20">
              STEP {selectedNodeConfig.stepNumber} DRILLDOWN
            </span>
            <h4 className="text-sm font-extrabold text-[#130e30]">{selectedNodeConfig.stepLabel}</h4>
          </div>
          <span className="font-mono text-xs font-bold text-[#5f5c6e]">
            Execution ID: <span className="text-[#130e30]">op-{selectedNodeConfig.id}-098</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex flex-col gap-1.5 bg-[#eff2e5] p-3 rounded-xl border border-[#130e30]/10">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5f5c6e]">Technology & Model</span>
            <span className="font-semibold text-[#130e30] leading-snug">{selectedNodeConfig.techStack}</span>
          </div>

          <div className="flex flex-col gap-1.5 bg-[#eff2e5] p-3 rounded-xl border border-[#130e30]/10">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5f5c6e]">Input Artifact</span>
            <span className="font-mono text-[11px] text-[#130e30] leading-snug">{selectedNodeConfig.inputDesc}</span>
          </div>

          <div className="flex flex-col gap-1.5 bg-[#eff2e5] p-3 rounded-xl border border-[#130e30]/10">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5f5c6e]">Synthesized Output</span>
            <span className="font-mono text-[11px] text-[#130e30] leading-snug">{selectedNodeConfig.outputDesc}</span>
          </div>
        </div>

        {selectedEvent && (
          <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-[#5f5c6e] bg-[#eff2e5]/50 px-3 py-2 rounded-lg">
            <span>Action: <strong className="text-[#130e30]">{selectedEvent.action}</strong></span>
            <span>Decision: <strong className="text-[#130e30]">{selectedEvent.decision}</strong></span>
            <span>Q-Score: <strong className="text-[#59e25d]">{selectedEvent.quality_score}%</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
