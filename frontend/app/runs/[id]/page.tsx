'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Play, CheckCircle2, AlertCircle, RefreshCw, Terminal, Subtitles, Download, Clock, Cpu, XCircle, Sparkles, Film } from 'lucide-react';
import { CrewStatus } from '../../../components/studio/CrewStatus';
import { AgentSequenceTrack } from '../../../components/studio/AgentSequenceTrack';
import { ProducerBoard } from '../../../components/studio/ProducerBoard';
import { QARepairCard } from '../../../components/studio/QARepairCard';
import { ReadinessGauge } from '../../../components/studio/ReadinessGauge';
import { DecisionFeed } from '../../../components/studio/DecisionFeed';
import { BeforeAfterPlayer } from '../../../components/studio/BeforeAfterPlayer';
import { MasterVideoPreview } from '../../../components/studio/MasterVideoPreview';
import { MultiAudioPlayer } from '../../../components/studio/MultiAudioPlayer';
import { AccessibleErrorReport } from '../../../components/ui/AccessibleErrorReport';
import { TelemetryEvent, summarizeTelemetryEvents } from '../../../lib/telemetry';
import { AgentName } from '../../../lib/telemetry';
import { CrewMemberStatus } from '../../../lib/agents/director';

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

export default function RunDashboardPage() {
  const { id: runId } = useParams() as { id: string };
  const [runData, setRunData] = useState<RunData | null>(null);
  const [logs, setLogs] = useState<{ stage: string; level: string; msg: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'studio' | 'progress' | 'preview' | 'subtitles' | 'output'>('studio');
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
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

  const fetchHistoricalLogs = async () => {
    try {
      const res = await fetch(`/api/v1/runs/${runId}/logs`);
      if (res.ok) {
        const data: { stage_name: string; level: string; message: string; timestamp: string }[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLogs(data.map((e) => ({ stage: e.stage_name, level: e.level, msg: e.message })));
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
    fetchHistoricalLogs();
    fetchTelemetryEvents();
  }, [runId]);

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
          if (payload.type === 'run_completed') {
            setTimeout(() => {
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
          setLogs((prev) => [
            ...prev,
            { stage: payload.stage_name, level: payload.level, msg: payload.message }
          ]);
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


  const stagesList = ['extraction', 'denoise', 'transcription', 'translation'];

  if (!runData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 space-x-3">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
        <span>Loading pipeline state...</span>
      </div>
    );
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
    <div className="space-y-8 font-sans text-[#130e30]">
      {/* Header Info Banner */}
      <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 p-6 rounded-[24px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-[#130e30] uppercase tracking-tight">Run #{runId}</h1>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider border ${
                runData.status === 'completed'
                  ? 'bg-[#59e25d] text-[#130e30] border-[#130e30]'
                  : runData.status === 'running'
                  ? 'bg-[#ffe228] text-[#130e30] border-[#130e30] animate-pulse-yellow'
                  : runData.status === 'cancelling'
                  ? 'bg-[#ffe228]/50 text-[#130e30] border-[#130e30]'
                  : runData.status === 'cancelled'
                  ? 'bg-[#fdf3fe] text-[#e261e5] border-[#e261e5]'
                  : 'bg-[#130e30]/5 text-[#5f5c6e] border-[#130e30]/10'
              }`}
            >
              {runData.status === 'cancelling' ? '⏳ Cancelling…' : runData.status === 'completed' ? '✓ Master Ready' : runData.status}
            </span>
          </div>
          <p className="text-xs text-[#5f5c6e] mt-1.5 flex items-center space-x-3 font-mono font-medium flex-wrap">
            <span>Clip: {runData.clip?.filename || 'sample_movie.mp4'}</span>
            <span>•</span>
            <span>Mode: Project {runData.project_mode}</span>
            <span>•</span>
            <span>Pair: {(runData.source_language || 'es').toUpperCase()} → EN</span>
            <span>•</span>
            <span className="text-[#130e30] font-bold">
              ASR: {(() => {
                try {
                  const cfg = runData.frozen_stage_config_json ? JSON.parse(runData.frozen_stage_config_json) : {};
                  return cfg.whisper_model || cfg.asr_model || (runData.project_mode === 'A' ? 'whisper-large-v3' : 'whisper-turbo');
                } catch {
                  return 'whisper-turbo';
                }
              })()}
            </span>
          </p>
        </div>

        {/* Navigation Tabs + Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Header Action Controls */}
          {(runData.status === 'running' || runData.status === 'queued') ? (
            <button
              id="btn-cancel-run"
              onClick={handleCancel}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#fdf3fe] border border-[#e261e5] text-[#e261e5] hover:bg-[#fbdcfd] transition-all active:scale-[0.97]"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Stop Pipeline</span>
            </button>
          ) : runData.status === 'completed' ? (
            <span className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#59e25d] text-[#130e30] border border-[#130e30] shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pipeline Completed</span>
            </span>
          ) : (
            <button
              id="btn-continue-pipeline"
              onClick={handleContinuePipeline}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-black bg-[#ffe228] hover:bg-[#ebd020] text-[#130e30] border border-[#130e30] transition-all active:scale-[0.97] shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Pipeline</span>
            </button>
          )}

          <div className="flex items-center space-x-1 bg-[#f9fbf2] p-1.5 rounded-full border border-[#130e30]/15">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-[0.97] ${
                activeTab === 'studio'
                  ? 'bg-[#130e30] text-white shadow-sm'
                  : 'text-[#5f5c6e] hover:text-[#130e30]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ffe228] fill-current" />
              <span>Studio Console</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-[0.97] ${
                activeTab === 'preview'
                  ? 'bg-[#130e30] text-white shadow-sm'
                  : 'text-[#5f5c6e] hover:text-[#130e30]'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-[#59e25d]" />
              <span>Video Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-[0.97] ${
                activeTab === 'progress'
                  ? 'bg-[#130e30] text-white shadow-sm'
                  : 'text-[#5f5c6e] hover:text-[#130e30]'
              }`}
            >
              Progress &amp; Logs
            </button>
            <Link
              href={`/runs/${runId}/subtitles`}
              className="px-3 py-2 rounded-full text-xs font-bold text-[#5f5c6e] hover:text-[#130e30] transition-all flex items-center space-x-1.5 active:scale-[0.97]"
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>Subtitles</span>
            </Link>
            <Link
              href={`/runs/${runId}/output`}
              className="px-3 py-2 rounded-full text-xs font-bold text-[#5f5c6e] hover:text-[#130e30] transition-all flex items-center space-x-1.5 active:scale-[0.97]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Outputs</span>
            </Link>
          </div>
        </div>
      </div>

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
          {/* Top Serpentine Multi-Agent Workflow Track */}
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
              qa_agent: runData.status === 'completed' ? 'completed' : 'running',
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
            runStatus={runData.status}
          />

          {/* Secondary Grid: Readiness & Producer Board alongside Self-Repair and Audio Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
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
              <CrewStatus
                crewStatuses={{
                  director: runData.status === 'completed' ? 'completed' : runData.status === 'running' ? 'running' : 'ready',
                  story_analyst: telemetryEvents.some((e) => e.agent === 'story_analyst') ? 'completed' : 'pending',
                  localization_director: telemetryEvents.some((e) => e.agent === 'localization_director') ? 'completed' : 'pending',
                  voice_director: telemetryEvents.some((e) => e.agent === 'voice_director') ? 'completed' : 'pending',
                  sync_engineer: telemetryEvents.some((e) => e.agent === 'sync_engineer' && e.status === 'fixed')
                    ? 'completed'
                    : telemetryEvents.some((e) => e.agent === 'sync_engineer')
                    ? 'retrying'
                    : 'pending',
                  subtitle_director: telemetryEvents.some((e) => e.agent === 'subtitle_director') ? 'completed' : 'pending',
                  qa_agent: runData.status === 'completed' ? 'completed' : 'running',
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
              />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <ReadinessGauge
                score={
                  telemetryEvents.length > 0
                    ? telemetryEvents[telemetryEvents.length - 1].quality_score
                    : runData.status === 'completed'
                    ? 98.0
                    : 78.5
                }
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
                  fix_applied: runData.status === 'completed' || telemetryEvents.some((e) => e.status === 'fixed'),
                }}
              />

              <BeforeAfterPlayer
                targetLanguage={(() => {
                  try {
                    const parsed = JSON.parse(runData.target_languages_json || '["hi"]');
                    return Array.isArray(parsed) ? parsed[0] : 'hi';
                  } catch {
                    return 'hi';
                  }
                })()}
              />
            </div>
          </div>

          <DecisionFeed events={telemetryEvents} />
        </div>
      ) : activeTab === 'progress' ? (
        <div className="space-y-6">
          {/* Stage Timeline Card (S-07) */}
          <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 p-6 rounded-[24px] space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-[#130e30] uppercase tracking-tight flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#130e30]" />
                <span>Pipeline Stage Timeline</span>
              </h2>
              <span className="text-[11px] text-[#5f5c6e] font-mono">Click any stage to execute or rerun individually</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {stagesList.map((stageName, index) => {
                const status = getStageStatus(stageName);
                const pct = getStageProgress(stageName);
                const isGpu = stageName === 'transcription' || stageName === 'translation';

                return (
                  <div
                    key={stageName}
                    className={`p-4 rounded-[16px] border-[1.5px] flex flex-col justify-between transition-all select-none ${
                      status === 'completed'
                        ? 'bg-[#f9fbf2] border-[#59e25d]'
                        : status === 'running'
                        ? 'bg-[#f9fbf2] border-[#130e30] shadow-[0_0_0_3px_#ffe228]'
                        : status === 'failed'
                        ? 'bg-[#fdf3fe] border-[#e261e5]'
                        : 'bg-[#f9fbf2] border-[#130e30]/15'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-[#5f5c6e] font-extrabold uppercase">
                          Stage 0{index + 1}
                        </span>
                        {isGpu && (
                          <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-[#eff2e5] text-[#130e30] border border-[#130e30]/20 font-bold flex items-center space-x-1">
                            <Cpu className="w-3 h-3" />
                            <span>GPU</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-[#130e30] text-sm capitalize">{stageName}</h3>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#130e30]/10 h-1.5 rounded-full overflow-hidden mt-3">
                        <div
                          className={`h-full transition-all duration-300 ${
                            status === 'completed'
                              ? 'bg-[#59e25d]'
                              : status === 'running'
                              ? 'bg-[#ffe228]'
                              : status === 'failed'
                              ? 'bg-[#e261e5]'
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
                            ? 'text-[#130e30]'
                            : status === 'running'
                            ? 'text-[#130e30]'
                            : status === 'failed'
                            ? 'text-[#e261e5]'
                            : 'text-[#5f5c6e]'
                        }`}
                      >
                        {status} ({status === 'completed' ? '100%' : `${pct.toFixed(0)}%`})
                      </span>

                      {status === 'running' ? (
                        <span className="flex items-center space-x-1 text-[#130e30] text-[11px] font-bold">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Running</span>
                        </span>
                      ) : (status === 'pending' || status === 'cancelled') ? (
                        <button
                          onClick={() => handleRunSingleStage(stageName)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#ffe228] hover:bg-[#ebd020] text-[#130e30] border border-[#130e30] text-[10.5px] font-black transition-all active:scale-[0.97] cursor-pointer"
                          title={`Run ${stageName} stage only`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Run</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRetryStage(stageName)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-full hover:bg-[#eff2e5] text-[#5f5c6e] hover:text-[#130e30] border border-[#130e30]/20 text-[10.5px] font-bold transition-all active:scale-[0.97] cursor-pointer"
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
          <div className="bg-[#130e30] border-[1.5px] border-[#130e30] p-6 rounded-[24px] space-y-4 shadow-sm text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-[#ffe228] uppercase tracking-tight flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-[#ffe228]" />
                <span>Streaming Stage Logs</span>
              </h2>
              <span className="text-[10px] text-[#59e25d] font-mono font-bold">● Live WebSocket Stream</span>
            </div>

            <div className="bg-black/80 border border-white/10 rounded-xl p-4 font-mono text-xs text-[#59e25d] h-64 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <div className="text-white/40 italic">Listening for pipeline stage logs…</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex space-x-3">
                    <span className="text-white/40">[{log.stage}]</span>
                    <span
                      className={
                        log.level === 'WARNING'
                          ? 'text-[#ffe228]'
                          : log.level === 'ERROR'
                          ? 'text-[#e261e5]'
                          : 'text-[#59e25d]'
                      }
                    >
                      [{log.level}] {log.msg}
                    </span>
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
            defaultTrackId={(() => {
              try {
                const parsed = JSON.parse(runData.target_languages_json || '["hi"]');
                const code = Array.isArray(parsed) ? parsed[0] : 'hi';
                if (code === 'es') return 'spanish';
                if (code === 'fr') return 'french';
                return 'hindi';
              } catch {
                return 'hindi';
              }
            })()}
          />

          <div className="pt-4 border-t border-[#130e30]/10">
            <h4 className="text-xs font-black uppercase tracking-tight text-[#130e30] mb-3">
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

