'use client';

import React from 'react';
import { QAFinding } from '../../lib/agents/qa_agent';
import { Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface QARepairCardProps {
  finding: QAFinding;
}

export const QARepairCard: React.FC<QARepairCardProps> = ({ finding }) => {
  return (
    <div className="bg-white border border-[#f59e0b] rounded-2xl p-5 shadow-xs relative overflow-hidden font-sans text-[#1a1a1a]">
      <div className="flex items-center justify-between pb-3 border-b border-[#f2f0f8]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] animate-pulse" />
          <span className="text-[10.5px] font-mono font-bold tracking-wider text-[#b45309] uppercase bg-[#fffbeb] px-2.5 py-0.5 rounded-full border border-[#fde68a]">
            {finding.defect_type.replace(/_/g, ' ')}
          </span>
        </div>
        <span className="text-xs font-mono font-medium text-[#575268]">
          Scene: {finding.scene_id} • @{finding.timestamp_s.toFixed(2)}s
        </span>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#575268]">
            Defect Detected by QA Continuity Agent:
          </span>
          <p className="text-xs font-bold text-[#1a1a1a] mt-0.5">{finding.description}</p>
        </div>

        <div className="p-3 rounded-xl bg-[#fbfbfd] border border-[#dbd8e8]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a]">
            Remediation Strategy:
          </span>
          <p className="text-xs text-[#575268] mt-0.5 font-medium leading-relaxed">
            {finding.recommended_fix}
          </p>
        </div>

        <div className="pt-2 border-t border-[#f2f0f8] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-mono text-[#575268]">
            Target Agent:{' '}
            <strong className="text-[#1a1a1a] bg-[#f8f9fa] px-2 py-0.5 rounded border border-[#dbd8e8]">
              {finding.target_agent}
            </strong>
          </span>
          {finding.fix_applied ? (
            <span className="text-[10.5px] font-mono px-3 py-1 rounded-full bg-[#f0f9eb] border border-[#c2e7b0] text-[#14804a] font-bold flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>AUTOMATED SELF-REPAIR VERIFIED</span>
            </span>
          ) : (
            <span className="text-[10.5px] font-mono px-3 py-1 rounded-full bg-[#f2eeff] border border-[#bd98ec] text-[#7248ea] font-bold animate-pulse">
              TARGETED RETRY IN FLIGHT
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
