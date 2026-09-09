'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Download, FileText, ArrowLeft, RefreshCw, Film, CheckCircle2 } from 'lucide-react';

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
      <div className="flex items-center justify-center h-64 text-[#5f5c6e] space-x-3 font-mono text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-[#130e30]" />
        <span>Fetching Output Deliverables…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl font-sans text-[#130e30]">
      {/* Header */}
      <div className="border-b border-[#130e30]/10 pb-6">
        <Link
          href={`/runs/${runId}`}
          className="text-xs font-mono font-bold text-[#130e30] hover:underline flex items-center space-x-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Run Studio Dashboard</span>
        </Link>
        <h1 className="text-3xl font-black text-[#130e30] tracking-tight uppercase flex items-center space-x-3">
          <Download className="w-7 h-7 text-[#130e30]" />
          <span>Output Deliverables &amp; Master Stems</span>
        </h1>
        <p className="text-xs text-[#5f5c6e] mt-1.5 font-medium">
          Broadcast-ready neural dub tracks, synchronized subtitle masters, and QA-certified packages.
        </p>
      </div>

      {/* Artifact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {artifacts.length === 0 ? (
          <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 p-10 rounded-[24px] text-center text-[#5f5c6e] col-span-2 text-xs font-medium">
            No artifacts generated yet. Wait for pipeline stages to complete in the Studio Console.
          </div>
        ) : (
          artifacts.map((art) => (
            <div key={art.id} className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 p-6 rounded-[24px] flex items-center justify-between shadow-sm hover:border-[#130e30] transition">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-[#f9fbf2] border border-[#130e30]/20 flex items-center justify-center text-[#130e30]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#130e30] text-sm">{art.label}</h3>
                  <p className="text-[10.5px] text-[#5f5c6e] font-mono mt-0.5 truncate max-w-xs">{art.path}</p>
                </div>
              </div>

              <a
                href={`/api/v1/runs/${runId}/artifacts/${art.id}/download`}
                download
                className="bg-[#ffe228] hover:bg-[#ebd020] text-[#130e30] border border-[#130e30] px-4 py-2 rounded-full font-black text-xs shadow-sm flex items-center space-x-1.5 transition-all active:scale-[0.97]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
