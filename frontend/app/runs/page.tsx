'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Play, CheckCircle2, Clock, AlertCircle, ArrowRight, XCircle } from 'lucide-react';

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <History className="w-6 h-6 text-indigo-400" />
            <span>Run History & Logs (S-02)</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Filterable archive of all past and active movie dubbing pipeline executions.
          </p>
        </div>

        <Link
          href="/runs/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-glow flex items-center space-x-2 transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>New Run</span>
        </Link>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-gray-800">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-900/80 text-xs font-semibold text-gray-400 uppercase border-b border-gray-800">
            <tr>
              <th className="px-6 py-4">Run ID</th>
              <th className="px-6 py-4">Clip Name</th>
              <th className="px-6 py-4">Mode</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                  No runs created yet. Click "New Run" to launch your first pipeline execution.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="hover:bg-gray-900/60 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-medium">
                    <Link
                      href={`/runs/${run.id}`}
                      className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center space-x-1 font-bold"
                    >
                      <span>#{run.id}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    <Link href={`/runs/${run.id}`} className="hover:text-indigo-300 hover:underline">
                      {run.clip?.filename || 'sample_movie.mp4'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">
                    Mode {run.project_mode} {run.subtitle_only && '(Subtitle Only)'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        run.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : run.status === 'running'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse'
                          : run.status === 'cancelled'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : run.status === 'cancelling'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">
                    {new Date(run.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/runs/${run.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all inline-flex items-center space-x-1"
                        title="View Run Dashboard"
                      >
                        <span>Dashboard</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      {(run.status === 'running' || run.status === 'queued' || run.status === 'cancelling') && (
                        <button
                          onClick={() => handleCancelRun(run.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all inline-flex items-center space-x-1"
                          title="Cancel this run"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      )}

                      {run.status === 'completed' && (
                        <>
                          <Link
                            href={`/runs/${run.id}/subtitles`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-all inline-flex items-center space-x-1"
                            title="Review Subtitles"
                          >
                            <span>Subtitles</span>
                          </Link>
                          <Link
                            href={`/runs/${run.id}/output`}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all inline-flex items-center space-x-1"
                            title="Download Deliverables"
                          >
                            <span>Outputs</span>
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
