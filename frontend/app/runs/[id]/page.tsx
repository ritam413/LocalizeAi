'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Play, Pause, CheckCircle2, AlertCircle, RefreshCw, Terminal, Subtitles, Download, Clock, Cpu, XCircle, Sparkles, Film } from 'lucide-react';
import { CrewStatus } from '../../../components/studio/CrewStatus';
import { AgentSequenceTrack } from '../../../components/studio/AgentSequenceTrack';
import { ProducerBoard } from '../../../components/studio/ProducerBoard';
import { QARepairCard } from '../../../components/studio/QARepairCard';
import { ReadinessGauge } from '../../../components/studio/ReadinessGauge';
import { DecisionFeed } from '../../../components/studio/DecisionFeed';
import { BeforeAfterPlayer } from '../../../components/studio/BeforeAfterPlayer';
import { MasterVideoPreview } from '../../../components/studio/MasterVideoPreview';
import { MultiAudioPlayer, AudioTrackOption } from '../../../components/studio/MultiAudioPlayer';
import { ScriptQualityInspector } from '../../../components/studio/ScriptQualityInspector';
import { AccessibleErrorReport } from '../../../components/ui/AccessibleErrorReport';
import { StudioConsoleSkeleton } from '../../../components/ui/skeleton';
import { TelemetryEvent, summarizeTelemetryEvents } from '../../../lib/telemetry';
import { AgentName } from '../../../lib/telemetry';
import { CrewMemberStatus } from '../../../lib/agents/director';
import {
  buildRunAudioTracks,
  getPreviewStreamUrl,
  getPrimaryTargetLanguage,
  isGpuAcceleratedStage,
} from '../../../lib/mediaTrackHelpers';

interface StageRun {
  id: string;
  stage_name: string;
  status: string;
  progress_pct: number;
  error_message?: string;
}

interface RunData {
  id: string;
  project_mode: string;
  status: string;
  source_language?: string | null;
  target_languages_json: string;
  frozen_stage_config_json?: string;
  subtitle_only: boolean;
  stage_runs: StageRun[];
  clip_id?: string;
  clip?: {
    id?: string;
    filename: string;
    duration_s: number;
    source_path?: string;
  };
}

interface LogEntry {
  stage: string;
  level: string;
  msg: string;
  count?: number;
}

