'use client';

import React from 'react';
import { TelemetryEvent } from '../../lib/telemetry';
import { Activity, Terminal } from 'lucide-react';

interface DecisionFeedProps {
  events: TelemetryEvent[];
}

export const DecisionFeed: React.FC<DecisionFeedProps> = ({ events }) => {
  return (
    <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 rounded-[24px] p-6 shadow-sm flex flex-col h-[420px] font-sans text-[#130e30]">
      <div className="flex items-center justify-between pb-3 border-b border-[#130e30]/10 mb-3">
        <h4 className="text-xs font-extrabold tracking-tight text-[#130e30] uppercase flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#130e30]" />
          <span>Live Agent Decision &amp; Telemetry Stream (Section 6)</span>
        </h4>
        <span className="text-[10px] font-mono font-bold text-[#5f5c6e] bg-[#f9fbf2] px-2 py-0.5 rounded border border-[#130e30]/10">
          {events.length} Events Logged
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 font-mono text-xs">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#5f5c6e] italic">
            Awaiting autonomous agent telemetry events…
          </div>
        ) : (
          events.map((e, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#f9fbf2] border border-[#130e30]/10 hover:border-[#130e30]/30 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#eff2e5] text-[#130e30] border border-[#130e30]/20 font-extrabold uppercase text-[9.5px]">
                    {e.agent.replace('_', ' ')}
                  </span>
                  <span className="text-[#5f5c6e] text-[11px] font-sans font-bold">{e.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#5f5c6e] tabular-nums font-bold">{e.latency_ms}ms</span>
                  {e.status === 'ok' && (
                    <span className="text-[#130e30] font-extrabold text-[9.5px] px-2 py-0.5 bg-[#59e25d] rounded-full border border-[#130e30]">
                      OK
                    </span>
                  )}
                  {e.status === 'fixed' && (
                    <span className="text-[#130e30] font-extrabold text-[9.5px] px-2 py-0.5 bg-[#59e25d] rounded-full border border-[#130e30]">
                      FIXED
                    </span>
                  )}
                  {e.status === 'failed' && (
                    <span className="text-[#130e30] font-extrabold text-[9.5px] px-2 py-0.5 bg-[#fdf3fe] text-[#e261e5] rounded-full border border-[#e261e5]">
                      DEFECT
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[#130e30] font-sans text-xs leading-relaxed font-medium">{e.decision}</p>
              <div className="text-[10px] text-[#5f5c6e] flex items-center justify-between pt-1 border-t border-[#130e30]/5">
                <span>Score: <strong className="text-[#130e30]">{e.quality_score.toFixed(1)}/100</strong></span>
                <span>{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
