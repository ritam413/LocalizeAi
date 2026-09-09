'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Sparkles,
  Languages,
  Film,
  ArrowRight,
  FileVideo,
  Check,
  Zap,
  AlertCircle,
  Volume2,
  Sliders,
  CheckCircle2,
  FolderOpen,
  PlayCircle,
  Clapperboard,
  RotateCcw,
  Eye
} from 'lucide-react';
import { MasterVideoPreview } from '../../../components/studio/MasterVideoPreview';
import { AccessibleErrorReport } from '../../../components/ui/AccessibleErrorReport';

export default function NewRunPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sampleLoaded, setSampleLoaded] = useState(false);
  const [importPath, setImportPath] = useState('');
  const [useImportPath, setUseImportPath] = useState(false);
  const [activeIngestionTab, setActiveIngestionTab] = useState<'setup' | 'preview'>('setup');
  const [selectedMode, setSelectedMode] = useState<'A' | 'B' | 'C'>('A');
  const [whisperModel, setWhisperModel] = useState<string>('large-v3');
  const [subtitleOnly, setSubtitleOnly] = useState(false);
  const [useDemucs, setUseDemucs] = useState(true);
  const [sourceLang, setSourceLang] = useState('es');
  const [targetLang, setTargetLang] = useState('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const modes = [
    {
      id: 'A',
      title: 'Theatrical Cinema Dub',
      category: 'MAX FIDELITY RELEASE',
      subtitle: 'Actor Voice Cloning • Soundtrack Preserved',
      desc: 'Deep cultural adaptation reasoning via Gemini 2.5 Pro, Demucs 4-stem soundtrack preservation, and pitch-matched neural character casting.',
      badgeColor: 'bg-[#ffe228] text-[#130e30] border-[#130e30]',
      crewCount: '6 Post-Production Agents',
      turnaround: '~2m 15s (Scene Cut)',
      deliverables: 'Master MP4 + Dual 5.1/Stereo WAV + SRT',
    },
    {
      id: 'B',
      title: 'Broadcast Streaming Dub',
      category: 'FAST OTT & TV PIPELINE',
      subtitle: 'High-Throughput Neutral Voice Dub',
      desc: 'Optimized for rapid streaming turnaround with Whisper Turbo dialogue transcription, fast neural voices, and continuous phonetic alignment.',
      badgeColor: 'bg-[#eff2e5] text-[#130e30] border-[#130e30]/30',
      crewCount: '6 Post-Production Agents',
      turnaround: '~1m 05s (Fast Path)',
      deliverables: 'Master MP4 + Master SRT Subtitles',
    },
    {
      id: 'C',
      title: 'Festival Subtitle Master',
      category: 'RAPID SUBTITLE SPRINT',
      subtitle: 'Netflix-Standard 16 CPS Subtitles',
      desc: 'Fastest pipeline path. Skips voice synthesis to deliver timed, Netflix-compliant master subtitle tracks (.srt/.vtt) with 100% original actor audio.',
      badgeColor: 'bg-[#59e25d] text-[#130e30] border-[#130e30]',
      crewCount: '4 Subtitle & QA Agents',
      turnaround: '< 35 seconds',
      deliverables: 'Master SRT + WebVTT Files',
    },
  ];

  const handleModeChange = (modeId: 'A' | 'B' | 'C') => {
    setSelectedMode(modeId);
    if (modeId === 'A') {
      setWhisperModel('large-v3');
      setSubtitleOnly(false);
      setUseDemucs(true);
    } else if (modeId === 'B') {
      setWhisperModel('turbo');
      setSubtitleOnly(false);
      setUseDemucs(true);
    } else if (modeId === 'C') {
      setWhisperModel('turbo');
      setSubtitleOnly(true);
      setUseDemucs(false);
    }
  };

  const loadSampleMovie = () => {
    setFile(null);
    setUseImportPath(false);
    setSampleLoaded(true);
    setImportPath('storage/sample_movie.mp4');
  };

  const parseApiResponse = async (res: Response, fallbackErrorMsg: string) => {
    let data: any = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      try {
        const text = await res.text();
        data = { detail: text };
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      const detail =
        data?.detail ||
        data?.message ||
        (res.status === 500
          ? 'Backend server error (500). Please ensure the Python uvicorn backend is running on port 8000.'
          : `${fallbackErrorMsg} (Status ${res.status})`);
      throw new Error(detail);
    }

    return data;
  };

  const handleLaunch = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let clipId = '';

      if (useImportPath) {
        if (!importPath.trim()) {
          throw new Error('Please specify a valid movie file path');
        }
        const res = await fetch('/api/v1/clips/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: importPath.trim() }),
        });
        const clipData = await parseApiResponse(res, 'Failed to import video file');
        clipId = clipData.id;
      } else {
        if (!file) {
          const res = await fetch('/api/v1/clips/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: 'storage/sample_movie.mp4' }),
          });
          const clipData = await parseApiResponse(res, 'Failed to import sample movie file');
          clipId = clipData.id;
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/v1/clips/upload', {
            method: 'POST',
            body: formData,
          });
          const clipData = await parseApiResponse(res, 'Failed to upload movie clip');
          clipId = clipData.id;
        }
      }

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
        }),
      });

      const runData = await parseApiResponse(runRes, 'Failed to launch autonomous dubbing run');
      router.push(`/runs/${runData.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during dispatch');
      setIsSubmitting(false);
    }
  };

  const hasVideo = Boolean(file || sampleLoaded || importPath);
  const activeVideoName = file ? file.name : sampleLoaded ? 'sample_movie.mp4 (Studio Master Reel)' : importPath || '';

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans text-[#130e30] pb-16">
      {/* Streamlined Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#130e30]/10 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-[#ffe228] px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider text-[#130e30] border border-[#130e30] mb-2">
            <Clapperboard className="w-3.5 h-3.5 fill-current" />
            <span>AI Cinema Post-Production Atelier</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#130e30] tracking-tight uppercase">
            New Film Localization Run
          </h1>
        </div>

        <div className="flex items-center space-x-2 bg-[#eff2e5] border-[1.5px] border-[#130e30] px-4 py-2 rounded-2xl text-xs font-extrabold text-[#130e30] shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#59e25d] animate-pulse border border-[#130e30]" />
          <span>6 Post-Production Agents Armed</span>
        </div>
      </div>

      {errorMsg && (
        <AccessibleErrorReport
          error={errorMsg}
          context="dispatch"
          onRetry={handleLaunch}
          onUseSample={loadSampleMovie}
          onDismiss={() => setErrorMsg('')}
        />
      )}

      {/* =========================================================
          HERO JUDGE DEMO MODE BANNER (35s AI Crew Showcase)
      ========================================================= */}
      <div className="bg-[#f9fbf2] border-[2.5px] border-[#130e30] rounded-[28px] p-6 shadow-[0_8px_30px_rgba(19,14,48,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ffe228] text-[#130e30] border-[2px] border-[#130e30] flex items-center justify-center font-black shadow-xs">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#130e30] text-[#ffe228]">
                HACKATHON PRESENTATION
              </span>
              <span className="text-xs font-mono font-bold text-[#5f5c6e]">35s Calibrated Run</span>
            </div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#130e30] mt-0.5">
              Live Judge Demo: Autonomous AI Crew + YouTube Multi-Audio Dub
            </h3>
            <p className="text-xs text-[#5f5c6e] font-medium">
              Runs the 6-agent post-production pipeline in 35 seconds and plays the localized video with YouTube-style audio tracks (English, Spanish, Hindi, French).
            </p>
          </div>
        </div>

        <Link
          href="/runs/demo"
          className="bg-[#130e30] hover:bg-[#251d5c] text-[#ffe228] border-[2px] border-[#130e30] px-6 py-3.5 rounded-full font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center space-x-2 transition-all active:scale-[0.97] cursor-pointer flex-shrink-0"
        >
          <span>🎬 Launch 35s Live Judge Demo</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </Link>
      </div>

      {/* =========================================================
          HERO STEP 1: MASTER MOVIE FOOTAGE INGESTION & PREVIEW
      ========================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#130e30] text-[#ffe228] flex items-center justify-center font-black text-base border border-[#130e30] shadow-sm">
              01
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#130e30] flex items-center gap-2">
                <span>Master Movie Footage Ingestion</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#ffe228] text-[#130e30] border border-[#130e30]">
                  PRIMARY INPUT
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#5f5c6e] font-medium">
                Drag and drop cinema footage, stream from disk, or preview live video playback
              </p>
            </div>
          </div>

          {/* Quick Sample Reel Trigger & Ingestion Mode Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                loadSampleMovie();
                setActiveIngestionTab('preview');
              }}
              className="flex items-center space-x-2 bg-[#eff2e5] hover:bg-[#ffe228] text-[#130e30] border-[1.5px] border-[#130e30] px-4 py-2 rounded-full text-xs font-extrabold transition-all active:scale-[0.97] cursor-pointer shadow-xs"
            >
              <PlayCircle className="w-4 h-4 text-[#130e30]" />
              <span>Load Studio 4K Sample Reel</span>
            </button>
          </div>
        </div>

        {/* Ingestion Sub-Navigation Tabs */}
        <div className="flex items-center space-x-2 bg-[#eff2e5] p-1.5 rounded-2xl border-[2px] border-[#130e30] w-fit shadow-xs">
          <button
            onClick={() => setActiveIngestionTab('setup')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
              activeIngestionTab === 'setup'
                ? 'bg-[#130e30] text-[#ffe228] shadow-sm'
                : 'text-[#5f5c6e] hover:text-[#130e30]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>1. Ingestion Setup</span>
          </button>

          <button
            onClick={() => setActiveIngestionTab('preview')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
              activeIngestionTab === 'preview'
                ? 'bg-[#130e30] text-[#ffe228] shadow-sm'
                : 'text-[#5f5c6e] hover:text-[#130e30]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>2. Master Video Preview</span>
            {hasVideo ? (
              <span className="w-2 h-2 rounded-full bg-[#59e25d] animate-pulse" />
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 text-[#5f5c6e]">Standby</span>
            )}
          </button>
        </div>

        {activeIngestionTab === 'preview' ? (
          <MasterVideoPreview
            file={file}
            diskPath={importPath}
            isSampleReel={sampleLoaded}
            onBackToSetup={() => setActiveIngestionTab('setup')}
          />
        ) : (
          /* Grand Hero Master Movie Container */
          <div className="bg-white border-[2.5px] border-[#130e30] rounded-[32px] p-6 sm:p-8 space-y-6 shadow-[0_8px_30px_rgba(19,14,48,0.08)]">
            {/* Top Ingestion Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#130e30]/10">
              <div className="flex items-center space-x-3 text-xs font-black">
                <button
                  onClick={() => {
                    setUseImportPath(false);
                    setSampleLoaded(false);
                  }}
                  className={`px-5 py-2.5 rounded-full border-[1.5px] transition-all duration-150 active:scale-[0.97] cursor-pointer flex items-center space-x-2 ${
                    !useImportPath
                      ? 'bg-[#130e30] text-[#ffe228] border-[#130e30] shadow-sm'
                      : 'bg-[#eff2e5] text-[#5f5c6e] border-[#130e30]/20 hover:text-[#130e30]'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Drag &amp; Drop Video File</span>
                </button>
                <button
                  onClick={() => {
                    setUseImportPath(true);
                    setSampleLoaded(false);
                  }}
                  className={`px-5 py-2.5 rounded-full border-[1.5px] transition-all duration-150 active:scale-[0.97] cursor-pointer flex items-center space-x-2 ${
                    useImportPath
                      ? 'bg-[#130e30] text-[#ffe228] border-[#130e30] shadow-sm'
                      : 'bg-[#eff2e5] text-[#5f5c6e] border-[#130e30]/20 hover:text-[#130e30]'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Direct Studio Disk Path</span>
                </button>
              </div>

              {/* Mobile sample button */}
              <button
                onClick={() => {
                  loadSampleMovie();
                  setActiveIngestionTab('preview');
                }}
                className="sm:hidden flex items-center space-x-1.5 bg-[#ffe228] text-[#130e30] border border-[#130e30] px-3 py-1.5 rounded-full text-xs font-extrabold"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Sample Reel</span>
              </button>
            </div>

            {!useImportPath ? (
              /* Cinematic Grand Dropzone */
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload master cinema footage. Drag and drop video file or press Enter to browse."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.getElementById('browse-master-input')?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setFile(e.dataTransfer.files[0]);
                    setSampleLoaded(false);
                  }
                }}
                className={`border-3 border-dashed rounded-[26px] p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer relative focus-visible:ring-2 focus-visible:ring-[#130e30] focus-visible:outline-hidden ${
                  hasVideo
                    ? 'border-[#59e25d] bg-[#f2fcf3] shadow-[0_0_0_3px_#59e25d/30]'
                    : 'border-[#130e30]/40 hover:border-[#130e30] bg-[#f9fbf2] hover:bg-[#fffde6]'
                }`}
              >
                {hasVideo ? (
                  /* Rich Video Ingested State Card */
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-[#130e30] text-[#59e25d] border-[2px] border-[#130e30] flex items-center justify-center mx-auto shadow-md">
                      <Check className="w-9 h-9 stroke-[3]" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#59e25d] text-[#130e30] border border-[#130e30]">
                        MASTER FOOTAGE LOADED &amp; READY
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-[#130e30] tracking-tight mt-2 break-all">
                        {activeVideoName}
                      </h3>
                    </div>

                    {/* Cinema Spec Pills */}
                    <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-mono font-bold text-[#130e30]">
                      <span className="bg-white px-3 py-1 rounded-xl border border-[#130e30]/20">
                        🎬 4K Cinema Master
                      </span>
                      <span className="bg-white px-3 py-1 rounded-xl border border-[#130e30]/20">
                        🔊 5.1 Multitrack Audio
                      </span>
                      <span className="bg-white px-3 py-1 rounded-xl border border-[#130e30]/20">
                        ⚡ Direct Disk 0-Latency
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActiveIngestionTab('preview')}
                        className="bg-[#130e30] hover:bg-[#251d5c] text-[#ffe228] border-[1.5px] border-[#130e30] px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md cursor-pointer active:scale-[0.97] flex items-center space-x-2 focus-visible:ring-2 focus-visible:ring-[#130e30]"
                      >
                        <Film className="w-4 h-4" aria-hidden="true" />
                        <span>Preview Video Tab</span>
                      </button>

                      <label
                        htmlFor="replace-file-input"
                        className="bg-[#ffe228] hover:bg-[#ebd020] text-[#130e30] border-[1.5px] border-[#130e30] px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer active:scale-[0.97] focus-within:ring-2 focus-within:ring-[#130e30]"
                      >
                        <span>Replace Movie File</span>
                        <input
                          id="replace-file-input"
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            setFile(e.target.files?.[0] || null);
                            setSampleLoaded(false);
                          }}
                          className="sr-only"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setSampleLoaded(false);
                        }}
                        className="text-xs font-bold text-[#5f5c6e] hover:text-[#130e30] underline cursor-pointer focus-visible:ring-2 focus-visible:ring-[#130e30] rounded"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty / Awaiting Footage State */
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div className="w-20 h-20 rounded-3xl bg-[#eff2e5] group-hover:bg-[#ffe228] text-[#130e30] border-[2px] border-[#130e30] flex items-center justify-center mx-auto transition-colors shadow-sm">
                      <Film className="w-10 h-10 stroke-[2.2] fill-current text-[#130e30]" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#130e30] tracking-tight">
                        Drag &amp; Drop Master Movie Footage Here
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5f5c6e] mt-1.5 font-normal leading-relaxed">
                        Accepts 4K ProRes 422/4444, H.264, H.265 (.mp4, .mov, .mkv) with multitrack 5.1/stereo dialogue &amp; music stems.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-4">
                      <label
                        htmlFor="browse-master-input"
                        className="bg-[#ffe228] hover:bg-[#ebd020] text-[#130e30] border-[2px] border-[#130e30] px-8 py-3.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_4px_12px_rgba(255,226,40,0.4)] cursor-pointer transition-all active:scale-[0.97] focus-within:ring-2 focus-within:ring-[#130e30]"
                      >
                        <span>Browse Master Files</span>
                        <input
                          id="browse-master-input"
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            setFile(e.target.files?.[0] || null);
                            setSampleLoaded(false);
                          }}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#f9fbf2] p-6 rounded-[22px] border-[2px] border-[#130e30] space-y-4">
                <label
                  htmlFor="import-disk-path-input"
                  className="block text-xs sm:text-sm font-black text-[#130e30] uppercase tracking-wider"
                >
                  Full Movie File Path on Local Disk / SAN
                </label>
                <input
                  id="import-disk-path-input"
                  type="text"
                  value={importPath}
                  onChange={(e) => setImportPath(e.target.value)}
                  placeholder="e.g. storage/sample_movie.mp4 or C:\path\to\movie.mp4"
                  aria-invalid={Boolean(errorMsg && useImportPath)}
                  aria-describedby="import-path-description"
                  className="w-full bg-white border-[2px] border-[#130e30]/40 focus:border-[#130e30] rounded-xl px-4 py-3.5 text-xs sm:text-sm text-[#130e30] font-mono focus:outline-none focus:ring-2 focus:ring-[#ffe228]"
                />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p id="import-path-description" className="text-xs text-[#5f5c6e] font-medium">
                    Directly links master cinema footage stored on local NVMe or studio shared drives without uploading over HTTP.
                  </p>
                  {importPath.trim() && (
                    <button
                      type="button"
                      onClick={() => setActiveIngestionTab('preview')}
                      className="px-4 py-2 bg-[#130e30] hover:bg-[#251d5c] text-[#ffe228] rounded-xl text-xs font-black uppercase tracking-wider border border-[#130e30] transition active:scale-[0.97] cursor-pointer flex items-center space-x-1.5 shadow-xs focus-visible:ring-2 focus-visible:ring-[#130e30]"
                    >
                      <Film className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Preview Footage</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================================
          STEP 2: Language Selection & Sound Direction
      ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#130e30] text-[#ffe228] flex items-center justify-center font-black text-base border border-[#130e30] shadow-sm">
            02
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-[#130e30]">
              Language Pair &amp; Sound Direction
            </h2>
            <p className="text-xs text-[#5f5c6e] font-medium">
              Specify spoken dialogue, target release market, and soundtrack preservation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Box (7 cols): Spoken & Target Dub Languages */}
          <div className="lg:col-span-7 bg-white border-[2px] border-[#130e30] rounded-[28px] p-6 sm:p-7 space-y-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#130e30]/10 mb-4">
                <div className="flex items-center space-x-2">
                  <Languages className="w-4 h-4 text-[#130e30]" aria-hidden="true" />
                  <span className="text-sm font-black uppercase tracking-tight text-[#130e30]">
                    Dialogue Language Settings
                  </span>
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-[#eff2e5] border border-[#130e30]/20 text-[#130e30]">
                  Neural VAD
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Language Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="source-lang-select" className="block text-xs font-black uppercase tracking-wider text-[#130e30]">
                    Original Spoken Dialogue
                  </label>
                  <select
                    id="source-lang-select"
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    aria-describedby="source-lang-help"
                    className="w-full bg-[#f9fbf2] border-[1.5px] border-[#130e30]/30 focus:border-[#130e30] rounded-xl px-4 py-3 text-xs sm:text-sm font-bold text-[#130e30] focus:outline-none focus:ring-2 focus:ring-[#ffe228] cursor-pointer shadow-xs"
                  >
                    <option value="auto">✨ Auto-Detect from Audio</option>
                    <option value="es">Spanish / Latin American (es)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="bn">Bengali (bn)</option>
                    <option value="fr">French (fr)</option>
                    <option value="pt">Portuguese (pt)</option>
                    <option value="ru">Russian (ru)</option>
                    <option value="de">German (de)</option>
                    <option value="ja">Japanese (ja)</option>
                  </select>
                  <p id="source-lang-help" className="text-[11px] text-[#5f5c6e] font-normal leading-tight pt-1">
                    Detects character emotions, dialect idioms, and tone.
                  </p>
                </div>

                {/* Target Language Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="target-lang-select" className="block text-xs font-black uppercase tracking-wider text-[#130e30]">
                    Dub Into Release Language
                  </label>
                  <select
                    id="target-lang-select"
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    aria-describedby="target-lang-help"
                    className="w-full bg-[#f9fbf2] border-[1.5px] border-[#130e30]/30 focus:border-[#130e30] rounded-xl px-4 py-3 text-xs sm:text-sm font-bold text-[#130e30] focus:outline-none focus:ring-2 focus:ring-[#ffe228] cursor-pointer shadow-xs"
                  >
                    <option value="en">English — Theatrical Global (en)</option>
                    <option value="es">Spanish — Latin American (es)</option>
                    <option value="hi">Hindi — Bollywood Neutral (hi)</option>
                    <option value="fr">French — European Standard (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="pt">Portuguese — Brazilian (pt)</option>
                    <option value="ru">Russian (ru)</option>
                  </select>
                  <p id="target-lang-help" className="text-[11px] text-[#5f5c6e] font-normal leading-tight pt-1">
                    Generates culturally adapted scripts and localized speech.
                  </p>
                </div>
              </div>
            </div>

            {/* Speech Recognition Quality */}
            <div className="pt-4 border-t border-[#130e30]/10 space-y-2">
              <label htmlFor="whisper-model-select" className="block text-xs font-black uppercase tracking-wider text-[#130e30]">
                Dialogue Transcription Quality
              </label>
              <select
                id="whisper-model-select"
                value={whisperModel}
                onChange={(e) => setWhisperModel(e.target.value)}
                className="w-full bg-[#f9fbf2] border-[1.5px] border-[#130e30]/30 focus:border-[#130e30] rounded-xl px-4 py-3 text-xs sm:text-sm font-bold text-[#130e30] focus:outline-none focus:ring-2 focus:ring-[#ffe228] cursor-pointer shadow-xs"
              >
                <option value="large-v3">Master Cinema Precision (Whisper Large v3 • Max Actor Diarization)</option>
                <option value="turbo">Fast Broadcast Track (Whisper Turbo • Ultra Fast 8x Realtime)</option>
                <option value="medium">Balanced Studio Grade (Whisper Medium)</option>
              </select>
            </div>
          </div>

          {/* Right Box (5 cols): Soundtrack & Audio Stem Controls */}
          <div className="lg:col-span-5 bg-white border-[2px] border-[#130e30] rounded-[28px] p-6 sm:p-7 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#130e30]/10">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-[#130e30]" />
                <span className="text-sm font-black uppercase tracking-tight text-[#130e30]">
                  Soundtrack &amp; Mixing Options
                </span>
              </div>
              <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-[#59e25d] text-[#130e30] border border-[#130e30]">
                Stem Ready
              </span>
            </div>

            <div className="space-y-3.5 flex-1 flex flex-col justify-center">
              {/* Demucs Vocal Split Card */}
              <div
                onClick={() => setUseDemucs(!useDemucs)}
                className={`p-4 rounded-2xl border-[2px] transition-all duration-150 cursor-pointer select-none active:scale-[0.97] ${
                  useDemucs
                    ? 'bg-[#f9fbf2] border-[#130e30] shadow-[0_0_0_2px_#ffe228,0_4px_12px_rgba(19,14,48,0.06)]'
                    : 'bg-[#eff2e5]/50 border-[#130e30]/20 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${useDemucs ? 'bg-[#59e25d] border border-[#130e30]' : 'bg-[#5f5c6e]'}`} />
                    <span className="text-sm font-black text-[#130e30] uppercase">
                      Preserve Original Music &amp; SFX
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-[#ffe228] text-[#130e30] border border-[#130e30]">
                    {useDemucs ? 'ENABLED' : 'OFF'}
                  </span>
                </div>
                <p className="text-xs text-[#5f5c6e] mt-2 leading-relaxed font-normal">
                  Isolates dialogue so the movie's original musical score, ambiance, and explosion sound effects are <strong className="text-[#130e30] font-bold">100% preserved</strong> under the new dubbed voices.
                </p>
              </div>

              {/* Execution Depth: Full Dub vs Subtitle-Only */}
              <div
                onClick={() => setSubtitleOnly(!subtitleOnly)}
                className={`p-4 rounded-2xl border-[2px] transition-all duration-150 cursor-pointer select-none active:scale-[0.97] ${
                  !subtitleOnly
                    ? 'bg-[#f9fbf2] border-[#130e30] shadow-[0_0_0_2px_#ffe228,0_4px_12px_rgba(19,14,48,0.06)]'
                    : 'bg-[#eff2e5]/50 border-[#130e30]/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${!subtitleOnly ? 'bg-[#ffe228] border border-[#130e30]' : 'bg-[#59e25d] border border-[#130e30]'}`} />
                    <span className="text-sm font-black text-[#130e30] uppercase">
                      {!subtitleOnly ? 'Full Neural Voice Dubbing' : 'Subtitles Only (No Dub)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-[#eff2e5] text-[#130e30] border border-[#130e30]/30">
                    {!subtitleOnly ? 'VOICE + SYNC' : 'SUBTITLE ONLY'}
                  </span>
                </div>
                <p className="text-xs text-[#5f5c6e] mt-2 leading-relaxed font-normal">
                  {!subtitleOnly
                    ? 'Casts in-character voice clones, reconciles lip timing with atempo speed adjust, and synchronizes SRT tracks.'
                    : 'Generates timed master subtitle tracks in <35 seconds while keeping 100% original actor audio.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          STEP 3: Select Post-Production Dubbing Preset
      ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#130e30] text-[#ffe228] flex items-center justify-center font-black text-base border border-[#130e30] shadow-sm">
            03
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-[#130e30]">
              Select Dubbing Preset Profile
            </h2>
            <p className="text-xs text-[#5f5c6e] font-medium">
              Choose your post-production workflow speed and release target
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => handleModeChange(mode.id as any)}
                className={`border-[2px] p-6 sm:p-7 rounded-[28px] cursor-pointer flex flex-col justify-between transition-all duration-150 select-none active:scale-[0.97] ${
                  isSelected
                    ? 'border-[#130e30] shadow-[0_0_0_3px_#ffe228,0_12px_32px_rgba(19,14,48,0.08)] bg-white'
                    : 'border-[#130e30]/20 bg-[#eff2e5]/60 hover:bg-white hover:border-[#130e30]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-mono px-3 py-1 rounded-full font-black uppercase tracking-wider border ${mode.badgeColor}`}>
                      {mode.category}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#130e30] text-[#ffe228] flex items-center justify-center border border-[#130e30] shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-black text-lg text-[#130e30] tracking-tight">{mode.title}</h3>
                  <p className="text-xs font-mono font-bold text-[#5f5c6e] mt-1">{mode.subtitle}</p>
                  <p className="text-xs text-[#130e30]/85 mt-3 leading-relaxed font-normal">{mode.desc}</p>
                </div>

                {/* Structured Operational Metrics */}
                <div className="space-y-2 pt-5 border-t border-[#130e30]/10 text-xs mt-5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f9fbf2] border border-[#130e30]/10">
                    <span className="text-[#5f5c6e] font-medium text-xs">Active Crew:</span>
                    <span className="font-mono font-bold text-[#130e30] text-xs">{mode.crewCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f9fbf2] border border-[#130e30]/10">
                    <span className="text-[#5f5c6e] font-medium text-xs">Est. Turnaround:</span>
                    <span className="font-mono font-bold text-[#130e30] text-xs">{mode.turnaround}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f9fbf2] border border-[#130e30]/10">
                    <span className="text-[#5f5c6e] font-medium text-xs">Deliverables:</span>
                    <span className="font-mono font-bold text-[#130e30] text-xs">{mode.deliverables}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          STEP 4: Dispatch Autonomous Post-Production Crew
      ========================================================= */}
      <div className="p-6 sm:p-8 rounded-[28px] bg-white border-[2.5px] border-[#130e30] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_8px_30px_rgba(19,14,48,0.08)]">
        <div className="space-y-1.5">
          <div className="text-base sm:text-lg font-black uppercase tracking-tight text-[#130e30] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#59e25d] stroke-[3]" />
            <span>Ready to Dispatch Post-Production Crew</span>
          </div>
          <div className="text-xs sm:text-sm text-[#5f5c6e] font-mono flex items-center gap-2 flex-wrap">
            <span>Preset: <strong className="text-[#130e30] font-black">{selectedMode === 'A' ? 'Theatrical Master' : selectedMode === 'B' ? 'Broadcast Streaming' : 'Festival Subtitles'}</strong></span>
            <span>•</span>
            <span>Languages: <strong className="text-[#130e30] font-black">{sourceLang.toUpperCase()} ➔ {targetLang.toUpperCase()}</strong></span>
            <span>•</span>
            <span>Footage: <strong className="text-[#130e30] font-black truncate max-w-[200px]">{hasVideo ? activeVideoName : 'Default Cinema Sample'}</strong></span>
          </div>
        </div>

        <button
          id="btn-launch-run"
          onClick={handleLaunch}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          aria-label={isSubmitting ? 'Initializing post-production crew and launching run' : 'Dispatch localize pipeline and start post-production crew'}
          className="bg-[#ffe228] hover:bg-[#ebd020] text-[#130e30] border-[2px] border-[#130e30] px-8 sm:px-10 py-4 sm:py-5 rounded-full font-black text-sm shadow-[0_4px_16px_rgba(255,226,40,0.4)] flex items-center justify-center space-x-3 transition-all duration-150 active:scale-[0.97] disabled:opacity-50 cursor-pointer flex-shrink-0 focus-visible:ring-2 focus-visible:ring-[#130e30]"
        >
          <span>{isSubmitting ? 'INITIALIZING POST-PRODUCTION CREW…' : 'DISPATCH LOCALIZE PIPELINE ➔'}</span>
          <ArrowRight className="w-5 h-5 stroke-[3]" aria-hidden="true" />
        </button>

        <div role="status" aria-live="polite" className="sr-only">
          {isSubmitting ? 'Launching autonomous post-production crew...' : ''}
        </div>
      </div>

    </div>
  );
}