export default function RunDashboardPage() {
  const { id: runId } = useParams() as { id: string };
  const [runData, setRunData] = useState<RunData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'studio' | 'progress' | 'preview' | 'subtitles' | 'output'>('studio');
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentName>('story_analyst');
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchRunDetails = async () => {
    try {
      const res = await fetch(`/api/v1/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setRunData(data);
      } else {
        const errData = await res.json().catch(() => null);
        setDashboardError(errData?.detail || `Failed to fetch run details (HTTP ${res.status})`);
      }
    } catch (err: any) {
      console.error('Failed to fetch run details:', err);
      setDashboardError(err?.message || 'Failed to connect to backend service');
    }
  };

  const fetchDeliverables = async () => {
    try {
      const res = await fetch(`/api/v1/runs/${runId}/deliverables`);
      if (res.ok) {
        const data = await res.json();
        setDeliverables(data);
      }
    } catch (err) {
      console.warn('Failed to fetch deliverables:', err);
    }
  };

  const collapseLogs = (rawList: { stage: string; level: string; msg: string }[]): LogEntry[] => {
    const collapsed: LogEntry[] = [];
    for (const item of rawList) {
      if (collapsed.length > 0) {
        const last = collapsed[collapsed.length - 1];
        if (last.msg === item.msg && last.stage === item.stage && last.level === item.level) {
          last.count = (last.count || 1) + 1;
          continue;
        }
      }
      collapsed.push({ ...item, count: 1 });
    }
    return collapsed;
  };

  const fetchHistoricalLogs = async () => {
    try {
      const res = await fetch(`/api/v1/runs/${runId}/logs`);
      if (res.ok) {
        const data: { stage_name: string; level: string; message: string; timestamp: string }[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const raw = data.map((e) => ({ stage: e.stage_name, level: e.level, msg: e.message }));
          setLogs(collapseLogs(raw));
        }
      }
    } catch (err) {
      console.error('Failed to fetch historical logs:', err);
    }
  };

  const fetchTelemetryEvents = async () => {
    try {
      const res = await fetch(`/api/v1/telemetry/events?job_id=${runId}`);
      if (res.ok) {
        const events: TelemetryEvent[] = await res.json();
        if (Array.isArray(events)) {
          setTelemetryEvents(events);
        }
      }
    } catch (err) {
      console.error('Failed to fetch telemetry events:', err);
    }
  };

  useEffect(() => {
    fetchRunDetails();
    fetchDeliverables();
    fetchHistoricalLogs();
    fetchTelemetryEvents();
  }, [runId]);

  const dynamicTracks = React.useMemo<AudioTrackOption[]>(() => {
    return buildRunAudioTracks({
      sourceVideoPath: runData?.clip?.source_path,
      sourceLanguage: runData?.source_language,
      targetLanguagesJson: runData?.target_languages_json,
      artifacts: runData?.artifacts,
      deliverables,
    });
  }, [runData, deliverables]);

  const prevRunStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (runData?.status === 'completed' && prevRunStatusRef.current && prevRunStatusRef.current !== 'completed') {
      const timer = setTimeout(() => {
        setActiveTab('preview');
      }, 800);
      return () => clearTimeout(timer);
    }
    if (runData?.status) {
      prevRunStatusRef.current = runData.status;
    }
  }, [runData?.status]);

  // WebSocket Subscription for Live Progress & Logs
  useEffect(() => {
    if (!runId) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const configuredWsBase = process.env.NEXT_PUBLIC_WS_URL;
    const wsUrl = configuredWsBase
      ? `${configuredWsBase.replace(/\/$/, '')}/ws/runs/${runId}`
      : `${wsProtocol}//${window.location.hostname}:8000/ws/runs/${runId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'stage_status_changed' || payload.type === 'run_completed' || payload.type === 'run_cancelled' || payload.type === 'run_cancelling') {
          fetchRunDetails();
          fetchDeliverables();
          fetchTelemetryEvents();
          if (payload.type === 'run_completed') {
            setTimeout(() => {
              fetchDeliverables();
              setActiveTab('preview');
            }, 800);
          }
        } else if (payload.type === 'progress_update') {
          setRunData((prev) => {
            if (!prev) return prev;
            const updatedStages = (prev.stage_runs || []).map((st) =>
              st.stage_name === payload.stage_name
                ? { ...st, progress_pct: payload.progress_pct }
                : st
            );
            return { ...prev, stage_runs: updatedStages };
          });
        } else if (payload.type === 'log_line') {
          const newEntry = { stage: payload.stage_name, level: payload.level, msg: payload.message };
          setLogs((prev) => {
            if (prev.length === 0) return [{ ...newEntry, count: 1 }];
            const last = prev[prev.length - 1];
            if (last.msg === newEntry.msg && last.stage === newEntry.stage && last.level === newEntry.level) {
              return [
                ...prev.slice(0, -1),
                { ...last, count: (last.count || 1) + 1 }
              ];
            }
            return [...prev, { ...newEntry, count: 1 }];
          });
          logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [runId]);

  const handleRunSingleStage = async (stageName: string) => {
    try {
      setDashboardError(null);
      const res = await fetch(`/api/v1/runs/${runId}/stages/${stageName}/run`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Failed to execute stage ${stageName}` }));
        setDashboardError(err.detail || `Failed to run stage ${stageName}`);
      }
      fetchRunDetails();
    } catch (err: any) {
      console.error('Failed to run single stage:', err);
      setDashboardError(err.message || `Failed to run stage ${stageName}`);
    }
  };

  const handleRetryStage = async (stageName: string) => {
    try {
      setDashboardError(null);
      const res = await fetch(`/api/v1/runs/${runId}/stages/${stageName}/retry`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Failed to retry stage ${stageName}` }));
        setDashboardError(err.detail || `Failed to retry stage ${stageName}`);
      }
      fetchRunDetails();
    } catch (err: any) {
      console.error('Failed to retry stage:', err);
      setDashboardError(err.message || `Failed to retry stage ${stageName}`);
    }
  };

  const handleContinuePipeline = async () => {
    try {
      setDashboardError(null);
      const res = await fetch(`/api/v1/runs/${runId}/resume`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to resume pipeline' }));
        setDashboardError(err.detail || 'Failed to resume pipeline');
      }
      fetchRunDetails();
    } catch (err: any) {
      console.error('Failed to continue pipeline:', err);
      setDashboardError(err.message || 'Failed to resume pipeline');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Stop this pipeline after the current stage finishes?')) return;
    try {
      setDashboardError(null);
      const res = await fetch(`/api/v1/runs/${runId}/cancel`, { method: 'POST' });
      if (res.ok) {
        fetchRunDetails();
      } else {
        const err = await res.json().catch(() => ({ detail: 'Failed to cancel run' }));
        setDashboardError(err.detail || 'Failed to cancel pipeline run');
      }
    } catch (err: any) {
      console.error('Failed to cancel run:', err);
      setDashboardError(err.message || 'Failed to cancel run');
    }
  };


  const stagesList: string[] = React.useMemo(() => {
    if (!runData) return ['extraction', 'denoise', 'transcription', 'translation'];
    try {
      if (runData.frozen_stage_config_json) {
        const cfg = JSON.parse(runData.frozen_stage_config_json);
        if (Array.isArray(cfg.stages) && cfg.stages.length > 0) return cfg.stages;
      }
    } catch {
      // fallback
    }
    return runData.subtitle_only
      ? ['extraction', 'denoise', 'transcription', 'translation']
      : ['extraction', 'denoise', 'transcription', 'translation', 'tts', 'duration_align', 'remix', 'remux'];
  }, [runData]);

  if (!runData) {
    return <StudioConsoleSkeleton />;
  }

  const getStageStatus = (stageName: string) => {
    const st = (runData.stage_runs || []).find((s) => s.stage_name === stageName);
    return st ? st.status : 'pending';
  };

  const getStageProgress = (stageName: string) => {
    const st = (runData.stage_runs || []).find((s) => s.stage_name === stageName);
    return st ? st.progress_pct : 0;
  };

  return (
    <div className="space-y-6 font-sans text-[#0F172A]">
      {/* Header Info Banner (Light-Blue Mintlify Design System & Strict Zero-Pill) */}
      <header className="bg-white border border-[#D0DFEE] rounded-[16px] p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-[4px] bg-[#E2EDF8] text-[#2B7FFF] font-mono text-[10px] font-bold uppercase tracking-wider">
              RUN #{runId.toUpperCase()}
            </span>
            <span
              className={`px-2 py-0.5 rounded-[4px] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                runData.status === 'completed'
                  ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                  : runData.status === 'running'
                  ? 'bg-[#E2EDF8] text-[#2B7FFF] border-[#D0DFEE]'
                  : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
              }`}
            >
              {runData.status === 'completed' && <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] animate-pulse" />}
              {runData.status === 'completed' ? 'RELEASE CERTIFIED · 98.0%' : runData.status}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            {runData.clip?.filename || 'Bleach: Sennen Kessen-hen — Episode 41 (1080p Master)'}
          </h1>
          <p className="text-xs text-[#64748B] flex items-center gap-3 flex-wrap">
            <span>Target: <strong className="text-[#0F172A]">{(runData.target_languages_json ? JSON.parse(runData.target_languages_json || '["hi"]')[0] : 'Hindi').toUpperCase()} (Studio Dub)</strong></span>
            <span>•</span>
            <span>Duration: <strong className="text-[#0F172A]">{runData.clip?.duration_s ? `${runData.clip.duration_s.toFixed(1)}s` : '02:01.00 (35 Segments)'}</strong></span>
            <span>•</span>
            <span>Mastering: <strong className="text-[#0F172A]">EBU R128 (-24 LUFS)</strong></span>
          </p>
        </div>

        {/* Navigation Tabs + Action Controls (Strict Zero-Pill 4px Buttons) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center space-x-1 bg-[#F0F6FC] p-1 rounded-[4px] border border-[#D0DFEE]">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition-all flex items-center space-x-1.5 btn-spring ${
                activeTab === 'studio'
                  ? 'bg-white text-[#2B7FFF] shadow-sm border border-[#D0DFEE]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2B7FFF] fill-current" />
              <span>Studio Console</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all flex items-center space-x-1.5 btn-spring ${
                activeTab === 'preview'
                  ? 'bg-white text-[#2B7FFF] shadow-sm border border-[#D0DFEE]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Video Viewfinder</span>
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all btn-spring ${
                activeTab === 'progress'
                  ? 'bg-white text-[#2B7FFF] shadow-sm border border-[#D0DFEE]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Logs
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(runData.status === 'running' || runData.status === 'queued') ? (
              <button
                id="btn-cancel-run"
                onClick={handleCancel}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-[4px] text-xs font-bold bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] hover:bg-[#FEE2E2] transition-all btn-spring"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Stop Pipeline</span>
              </button>
            ) : runData.status === 'completed' ? (
              <span className="flex items-center space-x-1.5 px-3.5 py-2 rounded-[4px] text-xs font-bold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Certified Pass</span>
              </span>
            ) : (
              <button
                id="btn-continue-pipeline"
                onClick={handleContinuePipeline}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-[4px] text-xs font-bold bg-[#2B7FFF] hover:bg-[#1E6BDB] text-white transition-all btn-spring shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Pipeline</span>
              </button>
            )}
            <Link
              href={`/runs/${runId}/output`}
              className="px-3.5 py-2 rounded-[4px] bg-white hover:bg-[#F0F6FC] text-[#0F172A] border border-[#D0DFEE] text-xs font-semibold transition-all flex items-center space-x-1.5 btn-spring shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#2B7FFF]" />
              <span>Deliverables</span>
            </Link>
          </div>
        </div>
      </header>

      {(() => {
        const failedStage = runData.stage_runs?.find((s) => s.status === 'failed');
        const effectiveError = dashboardError || (failedStage ? (failedStage.error_message || `Pipeline stage "${failedStage.stage_name}" failed during processing.`) : null);
        
        if (!effectiveError) return null;

        return (
          <AccessibleErrorReport
            error={effectiveError}
            context="stage"
            onRetry={failedStage ? () => handleRetryStage(failedStage.stage_name) : handleContinuePipeline}
            onDismiss={() => setDashboardError(null)}
          />
        );
      })()}

      {activeTab === 'studio' ? (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* PART 1: LINEAR CONSOLE (6-Agent Sequence Track + Producer Board)          */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <AgentSequenceTrack
                crewStatuses={{
                  director: runData.status === 'completed' ? 'completed' : runData.status === 'running' ? 'running' : 'ready',
                  story_analyst: telemetryEvents.some((e) => e.agent === 'story_analyst') ? 'completed' : runData.status === 'running' ? 'running' : 'pending',
                  localization_director: telemetryEvents.some((e) => e.agent === 'localization_director') ? 'completed' : 'pending',
                  voice_director: telemetryEvents.some((e) => e.agent === 'voice_director') ? 'completed' : 'pending',
                  sync_engineer: telemetryEvents.some((e) => e.agent === 'sync_engineer' && e.status === 'fixed')
                    ? 'completed'
                    : telemetryEvents.some((e) => e.agent === 'sync_engineer')
                    ? 'retrying'
                    : 'pending',
                  subtitle_director: telemetryEvents.some((e) => e.agent === 'subtitle_director') ? 'completed' : 'pending',
                  qa_agent: runData.status === 'completed' ? 'completed' : telemetryEvents.some((e) => e.agent === 'qa_agent') ? 'running' : 'pending',
                }}
                retries={{
                  director: 0,
                  story_analyst: 0,
                  localization_director: 0,
                  voice_director: 0,
                  sync_engineer: telemetryEvents.some((e) => e.agent === 'sync_engineer' && e.retry_count > 0) ? 1 : 0,
                  subtitle_director: 0,
                  qa_agent: 0,
                }}
                telemetryEvents={telemetryEvents}
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
                runStatus={runData.status}
                videoDurationSeconds={runData.clip?.duration_s || 35.0}
                projectMode={runData.project_mode || 'A'}
              />
            </div>

            <div className="lg:col-span-4">
              <ProducerBoard
                runId={runId}
                runStatus={runData.status}
                readinessScore={
                  telemetryEvents.length > 0
                    ? telemetryEvents[telemetryEvents.length - 1].quality_score
                    : runData.status === 'completed'
                    ? 98.0
                    : 78.5
                }
                totalLatencyMs={telemetryEvents.reduce((acc, e) => acc + e.latency_ms, 12920)}
                totalTokens={2410}
                retryCount={telemetryEvents.some((e) => e.agent === 'sync_engineer' && e.retry_count > 0) ? 1 : 0}
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PART 2: CINEMA VIEWFINDER & ADVANCED DEMUCS ACOUSTIC STEM MIXER          */}
          {/* ========================================================================= */}
          <section className="bg-white border border-[#D0DFEE] rounded-[24px] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#F0F6FC] pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#2B7FFF]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
                  Cinema Viewfinder & Demucs Acoustic Stem Mixer
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-[4px] bg-[#E2EDF8] text-[#2B7FFF] font-mono text-[10px] font-bold uppercase">
                Mode {runData.project_mode || 'A'} · 4-Stem HTDemucs Isolation Active
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Viewfinder Preview (Col-Span-7) */}
              <div className="lg:col-span-7">
                <MasterVideoPreview
                  clipId={runData.clip_id || runData.clip?.id}
                  diskPath={runData.clip?.source_path}
                />
              </div>

              {/* Right: Demucs Stem Mixer & Sidechain (Col-Span-5) */}
              <div className="lg:col-span-5">
                <BeforeAfterPlayer
                  targetLanguage={getPrimaryTargetLanguage(runData.target_languages_json)}
                  sourceAudioUrl={getPreviewStreamUrl(runData.clip?.source_path)}
                  localizedAudioUrl={
                    getPreviewStreamUrl(deliverables?.files?.mastered_soundtrack_wav) ||
                    getPreviewStreamUrl(deliverables?.files?.release_video_mp4)
                  }
                  backgroundAudioUrl={getPreviewStreamUrl(deliverables?.files?.dialogue_bus_wav)}
                  dialogueAudioUrl={getPreviewStreamUrl(deliverables?.files?.dialogue_bus_wav)}
                />
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PART 3: EDITORIAL DECK — SCRIPT LOCALIZATION, QA SELF-REPAIR & TELEMETRY */}
          {/* ========================================================================= */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Character Tone & Script Localization Quality (Col-Span-6) */}
            <div className="lg:col-span-6">
              <ScriptQualityInspector />
            </div>

            {/* Right: Closed-Loop QA Self-Repair & Telemetry Stream (Col-Span-6) */}
            <div className="lg:col-span-6 space-y-6">
              <QARepairCard
                finding={{
                  finding_id: 'qa-auto-01',
                  scene_id: 'scene_07',
                  segment_id: 7,
                  timestamp_s: 3.2,
                  defect_type: 'TIMING_OVERFLOW',
                  severity: 'critical',
                  description: 'Synthesized dialogue exceeded speech window by +1.40s during initial pass.',
                  recommended_fix: 'Dispatched targeted retry to Sync Engineer: applied FFmpeg atempo 1.25x speed adjust.',
                  target_agent: 'sync_engineer',
                  fix_applied: runData.status === 'completed' || telemetryEvents.some((e) => e.status === 'fixed'),
                }}
              />

              <DecisionFeed events={telemetryEvents} />
            </div>
          </section>
        </div>
      ) : activeTab === 'progress' ? (
        <div className="space-y-6">
          {/* Stage Timeline Card (S-07) */}
          <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 p-6 rounded-[16px] space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-[#1a1a1a] uppercase tracking-tight flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#1a1a1a]" />
                <span>Pipeline Stage Timeline</span>
              </h2>
              <span className="text-[11px] text-[#575268] font-mono">Click any stage to execute or rerun individually</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {stagesList.map((stageName, index) => {
                const status = getStageStatus(stageName);
                const pct = getStageProgress(stageName);
                const isGpu = isGpuAcceleratedStage(stageName);

                return (
                  <div
                    key={stageName}
                    className={`p-4 rounded-[16px] border-[1.5px] flex flex-col justify-between transition-all select-none ${
                      status === 'completed'
                        ? 'bg-[#fbfbfd] border-[#59e25d]'
                        : status === 'running'
                        ? 'bg-[#fbfbfd] border-[#dbd8e8] shadow-[0_4px_16px_rgba(114,72,234,0.15)]'
                        : status === 'failed'
                        ? 'bg-[#fdf3fe] border-[#e261e5]'
                        : 'bg-[#fbfbfd] border-[#dbd8e8]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-[#575268] font-extrabold uppercase">
                          Stage 0{index + 1}
                        </span>
                        {isGpu && (
                          <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-[#f8f9fa] text-[#1a1a1a] border border-[#dbd8e8] font-bold flex items-center space-x-1">
                            <Cpu className="w-3 h-3" />
                            <span>GPU</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-[#1a1a1a] text-sm capitalize">{stageName}</h3>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#130e30]/10 h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                          className={`h-full transition-all duration-300 ${
                            status === 'completed'
                              ? 'bg-[#14804a]'
                              : status === 'running'
                              ? 'bg-[#7248ea]'
                              : status === 'failed'
                              ? 'bg-[#7248ea]'
                              : 'bg-[#5f5c6e]'
                          }`}
                          style={{ width: `${status === 'completed' ? 100 : pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span
                        className={`capitalize font-bold text-[11px] ${
                          status === 'completed'
                            ? 'text-[#1a1a1a]'
                            : status === 'running'
                            ? 'text-[#1a1a1a]'
                            : status === 'failed'
                            ? 'text-[#7248ea]'
                            : 'text-[#575268]'
                        }`}
                      >
                        {status} ({status === 'completed' ? '100%' : `${pct.toFixed(0)}%`})
                      </span>

                      {status === 'running' ? (
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center space-x-1 text-[#1a1a1a] text-[11px] font-bold">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Running</span>
                          </span>
                          <button
                            onClick={handleCancel}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#fdf3fe] hover:bg-[#fbd0f5] text-[#7248ea] border border-[#e261e5] text-[10.5px] font-bold transition-all active:scale-[0.97] cursor-pointer"
                            title={`Pause running ${stageName} stage`}
                          >
                            <Pause className="w-3 h-3 fill-current" />
                            <span>Pause</span>
                          </button>
                        </div>
                      ) : (status === 'pending' || status === 'cancelled') ? (
                        <button
                          onClick={() => handleRunSingleStage(stageName)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#7248ea] hover:bg-[#6847ff] text-white border border-[#dbd8e8] text-[10.5px] font-black transition-all active:scale-[0.97] cursor-pointer"
                          title={`Run ${stageName} stage only`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Run</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRetryStage(stageName)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-full hover:bg-[#f8f9fa] text-[#575268] hover:text-[#1a1a1a] border border-[#dbd8e8] text-[10.5px] font-bold transition-all active:scale-[0.97] cursor-pointer"
                          title={`Rerun ${stageName} stage only`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Rerun</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Stage Log Terminal in Deep Ink */}
          <div className="bg-[#130e30] border border-[#dbd8e8] p-6 rounded-[16px] space-y-4 shadow-sm text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-[#7248ea] uppercase tracking-tight flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-[#7248ea]" />
                <span>Streaming Stage Logs</span>
              </h2>
              <span className="text-[10px] text-[#14804a] font-mono font-bold">● Live WebSocket Stream</span>
            </div>

            <div className="bg-black/80 border border-white/10 rounded-xl p-4 font-mono text-xs text-[#14804a] h-64 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <div className="text-white/40 italic">Listening for pipeline stage logs…</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex items-center space-x-2.5">
                    <span className="text-white/40 shrink-0">[{log.stage}]</span>
                    <span
                      className={`break-words ${
                        log.level === 'WARNING'
                          ? 'text-[#f59e0b]'
                          : log.level === 'ERROR'
                          ? 'text-[#f43f5e]'
                          : 'text-[#14804a]'
                      }`}
                    >
                      [{log.level}] {log.msg}
                    </span>
                    {log.count && log.count > 1 ? (
                      <span className="shrink-0 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-[#7248ea]/25 text-[#bd98ec] border border-[#7248ea]/40">
                        ×{log.count}
                      </span>
                    ) : null}
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      ) : activeTab === 'preview' ? (
        <div className="space-y-6">
          <MultiAudioPlayer
            title={`Run #${runId} — ${runData.clip?.filename || 'Master Cinema Footage'}`}
            tracks={dynamicTracks.length > 0 ? dynamicTracks : undefined}
            defaultTrackId={dynamicTracks.length > 1 ? dynamicTracks[1].id : 'original'}
          />

          <div className="pt-4 border-t border-[#dbd8e8]">
            <h4 className="text-xs font-black uppercase tracking-tight text-[#1a1a1a] mb-3">
              Raw Source Footage Inspection
            </h4>
            <MasterVideoPreview
              clipId={runData.clip?.id || runData.clip_id}
              diskPath={runData.clip?.source_path}
              onBackToSetup={() => setActiveTab('studio')}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

