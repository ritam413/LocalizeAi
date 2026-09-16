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
    <div className="space-y-8 max-w-5xl font-sans text-[#1a1a1a]">
      <div className="border-b border-[#dbd8e8] pb-6">
        <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight uppercase flex items-center space-x-3">
          <Cpu className="w-7 h-7 text-[#1a1a1a]" />
          <span>Pluggable Agent &amp; Model Registry</span>
        </h1>
        <p className="text-xs text-[#575268] mt-1.5 font-medium">
          Registered machine learning adapters, neural voice synthesizers, and ASR engines with VRAM footprints for GpuLock serialization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {models.map((model) => (
          <div key={model.id} className="bg-[#f8f9fa] border border-[#dbd8e8]/15 p-6 rounded-[16px] space-y-4 shadow-sm hover:border-[#dbd8e8] transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#fbfbfd] text-[#1a1a1a] border border-[#dbd8e8]">
                {model.stage_type}
              </span>
              <div className="flex items-center space-x-1.5 text-xs text-[#1a1a1a] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#14804a] border border-[#dbd8e8]" />
                <span>Installed</span>
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-[#1a1a1a] text-base">{model.display_name}</h3>
              <p className="text-[11px] text-[#575268] font-mono mt-0.5">Model ID: {model.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#dbd8e8] text-xs bg-[#fbfbfd] p-3 rounded-xl border border-[#dbd8e8]">
              <div className="flex items-center space-x-2 text-[#575268]">
                <Shield className="w-3.5 h-3.5 text-[#1a1a1a]" />
                <span>License: <strong className="text-[#1a1a1a]">{model.license}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-[#575268]">
                <HardDrive className="w-3.5 h-3.5 text-[#1a1a1a]" />
                <span>VRAM: <strong className="text-[#1a1a1a]">{model.vram_footprint_mb} MB</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
