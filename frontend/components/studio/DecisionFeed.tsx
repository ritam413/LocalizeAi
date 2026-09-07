import React from 'react';
import { TelemetryEvent } from '../../lib/telemetry';

interface DecisionFeedProps {
  events: TelemetryEvent[];
}

export const DecisionFeed: React.FC<DecisionFeedProps> = ({ events }) => {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl flex flex-col h-[420px]">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
        <h4 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Live Agent Decision & Telemetry Stream (Section 6)
        </h4>
        <span className="text-xs font-mono text-zinc-400">{events.length} Events</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 font-mono text-xs">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-400">
            Awaiting agent execution events...
          </div>
        ) : (
          events.map((e, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold uppercase text-[10px]">
                    {e.agent.replace('_', ' ')}
                  </span>
                  <span className="text-zinc-400 text-[11px]">{e.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">{e.latency_ms}ms</span>
                  {e.status === 'ok' && (
                    <span className="text-emerald-400 font-bold text-[10px] px-1 bg-emerald-950/80 rounded">
                      OK
                    </span>
                  )}
                  {e.status === 'fixed' && (
                    <span className="text-emerald-300 font-bold text-[10px] px-1 bg-emerald-950 rounded border border-emerald-600">
                      FIXED
                    </span>
                  )}
                  {e.status === 'failed' && (
                    <span className="text-red-400 font-bold text-[10px] px-1 bg-red-950/80 rounded">
                      DEFECT
                    </span>
                  )}
                </div>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11px]">{e.decision}</p>
              <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1">
                <span>Score: {e.quality_score.toFixed(1)}/100</span>
                <span>{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
