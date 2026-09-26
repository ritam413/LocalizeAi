'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Sparkles,
  CheckCircle2,
  Film,
  Zap,
  Globe2,
  Subtitles,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Radio,
  Clock,
  Terminal,
  Clapperboard
} from 'lucide-react';
import { MultiAudioPlayer, AudioTrackOption } from '../../../components/studio/MultiAudioPlayer';
import { AgentSequenceTrack } from '../../../components/studio/AgentSequenceTrack';
import { ProducerBoard } from '../../../components/studio/ProducerBoard';
import { QARepairCard } from '../../../components/studio/QARepairCard';
import { ReadinessGauge } from '../../../components/studio/ReadinessGauge';
import { DecisionFeed } from '../../../components/studio/DecisionFeed';
import { TelemetryEvent, AgentName } from '../../../lib/telemetry';
import { CrewMemberStatus } from '../../../lib/agents/director';

interface DemoStage {
  id: AgentName;
  stepNumber: string;
  name: string;
  role: string;
  start_s: number;
  end_s: number;
  latency_ms: number;
  event: TelemetryEvent;
}

const DEMO_STAGES: DemoStage[] = [
  {
    id: 'story_analyst',
    stepNumber: '01',
    name: 'Story Analyst Agent',
    role: 'Narrative Tone & Dialogue Extraction',
    start_s: 0,
    end_s: 6,
    latency_ms: 4820,
    event: {
      job_id: 'demo_judge_reel',
      scene_id: 'scene_01',
      agent: 'story_analyst',
      action: 'ANALYZE_NARRATIVE_CONTEXT',
      decision: 'Extracted 31 dialogue segments. Identified speaker_1 (Afan Mustafa) with high urgency/enthusiasm.',
      latency_ms: 4820,
      retry_count: 0,
      quality_score: 96.0,
      status: 'ok',
      timestamp: '2026-09-09T21:10:00Z',
    },
  },
  {
    id: 'localization_director',
    stepNumber: '02',
    name: 'Localization Director Agent',
    role: 'Cultural Script Adaptation',
    start_s: 6,
    end_s: 12,
    latency_ms: 5910,
    event: {
      job_id: 'demo_judge_reel',
      scene_id: 'scene_01',
      agent: 'localization_director',
      action: 'TRANSLATE_CULTURAL_SCRIPT',
      decision: 'Localized into Spanish, Hindi, and French. Maintained hackathon tech idioms with rationale per line.',
      latency_ms: 5910,
      retry_count: 0,
      quality_score: 97.5,
      status: 'ok',
      timestamp: '2026-09-09T21:10:06Z',
    },
  },
  {
    id: 'voice_director',
    stepNumber: '03',
    name: 'Voice Director Agent',
    role: 'Neural Voice Synthesis',
    start_s: 12,
    end_s: 19,
    latency_ms: 6840,
    event: {
      job_id: 'demo_judge_reel',
      scene_id: 'scene_01',
      agent: 'voice_director',
      action: 'SYNTHESIZE_SPEECH_AUDIO',
      decision: 'Synthesized 93 neural speech stems using AlvaroNeural (ES), MadhurNeural (HI), and HenriNeural (FR).',
      latency_ms: 6840,
      retry_count: 0,
      quality_score: 98.0,
      status: 'ok',
      timestamp: '2026-09-09T21:10:13Z',
    },
  },
  {
    id: 'sync_engineer',
    stepNumber: '04',
    name: 'Sync Engineer Agent',
    role: 'Duration & Timing Reconciliation',
    start_s: 19,
    end_s: 25,
    latency_ms: 5780,
    event: {
      job_id: 'demo_judge_reel',
      scene_id: 'scene_07',
      agent: 'sync_engineer',
      action: 'RECONCILE_AUDIO_DURATIONS',
      decision: 'Applied dynamic atempo speed factors (1.05x - 1.22x) to fit speech windows within 18ms lip tolerance.',
      latency_ms: 5780,
      retry_count: 0,
      quality_score: 96.8,
      status: 'ok',
      timestamp: '2026-09-09T21:10:20Z',
    },
  },
  {
    id: 'subtitle_director',
    stepNumber: '05',
    name: 'Subtitle Director Agent',
    role: 'Synchronized SRT / VTT Formatting',
    start_s: 25,
    end_s: 30,
    latency_ms: 4650,
    event: {
      job_id: 'demo_judge_reel',
      scene_id: 'scene_01',
      agent: 'subtitle_director',
      action: 'GENERATE_SYNCHRONIZED_SUBTITLES',
      decision: 'Generated drift-free WebVTT and SRT subtitle streams aligned with adjusted audio boundaries under 17 CPS.',
      latency_ms: 4650,
      retry_count: 0,
      quality_score: 99.0,
      status: 'ok',
      timestamp: '2026-09-09T21:10:26Z',
    },
  },
  {
    id: 'qa_agent',
    stepNumber: '06',
    name: 'QA / Continuity Agent',
    role: 'Automated Quality Inspection & Self-Repair',
    start_s: 30,
    end_s: 36,
    latency_ms: 5990,
    event: {
      job_id: 'demo_judge_reel',
      scene_id: 'scene_07',
      agent: 'qa_agent',
      action: 'INSPECT_RELEASE_CANDIDATE',
      decision: 'Detected initial TIMING_OVERFLOW. Triggered targeted self-repair loop back to Sync Engineer. Score 84.0 -> 98.0 PASS.',
      latency_ms: 5990,
      retry_count: 1,
      quality_score: 98.0,
      status: 'fixed',
      timestamp: '2026-09-09T21:10:32Z',
    },
  },
];

