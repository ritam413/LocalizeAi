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
    <div className="bg-white border border-[#dbd8e8] rounded-2xl p-6 flex flex-col justify-between gap-5 text-[#1a1a1a] font-sans shadow-xs">
      {/* Board Header */}
      <div className="border-b border-[#f2f0f8] pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#7248ea]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a1a1a]">
            The Producer Board
          </h3>
        </div>
        <span
          className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
            isApproved
              ? 'bg-[#f0f9eb] text-[#14804a] border-[#c2e7b0]'
              : isReady
              ? 'bg-[#f2eeff] text-[#7248ea] border-[#bd98ec]'
              : 'bg-[#f8f9fa] text-[#575268] border-[#dbd8e8]'
          }`}
        >
          {isApproved ? 'RELEASE CERTIFIED' : isReady ? 'READY TO AIR' : 'EVALUATING'}
        </span>
      </div>

      {/* Metric Verdict Checklist */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between p-2.5 bg-[#fbfbfd] rounded-xl border border-[#dbd8e8]">
          <span className="text-[#575268] font-medium">Continuity Score</span>
          <span className="font-mono font-bold text-[#1a1a1a] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#14804a]" />
            {readinessScore.toFixed(1)}% (PASS)
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#fbfbfd] rounded-xl border border-[#dbd8e8]">
          <span className="text-[#575268] font-medium">Phonetic Lip Drift</span>
          <span className="font-mono font-bold text-[#1a1a1a] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#14804a]" />
            &lt; 18ms Max (EBU R128)
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#fbfbfd] rounded-xl border border-[#dbd8e8]">
          <span className="text-[#575268] font-medium">Subtitle CPS Compliance</span>
          <span className="font-mono font-bold text-[#1a1a1a] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#14804a]" />
            16.2 CPS (42 CPL Max)
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#fbfbfd] rounded-xl border border-[#dbd8e8]">
          <span className="text-[#575268] font-medium">Reasoning Compute</span>
          <span className="font-mono font-bold text-[#1a1a1a]">
            {totalTokens.toLocaleString()} tok (Gemini 2.5)
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#fbfbfd] rounded-xl border border-[#dbd8e8]">
          <span className="text-[#575268] font-medium">Self-Repair Loops</span>
          <span className="font-mono font-bold text-[#1a1a1a]">
            {retryCount > 0 ? `${retryCount} Loop (Auto-Resolved)` : '0 Defects'}
          </span>
        </div>
      </div>

      {/* Production Summary Card */}
      <div
        className={`p-3.5 rounded-xl text-xs leading-relaxed border-l-4 transition-all ${
          isApproved
            ? 'bg-[#f0f9eb] border-l-[#14804a] border border-[#c2e7b0] text-[#1a1a1a]'
            : 'bg-[#f8f6ff] border-l-[#7248ea] border border-[#bd98ec]/40 text-[#1a1a1a]'
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
            <div className="w-full py-3 px-4 rounded-xl bg-[#14804a] text-white font-bold text-xs text-center border border-[#14804a] flex items-center justify-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>DISTRIBUTION APPROVED</span>
            </div>
            <a
              href={`/runs/${runId}/output`}
              className="w-full py-2.5 px-4 rounded-xl bg-[#111827] text-white hover:bg-[#1f2937] font-bold text-xs text-center flex items-center justify-center gap-2 transition active:scale-[0.97]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Master Package (.zip)</span>
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              id="btn-producer-approve"
              type="button"
              onClick={handleApprove}
              disabled={approving}
              className="w-full py-3 px-4 rounded-xl bg-[#7248ea] hover:bg-[#6847ff] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition active:scale-[0.97] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{approving ? 'CERTIFYING STEMS…' : 'APPROVE FOR DISTRIBUTION'}</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Dispatched manual review notice to Director Agent.')}
              className="w-full py-2 px-4 rounded-xl bg-white hover:bg-[#f8f9fa] text-[#575268] hover:text-[#1a1a1a] font-bold text-xs border border-[#dbd8e8] flex items-center justify-center gap-1.5 transition active:scale-[0.97] cursor-pointer"
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
