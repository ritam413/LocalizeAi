'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Sparkles, Languages, Subtitles, ArrowRight, FileVideo, Check, Zap, AlertCircle, Cpu } from 'lucide-react';

export default function NewRunPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importPath, setImportPath] = useState('');
  const [useImportPath, setUseImportPath] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'A' | 'B' | 'C'>('C');
  const [whisperModel, setWhisperModel] = useState<string>('turbo');
  const [subtitleOnly, setSubtitleOnly] = useState(true);
  const [useDemucs, setUseDemucs] = useState(true);
  const [sourceLang, setSourceLang] = useState('es');
  const [targetLang, setTargetLang] = useState('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const modes = [
    {
      id: 'A',
      title: 'Project A — Max Quality',
      subtitle: 'Hindi / Bengali Quality Dubbing',
      desc: 'Uses Whisper large-v3 ASR & XTTS-v2 / Indic-TTS voice cloning with extra VAD precision.',
      badge: 'Max Fidelity',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    {
      id: 'B',
      title: 'Project B — Bulk Throughput',
      subtitle: 'Spanish / Portuguese / Russian Dubs',
      desc: 'Optimized for speed & throughput using Whisper Turbo & NLLB 1.3B models.',
      badge: 'High Speed',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    },
    {
      id: 'C',
      title: 'Project C — Universal Subtitle & Fast Path',
      subtitle: 'Any Language → English Subtitles',
      desc: 'Fastest pipeline slice. Skips heavy TTS and outputs QA-validated SRT/VTT in minutes.',
      badge: 'Recommended First',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    }
  ];

  const handleModeChange = (modeId: 'A' | 'B' | 'C') => {
    setSelectedMode(modeId);
    if (modeId === 'A') {
      setWhisperModel('large-v3');
    } else if (modeId === 'B') {
      setWhisperModel('turbo');
    } else if (modeId === 'C') {
      setWhisperModel('turbo');
      setSubtitleOnly(true);
    }
  };

  const handleLaunch = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let clipId = '';

      if (useImportPath) {
        if (!importPath.trim()) {
          throw new Error('Please specify a valid video file path');
        }
        const res = await fetch('/api/v1/clips/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: importPath.trim() })
        });
        if (!res.ok) throw new Error('Failed to import video file');
        const clipData = await res.json();
        clipId = clipData.id;
      } else {
        if (!file) {
          // If user didn't attach file, create a virtual demo clip
          const res = await fetch('/api/v1/clips/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: 'd:/Games/Hckthons/moviedu/storage/sample_movie.mp4' })
          });
          const clipData = await res.json();
          if (!res.ok) throw new Error(clipData.detail || 'Failed to import sample video file');
          clipId = clipData.id;
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/v1/clips/upload', {
            method: 'POST',
            body: formData
          });
          const clipData = await res.json();
          if (!res.ok) throw new Error(clipData.detail || 'Failed to upload clip');
          clipId = clipData.id;
        }
      }

      // Create & start run
      const runRes = await fetch('/api/v1/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: clipId,
          project_mode: selectedMode,
          source_language: sourceLang,
          target_languages: [targetLang],
          subtitle_only: subtitleOnly,
          use_demucs: useDemucs,
          whisper_model: whisperModel,
        })
      });

      if (!runRes.ok) throw new Error('Failed to launch run');
      const runData = await runRes.json();
      router.push(`/runs/${runData.id}`);

    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Step Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <span>Launch New Pipeline Run</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure video clip ingestion, target language pairs, and execution preset mode.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Source Video Ingestion (S-03) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <FileVideo className="w-5 h-5 text-indigo-400" />
          <span>1. Source Video Clip Ingestion</span>
        </h2>

        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-6 text-sm">
            <button
              onClick={() => setUseImportPath(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                !useImportPath
                  ? 'bg-indigo-600 text-white shadow-glow'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Upload Local File
            </button>
            <button
              onClick={() => setUseImportPath(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                useImportPath
                  ? 'bg-indigo-600 text-white shadow-glow'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Specify Shared Path
            </button>
          </div>

          {!useImportPath ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setFile(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-gray-700/80 hover:border-indigo-500/50 rounded-xl p-8 text-center transition-all bg-gray-900/30 cursor-pointer"
            >
              <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <p className="text-sm text-gray-300 font-medium">
                {file ? file.name : 'Drag & drop movie clip here or click to browse'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Supports .mp4, .mkv, .mov, .avi</p>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-4 text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Absolute Shared File Path
              </label>
              <input
                type="text"
                value={importPath}
                onChange={(e) => setImportPath(e.target.value)}
                placeholder="e.g. d:\Games\Hckthons\moviedu\storage\sample_movie.mp4"
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          )}
        </div>
      </section>

      {/* Step 2: Languages & Subtitle Toggle (S-04) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Languages className="w-5 h-5 text-indigo-400" />
          <span>2. Languages & Pipeline Options</span>
        </h2>

        <div className="glass-panel rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Source Language
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="auto">Auto-Detect Language (Whisper ASR)</option>
              <option value="es">Spanish / Colombian Spanish</option>
              <option value="hi">Hindi</option>
              <option value="bn">Bengali</option>
              <option value="pt">Portuguese</option>
              <option value="fr">French</option>
              <option value="ru">Russian</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Target Language
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="en">English (Default)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="ru">Russian</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Whisper ASR Model
            </label>
            <select
              value={whisperModel}
              onChange={(e) => setWhisperModel(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="turbo">Whisper Turbo (Recommended B/C)</option>
              <option value="medium">Whisper Medium (High Accuracy)</option>
              <option value="small">Whisper Small (Lightweight)</option>
              <option value="large-v3">Whisper Large v3 (Max Fidelity A)</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <div
              onClick={() => setSubtitleOnly(!subtitleOnly)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                subtitleOnly
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-gray-900 border-gray-700 text-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Subtitles className="w-5 h-5" />
                <div>
                  <div className="text-sm font-semibold">Subtitle-Only Fast Path</div>
                  <div className="text-xs opacity-75">Skips TTS/Remix for fast SRT/VTT</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${subtitleOnly ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-gray-600'}`}>
                {subtitleOnly && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Demucs ON/OFF Toggle */}
          <div className="flex flex-col justify-end">
            <div
              onClick={() => setUseDemucs(!useDemucs)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                useDemucs
                  ? 'bg-violet-500/10 border-violet-500/40 text-violet-400'
                  : 'bg-gray-900 border-gray-700 text-gray-400'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Cpu className="w-5 h-5" />
                <div>
                  <div className="text-sm font-semibold">Demucs Vocal Isolation</div>
                  <div className="text-xs opacity-75">{useDemucs ? 'HTDemucs stem separation (GPU)' : 'Fast ffmpeg fallback (no GPU)'}</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${useDemucs ? 'bg-violet-500 border-violet-400 text-white' : 'border-gray-600'}`}>
                {useDemucs && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Project Mode Presets */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Zap className="w-5 h-5 text-indigo-400" />
          <span>3. Select Project Mode Preset</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => handleModeChange(mode.id as any)}
                className={`glass-card p-6 rounded-2xl cursor-pointer relative flex flex-col justify-between ${
                  isSelected ? 'border-indigo-500 shadow-glow bg-indigo-950/20' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${mode.badgeColor}`}>
                      {mode.badge}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-glow">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-base">{mode.title}</h3>
                  <p className="text-xs text-indigo-400 font-mono mt-0.5">{mode.subtitle}</p>
                  <p className="text-xs text-gray-400 mt-3 leading-relaxed">{mode.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Launch Button */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={handleLaunch}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-4 rounded-xl font-semibold shadow-glow flex items-center space-x-3 transition-all disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Initializing Run...' : 'Launch DubForge Pipeline'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
