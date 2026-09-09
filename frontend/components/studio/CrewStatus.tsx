'use client';

import React from 'react';
import { AgentName } from '../../lib/telemetry';
import { CrewMemberStatus } from '../../lib/agents/director';

interface CrewStatusProps {
  crewStatuses: Record<AgentName, CrewMemberStatus>;
  retries: Record<AgentName, number>;
}

const AGENT_LABELS: Record<AgentName, { title: string; subtitle: string; step: string }> = {
  director: { title: 'Director', subtitle: 'Pipeline Orchestrator', step: '00' },
  story_analyst: { title: 'Story Analyst', subtitle: 'Demucs + Whisper Tone Extraction', step: '01' },
  localization_director: { title: 'Localization Director', subtitle: 'Cultural Adaptation & Nuance', step: '02' },
  voice_director: { title: 'Voice Director', subtitle: 'Neural Voice Casting & Synthesis', step: '03' },
  sync_engineer: { title: 'Sync Engineer', subtitle: 'Phonetic Alignment & Atempo Stretch', step: '04' },
  subtitle_director: { title: 'Subtitle Director', subtitle: 'SRT/VTT Sync & CPS Guardrails', step: '05' },
  qa_agent: { title: 'QA / Continuity', subtitle: 'Defect Detection & Auto Self-Repair', step: '06' },
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
    <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 rounded-[24px] p-6 text-[#130e30] font-sans shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#130e30]/10 mb-4">
        <div>
          <h3 className="text-sm font-extrabold tracking-tight uppercase text-[#130e30] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffe228] border border-[#130e30] animate-pulse" />
            Autonomous Post-Production Crew
          </h3>
          <p className="text-xs text-[#5f5c6e] mt-0.5">Google Cloud Gemini Reasoning Core</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {agentOrder.map((agent) => {
          const status = crewStatuses[agent] || 'pending';
          const retryCount = retries[agent] || 0;
          const info = AGENT_LABELS[agent];

          let statusBadge = (
            <span className="text-[9.5px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#130e30]/5 text-[#5f5c6e] uppercase">
              PENDING
            </span>
          );
          if (status === 'running') {
            statusBadge = (
              <span className="text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#ffe228] border border-[#130e30] text-[#130e30] animate-pulse-yellow uppercase">
                RUNNING
              </span>
            );
          } else if (status === 'retrying') {
            statusBadge = (
              <span className="text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#e261e5] text-white uppercase animate-pulse">
                RETRYING
              </span>
            );
          } else if (status === 'completed') {
            statusBadge = (
              <span className="text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#59e25d] text-[#130e30] uppercase">
                READY
              </span>
            );
          }

          return (
            <div
              key={agent}
              className="flex items-center justify-between p-3 rounded-xl bg-[#f9fbf2] border border-[#130e30]/10 hover:border-[#130e30]/30 transition"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] font-bold text-[#5f5c6e] bg-[#eff2e5] px-1.5 py-0.5 rounded border border-[#130e30]/10">
                  {info.step}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#130e30]">{info.title}</span>
                  <span className="text-[10.5px] text-[#5f5c6e]">{info.subtitle}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {retryCount > 0 && (
                  <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#fdf3fe] border border-[#e261e5] text-[#e261e5]">
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
