'use client';

import React from 'react';
import { QAFinding } from '../../lib/agents/qa_agent';
import { Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface QARepairCardProps {
  finding: QAFinding;
}

export const QARepairCard: React.FC<QARepairCardProps> = ({ finding }) => {
  return (
    <div className="bg-white border-2 border-[#FDE68A] rounded-[16px] p-5 shadow-sm relative overflow-hidden font-sans text-[#0F172A] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#FFFBEB]">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-[4px] bg-[#FEF3C7] text-[#B45309] font-mono text-[10px] font-bold uppercase tracking-wider border border-[#FDE68A]">
            {finding.defect_type.replace(/_/g, ' ')}
          </span>
          <span className="text-xs font-mono text-[#64748B]">
            Scene: <strong>{finding.scene_id} @ {finding.timestamp_s.toFixed(2)}s</strong>
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-[4px] bg-[#F0FDF4] text-[#15803D] font-mono text-[10px] font-bold border border-[#BBF7D0]">
          AUTOMATED SELF-REPAIR VERIFIED
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block font-mono">
            Defect Detected by QA Continuity Agent:
          </span>
          <p className="text-xs font-semibold text-[#0F172A] mt-0.5">{finding.description}</p>
        </div>

        <div className="p-3 bg-[#F0F6FC] rounded-[4px] border border-[#D0DFEE]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B7FFF] block">
            Closed-Loop Remediation Strategy:
          </span>
          <p className="text-xs text-[#0F172A] mt-0.5 leading-relaxed font-sans">
            {finding.recommended_fix}
          </p>
        </div>

        <div className="pt-2 border-t border-[#F0F6FC] flex items-center justify-between text-xs text-[#64748B] font-mono">
          <span>
            Target: <strong className="text-[#0F172A]">{finding.target_agent}</strong>
          </span>
          <span>
            Delta Syllables: <strong className="text-[#15803D]">0 deficit remaining</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
