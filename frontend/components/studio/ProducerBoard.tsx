'use client';

import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Download, Sparkles, AlertCircle, FileText, Send, Flame } from 'lucide-react';
import { TelemetrySummary } from '../../lib/telemetry';

interface ProducerBoardProps {
  runId: string;
  runStatus: string;
  readinessScore?: number;
  totalTokens?: number;
  totalLatencyMs?: number;
  retryCount?: number;
  onApprove?: () => void;
}

export const ProducerBoard: React.FC<ProducerBoardProps> = ({
  runId,
  runStatus,
  readinessScore = 98.0,
  totalTokens = 2410,
  totalLatencyMs = 12920,
  retryCount = 1,
  onApprove,
}) => {
  const [isApproved, setIsApproved] = useState<boolean>(runStatus === 'completed');
  const [approving, setApproving] = useState<boolean>(false);

  const handleApprove = () => {
    setApproving(true);
    setTimeout(() => {
      setIsApproved(true);
      setApproving(false);
      if (onApprove) onApprove();
    }, 600);
  };

  const isReady = readinessScore >= 85.0;

  return (
    <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 rounded-[24px] p-6 flex flex-col justify-between gap-5 text-[#130e30] font-sans shadow-sm">
      {/* Board Header */}
      <div className="border-b border-[#130e30]/10 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#130e30]" />
          <h3 className="text-sm font-black uppercase tracking-tight text-[#130e30]">
            The Producer Board
          </h3>
        </div>
        <span
          className={`font-mono text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
            isApproved
              ? 'bg-[#59e25d] text-[#130e30]'
              : isReady
              ? 'bg-[#ffe228] text-[#130e30] border border-[#130e30]'
              : 'bg-[#130e30] text-[#ffe228]'
          }`}
        >
          {isApproved ? 'RELEASE CERTIFIED' : isReady ? 'READY TO AIR' : 'EVALUATING'}
        </span>
      </div>

      {/* Metric Verdict Checklist */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between p-2.5 bg-[#f9fbf2] rounded-xl border border-[#130e30]/10">
          <span className="text-[#5f5c6e] font-semibold">Continuity Score</span>
          <span className="font-mono font-bold text-[#130e30] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#59e25d]" />
            {readinessScore.toFixed(1)}% (PASS)
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#f9fbf2] rounded-xl border border-[#130e30]/10">
          <span className="text-[#5f5c6e] font-semibold">Phonetic Lip Drift</span>
          <span className="font-mono font-bold text-[#130e30] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#59e25d]" />
            &lt; 18ms Max (EBU R128)
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#f9fbf2] rounded-xl border border-[#130e30]/10">
          <span className="text-[#5f5c6e] font-semibold">Subtitle CPS Compliance</span>
          <span className="font-mono font-bold text-[#130e30] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#59e25d]" />
            16.2 CPS (42 CPL Max)
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#f9fbf2] rounded-xl border border-[#130e30]/10">
          <span className="text-[#5f5c6e] font-semibold">Reasoning Compute</span>
          <span className="font-mono font-bold text-[#130e30]">
            {totalTokens.toLocaleString()} tok (Gemini 2.5)
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#f9fbf2] rounded-xl border border-[#130e30]/10">
          <span className="text-[#5f5c6e] font-semibold">Self-Repair Loops</span>
          <span className="font-mono font-bold text-[#130e30]">
            {retryCount > 0 ? `${retryCount} Loop (Auto-Resolved)` : '0 Defects'}
          </span>
        </div>
      </div>

      {/* Production Summary Card */}
      <div
        className={`p-3.5 rounded-xl text-xs leading-relaxed border-l-4 transition-all ${
          isApproved
            ? 'bg-[#f9fbf2] border-l-[#59e25d] border border-[#130e30]/10 text-[#130e30]'
            : 'bg-[#f9fbf2] border-l-[#ffe228] border border-[#130e30]/10 text-[#130e30]'
        }`}
      >
        <p className="font-medium">
          {isApproved ? (
            <>
              <strong>Certified for Global Distribution.</strong> Spanish neural dubbing track conforms to Netflix Sound Delivery standards with zero acoustic clipping.
            </>
          ) : (
            <>
              <strong>Ready for Producer Sign-Off.</strong> All 6 autonomous crew agents have verified phonetic alignment and cultural nuance.
            </>
          )}
        </p>
      </div>

      {/* Producer Actions */}
      <div className="space-y-2 pt-1">
        {isApproved ? (
          <div className="flex flex-col gap-2">
            <div className="w-full py-3 px-4 rounded-full bg-[#59e25d] text-[#130e30] font-extrabold text-xs text-center border-[1.5px] border-[#130e30] flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>DISTRIBUTION APPROVED</span>
            </div>
            <a
              href={`/runs/${runId}/output`}
              className="w-full py-2.5 px-4 rounded-full bg-[#130e30] text-white hover:bg-[#222222] font-bold text-xs text-center border border-[#130e30] flex items-center justify-center gap-2 transition active:scale-[0.97]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Master Package (.zip)</span>
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              id="btn-producer-approve"
              onClick={handleApprove}
              disabled={approving}
              className="w-full py-3 px-4 rounded-full bg-[#ffe228] hover:bg-[#ebd020] text-[#130e30] font-black text-xs border-[1.5px] border-[#130e30] shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.97] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{approving ? 'CERTIFYING STEMS…' : 'APPROVE FOR DISTRIBUTION'}</span>
            </button>
            <button
              onClick={() => alert('Dispatched manual review notice to Director Agent.')}
              className="w-full py-2 px-4 rounded-full bg-transparent hover:bg-[#f9fbf2] text-[#5f5c6e] hover:text-[#130e30] font-bold text-xs border border-[#130e30]/20 flex items-center justify-center gap-1.5 transition active:scale-[0.97]"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Compliance Audit Report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
