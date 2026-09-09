'use client';

import React from 'react';
import { QAFinding } from '../../lib/agents/qa_agent';
import { Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface QARepairCardProps {
  finding: QAFinding;
}

export const QARepairCard: React.FC<QARepairCardProps> = ({ finding }) => {
  return (
    <div className="bg-[#eff2e5] border-[1.5px] border-[#e261e5] rounded-[24px] p-5 shadow-sm relative overflow-hidden font-sans text-[#130e30]">
      <div className="flex items-center justify-between pb-3 border-b border-[#130e30]/10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e261e5] border border-[#130e30] animate-pulse" />
          <span className="text-[10.5px] font-mono font-black tracking-wider text-[#e261e5] uppercase bg-[#fdf3fe] px-2.5 py-0.5 rounded-full border border-[#e261e5]">
            {finding.defect_type.replace('_', ' ')}
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-[#5f5c6e]">
          Scene: {finding.scene_id} • @{finding.timestamp_s.toFixed(2)}s
        </span>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5f5c6e]">Defect Detected by QA Continuity Agent:</span>
          <p className="text-xs font-bold text-[#130e30] mt-0.5">{finding.description}</p>
        </div>

        <div className="p-3 rounded-xl bg-[#f9fbf2] border border-[#130e30]/10">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#130e30]">Remediation Strategy:</span>
          <p className="text-xs text-[#5f5c6e] mt-0.5 font-medium leading-relaxed">{finding.recommended_fix}</p>
        </div>

        <div className="pt-2 border-t border-[#130e30]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-mono text-[#5f5c6e]">
            Target Agent: <strong className="text-[#130e30] bg-[#f9fbf2] px-2 py-0.5 rounded border border-[#130e30]/10">{finding.target_agent}</strong>
          </span>
          {finding.fix_applied ? (
            <span className="text-[10.5px] font-mono px-3 py-1 rounded-full bg-[#59e25d] border border-[#130e30] text-[#130e30] font-black flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>AUTOMATED SELF-REPAIR VERIFIED</span>
            </span>
          ) : (
            <span className="text-[10.5px] font-mono px-3 py-1 rounded-full bg-[#ffe228] border border-[#130e30] text-[#130e30] font-black animate-pulse">
              TARGETED RETRY IN FLIGHT
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
