'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle2, Shield, HardDrive, Tag } from 'lucide-react';
import { ModelRegistrySkeleton } from '../../components/ui/skeleton';

interface ModelItem {
  id: string;
  stage_type: string;
  display_name: string;
  license: string;
  vram_footprint_mb: number;
  installed: boolean;
}

export default function ModelRegistryPage() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch('/api/v1/models');
        if (res.ok) {
          const data = await res.json();
          setModels(data);
        }
      } catch (err) {
        console.error('Failed to load models:', err);
      } finally {
        setLoading(false);
      }
    }
    loadModels();
  }, []);

  if (loading) {
    return <ModelRegistrySkeleton cards={6} />;
  }

  return (
    <div className="space-y-8 max-w-5xl font-sans text-[#130e30]">
      <div className="border-b border-[#130e30]/10 pb-6">
        <h1 className="text-3xl font-black text-[#130e30] tracking-tight uppercase flex items-center space-x-3">
          <Cpu className="w-7 h-7 text-[#130e30]" />
          <span>Pluggable Agent &amp; Model Registry</span>
        </h1>
        <p className="text-xs text-[#5f5c6e] mt-1.5 font-medium">
          Registered machine learning adapters, neural voice synthesizers, and ASR engines with VRAM footprints for GpuLock serialization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {models.map((model) => (
          <div key={model.id} className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 p-6 rounded-[24px] space-y-4 shadow-sm hover:border-[#130e30] transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#f9fbf2] text-[#130e30] border border-[#130e30]/20">
                {model.stage_type}
              </span>
              <div className="flex items-center space-x-1.5 text-xs text-[#130e30] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#59e25d] border border-[#130e30]" />
                <span>Installed</span>
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-[#130e30] text-base">{model.display_name}</h3>
              <p className="text-[11px] text-[#5f5c6e] font-mono mt-0.5">Model ID: {model.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#130e30]/10 text-xs bg-[#f9fbf2] p-3 rounded-xl border border-[#130e30]/10">
              <div className="flex items-center space-x-2 text-[#5f5c6e]">
                <Shield className="w-3.5 h-3.5 text-[#130e30]" />
                <span>License: <strong className="text-[#130e30]">{model.license}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-[#5f5c6e]">
                <HardDrive className="w-3.5 h-3.5 text-[#130e30]" />
                <span>VRAM: <strong className="text-[#130e30]">{model.vram_footprint_mb} MB</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
