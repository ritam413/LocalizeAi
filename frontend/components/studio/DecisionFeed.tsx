'use client';

import React from 'react';
import { TelemetryEvent } from '../../lib/telemetry';
import { Activity, Terminal } from 'lucide-react';

interface DecisionFeedProps {
  events: TelemetryEvent[];
}

export const DecisionFeed: React.FC<DecisionFeedProps> = ({ events }) => {
  return (
    <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 rounded-[16px] p-6 shadow-sm flex flex-col h-[420px] font-sans text-[#1a1a1a]">
      <div className="flex items-center justify-between pb-3 border-b border-[#dbd8e8] mb-3">
        <h4 className="text-xs font-extrabold tracking-tight text-[#1a1a1a] uppercase flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#1a1a1a]" />
          <span>Live Agent Decision &amp; Telemetry Stream (Section 6)</span>
        </h4>
        <span className="text-[10px] font-mono font-bold text-[#575268] bg-[#fbfbfd] px-2 py-0.5 rounded border border-[#dbd8e8]">
          {events.length} Events Logged
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 font-mono text-xs">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#575268] italic">
            Awaiting autonomous agent telemetry events…
          </div>
        ) : (
          events.map((e, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#fbfbfd] border border-[#dbd8e8] hover:border-[#dbd8e8] transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#f8f9fa] text-[#1a1a1a] border border-[#dbd8e8] font-extrabold uppercase text-[9.5px]">
                    {e.agent.replace('_', ' ')}
                  </span>
                  <span className="text-[#575268] text-[11px] font-sans font-bold">{e.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#575268] tabular-nums font-bold">{e.latency_ms}ms</span>
                  {e.status === 'ok' && (
                    <span className="text-[#1a1a1a] font-extrabold text-[9.5px] px-2 py-0.5 bg-[#14804a] rounded-full border border-[#dbd8e8]">
                      OK
                    </span>
                  )}
                  {e.status === 'fixed' && (
                    <span className="text-[#1a1a1a] font-extrabold text-[9.5px] px-2 py-0.5 bg-[#14804a] rounded-full border border-[#dbd8e8]">
                      FIXED
                    </span>
                  )}
                  {e.status === 'failed' && (
                    <span className="text-[#1a1a1a] font-extrabold text-[9.5px] px-2 py-0.5 bg-[#fdf3fe] text-[#7248ea] rounded-full border border-[#e261e5]">
                      DEFECT
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[#1a1a1a] font-sans text-xs leading-relaxed font-medium">{e.decision}</p>
              <div className="text-[10px] text-[#575268] flex items-center justify-between pt-1 border-t border-[#dbd8e8]/5">
                <span>Score: <strong className="text-[#1a1a1a]">{e.quality_score.toFixed(1)}/100</strong></span>
                <span>{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
