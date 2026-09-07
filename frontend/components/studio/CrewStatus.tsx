import React from 'react';
import { AgentName } from '../../lib/telemetry';
import { CrewMemberStatus } from '../../lib/agents/director';

interface CrewStatusProps {
  crewStatuses: Record<AgentName, CrewMemberStatus>;
  retries: Record<AgentName, number>;
}

const AGENT_LABELS: Record<AgentName, { title: string; subtitle: string }> = {
  director: { title: 'Director', subtitle: 'Pipeline Orchestrator' },
  story_analyst: { title: 'Story Analyst', subtitle: 'Narrative & Tone' },
  localization_director: { title: 'Localization Director', subtitle: 'Cultural Adaptation' },
  voice_director: { title: 'Voice Director', subtitle: 'Voice Cast & TTS' },
  sync_engineer: { title: 'Sync Engineer', subtitle: 'Timing Reconciliation' },
  subtitle_director: { title: 'Subtitle Director', subtitle: 'SRT/VTT Sync' },
  qa_agent: { title: 'QA / Continuity', subtitle: 'Defect Detection & Fixes' },
};

export const CrewStatus: React.FC<CrewStatusProps> = ({ crewStatuses, retries }) => {
  const agentOrder: AgentName[] = [
    'director',
    'story_analyst',
    'localization_director',
    'voice_director',
    'sync_engineer',
    'subtitle_director',
    'qa_agent',
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-zinc-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Autonomous Post-Production Crew
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">Google Cloud Gemini Reasoning + Observability</p>
        </div>
      </div>

      <div className="space-y-3">
        {agentOrder.map((agent) => {
          const status = crewStatuses[agent] || 'pending';
          const retryCount = retries[agent] || 0;
          const info = AGENT_LABELS[agent];

          let statusBadge = (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">PENDING</span>
          );
          if (status === 'running') {
            statusBadge = (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 animate-pulse">
                RUNNING
              </span>
            );
          } else if (status === 'retrying') {
            statusBadge = (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-950/80 border border-orange-500/40 text-orange-300 animate-pulse">
                RETRYING
              </span>
            );
          } else if (status === 'completed') {
            statusBadge = (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                COMPLETED
              </span>
            );
          }

          return (
            <div
              key={agent}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-200">{info.title}</span>
                <span className="text-xs text-zinc-400">{info.subtitle}</span>
              </div>
              <div className="flex items-center gap-2">
                {retryCount > 0 && (
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-red-950 border border-red-800 text-red-300">
                    Retry #{retryCount}
                  </span>
                )}
                {statusBadge}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
