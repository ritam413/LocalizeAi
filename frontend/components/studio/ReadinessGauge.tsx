'use client';

import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ReadinessGaugeProps {
  score: number;
  threshold?: number;
}

export const ReadinessGauge: React.FC<ReadinessGaugeProps> = ({ score, threshold = 85.0 }) => {
  const isReady = score >= threshold;

  return (
    <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 rounded-[24px] p-5 shadow-sm flex items-center justify-between font-sans text-[#130e30]">
      <div>
        <h4 className="text-[10px] font-extrabold tracking-wider text-[#5f5c6e] uppercase">
          QA Release-Readiness Continuity Score
        </h4>
        <div className="flex items-baseline gap-2 mt-1">
          <span
            className="text-3xl font-mono font-black tabular-nums text-[#130e30]"
          >
            {score.toFixed(1)}%
          </span>
          <span className="text-xs text-[#5f5c6e] font-mono font-bold">/ threshold {threshold.toFixed(0)}%</span>
        </div>
      </div>

      <div>
        {isReady ? (
          <div className="px-3.5 py-2 rounded-full bg-[#59e25d] border-[1.5px] border-[#130e30] text-[#130e30] text-xs font-mono font-black tracking-wide flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#130e30]" />
            <span>RELEASE READY</span>
          </div>
        ) : (
          <div className="px-3.5 py-2 rounded-full bg-[#ffe228] border-[1.5px] border-[#130e30] text-[#130e30] text-xs font-mono font-black tracking-wide flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#130e30] animate-pulse" />
            <span>REWORK IN FLIGHT</span>
          </div>
        )}
      </div>
    </div>
  );
};