const TOTAL_DEMO_SECONDS = 36;

export default function DemoRunPage() {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentName>('story_analyst');
  const [activeTab, setActiveTab] = useState<'studio' | 'player'>('studio');

  // Timer Tick (50ms interval for silky smooth 20fps interpolation)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && elapsedSeconds < TOTAL_DEMO_SECONDS) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = Math.round((prev + 0.05) * 100) / 100;
          if (next >= TOTAL_DEMO_SECONDS) {
            setIsRunning(false);
            return TOTAL_DEMO_SECONDS;
          }
          return next;
        });
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, elapsedSeconds]);

  // Compute live agent statuses based on elapsedSeconds
  const crewStatuses: Record<AgentName, CrewMemberStatus> = {
    director: elapsedSeconds >= TOTAL_DEMO_SECONDS ? 'completed' : isRunning ? 'running' : 'ready',
    story_analyst: elapsedSeconds >= 6 ? 'completed' : elapsedSeconds > 0 ? 'running' : 'pending',
    localization_director: elapsedSeconds >= 12 ? 'completed' : elapsedSeconds > 6 ? 'running' : 'pending',
    voice_director: elapsedSeconds >= 19 ? 'completed' : elapsedSeconds > 12 ? 'running' : 'pending',
    sync_engineer:
      elapsedSeconds >= TOTAL_DEMO_SECONDS
        ? 'completed'
        : elapsedSeconds >= 32
        ? 'retrying'
        : elapsedSeconds >= 25
        ? 'completed'
        : elapsedSeconds > 19
        ? 'running'
        : 'pending',
    subtitle_director: elapsedSeconds >= 30 ? 'completed' : elapsedSeconds > 25 ? 'running' : 'pending',
    qa_agent:
      elapsedSeconds >= TOTAL_DEMO_SECONDS
        ? 'completed'
        : elapsedSeconds >= 30
        ? 'running'
        : 'pending',
  };

  const retries: Record<AgentName, number> = {
    director: 0,
    story_analyst: 0,
    localization_director: 0,
    voice_director: 0,
    sync_engineer: elapsedSeconds >= 32 ? 1 : 0,
    subtitle_director: 0,
    qa_agent: 0,
  };

  // Compute stage-specific progress & timing for all 6 agents
  const stageProgressMap: Partial<Record<AgentName, { elapsedSeconds: number; targetDuration: number }>> = {};
  
  DEMO_STAGES.forEach((stage) => {
    const targetDuration = stage.latency_ms / 1000;
    let stageElapsed = 0;
    if (elapsedSeconds >= stage.end_s) {
      stageElapsed = targetDuration;
    } else if (elapsedSeconds <= stage.start_s) {
      stageElapsed = 0;
    } else {
      const stageSpan = stage.end_s - stage.start_s;
      const progressFraction = (elapsedSeconds - stage.start_s) / stageSpan;
      stageElapsed = progressFraction * targetDuration;
    }
    stageProgressMap[stage.id] = {
      elapsedSeconds: stageElapsed,
      targetDuration,
    };
  });

  // Handle Sync Engineer retrying loop in demo (seconds 32 to 36)
  if (elapsedSeconds >= 32 && elapsedSeconds < TOTAL_DEMO_SECONDS) {
    const retryFraction = (elapsedSeconds - 32) / (TOTAL_DEMO_SECONDS - 32);
    stageProgressMap.sync_engineer = {
      elapsedSeconds: retryFraction * 2.15,
      targetDuration: 2.15,
    };
  }

  // Telemetry events populated dynamically as time passes
  const activeEvents: TelemetryEvent[] = DEMO_STAGES.filter((s) => elapsedSeconds >= s.end_s).map(
    (s) => s.event
  );

  const isCompleted = elapsedSeconds >= TOTAL_DEMO_SECONDS;

  // Automatically transition to the YouTube Multi-Audio Player when all stages are complete
  useEffect(() => {
    if (elapsedSeconds >= TOTAL_DEMO_SECONDS) {
      const timer = setTimeout(() => {
        setActiveTab('player');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [elapsedSeconds]);

  // Active current step
  const currentStage = DEMO_STAGES.find(
    (s) => elapsedSeconds >= s.start_s && elapsedSeconds < s.end_s
  ) || DEMO_STAGES[DEMO_STAGES.length - 1];

  const handleRestart = () => {
    setElapsedSeconds(0);
    setIsRunning(true);
    setSelectedAgent('story_analyst');
    setActiveTab('studio');
  };

  const handleFastForward = () => {
    setElapsedSeconds(TOTAL_DEMO_SECONDS);
    setIsRunning(false);
    setActiveTab('player');
  };

  return (
    <div className="space-y-8 font-sans text-[#1a1a1a] max-w-7xl mx-auto pb-16">
      {/* Top Demo Banner Bar */}
      <div className="bg-white border border-[#dbd8e8] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center space-x-1.5 bg-[#f2eeff] text-[#7248ea] border border-[#bd98ec]/60 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>JUDGE DEMO MODE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tight">
              35s AI Post-Production Crew
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase border ${
                isCompleted
                  ? 'bg-[#f0f9eb] text-[#14804a] border-[#c2e7b0]'
                  : 'bg-[#f2eeff] text-[#7248ea] border-[#bd98ec]'
              }`}
            >
              {isCompleted ? '✓ 100% Release Ready' : `Step ${currentStage.stepNumber} Active`}
            </span>
          </div>
          <p className="text-xs text-[#575268] leading-relaxed">
            Footage: <strong className="text-[#1a1a1a]">Anthropic Hackathon Winner - Afan Mustafa</strong> • 4K
            Cinema Master • Languages: <strong className="text-[#1a1a1a]">ES, HI, FR</strong>
          </p>
        </div>

        {/* Demo Timer HUD & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Progress Timer Badge with Fixed-Width Tabular Numerals */}
          <div className="flex items-center space-x-2 bg-[#fbfbfd] border border-[#dbd8e8] px-4 py-2 rounded-xl shadow-2xs">
            <Clock className="w-4 h-4 text-[#7248ea]" />
            <span className="text-xs font-bold text-[#575268]">Timer:</span>
            <span className="text-sm font-mono font-bold text-[#1a1a1a] tabular-nums min-w-[70px]">
              {elapsedSeconds.toFixed(1)}s / {TOTAL_DEMO_SECONDS}s
            </span>
          </div>

          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#f8f9fa] text-[#1a1a1a] border border-[#dbd8e8] hover:border-[#bd98ec] shadow-2xs transition-all active:scale-[0.97] cursor-pointer"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isCompleted ? 'Finished' : 'Resume'}</span>
              </>
            )}
          </button>

          {/* Fast-Forward / Skip to Dubbed Video */}
          <button
            type="button"
            onClick={handleFastForward}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#7248ea] hover:bg-[#6847ff] text-white shadow-[0_4px_12px_rgba(114,72,234,0.3)] transition-all active:scale-[0.97] cursor-pointer"
            title="Jump directly to completed YouTube-style Multi-Audio Player"
          >
            <FastForward className="w-3.5 h-3.5 fill-current" />
            <span>Skip to Dubbed Video ➔</span>
          </button>

          {/* Restart Demo */}
          <button
            type="button"
            onClick={handleRestart}
            className="p-2.5 rounded-xl bg-white hover:bg-[#f8f9fa] text-[#575268] hover:text-[#1a1a1a] border border-[#dbd8e8] hover:border-[#bd98ec] shadow-2xs transition-all active:scale-[0.97] cursor-pointer"
            title="Restart 35s Demo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Visualizer & Switchable Segmented Tabs */}
      <div className="flex items-center space-x-1.5 bg-[#f2f0f8] p-1.5 rounded-2xl border border-[#dbd8e8] w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('studio')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'studio'
              ? 'bg-white text-[#7248ea] shadow-sm'
              : 'text-[#575268] hover:text-[#1a1a1a] hover:bg-white/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#7248ea]" />
          <span>1. Autonomous Crew Visualizer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('player')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'player'
              ? 'bg-white text-[#7248ea] shadow-sm'
              : 'text-[#575268] hover:text-[#1a1a1a] hover:bg-white/60'
          }`}
        >
          <Globe2 className="w-4 h-4 text-[#00d4aa]" />
          <span>2. YouTube Multi-Audio Player</span>
          {isCompleted && <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />}
        </button>
      </div>

      {/* =========================================================
          TAB 1: AUTONOMOUS CREW SEQUENCE TRACK & PRODUCER BOARD
      ========================================================= */}
      {activeTab === 'studio' && (
        <div className="space-y-6">
          {/* 2-Row Serpentine Agent Workflow Track */}
          <AgentSequenceTrack
            crewStatuses={crewStatuses}
            retries={retries}
            telemetryEvents={activeEvents}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            runStatus={isCompleted ? 'completed' : 'running'}
            stageProgressMap={stageProgressMap}
            videoDurationSeconds={TOTAL_DEMO_SECONDS}
            projectMode="A"
          />

          {/* Post-Completion Hero Card to jump to Video */}
          {isCompleted && (
            <div className="bg-[#fbfbfd] border-[2.5px] border-[#59e25d] rounded-[16px] p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-[#14804a] text-[#1a1a1a] flex items-center justify-center font-black border border-[#dbd8e8]">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-[#1a1a1a]">
                    Autonomous Multi-Agent Crew Complete!
                  </h3>
                  <p className="text-xs text-[#575268] font-medium">
                    All dubbing stems synthesized, lip-sync reconciled, subtitles formatted, and QA 98.0 PASS certified.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('player')}
                className="bg-[#130e30] hover:bg-[#251d5c] text-[#7248ea] border border-[#dbd8e8] px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider shadow-md cursor-pointer active:scale-[0.97] flex items-center space-x-2"
              >
                <span>Watch Multi-Audio Dubbed Video</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}

          {/* Secondary Grid: Producer Board + QA Defect Card + Gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
              <ProducerBoard
                runId="demo_judge_reel"
                runStatus={isCompleted ? 'completed' : 'running'}
                readinessScore={isCompleted ? 98.0 : elapsedSeconds > 20 ? 88.5 : 74.0}
                totalLatencyMs={activeEvents.reduce((acc, e) => acc + e.latency_ms, 8200)}
                totalTokens={2410}
                retryCount={elapsedSeconds >= 32 ? 1 : 0}
              />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <ReadinessGauge
                score={isCompleted ? 98.0 : elapsedSeconds > 25 ? 88.5 : 74.0}
                threshold={85.0}
              />

              <QARepairCard
                finding={{
                  finding_id: 'qa-auto-01',
                  scene_id: 'scene_07',
                  segment_id: 7,
                  timestamp_s: 3.2,
                  defect_type: 'TIMING_OVERFLOW',
                  severity: 'critical',
                  description: 'Synthesized dialogue exceeded speech window by 1.40s during initial pass.',
                  recommended_fix: 'Dispatched targeted retry to Sync Engineer: applied atempo 1.25x speed adjust.',
                  target_agent: 'sync_engineer',
                  fix_applied: elapsedSeconds >= 34,
                }}
              />
            </div>
          </div>

          {/* Live Decision Feed */}
          <DecisionFeed events={activeEvents} />
        </div>
      )}

      {/* =========================================================
          TAB 2: YOUTUBE-STYLE MULTI-AUDIO TRACK VIDEO PLAYER
      ========================================================= */}
      {activeTab === 'player' && (
        <div className="space-y-6">
          <MultiAudioPlayer
            title="Anthropic Hackathon Winner Release - Afan Mustafa Claude Code"
            defaultTrackId="hindi"
          />
        </div>
      )}
    </div>
  );
}
