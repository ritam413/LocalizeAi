'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Download, FileText, ArrowLeft, RefreshCw, Film, CheckCircle } from 'lucide-react';

interface Artifact {
  id: string;
  type: string;
  label: string;
  path: string;
}

export default function OutputPage() {
  const { id: runId } = useParams() as { id: string };
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOutput() {
      try {
        const res = await fetch(`/api/v1/runs/${runId}/artifacts`);
        if (res.ok) {
          const data = await res.json();
          setArtifacts(data);
        }
      } catch (err) {
        console.error('Failed to load output artifacts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOutput();
  }, [runId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 space-x-3">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
        <span>Fetching Output Artifacts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/runs/${runId}`}
          className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Run Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
          <Download className="w-6 h-6 text-indigo-400" />
          <span>Output & Deliverables Package (S-12)</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          QA-validated subtitle tracks and intermediate artifacts ready for download.
        </p>
      </div>

      {/* Artifact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {artifacts.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center text-gray-500 col-span-2">
            No artifacts generated yet. Wait for pipeline stages to complete.
          </div>
        ) : (
          artifacts.map((art) => (
            <div key={art.id} className="glass-panel p-6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{art.label}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{art.path}</p>
                </div>
              </div>

              <a
                href={`/api/v1/runs/${runId}/artifacts/${art.id}/download`}
                download
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-xs shadow-glow flex items-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
