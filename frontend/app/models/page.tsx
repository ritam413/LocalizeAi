'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle2, Shield, HardDrive, Tag } from 'lucide-react';

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
      }
    }
    loadModels();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
          <Cpu className="w-6 h-6 text-indigo-400" />
          <span>Pluggable Model Registry (S-15)</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Registered ML adapters with licensing details and VRAM footprints for GpuLock serialization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {models.map((model) => (
          <div key={model.id} className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {model.stage_type}
              </span>
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Installed</span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-white text-lg">{model.display_name}</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {model.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-800 text-xs">
              <div className="flex items-center space-x-2 text-gray-400">
                <Shield className="w-4 h-4 text-violet-400" />
                <span>License: <strong className="text-gray-200">{model.license}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>VRAM: <strong className="text-gray-200">{model.vram_footprint_mb} MB</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
