'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  Film,
  Link2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileVideo,
  X,
  PlayCircle,
  AlertCircle,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { ModelPicker, DUBBING_MODELS, DubbingModel } from './ModelPicker';

export interface WorkbenchCardProps {
  onRunLaunched?: (runId: string) => void;
}

export function WorkbenchCard({ onRunLaunched }: WorkbenchCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'video' | 'link'>('video');
  const [selectedModelId, setSelectedModelId] = useState<'1.0' | '2.0' | '3.0'>('2.0');
  const [file, setFile] = useState<File | null>(null);
  const [isSampleLoaded, setIsSampleLoaded] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [addSubtitles, setAddSubtitles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const activeModel = DUBBING_MODELS.find((m) => m.id === selectedModelId) || DUBBING_MODELS[1];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsSampleLoaded(false);
      setErrorMsg('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setIsSampleLoaded(false);
      setErrorMsg('');
    }
  };

  const loadSample = () => {
    setFile(null);
    setIsSampleLoaded(true);
    setErrorMsg('');
  };

  const clearFile = () => {
    setFile(null);
    setIsSampleLoaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLaunch = async () => {
    if (!file && !isSampleLoaded && (!linkUrl.trim() || activeTab !== 'link')) {
      setErrorMsg('Please select a video file or load the sample scene before generating.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let clipId = '';

      if (isSampleLoaded || (activeTab === 'link' && !file)) {
        // Use standard server-side sample clip
        const res = await fetch('/api/v1/clips/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'storage/sample_movie.mp4' }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Clip import failed with status ${res.status}`);
        }
        const clipData = await res.json();
        clipId = clipData.id;
      } else if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/v1/clips/upload', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Upload failed with status ${res.status}`);
        }
        const clipData = await res.json();
        clipId = clipData.id;
      }

      // Map UI model tier to Director Project Mode
      const projectMode = activeModel.modeMapping; // 'A', 'B', or 'C'
      const actualSourceLang = sourceLang === 'auto' ? 'es' : sourceLang;

      const runRes = await fetch('/api/v1/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: clipId,
          project_mode: projectMode,
          source_language: actualSourceLang,
          target_languages: [targetLang],
          subtitle_only: !addSubtitles && projectMode === 'C',
          use_demucs: projectMode !== 'C',
          whisper_model: projectMode === 'A' ? 'large-v3' : 'turbo',
        }),
      });

      if (!runRes.ok) {
        const errData = await runRes.json().catch(() => ({}));
        throw new Error(errData.detail || `Run dispatch failed with status ${runRes.status}`);
      }

      const runData = await runRes.json();
      if (onRunLaunched) {
        onRunLaunched(runData.id);
      } else {
        router.push(`/runs/${runData.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while launching dubbing.');
      setIsSubmitting(false);
    }
  };

  const hasLoadedVideo = Boolean(file || isSampleLoaded);

  return (
    <div
      id="workbench-dropzone"
      className="bg-white border border-[#dbd8e8] rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-200"
    >
      {/* Top Controls Bar: Tabs on Left, Model Picker on Right */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#f2f0f8]">
        {/* Source Switcher: Video vs Link */}
        <div className="flex items-center space-x-1.5 p-1 bg-[#f8f9fa] rounded-xl border border-[#dbd8e8]/70">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeTab === 'video'
                ? 'bg-[#f2eeff] text-[#7248ea] shadow-xs'
                : 'text-[#575268] hover:text-[#1a1a1a]'
            }`}
          >
            <Film className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Video</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeTab === 'link'
                ? 'bg-[#f2eeff] text-[#7248ea] shadow-xs'
                : 'text-[#575268] hover:text-[#1a1a1a]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Link</span>
          </button>
        </div>

        {/* Replicated Model Selection Dropdown */}
        <ModelPicker
          selectedModelId={selectedModelId}
          onSelectModel={(m) => setSelectedModelId(m.id)}
        />
      </div>

      {/* Main Drag-and-Drop Area */}
      <div className="mt-6">
        {activeTab === 'video' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed transition-all p-8 sm:p-12 text-center flex flex-col items-center justify-center ${
              isDragOver
                ? 'border-[#7248ea] bg-[#f8f6ff]'
                : hasLoadedVideo
                ? 'border-[#c2e7b0] bg-[#f0f9eb]/30'
                : 'border-[#dbd8e8] hover:border-[#bd98ec] bg-[#fbfbfd]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
              className="hidden"
            />

            {!hasLoadedVideo ? (
              <>
                {/* Stylized Cloud Upload Icon */}
                <div className="w-16 h-16 rounded-2xl bg-[#f2eeff] text-[#7248ea] flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(114,72,234,0.15)]">
                  <UploadCloud className="w-8 h-8 stroke-[2]" />
                </div>

                <h3 className="text-base font-bold text-[#1a1a1a] tracking-tight">
                  Click to upload or drag file here
                </h3>

                <p className="text-xs text-[#575268] mt-1.5">
                  Video up to 15s long, 1024MB in size ·{' '}
                  <span className="text-[#7248ea] underline cursor-pointer hover:text-[#6847ff]">
                    Upgrade
                  </span>{' '}
                  to unlock longer playtime
                </p>

                {/* Primary Upload CTA Button */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-xl bg-[#7248ea] hover:bg-[#6847ff] text-white font-bold text-xs shadow-[0_4px_14px_rgba(114,72,234,0.35)] transition-all active:scale-[0.97] cursor-pointer flex items-center space-x-2"
                  >
                    <Film className="w-4 h-4 stroke-[2]" />
                    <span>Upload a Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadSample}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#f2eeff] text-[#7248ea] border border-[#bd98ec]/60 font-bold text-xs transition-all active:scale-[0.97] cursor-pointer flex items-center space-x-2"
                  >
                    <PlayCircle className="w-4 h-4 stroke-[2]" />
                    <span>Load 35s Festival Demo</span>
                  </button>
                </div>
              </>
            ) : (
              /* Loaded Video File Badge */
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#14804a] text-white flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="font-bold text-sm text-[#1a1a1a]">
                      {file ? file.name : 'sample_movie.mp4 (Festival Master Scene)'}
                    </span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="text-[#9e9e9e] hover:text-[#b42318] p-1 rounded-md transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#14804a] font-medium mt-1">
                    Ready for Ingestion · Demucs 4-Stem vocal split configured
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Link Mode Tab */
          <div className="rounded-2xl border border-[#dbd8e8] bg-[#fbfbfd] p-8 text-center space-y-4">
            <div className="max-w-md mx-auto space-y-3">
              <label className="block text-xs font-bold text-[#1a1a1a] text-left">
                Paste YouTube / Vimeo URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#dbd8e8] bg-white text-xs text-[#1a1a1a] focus:outline-none focus:border-[#7248ea] focus:ring-2 focus:ring-[#f2eeff]"
                />
                <button
                  type="button"
                  onClick={loadSample}
                  className="px-4 py-2.5 rounded-xl bg-[#f2eeff] text-[#7248ea] text-xs font-bold hover:bg-[#ebd9fc] transition-all cursor-pointer whitespace-nowrap"
                >
                  Use Demo URL
                </button>
              </div>
              <p className="text-[11px] text-[#575268] text-left">
                Supports YouTube, Vimeo, Google Drive public links, and direct MP4 URLs.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Language & Dubbing Parameter Selector Row */}
      <div className="mt-6 pt-5 border-t border-[#f2f0f8] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Source Language */}
          <div className="flex items-center space-x-2">
            <span className="text-[#575268] font-medium">Original:</span>
            <div className="relative">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="appearance-none bg-[#f8f9fa] hover:bg-white text-[#1a1a1a] font-bold py-1.5 pl-3 pr-8 rounded-xl border border-[#dbd8e8] focus:outline-none focus:border-[#7248ea] cursor-pointer text-xs"
              >
                <option value="auto">Auto Detect</option>
                <option value="es">Spanish (Español)</option>
                <option value="en">English (US)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
                <option value="ja">Japanese (日本語)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="zh">Chinese (中文)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#575268] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-[#9e9e9e] hidden sm:block" />

          {/* Target Language */}
          <div className="flex items-center space-x-2">
            <span className="text-[#575268] font-medium">Translate to:</span>
            <div className="relative">
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="appearance-none bg-[#f8f9fa] hover:bg-white text-[#1a1a1a] font-bold py-1.5 pl-3 pr-8 rounded-xl border border-[#dbd8e8] focus:outline-none focus:border-[#7248ea] cursor-pointer text-xs"
              >
                <option value="en">🇺🇸 English (US)</option>
                <option value="es">🇪🇸 Spanish (Castilian)</option>
                <option value="fr">🇫🇷 French (Français)</option>
                <option value="de">🇩🇪 German (Deutsch)</option>
                <option value="ja">🇯🇵 Japanese (日本語)</option>
                <option value="hi">🇮🇳 Hindi (हिन्दी)</option>
                <option value="zh">🇨🇳 Chinese (Mandarin)</option>
                <option value="it">🇮🇹 Italian (Italiano)</option>
                <option value="pt">🇧🇷 Portuguese (Brazilian)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#575268] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Subtitle Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={addSubtitles}
              onChange={(e) => setAddSubtitles(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-[#dbd8e8] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#7248ea] relative" />
            <span className="text-xs font-semibold text-[#1a1a1a]">Add Subtitles</span>
          </label>
        </div>

        {/* Generate Button */}
        <div>
          <button
            type="button"
            onClick={handleLaunch}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#7248ea] hover:bg-[#6847ff] text-white font-bold text-xs shadow-[0_4px_14px_rgba(114,72,234,0.35)] transition-all active:scale-[0.97] cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Dispatching Crew...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 stroke-[2]" />
                <span>Generate Dubbed Movie</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-3 rounded-xl bg-[#fef0f0] border border-[#fde2e2] text-xs text-[#b42318] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
