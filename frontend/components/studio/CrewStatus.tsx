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
    <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 rounded-[16px] p-6 text-[#1a1a1a] font-sans shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#dbd8e8] mb-4">
        <div>
          <h3 className="text-sm font-extrabold tracking-tight uppercase text-[#1a1a1a] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7248ea] border border-[#dbd8e8] animate-pulse" />
            Autonomous Post-Production Crew
          </h3>
          <p className="text-xs text-[#575268] mt-0.5">Google Cloud Gemini Reasoning Core</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {agentOrder.map((agent) => {
          const status = crewStatuses[agent] || 'pending';
          const retryCount = retries[agent] || 0;
          const info = AGENT_LABELS[agent];

          let statusBadge = (
            <span className="text-[9.5px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#130e30]/5 text-[#575268] uppercase">
              PENDING
            </span>
          );
          if (status === 'running') {
            statusBadge = (
              <span className="text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#7248ea] border border-[#dbd8e8] text-[#1a1a1a] animate-pulse-yellow uppercase">
                RUNNING
              </span>
            );
          } else if (status === 'retrying') {
            statusBadge = (
              <span className="text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#7248ea] text-white uppercase animate-pulse">
                RETRYING
              </span>
            );
          } else if (status === 'completed') {
            statusBadge = (
              <span className="text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#14804a] text-[#1a1a1a] uppercase">
                READY
              </span>
            );
          }

          return (
            <div
              key={agent}
              className="flex items-center justify-between p-3 rounded-xl bg-[#fbfbfd] border border-[#dbd8e8] hover:border-[#dbd8e8] transition"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] font-bold text-[#575268] bg-[#f8f9fa] px-1.5 py-0.5 rounded border border-[#dbd8e8]">
                  {info.step}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1a1a1a]">{info.title}</span>
                  <span className="text-[10.5px] text-[#575268]">{info.subtitle}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {retryCount > 0 && (
                  <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#fdf3fe] border border-[#e261e5] text-[#7248ea]">
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
