import React from 'react';

interface ReadinessGaugeProps {
  score: number;
  threshold?: number;
}

export const ReadinessGauge: React.FC<ReadinessGaugeProps> = ({ score, threshold = 85.0 }) => {
  const isReady = score >= threshold;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl flex items-center justify-between">
      <div>
        <h4 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
          QA Release-Readiness Score
        </h4>
        <div className="flex items-baseline gap-2 mt-1">
          <span
            className={`text-3xl font-mono font-extrabold ${
              isReady ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {score.toFixed(1)}%
          </span>
          <span className="text-xs text-zinc-400 font-mono">/ threshold {threshold.toFixed(0)}%</span>
        </div>
      </div>

      <div>
        {isReady ? (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            RELEASE READY
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs font-mono font-bold tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            REWORK REQUIRED
          </div>
        )}
      </div>
    </div>
  );
};
