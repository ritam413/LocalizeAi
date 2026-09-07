'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Subtitles, AlertTriangle, CheckCircle, Save, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';

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
          end_s: segment.end_s
        })
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
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 space-x-3">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
        <span>Loading Subtitle Editor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/runs/${runId}`}
            className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Run Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <Subtitles className="w-6 h-6 text-indigo-400" />
            <span>Subtitle Review & QA Editor (S-11)</span>
          </h1>
        </div>

        {/* Overall QA Status Badge */}
        <div
          className={`px-4 py-2 rounded-xl border text-sm font-semibold flex items-center space-x-2 ${
            violations.length === 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}
        >
          {violations.length === 0 ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>QA Validated — Zero Violations</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>{violations.length} QA Violations Flagged</span>
            </>
          )}
        </div>
      </div>

      {/* Subtitle Line Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-gray-800">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-900/80 text-xs font-semibold text-gray-400 uppercase border-b border-gray-800">
            <tr>
              <th className="px-4 py-3 w-16">#</th>
              <th className="px-4 py-3 w-44">Timing (Start → End)</th>
              <th className="px-4 py-3">Source & Translated Subtitle</th>
              <th className="px-4 py-3 w-28">CPS Rate</th>
              <th className="px-4 py-3 w-48">QA Status Badges</th>
              <th className="px-4 py-3 w-20">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {segments.map((seg, index) => {
              const segViolations = getSegmentViolations(seg.id);
              const duration = max(0.1, seg.end_s - seg.start_s);
              const text = seg.translated_text || seg.source_text || '';
              const cps = seg.cps || round(text.length / duration, 1);

              return (
                <tr key={seg.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="px-4 py-4 text-xs font-mono text-gray-500">{index + 1}</td>
                  
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
                        className="w-16 bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs font-mono text-white text-center"
                      />
                      <span className="text-gray-500">→</span>
                      <input
                        type="number"
                        step="0.1"
                        value={seg.end_s}
                        onChange={(e) =>
                          handleTimingChange(seg.id, 'end_s', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 bg-gray-900 border border-gray-700 rounded px-1.5 py-1 text-xs font-mono text-white text-center"
                      />
                    </div>
                  </td>

                  {/* Subtitle Text Input */}
                  <td className="px-4 py-4 space-y-1.5">
                    <div className="text-xs text-gray-500 italic">"{seg.source_text}"</div>
                    <textarea
                      rows={2}
                      value={seg.translated_text || ''}
                      onChange={(e) => handleTextChange(seg.id, e.target.value)}
                      className="w-full bg-gray-900/90 border border-gray-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </td>

                  {/* CPS Rate */}
                  <td className="px-4 py-4 text-xs font-mono">
                    <span className={cps > 17.0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                      {cps.toFixed(1)} CPS
                    </span>
                  </td>

                  {/* QA Badges */}
                  <td className="px-4 py-4 space-y-1">
                    {segViolations.length === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Pass
                      </span>
                    ) : (
                      segViolations.map((v, i) => (
                        <div
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        >
                          {v.type}
                        </div>
                      ))
                    )}
                  </td>

                  {/* Action Save Button */}
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleSaveSegment(seg)}
                      disabled={savingId === seg.id}
                      className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg border border-indigo-500/30 transition-all"
                      title="Save edits"
                    >
                      <Save className="w-4 h-4" />
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
