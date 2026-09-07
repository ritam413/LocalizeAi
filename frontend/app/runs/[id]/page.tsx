'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Play, CheckCircle2, AlertCircle, RefreshCw, Terminal, Subtitles, Download, Clock, Cpu, XCircle, Sparkles } from 'lucide-react';
import { CrewStatus } from '../../../components/studio/CrewStatus';
import { QARepairCard } from '../../../components/studio/QARepairCard';
import { ReadinessGauge } from '../../../components/studio/ReadinessGauge';
import { DecisionFeed } from '../../../components/studio/DecisionFeed';
import { BeforeAfterPlayer } from '../../../components/studio/BeforeAfterPlayer';
import { TelemetryEvent } from '../../../lib/telemetry';
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
  clip?: {
    filename: string;
    duration_s: number;
  };
}

export default function RunDashboardPage() {
  const { id: runId } = useParams() as { id: string };
  const [runData, setRunData] = useState<RunData | null>(null);
  const [logs, setLogs] = useState<{ stage: string; level: string; msg: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'studio' | 'progress' | 'subtitles' | 'output'>('studio');
  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryEvent[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchRunDetails = async () => {
    try {
      const res = await fetch(`/api/v1/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setRunData(data);
      }
    } catch (err) {
      console.error('Failed to fetch run details:', err);
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

  // WebSocket Subscription for Live Progress & Logs
  useEffect(() => {
    if (!runId) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/runs/${runId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'stage_status_changed' || payload.type === 'run_completed' || payload.type === 'run_cancelled' || payload.type === 'run_cancelling') {
          fetchRunDetails();
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
      await fetch(`/api/v1/runs/${runId}/stages/${stageName}/run`, { method: 'POST' });
      fetchRunDetails();
    } catch (err) {
      console.error('Failed to run single stage:', err);
    }
  };

  const handleRetryStage = async (stageName: string) => {
    try {
      await fetch(`/api/v1/runs/${runId}/stages/${stageName}/retry`, { method: 'POST' });
      fetchRunDetails();
    } catch (err) {
      console.error('Failed to retry stage:', err);
    }
  };

  const handleContinuePipeline = async () => {
    try {
      await fetch(`/api/v1/runs/${runId}/resume`, { method: 'POST' });
      fetchRunDetails();
    } catch (err) {
      console.error('Failed to continue pipeline:', err);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Stop this pipeline after the current stage finishes?')) return;
    try {
      const res = await fetch(`/api/v1/runs/${runId}/cancel`, { method: 'POST' });
      if (res.ok) {
        fetchRunDetails();
      } else {
        const err = await res.json();
        alert(`Could not cancel: ${err.detail}`);
      }
    } catch (err) {
      console.error('Failed to cancel run:', err);
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
    <div className="space-y-8">
      {/* Header Info Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white">Run #{runId}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                runData.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : runData.status === 'running'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse'
                  : runData.status === 'cancelling'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                  : runData.status === 'cancelled'
                  ? 'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {runData.status === 'cancelling' ? '⏳ Cancelling…' : runData.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 flex items-center space-x-3 font-mono flex-wrap">
            <span>Clip: {runData.clip?.filename || 'sample_movie.mp4'}</span>
            <span>•</span>
            <span>Mode: Project {runData.project_mode}</span>
            <span>•</span>
            <span>Pair: {(runData.source_language || 'es').toUpperCase()} → EN</span>
            <span>•</span>
            <span className="text-indigo-400 font-semibold">
              ASR: {(() => {
                try {
                  const cfg = runData.frozen_stage_config_json ? JSON.parse(runData.frozen_stage_config_json) : {};
                  return cfg.whisper_model || cfg.asr_model || (runData.project_mode === 'A' ? 'whisper-large-v3' : 'whisper-large-v3-turbo');
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
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-rose-900/30 border border-rose-500/40 text-rose-400 hover:bg-rose-800/50 hover:text-rose-300 transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Stop Pipeline</span>
            </button>
          ) : runData.status === 'completed' ? (
            <span className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pipeline Completed</span>
            </span>
          ) : (
            <button
              id="btn-continue-pipeline"
              onClick={handleContinuePipeline}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all shadow-glow"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Pipeline</span>
            </button>
          )}

          <div className="flex items-center space-x-2 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'studio'
                  ? 'bg-emerald-600 text-white shadow-glow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio Console (Crew)</span>
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'progress'
                  ? 'bg-indigo-600 text-white shadow-glow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Progress &amp; Logs
            </button>
            <Link
              href={`/runs/${runId}/subtitles`}
              className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all flex items-center space-x-1.5"
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>Subtitle Review (S-11)</span>
            </Link>
            <Link
              href={`/runs/${runId}/output`}
              className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Outputs (S-12)</span>
            </Link>
          </div>
        </div>
      </div>

      {activeTab === 'studio' ? (
        <div className="space-y-6">
          <ReadinessGauge
            score={
              telemetryEvents.length > 0
                ? telemetryEvents[telemetryEvents.length - 1].quality_score
                : runData.status === 'completed'
                ? 95.0
                : 78.5
            }
            threshold={85.0}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <div className="space-y-6">
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
      ) : (
        <div className="space-y-6">
          {/* Stage Timeline Card (S-07) */}
          <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Pipeline Stage Timeline</span>
          </h2>
          <span className="text-xs text-gray-400">Click any stage to execute or rerun individually</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stagesList.map((stageName, index) => {
            const status = getStageStatus(stageName);
            const pct = getStageProgress(stageName);
            const isGpu = stageName === 'transcription' || stageName === 'translation';

            return (
              <div
                key={stageName}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  status === 'completed'
                    ? 'bg-emerald-950/10 border-emerald-500/30'
                    : status === 'running'
                    ? 'bg-indigo-950/20 border-indigo-500 shadow-glow'
                    : status === 'failed'
                    ? 'bg-rose-950/20 border-rose-500'
                    : 'bg-gray-900/50 border-gray-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-gray-400 uppercase">
                      Stage 0{index + 1}
                    </span>
                    {isGpu && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center space-x-1">
                        <Cpu className="w-3 h-3" />
                        <span>GPU</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-sm capitalize">{stageName}</h3>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full transition-all duration-300 ${
                        status === 'completed'
                          ? 'bg-emerald-400'
                          : status === 'running'
                          ? 'bg-indigo-500'
                          : status === 'failed'
                          ? 'bg-rose-500'
                          : 'bg-gray-700'
                      }`}
                      style={{ width: `${status === 'completed' ? 100 : pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span
                    className={`capitalize font-medium ${
                      status === 'completed'
                        ? 'text-emerald-400'
                        : status === 'running'
                        ? 'text-indigo-400'
                        : status === 'failed'
                        ? 'text-rose-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {status} ({status === 'completed' ? '100%' : `${pct.toFixed(0)}%`})
                  </span>

                  {status === 'running' ? (
                    <span className="flex items-center space-x-1 text-indigo-400 animate-pulse text-[11px]">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Running</span>
                    </span>
                  ) : (status === 'pending' || status === 'cancelled') ? (
                    <button
                      onClick={() => handleRunSingleStage(stageName)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-medium transition-all"
                      title={`Run ${stageName} stage only`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Run</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRetryStage(stageName)}
                      className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-700/50 text-[11px] font-medium transition-all"
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

      {/* Real-time Stage Log Terminal */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Streaming Stage Logs</span>
          </h2>
          <span className="text-xs text-gray-500 font-mono">Live WebSocket Feed</span>
        </div>

        <div className="bg-black/90 border border-gray-800 rounded-xl p-4 font-mono text-xs text-green-400 h-64 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <div className="text-gray-600 italic">Listening for pipeline stage logs...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex space-x-3">
                <span className="text-gray-500">[{log.stage}]</span>
                <span
                  className={
                    log.level === 'WARNING'
                      ? 'text-amber-400'
                      : log.level === 'ERROR'
                      ? 'text-rose-400'
                      : 'text-green-400'
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
  )}
</div>
  );
}
