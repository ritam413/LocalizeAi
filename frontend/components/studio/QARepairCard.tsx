import React from 'react';
import { QAFinding } from '../../lib/agents/qa_agent';

interface QARepairCardProps {
  finding: QAFinding;
}

export const QARepairCard: React.FC<QARepairCardProps> = ({ finding }) => {
  return (
    <div className="bg-zinc-950 border border-red-900/40 rounded-xl p-5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl -z-0 pointer-events-none" />

      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-red-400 uppercase">
            {finding.defect_type.replace('_', ' ')}
          </span>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          Scene: {finding.scene_id} • @{finding.timestamp_s.toFixed(2)}s
        </span>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <span className="text-xs font-medium text-zinc-400">Defect Detected by QA Agent:</span>
          <p className="text-sm text-zinc-200 mt-0.5">{finding.description}</p>
        </div>

        <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs font-medium text-amber-400">Remediation Strategy:</span>
          <p className="text-xs text-zinc-300 mt-0.5">{finding.recommended_fix}</p>
        </div>

        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400">
            Target Agent: <strong className="text-zinc-200">{finding.target_agent}</strong>
          </span>
          {finding.fix_applied ? (
            <span className="text-xs font-mono px-2 py-1 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              AUTOMATED SELF-REPAIR VERIFIED
            </span>
          ) : (
            <span className="text-xs font-mono px-2 py-1 rounded bg-amber-950 border border-amber-600 text-amber-300 animate-pulse">
              TARGETED RETRY IN FLIGHT
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
