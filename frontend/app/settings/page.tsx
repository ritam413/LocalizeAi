'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, Sliders, Cpu, ShieldAlert } from 'lucide-react';
import { AccessibleErrorReport } from '../../components/ui/AccessibleErrorReport';
import { SettingsSkeleton } from '../../components/ui/skeleton';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    gpu_vram_mb: 4096,
    qa_min_gap_ms: 100,
    qa_max_cps: 17.0,
    qa_min_duration_s: 1.0,
    qa_max_line_chars: 42,
  });
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/v1/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        } else {
          const errData = await res.json().catch(() => null);
          setErrorMsg(errData?.detail || `Failed to load studio settings (HTTP ${res.status})`);
        }
      } catch (err: any) {
        console.error('Failed to load settings:', err);
        setErrorMsg(err?.message || 'Failed to connect to backend on port 8000');
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errData = await res.json().catch(() => null);
        setErrorMsg(errData?.detail || `Failed to save studio settings (HTTP ${res.status})`);
      }
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setErrorMsg(err?.message || 'Network error while updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !errorMsg) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-8 max-w-4xl font-sans text-[#1a1a1a]">
      <div className="border-b border-[#dbd8e8] pb-6">
        <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight uppercase flex items-center space-x-3">
          <Settings className="w-7 h-7 text-[#1a1a1a]" aria-hidden="true" />
          <span>Studio Settings &amp; QA Guardrails</span>
        </h1>
        <p className="text-xs text-[#575268] mt-1.5 font-medium">
          Configure hardware cluster constraints for GpuLock and global subtitle reading speed (CPS) thresholds.
        </p>
      </div>

      {errorMsg && (
        <AccessibleErrorReport
          error={errorMsg}
          context="settings"
          onRetry={handleSave}
          onDismiss={() => setErrorMsg(null)}
        />
      )}

      {saved && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-[#14804a]/20 border border-[#dbd8e8] text-[#1a1a1a] text-xs font-bold flex items-center space-x-2 shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-[#1a1a1a]" aria-hidden="true" />
          <span>Settings saved and synchronized with agent runtime.</span>
        </div>
      )}

      {/* Hardware Profile Section */}
      <section className="bg-[#f8f9fa] border border-[#dbd8e8]/15 p-6 rounded-[16px] space-y-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#1a1a1a] uppercase tracking-tight flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-[#1a1a1a]" aria-hidden="true" />
          <span>Hardware Constraint Settings</span>
        </h2>

        <div>
          <label
            htmlFor="gpu-vram-input"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#575268] mb-1.5"
          >
            GPU Box VRAM Limit (MB)
          </label>
          <input
            id="gpu-vram-input"
            type="number"
            value={settings.gpu_vram_mb}
            onChange={(e) => setSettings({ ...settings, gpu_vram_mb: parseInt(e.target.value) || 4096 })}
            aria-describedby="gpu-vram-help"
            className="w-full bg-[#fbfbfd] border border-[#dbd8e8]/20 focus:border-[#dbd8e8] rounded-xl px-4 py-3 text-xs text-[#1a1a1a] font-mono focus:outline-none focus:ring-2 focus:ring-[#7248ea]/20"
          />
          <p id="gpu-vram-help" className="text-[11px] text-[#575268] mt-1.5 font-mono">
            Enforces GpuLock model serialization for GTX 1050 Ti (default 4096 MB).
          </p>
        </div>
      </section>

      {/* Subtitle QA Thresholds */}
      <section className="bg-[#f8f9fa] border border-[#dbd8e8]/15 p-6 rounded-[16px] space-y-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#1a1a1a] uppercase tracking-tight flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-[#1a1a1a]" aria-hidden="true" />
          <span>Subtitle QA Validation Thresholds</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="qa-min-gap-input"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#575268] mb-1.5"
            >
              Min Inter-segment Gap (ms)
            </label>
            <input
              id="qa-min-gap-input"
              type="number"
              value={settings.qa_min_gap_ms}
              onChange={(e) => setSettings({ ...settings, qa_min_gap_ms: parseInt(e.target.value) || 100 })}
              className="w-full bg-[#fbfbfd] border border-[#dbd8e8] rounded-xl px-4 py-2.5 text-xs text-[#1a1a1a] font-mono focus:outline-none focus:ring-2 focus:ring-[#7248ea]/20"
            />
          </div>

          <div>
            <label
              htmlFor="qa-max-cps-input"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#575268] mb-1.5"
            >
              Max Characters Per Second (CPS)
            </label>
            <input
              id="qa-max-cps-input"
              type="number"
              step="0.5"
              value={settings.qa_max_cps}
              onChange={(e) => setSettings({ ...settings, qa_max_cps: parseFloat(e.target.value) || 17.0 })}
              className="w-full bg-[#fbfbfd] border border-[#dbd8e8] rounded-xl px-4 py-2.5 text-xs text-[#1a1a1a] font-mono focus:outline-none focus:ring-2 focus:ring-[#7248ea]/20"
            />
          </div>

          <div>
            <label
              htmlFor="qa-min-dur-input"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#575268] mb-1.5"
            >
              Min Subtitle Duration (seconds)
            </label>
            <input
              id="qa-min-dur-input"
              type="number"
              step="0.1"
              value={settings.qa_min_duration_s}
              onChange={(e) => setSettings({ ...settings, qa_min_duration_s: parseFloat(e.target.value) || 1.0 })}
              className="w-full bg-[#fbfbfd] border border-[#dbd8e8] rounded-xl px-4 py-2.5 text-xs text-[#1a1a1a] font-mono focus:outline-none focus:ring-2 focus:ring-[#7248ea]/20"
            />
          </div>

          <div>
            <label
              htmlFor="qa-max-chars-input"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#575268] mb-1.5"
            >
              Max Line Length (characters)
            </label>
            <input
              id="qa-max-chars-input"
              type="number"
              value={settings.qa_max_line_chars}
              onChange={(e) => setSettings({ ...settings, qa_max_line_chars: parseInt(e.target.value) || 42 })}
              className="w-full bg-[#fbfbfd] border border-[#dbd8e8] rounded-xl px-4 py-2.5 text-xs text-[#1a1a1a] font-mono focus:outline-none focus:ring-2 focus:ring-[#7248ea]/20"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          aria-busy={isSaving}
          className="bg-[#7248ea] hover:bg-[#6847ff] text-white border border-[#dbd8e8] px-8 py-3.5 rounded-full font-black text-xs shadow-sm flex items-center space-x-2 transition-all active:scale-[0.97] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7248ea]"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          <span>{isSaving ? 'SAVING SETTINGS…' : 'SAVE SYSTEM SETTINGS'}</span>
        </button>
      </div>
    </div>
  );
}
