'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    gpu_vram_mb: 4096,
    qa_min_gap_ms: 100,
    qa_max_cps: 17.0,
    qa_min_duration_s: 1.0,
    qa_max_line_chars: 42
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/v1/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      await fetch('/api/v1/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
          <Settings className="w-6 h-6 text-indigo-400" />
          <span>System Settings & QA Thresholds (S-17)</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure hardware constraints for GpuLock and global subtitle QA validation thresholds.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Hardware Profile Section */}
      <section className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>Hardware Constraint Settings</span>
        </h2>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            GPU Box VRAM Limit (MB)
          </label>
          <input
            type="number"
            value={settings.gpu_vram_mb}
            onChange={(e) => setSettings({ ...settings, gpu_vram_mb: parseInt(e.target.value) || 4096 })}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enforces GpuLock model serialization for GTX 1050 Ti (default 4096 MB).
          </p>
        </div>
      </section>

      {/* Subtitle QA Thresholds (F-38 / F-27) */}
      <section className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>Subtitle QA Validation Thresholds</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Min Inter-segment Gap (ms)
            </label>
            <input
              type="number"
              value={settings.qa_min_gap_ms}
              onChange={(e) => setSettings({ ...settings, qa_min_gap_ms: parseInt(e.target.value) || 100 })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Max Characters Per Second (CPS)
            </label>
            <input
              type="number"
              step="0.5"
              value={settings.qa_max_cps}
              onChange={(e) => setSettings({ ...settings, qa_max_cps: parseFloat(e.target.value) || 17.0 })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Min Subtitle Duration (seconds)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.qa_min_duration_s}
              onChange={(e) => setSettings({ ...settings, qa_min_duration_s: parseFloat(e.target.value) || 1.0 })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Max Line Length (characters)
            </label>
            <input
              type="number"
              value={settings.qa_max_line_chars}
              onChange={(e) => setSettings({ ...settings, qa_max_line_chars: parseInt(e.target.value) || 42 })}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-glow flex items-center space-x-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save System Settings</span>
        </button>
      </div>
    </div>
  );
}
