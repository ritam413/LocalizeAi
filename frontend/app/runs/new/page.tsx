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
      badgeColor: 'bg-[#f2eeff] text-[#7248ea] border-[#bd98ec]',
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
      badgeColor: 'bg-[#f8f9fa] text-[#575268] border-[#dbd8e8]',
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
      badgeColor: 'bg-[#f0f9eb] text-[#14804a] border-[#c2e7b0]',
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
    <div className="space-y-8 max-w-[1200px] mx-auto font-sans text-[#1a1a1a] pb-16">
      {/* Streamlined Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dbd8e8] pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 bg-[#f2eeff] px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#7248ea] border border-[#bd98ec]/40 mb-2.5">
            <Clapperboard className="w-3.5 h-3.5 fill-current" />
            <span>AI Cinema Post-Production Atelier</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">
            New Film Localization Run
          </h1>
        </div>

        <div className="flex items-center space-x-2 bg-[#ffffff] border border-[#dbd8e8] px-4 py-2 rounded-xl text-xs font-semibold text-[#575268] shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#14804a] animate-pulse" />
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
      <div className="bg-[#ffffff] border border-[#dbd8e8] rounded-[20px] p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-[#bd98ec] transition-all">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#f2eeff] text-[#7248ea] border border-[#bd98ec]/40 flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#7248ea] text-white">
                HACKATHON PRESENTATION
              </span>
              <span className="text-xs font-mono font-semibold text-[#575268]">35s Calibrated Run</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] mt-1">
              Live Judge Demo: Autonomous AI Crew + YouTube Multi-Audio Dub
            </h3>
            <p className="text-xs text-[#575268] font-normal leading-relaxed">
              Runs the 6-agent post-production pipeline in 35 seconds and plays the localized video with YouTube-style audio tracks (English, Spanish, Hindi, French).
            </p>
          </div>
        </div>

        <Link
          href="/runs/demo"
          className="bg-[#7248ea] hover:bg-[#6847ff] text-white px-6 py-3.5 rounded-full font-semibold text-xs tracking-wider shadow-[0_4px_14px_rgba(114,72,234,0.28)] flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer flex-shrink-0"
        >
          <span>🎬 Launch 35s Live Judge Demo</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </Link>
      </div>

      {/* =========================================================
          HERO STEP 1: MASTER MOVIE FOOTAGE INGESTION & PREVIEW
      ========================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#7248ea] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              01
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1a1a1a] flex items-center gap-2">
                <span>Master Movie Footage Ingestion</span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#f2eeff] text-[#7248ea] border border-[#bd98ec]/40">
                  PRIMARY INPUT
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#575268] font-normal">
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
              className="flex items-center space-x-2 bg-[#f2eeff] hover:bg-[#6847ff]/20 hover:border-[#bd98ec] text-[#7248ea] border border-[#bd98ec]/60 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs"
            >
              <PlayCircle className="w-4 h-4 text-[#7248ea]" />
              <span>Load Studio 4K Sample Reel</span>
            </button>
          </div>
        </div>

        {/* Ingestion Sub-Navigation Tabs */}
        <div className="flex items-center space-x-2 bg-[#f8f9fa] p-1.5 rounded-xl border border-[#dbd8e8] w-fit shadow-xs">
          <button
            onClick={() => setActiveIngestionTab('setup')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
              activeIngestionTab === 'setup'
                ? 'bg-[#7248ea] text-white shadow-xs'
                : 'text-[#575268] hover:text-[#1a1a1a]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>1. Ingestion Setup</span>
          </button>

          <button
            onClick={() => setActiveIngestionTab('preview')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
              activeIngestionTab === 'preview'
                ? 'bg-[#7248ea] text-white shadow-xs'
                : 'text-[#575268] hover:text-[#1a1a1a]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>2. Master Video Preview</span>
            {hasVideo ? (
              <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 text-[#575268]">Standby</span>
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
          <div className="bg-white border border-[#dbd8e8] rounded-[20px] p-6 sm:p-8 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            {/* Top Ingestion Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#dbd8e8]">
              <div className="flex items-center space-x-3 text-xs font-semibold">
                <button
                  onClick={() => {
                    setUseImportPath(false);
                    setSampleLoaded(false);
                  }}
                  className={`px-5 py-2.5 rounded-full border transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center space-x-2 ${
                    !useImportPath
                      ? 'bg-[#7248ea] text-white border-[#7248ea] shadow-xs'
                      : 'bg-[#f8f9fa] text-[#575268] border-[#dbd8e8] hover:text-[#1a1a1a]'
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
                  className={`px-5 py-2.5 rounded-full border transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center space-x-2 ${
                    useImportPath
                      ? 'bg-[#7248ea] text-white border-[#7248ea] shadow-xs'
                      : 'bg-[#f8f9fa] text-[#575268] border-[#dbd8e8] hover:text-[#1a1a1a]'
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
                className="sm:hidden flex items-center space-x-1.5 bg-[#f2eeff] text-[#7248ea] border border-[#bd98ec] px-3 py-1.5 rounded-full text-xs font-semibold"
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
                className={`border-2 border-dashed rounded-[16px] p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer relative focus-visible:ring-2 focus-visible:ring-[#7248ea] focus-visible:outline-hidden ${
                  hasVideo
                    ? 'border-[#00d4aa] bg-[#f0fdf9] shadow-sm'
                    : 'border-[#bd98ec] hover:border-[#7248ea] bg-[#fbfbfd] hover:bg-[#f2eeff]/30'
                }`}
              >
                {hasVideo ? (
                  /* Rich Video Ingested State Card */
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-[#00d4aa]/15 text-[#00d4aa] border border-[#00d4aa]/30 flex items-center justify-center mx-auto shadow-sm">
                      <Check className="w-8 h-8 stroke-[3]" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#f0f9eb] text-[#14804a] border border-[#c2e7b0]">
                        MASTER FOOTAGE LOADED &amp; READY
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] tracking-tight mt-2 break-all">
                        {activeVideoName}
                      </h3>
                    </div>

                    {/* Cinema Spec Pills */}
                    <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-mono font-medium text-[#575268]">
                      <span className="bg-white px-3 py-1 rounded-lg border border-[#dbd8e8]">
                        🎬 4K Cinema Master
                      </span>
                      <span className="bg-white px-3 py-1 rounded-lg border border-[#dbd8e8]">
                        🔊 5.1 Multitrack Audio
                      </span>
                      <span className="bg-white px-3 py-1 rounded-lg border border-[#dbd8e8]">
                        ⚡ Direct Disk 0-Latency
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActiveIngestionTab('preview')}
                        className="bg-[#7248ea] hover:bg-[#6847ff] text-white px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm cursor-pointer active:scale-[0.98] flex items-center space-x-2 focus-visible:ring-2 focus-visible:ring-[#7248ea]"
                      >
                        <Film className="w-4 h-4" aria-hidden="true" />
                        <span>Preview Video Tab</span>
                      </button>

                      <label
                        htmlFor="replace-file-input"
                        className="bg-[#f2eeff] hover:bg-[#e8e0ff] text-[#7248ea] border border-[#bd98ec]/60 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-xs cursor-pointer active:scale-[0.98] focus-within:ring-2 focus-within:ring-[#7248ea]"
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
                        className="text-xs font-medium text-[#575268] hover:text-[#b42318] underline cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7248ea] rounded"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty / Awaiting Footage State */
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-[#f2eeff] text-[#7248ea] border border-[#bd98ec]/40 flex items-center justify-center mx-auto shadow-sm">
                      <Film className="w-8 h-8 stroke-[2]" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] tracking-tight">
                        Drag &amp; Drop Master Movie Footage Here
                      </h3>
                      <p className="text-xs sm:text-sm text-[#575268] mt-1.5 font-normal leading-relaxed">
                        Accepts 4K ProRes 422/4444, H.264, H.265 (.mp4, .mov, .mkv) with multitrack 5.1/stereo dialogue &amp; music stems.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-4">
                      <label
                        htmlFor="browse-master-input"
                        className="bg-[#7248ea] hover:bg-[#6847ff] text-white px-8 py-3.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider shadow-[0_4px_14px_rgba(114,72,234,0.28)] cursor-pointer transition-all active:scale-[0.98] focus-within:ring-2 focus-within:ring-[#7248ea]"
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
              <div className="bg-[#f8f9fa] p-6 rounded-[16px] border border-[#dbd8e8] space-y-4">
                <label
                  htmlFor="import-disk-path-input"
                  className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] uppercase tracking-wider"
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
                  className="w-full bg-white border border-[#dbd8e8] focus:border-[#7248ea] rounded-xl px-4 py-3.5 text-xs sm:text-sm text-[#1a1a1a] font-mono focus:outline-none focus:ring-2 focus:ring-[#7248ea]/20"
                />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p id="import-path-description" className="text-xs text-[#575268] font-normal">
                    Directly links master cinema footage stored on local NVMe or studio shared drives without uploading over HTTP.
                  </p>
                  {importPath.trim() && (
                    <button
                      type="button"
                      onClick={() => setActiveIngestionTab('preview')}
                      className="px-4 py-2 bg-[#7248ea] hover:bg-[#6847ff] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition active:scale-[0.98] cursor-pointer flex items-center space-x-1.5 shadow-xs focus-visible:ring-2 focus-visible:ring-[#7248ea]"
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
          <div className="w-9 h-9 rounded-full bg-[#7248ea] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            02
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">
              Language Pair &amp; Sound Direction
            </h2>
            <p className="text-xs text-[#575268] font-normal">
              Specify spoken dialogue, target release market, and soundtrack preservation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Box (7 cols): Spoken & Target Dub Languages */}
          <div className="lg:col-span-7 bg-white border border-[#dbd8e8] rounded-[20px] p-6 sm:p-7 space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#dbd8e8] mb-4">
                <div className="flex items-center space-x-2">
                  <Languages className="w-4 h-4 text-[#7248ea]" aria-hidden="true" />
                  <span className="text-sm font-bold text-[#1a1a1a]">
                    Dialogue Language Settings
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#f2eeff] border border-[#bd98ec]/30 text-[#7248ea]">
                  Neural VAD
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Language Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="source-lang-select" className="block text-xs font-semibold uppercase tracking-wider text-[#575268]">
                    Original Spoken Dialogue
                  </label>
                  <select
                    id="source-lang-select"
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    aria-describedby="source-lang-help"
                    className="w-full bg-[#fbfbfd] border border-[#dbd8e8] focus:border-[#7248ea] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7248ea]/20 cursor-pointer shadow-xs"
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
                  <p id="source-lang-help" className="text-[11px] text-[#575268] font-normal leading-tight pt-1">
                    Detects character emotions, dialect idioms, and tone.
                  </p>
                </div>

                {/* Target Language Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="target-lang-select" className="block text-xs font-semibold uppercase tracking-wider text-[#575268]">
                    Dub Into Release Language
                  </label>
                  <select
                    id="target-lang-select"
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    aria-describedby="target-lang-help"
                    className="w-full bg-[#fbfbfd] border border-[#dbd8e8] focus:border-[#7248ea] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7248ea]/20 cursor-pointer shadow-xs"
                  >
                    <option value="en">English — Theatrical Global (en)</option>
                    <option value="es">Spanish — Latin American (es)</option>
                    <option value="hi">Hindi — Bollywood Neutral (hi)</option>
                    <option value="fr">French — European Standard (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="pt">Portuguese — Brazilian (pt)</option>
                    <option value="ru">Russian (ru)</option>
                  </select>
                  <p id="target-lang-help" className="text-[11px] text-[#575268] font-normal leading-tight pt-1">
                    Generates culturally adapted scripts and localized speech.
                  </p>
                </div>
              </div>
            </div>

            {/* Speech Recognition Quality */}
            <div className="pt-4 border-t border-[#dbd8e8] space-y-2">
              <label htmlFor="whisper-model-select" className="block text-xs font-semibold uppercase tracking-wider text-[#575268]">
                Dialogue Transcription Quality
              </label>
              <select
                id="whisper-model-select"
                value={whisperModel}
                onChange={(e) => setWhisperModel(e.target.value)}
                className="w-full bg-[#fbfbfd] border border-[#dbd8e8] focus:border-[#7248ea] rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#7248ea]/20 cursor-pointer shadow-xs"
              >
                <option value="large-v3">Master Cinema Precision (Whisper Large v3 • Max Actor Diarization)</option>
                <option value="turbo">Fast Broadcast Track (Whisper Turbo • Ultra Fast 8x Realtime)</option>
                <option value="medium">Balanced Studio Grade (Whisper Medium)</option>
              </select>
            </div>
          </div>

          {/* Right Box (5 cols): Soundtrack & Audio Stem Controls */}
          <div className="lg:col-span-5 bg-white border border-[#dbd8e8] rounded-[20px] p-6 sm:p-7 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#dbd8e8]">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-[#7248ea]" />
                <span className="text-sm font-bold text-[#1a1a1a]">
                  Soundtrack &amp; Mixing Options
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#f0f9eb] text-[#14804a] border border-[#c2e7b0]">
                Stem Ready
              </span>
            </div>

            <div className="space-y-3.5 flex-1 flex flex-col justify-center">
              {/* Demucs Vocal Split Card */}
              <div
                onClick={() => setUseDemucs(!useDemucs)}
                className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                  useDemucs
                    ? 'bg-[#f2eeff] border-[#bd98ec] shadow-xs'
                    : 'bg-[#f8f9fa] border-[#dbd8e8] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${useDemucs ? 'bg-[#00d4aa]' : 'bg-[#9e9e9e]'}`} />
                    <span className={`text-sm font-semibold ${useDemucs ? 'text-[#7248ea]' : 'text-[#1a1a1a]'}`}>
                      Preserve Original Music &amp; SFX
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${useDemucs ? 'bg-[#7248ea] text-white' : 'bg-[#dbd8e8] text-[#575268]'}`}>
                    {useDemucs ? 'ENABLED' : 'OFF'}
                  </span>
                </div>
                <p className="text-xs text-[#575268] mt-2 leading-relaxed font-normal">
                  Isolates dialogue so the movie's original musical score, ambiance, and explosion sound effects are <strong className="text-[#1a1a1a] font-semibold">100% preserved</strong> under the new dubbed voices.
                </p>
              </div>

              {/* Execution Depth: Full Dub vs Subtitle-Only */}
              <div
                onClick={() => setSubtitleOnly(!subtitleOnly)}
                className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                  !subtitleOnly
                    ? 'bg-[#f2eeff] border-[#bd98ec] shadow-xs'
                    : 'bg-[#f8f9fa] border-[#dbd8e8]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${!subtitleOnly ? 'bg-[#7248ea]' : 'bg-[#00d4aa]'}`} />
                    <span className={`text-sm font-semibold ${!subtitleOnly ? 'text-[#7248ea]' : 'text-[#1a1a1a]'}`}>
                      {!subtitleOnly ? 'Full Neural Voice Dubbing' : 'Subtitles Only (No Dub)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white text-[#575268] border border-[#dbd8e8]">
                    {!subtitleOnly ? 'VOICE + SYNC' : 'SUBTITLE ONLY'}
                  </span>
                </div>
                <p className="text-xs text-[#575268] mt-2 leading-relaxed font-normal">
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
          <div className="w-9 h-9 rounded-full bg-[#7248ea] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            03
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">
              Select Dubbing Preset Profile
            </h2>
            <p className="text-xs text-[#575268] font-normal">
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
                className={`border p-6 sm:p-7 rounded-[20px] cursor-pointer flex flex-col justify-between transition-all duration-150 select-none active:scale-[0.98] ${
                  isSelected
                    ? 'border-[#7248ea] shadow-[0_4px_16px_rgba(114,72,234,0.15)] bg-white ring-2 ring-[#7248ea]/20'
                    : 'border-[#dbd8e8] bg-white hover:border-[#bd98ec]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${mode.badgeColor}`}>
                      {mode.category}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#7248ea] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-[#1a1a1a] tracking-tight">{mode.title}</h3>
                  <p className="text-xs font-mono font-medium text-[#7248ea] mt-1">{mode.subtitle}</p>
                  <p className="text-xs text-[#575268] mt-3 leading-relaxed font-normal">{mode.desc}</p>
                </div>

                {/* Structured Operational Metrics */}
                <div className="space-y-2 pt-5 border-t border-[#dbd8e8] text-xs mt-5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8f9fa] border border-[#dbd8e8]/60">
                    <span className="text-[#575268] font-medium text-xs">Active Crew:</span>
                    <span className="font-mono font-semibold text-[#1a1a1a] text-xs">{mode.crewCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8f9fa] border border-[#dbd8e8]/60">
                    <span className="text-[#575268] font-medium text-xs">Est. Turnaround:</span>
                    <span className="font-mono font-semibold text-[#1a1a1a] text-xs">{mode.turnaround}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8f9fa] border border-[#dbd8e8]/60">
                    <span className="text-[#575268] font-medium text-xs">Deliverables:</span>
                    <span className="font-mono font-semibold text-[#1a1a1a] text-xs">{mode.deliverables}</span>
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
      <div className="p-6 sm:p-8 rounded-[20px] bg-white border border-[#dbd8e8] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="space-y-1.5">
          <div className="text-base sm:text-lg font-bold text-[#1a1a1a] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#14804a] stroke-[2.5]" />
            <span>Ready to Dispatch Post-Production Crew</span>
          </div>
          <div className="text-xs sm:text-sm text-[#575268] font-mono flex items-center gap-2 flex-wrap">
            <span>Preset: <strong className="text-[#1a1a1a] font-semibold">{selectedMode === 'A' ? 'Theatrical Master' : selectedMode === 'B' ? 'Broadcast Streaming' : 'Festival Subtitles'}</strong></span>
            <span>•</span>
            <span>Languages: <strong className="text-[#7248ea] font-semibold">{sourceLang.toUpperCase()} ➔ {targetLang.toUpperCase()}</strong></span>
            <span>•</span>
            <span>Footage: <strong className="text-[#1a1a1a] font-semibold truncate max-w-[200px]">{hasVideo ? activeVideoName : 'Default Cinema Sample'}</strong></span>
          </div>
        </div>

        <button
          id="btn-launch-run"
          onClick={handleLaunch}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          aria-label={isSubmitting ? 'Initializing post-production crew and launching run' : 'Dispatch localize pipeline and start post-production crew'}
          className="bg-[#7248ea] hover:bg-[#6847ff] text-white px-8 sm:px-10 py-4 sm:py-4.5 rounded-full font-bold text-sm shadow-[0_4px_16px_rgba(114,72,234,0.3)] flex items-center justify-center space-x-3 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex-shrink-0 focus-visible:ring-2 focus-visible:ring-[#7248ea]"
        >
          <span>{isSubmitting ? 'INITIALIZING POST-PRODUCTION CREW…' : 'DISPATCH LOCALIZE PIPELINE ➔'}</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
        </button>

        <div role="status" aria-live="polite" className="sr-only">
          {isSubmitting ? 'Launching autonomous post-production crew...' : ''}
        </div>
      </div>

    </div>
  );
}
