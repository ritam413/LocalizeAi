'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Play, CheckCircle2, Clock, AlertCircle, ArrowRight, XCircle, Sparkles } from 'lucide-react';
import { RunListSkeleton } from '../../components/ui/skeleton';

interface RunItem {
  id: string;
  project_mode: string;
  status: string;
  source_language?: string | null;
  subtitle_only: boolean;
  created_at: string;
  clip?: {
    filename: string;
  };
}

export default function RunHistoryPage() {
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRuns = async () => {
    try {
      const res = await fetch('/api/v1/runs');
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleCancelRun = async (runId: string) => {
    if (!confirm(`Cancel run #${runId}?`)) return;
    try {
      const res = await fetch(`/api/v1/runs/${runId}/cancel`, { method: 'POST' });
      if (res.ok) {
        loadRuns();
      } else {
        const err = await res.json();
        alert(`Could not cancel: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error('Failed to cancel run:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl font-sans text-[#130e30]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#130e30]/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#130e30] tracking-tight uppercase flex items-center space-x-3">
            <History className="w-7 h-7 text-[#130e30]" />
            <span>Swarm Run History &amp; Archives</span>
          </h1>
          <p className="text-xs text-[#5f5c6e] mt-1.5 font-medium">
            Filterable archive of all active and historic autonomous localization pipeline executions.
          </p>
        </div>

        <Link
          href="/runs/new"
          className="bg-[#ffe228] hover:bg-[#ebd020] text-[#130e30] border-[1.5px] border-[#130e30] px-5 py-2.5 rounded-full font-black text-xs shadow-sm flex items-center space-x-2 transition-all active:scale-[0.97]"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>New Localization Run</span>
        </Link>
      </div>

      <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 rounded-[24px] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-[#130e30]">
          <thead className="bg-[#eff2e5] text-[10px] font-extrabold text-[#5f5c6e] uppercase tracking-wider border-b border-[#130e30]/10">
            <tr>
              <th className="px-6 py-4">Run ID</th>
              <th className="px-6 py-4">Source Master</th>
              <th className="px-6 py-4">Pipeline Mode</th>
              <th className="px-6 py-4">Execution Status</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4 text-right">Studio Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#130e30]/8 bg-[#f9fbf2]">
            {loading ? (
              <RunListSkeleton rows={4} />
            ) : runs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-[#5f5c6e] italic">
                  No runs created yet. Click "New Localization Run" to dispatch your first crew.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="hover:bg-[#eff2e5]/60 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold">
                    <Link
                      href={`/runs/${run.id}`}
                      className="text-[#130e30] hover:underline flex items-center space-x-1"
                    >
                      <span className="bg-[#eff2e5] border border-[#130e30]/20 px-2 py-0.5 rounded">#{run.id}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#130e30]">
                    <Link href={`/runs/${run.id}`} className="hover:underline truncate block max-w-xs">
                      {run.clip?.filename || 'sample_movie.mp4'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#5f5c6e]">
                    Mode {run.project_mode} {run.subtitle_only && '• Subtitle'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider ${
                        run.status === 'completed'
                          ? 'bg-[#59e25d] text-[#130e30] border border-[#130e30]'
                          : run.status === 'running'
                          ? 'bg-[#ffe228] text-[#130e30] border border-[#130e30] animate-pulse-yellow'
                          : run.status === 'cancelled'
                          ? 'bg-[#fdf3fe] text-[#e261e5] border border-[#e261e5]'
                          : run.status === 'cancelling'
                          ? 'bg-[#ffe228]/50 text-[#130e30] border border-[#130e30]'
                          : 'bg-[#130e30]/5 text-[#5f5c6e]'
                      }`}
                    >
                      {run.status === 'completed' ? '✓ Ready' : run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-mono text-[#5f5c6e]">
                    {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/runs/${run.id}`}
                        className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#130e30] hover:bg-[#222222] text-white border border-[#130e30] transition-all active:scale-[0.97] inline-flex items-center space-x-1"
                        title="View Run Dashboard"
                      >
                        <span>Console</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      {(run.status === 'running' || run.status === 'queued' || run.status === 'cancelling') && (
                        <button
                          onClick={() => handleCancelRun(run.id)}
                          className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#fdf3fe] hover:bg-[#fbdcfd] text-[#e261e5] border border-[#e261e5] transition-all active:scale-[0.97] inline-flex items-center space-x-1"
                          title="Cancel this run"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Stop</span>
                        </button>
                      )}

                      {run.status === 'completed' && (
                        <>
                          <Link
                            href={`/runs/${run.id}/subtitles`}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#eff2e5] hover:bg-[#f9fbf2] text-[#130e30] border border-[#130e30]/30 transition-all active:scale-[0.97] inline-flex items-center space-x-1"
                            title="Review Subtitles"
                          >
                            <span>Subtitles</span>
                          </Link>
                          <Link
                            href={`/runs/${run.id}/output`}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#59e25d] hover:bg-[#4dd051] text-[#130e30] border border-[#130e30] transition-all active:scale-[0.97] inline-flex items-center space-x-1"
                            title="Download Deliverables"
                          >
                            <span>Stems</span>
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
