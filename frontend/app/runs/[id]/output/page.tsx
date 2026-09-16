'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Download, FileText, ArrowLeft, RefreshCw, Film, CheckCircle2 } from 'lucide-react';
import { OutputDeliverablesSkeleton } from '../../../../components/ui/skeleton';

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
    return <OutputDeliverablesSkeleton cards={4} />;
  }

  return (
    <div className="space-y-8 max-w-5xl font-sans text-[#1a1a1a]">
      {/* Header */}
      <div className="border-b border-[#dbd8e8] pb-6">
        <Link
          href={`/runs/${runId}`}
          className="text-xs font-mono font-bold text-[#1a1a1a] hover:underline flex items-center space-x-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Run Studio Dashboard</span>
        </Link>
        <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight uppercase flex items-center space-x-3">
          <Download className="w-7 h-7 text-[#1a1a1a]" />
          <span>Output Deliverables &amp; Master Stems</span>
        </h1>
        <p className="text-xs text-[#575268] mt-1.5 font-medium">
          Broadcast-ready neural dub tracks, synchronized subtitle masters, and QA-certified packages.
        </p>
      </div>

      {/* Artifact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {artifacts.length === 0 ? (
          <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 p-10 rounded-[16px] text-center text-[#575268] col-span-2 text-xs font-medium">
            No artifacts generated yet. Wait for pipeline stages to complete in the Studio Console.
          </div>
        ) : (
          artifacts.map((art) => (
            <div key={art.id} className="bg-[#f8f9fa] border border-[#dbd8e8]/15 p-6 rounded-[16px] flex items-center justify-between shadow-sm hover:border-[#dbd8e8] transition">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-[#fbfbfd] border border-[#dbd8e8] flex items-center justify-center text-[#1a1a1a]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#1a1a1a] text-sm">{art.label}</h3>
                  <p className="text-[10.5px] text-[#575268] font-mono mt-0.5 truncate max-w-xs">{art.path}</p>
                </div>
              </div>

              <a
                href={`/api/v1/runs/${runId}/artifacts/${art.id}/download`}
                download
                className="bg-[#7248ea] hover:bg-[#6847ff] text-white border border-[#dbd8e8] px-4 py-2 rounded-full font-black text-xs shadow-sm flex items-center space-x-1.5 transition-all active:scale-[0.97]"
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
