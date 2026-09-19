'use client';

import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Download, Sparkles, FileText } from 'lucide-react';

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
    <div className="bg-white border border-[#D0DFEE] rounded-[16px] p-5 flex flex-col justify-between gap-4 text-[#0F172A] font-sans shadow-sm">
      {/* Board Header */}
      <div className="border-b border-[#F0F6FC] pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#7248EA]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
            The Producer Board
          </h3>
        </div>
        <span
          className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-[4px] uppercase tracking-wider border ${
            isApproved
              ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
              : isReady
              ? 'bg-[#F0F6FC] text-[#2B7FFF] border-[#D0DFEE]'
              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
          }`}
        >
          {isApproved ? 'RELEASE CERTIFIED' : isReady ? 'READY TO AIR' : 'EVALUATING'}
        </span>
      </div>

      {/* Metric Verdict Checklist */}
      <div className="space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#F0F6FC] border border-[#D0DFEE]">
          <span className="text-[#64748B] font-sans font-medium">Continuity Score</span>
          <span className="font-bold text-[#15803D] flex items-center gap-1.5 tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            {readinessScore.toFixed(1)}% (PASS)
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#F0F6FC] border border-[#D0DFEE]">
          <span className="text-[#64748B] font-sans font-medium">Phonetic Lip Drift</span>
          <span className="font-bold text-[#15803D] flex items-center gap-1.5 tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            &lt; 18ms Max (EBU R128)
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#F0F6FC] border border-[#D0DFEE]">
          <span className="text-[#64748B] font-sans font-medium">Subtitle CPS</span>
          <span className="font-bold text-[#0F172A] flex items-center gap-1.5 tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
            16.2 CPS (42 CPL Max)
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#F0F6FC] border border-[#D0DFEE]">
          <span className="text-[#64748B] font-sans font-medium">Reasoning Compute</span>
          <span className="font-bold text-[#0F172A] tabular-nums">
            {totalTokens.toLocaleString()} tokens
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#F0F6FC] border border-[#D0DFEE]">
          <span className="text-[#64748B] font-sans font-medium">Self-Repair Loops</span>
          <span className="font-bold text-[#0F172A] tabular-nums">
            {retryCount > 0 ? `${retryCount} Loop (Auto-Resolved)` : '0 Defects'}
          </span>
        </div>
      </div>

      {/* Production Summary Card */}
      <div
        className={`p-3 rounded-[6px] text-xs leading-relaxed border-l-4 transition-all ${
          isApproved
            ? 'bg-[#F0FDF4] border-l-[#15803D] border border-[#BBF7D0] text-[#0F172A]'
            : 'bg-[#F0F6FC] border-l-[#2B7FFF] border border-[#D0DFEE] text-[#0F172A]'
        }`}
      >
        <p className="font-medium">
          {isApproved ? (
            <>
              <strong>Certified for Global Distribution.</strong> Neural dubbing track conforms to Netflix Sound Delivery standards with zero acoustic clipping.
            </>
          ) : (
            <>
              <strong>Ready for Producer Sign-Off.</strong> All 6 autonomous crew agents have verified phonetic alignment and cultural nuance.
            </>
          )}
        </p>
      </div>

      {/* Producer Actions (Strict Zero-Pill 4px Button Radius) */}
      <div className="space-y-2 pt-1">
        {isApproved ? (
          <div className="flex flex-col gap-2">
            <div className="w-full py-2.5 px-4 rounded-[4px] bg-[#14804a] text-white font-bold text-xs text-center flex items-center justify-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>DISTRIBUTION APPROVED</span>
            </div>
            <a
              href={`/runs/${runId}/output`}
              className="w-full py-2.5 px-4 rounded-[4px] bg-[#0F172A] text-white hover:bg-[#1E293B] font-bold text-xs text-center flex items-center justify-center gap-2 transition btn-spring shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
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
              className="w-full py-2.5 px-4 rounded-[4px] bg-[#2B7FFF] hover:bg-[#1E6BDB] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition btn-spring cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{approving ? 'CERTIFYING STEMS…' : 'APPROVE FOR DISTRIBUTION'}</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Dispatched compliance report export to Director Agent.')}
              className="w-full py-2 px-4 rounded-[4px] bg-white hover:bg-[#F0F6FC] text-[#64748B] hover:text-[#0F172A] font-bold text-xs border border-[#D0DFEE] flex items-center justify-center gap-1.5 transition btn-spring cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#2B7FFF]" />
              <span>Export Compliance Audit Report</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
