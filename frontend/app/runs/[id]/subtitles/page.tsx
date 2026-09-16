'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Subtitles, AlertTriangle, CheckCircle, Save, ArrowLeft, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { SubtitleEditorSkeleton } from '../../../../components/ui/skeleton';

interface Segment {
  id: string;
  start_s: number;
  end_s: number;
  source_text: string;
  translated_text: string;
  cps?: number;
  edited?: boolean;
}

interface Violation {
  segment_id: string;
  type: string;
  message: string;
}

export default function SubtitleReviewPage() {
  const { id: runId } = useParams() as { id: string };
  const [segments, setSegments] = useState<Segment[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const segRes = await fetch(`/api/v1/runs/${runId}/segments`);
      if (segRes.ok) {
        const segData = await segRes.json();
        setSegments(segData);
      }

      const valRes = await fetch(`/api/v1/runs/${runId}/subtitles/validate`, { method: 'POST' });
      if (valRes.ok) {
        const valData = await valRes.json();
        setViolations(valData.violations || []);
      }
    } catch (err) {
      console.error('Failed to load subtitle data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [runId]);

  const handleTextChange = (segId: string, text: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segId ? { ...s, translated_text: text } : s))
    );
  };

  const handleTimingChange = (segId: string, field: 'start_s' | 'end_s', val: number) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segId ? { ...s, [field]: val } : s))
    );
  };

  const handleSaveSegment = async (segment: Segment) => {
    setSavingId(segment.id);
    try {
      await fetch(`/api/v1/runs/${runId}/segments/${segment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translated_text: segment.translated_text,
          start_s: segment.start_s,
          end_s: segment.end_s,
        }),
      });
      await loadData();
    } catch (err) {
      console.error('Failed to save segment:', err);
    } finally {
      setSavingId(null);
    }
  };

  const getSegmentViolations = (segId: string) => {
    return violations.filter((v) => v.segment_id === segId);
  };

  if (loading) {
    return <SubtitleEditorSkeleton rows={5} />;
  }

  return (
    <div className="space-y-8 max-w-6xl font-sans text-[#1a1a1a]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dbd8e8] pb-6">
        <div>
          <Link
            href={`/runs/${runId}`}
            className="text-xs font-mono font-bold text-[#1a1a1a] hover:underline flex items-center space-x-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Run Studio Dashboard</span>
          </Link>
          <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight uppercase flex items-center space-x-3">
            <Subtitles className="w-7 h-7 text-[#1a1a1a]" />
            <span>Subtitle Review &amp; QA Editor</span>
          </h1>
        </div>

        {/* Overall QA Status Badge */}
        <div
          className={`px-4 py-2 rounded-full border border-[#dbd8e8] text-xs font-black uppercase tracking-wider flex items-center space-x-2 ${
            violations.length === 0
              ? 'bg-[#14804a] text-[#1a1a1a]'
              : 'bg-[#f2eeff] text-[#7248ea]'
          }`}
        >
          {violations.length === 0 ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>QA Validated — Zero Drift</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>{violations.length} CPS Violations Flagged</span>
            </>
          )}
        </div>
      </div>

      {/* Subtitle Line Table */}
      <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 rounded-[16px] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-[#1a1a1a]">
          <thead className="bg-[#f8f9fa] text-[10px] font-extrabold text-[#575268] uppercase tracking-wider border-b border-[#dbd8e8]">
            <tr>
              <th className="px-4 py-4 w-16">#</th>
              <th className="px-4 py-4 w-44">Dialogue Window</th>
              <th className="px-4 py-4">Source &amp; Translated Subtitle</th>
              <th className="px-4 py-4 w-28">Reading CPS</th>
              <th className="px-4 py-4 w-48">QA Status</th>
              <th className="px-4 py-4 w-20 text-center">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#130e30]/8 bg-[#fbfbfd]">
            {segments.map((seg, index) => {
              const segViolations = getSegmentViolations(seg.id);
              const duration = max(0.1, seg.end_s - seg.start_s);
              const text = seg.translated_text || seg.source_text || '';
              const cps = seg.cps || round(text.length / duration, 1);

              return (
                <tr key={seg.id} className="hover:bg-[#f8f9fa]/60 transition-colors">
                  <td className="px-4 py-4 text-xs font-mono font-bold text-[#575268]">{index + 1}</td>

                  {/* Timing Controls */}
                  <td className="px-4 py-4 space-y-1">
                    <div className="flex items-center space-x-1 text-xs">
                      <input
                        type="number"
                        step="0.1"
                        value={seg.start_s}
                        onChange={(e) =>
                          handleTimingChange(seg.id, 'start_s', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 bg-[#f8f9fa] border border-[#dbd8e8] rounded-md px-1.5 py-1 text-xs font-mono font-bold text-[#1a1a1a] text-center"
                      />
                      <span className="text-[#575268] font-bold">→</span>
                      <input
                        type="number"
                        step="0.1"
                        value={seg.end_s}
                        onChange={(e) =>
                          handleTimingChange(seg.id, 'end_s', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 bg-[#f8f9fa] border border-[#dbd8e8] rounded-md px-1.5 py-1 text-xs font-mono font-bold text-[#1a1a1a] text-center"
                      />
                    </div>
                  </td>

                  {/* Subtitle Text Input */}
                  <td className="px-4 py-4 space-y-1.5">
                    <div className="text-[11px] text-[#575268] italic">"{seg.source_text}"</div>
                    <textarea
                      rows={2}
                      value={seg.translated_text || ''}
                      onChange={(e) => handleTextChange(seg.id, e.target.value)}
                      className="w-full bg-[#f8f9fa]/50 border border-[#dbd8e8] rounded-xl p-2 text-xs font-medium text-[#1a1a1a] focus:outline-none focus:border-[#dbd8e8] focus:ring-2 focus:ring-[#7248ea]/20"
                    />
                  </td>

                  {/* CPS Rate */}
                  <td className="px-4 py-4 text-xs font-mono">
                    <span className={`font-bold px-2 py-0.5 rounded-full border ${cps > 17.0 ? 'bg-[#fdf3fe] text-[#7248ea] border-[#e261e5]' : 'bg-[#14804a]/20 text-[#1a1a1a] border-[#dbd8e8]'}`}>
                      {cps.toFixed(1)} CPS
                    </span>
                  </td>

                  {/* QA Badges */}
                  <td className="px-4 py-4 space-y-1">
                    {segViolations.length === 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#14804a] text-[#1a1a1a] border border-[#dbd8e8]">
                        ✓ Compliant
                      </span>
                    ) : (
                      segViolations.map((v, i) => (
                        <div
                          key={i}
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#fdf3fe] text-[#7248ea] border border-[#e261e5]"
                        >
                          {v.type}
                        </div>
                      ))
                    )}
                  </td>

                  {/* Action Save Button */}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleSaveSegment(seg)}
                      disabled={savingId === seg.id}
                      className="p-2 bg-[#130e30] hover:bg-[#222222] text-white rounded-xl border border-[#dbd8e8] transition-all active:scale-[0.97] cursor-pointer"
                      title="Save edits"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function max(a: number, b: number) {
  return a > b ? a : b;
}

function round(val: number, decimals: number) {
  return Number(Math.round(Number(val + 'e' + decimals)) + 'e-' + decimals);
}
