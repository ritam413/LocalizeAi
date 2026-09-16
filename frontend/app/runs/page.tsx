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
    <div className="space-y-8 max-w-6xl font-sans text-[#1a1a1a]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dbd8e8] pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight uppercase flex items-center space-x-3">
            <History className="w-7 h-7 text-[#1a1a1a]" />
            <span>Swarm Run History &amp; Archives</span>
          </h1>
          <p className="text-xs text-[#575268] mt-1.5 font-medium">
            Filterable archive of all active and historic autonomous localization pipeline executions.
          </p>
        </div>

        <Link
          href="/runs/new"
          className="bg-[#7248ea] hover:bg-[#6847ff] text-white border border-[#dbd8e8] px-5 py-2.5 rounded-full font-black text-xs shadow-sm flex items-center space-x-2 transition-all active:scale-[0.97]"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>New Localization Run</span>
        </Link>
      </div>

      <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 rounded-[16px] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-[#1a1a1a]">
          <thead className="bg-[#f8f9fa] text-[10px] font-extrabold text-[#575268] uppercase tracking-wider border-b border-[#dbd8e8]">
            <tr>
              <th className="px-6 py-4">Run ID</th>
              <th className="px-6 py-4">Source Master</th>
              <th className="px-6 py-4">Pipeline Mode</th>
              <th className="px-6 py-4">Execution Status</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4 text-right">Studio Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#130e30]/8 bg-[#fbfbfd]">
            {loading ? (
              <RunListSkeleton rows={4} />
            ) : runs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-[#575268] italic">
                  No runs created yet. Click "New Localization Run" to dispatch your first crew.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="hover:bg-[#f8f9fa]/60 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold">
                    <Link
                      href={`/runs/${run.id}`}
                      className="text-[#1a1a1a] hover:underline flex items-center space-x-1"
                    >
                      <span className="bg-[#f8f9fa] border border-[#dbd8e8] px-2 py-0.5 rounded">#{run.id}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#1a1a1a]">
                    <Link href={`/runs/${run.id}`} className="hover:underline truncate block max-w-xs">
                      {run.clip?.filename || 'sample_movie.mp4'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#575268]">
                    Mode {run.project_mode} {run.subtitle_only && '• Subtitle'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider ${
                        run.status === 'completed'
                          ? 'bg-[#14804a] text-[#1a1a1a] border border-[#dbd8e8]'
                          : run.status === 'running'
                          ? 'bg-[#f2eeff] text-[#7248ea] border border-[#dbd8e8] animate-pulse-yellow'
                          : run.status === 'cancelled'
                          ? 'bg-[#fdf3fe] text-[#7248ea] border border-[#e261e5]'
                          : run.status === 'cancelling'
                          ? 'bg-[#7248ea]/50 text-[#1a1a1a] border border-[#dbd8e8]'
                          : 'bg-[#130e30]/5 text-[#575268]'
                      }`}
                    >
                      {run.status === 'completed' ? '✓ Ready' : run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-mono text-[#575268]">
                    {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/runs/${run.id}`}
                        className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#130e30] hover:bg-[#222222] text-white border border-[#dbd8e8] transition-all active:scale-[0.97] inline-flex items-center space-x-1"
                        title="View Run Dashboard"
                      >
                        <span>Console</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      {(run.status === 'running' || run.status === 'queued' || run.status === 'cancelling') && (
                        <button
                          onClick={() => handleCancelRun(run.id)}
                          className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#fdf3fe] hover:bg-[#fbdcfd] text-[#7248ea] border border-[#e261e5] transition-all active:scale-[0.97] inline-flex items-center space-x-1"
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
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#f8f9fa] hover:bg-[#fbfbfd] text-[#1a1a1a] border border-[#dbd8e8] transition-all active:scale-[0.97] inline-flex items-center space-x-1"
                            title="Review Subtitles"
                          >
                            <span>Subtitles</span>
                          </Link>
                          <Link
                            href={`/runs/${run.id}/output`}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#14804a] hover:bg-[#4dd051] text-[#1a1a1a] border border-[#dbd8e8] transition-all active:scale-[0.97] inline-flex items-center space-x-1"
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
