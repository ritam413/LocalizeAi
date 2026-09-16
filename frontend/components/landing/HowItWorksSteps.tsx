'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  Sliders,
  CheckCircle2,
  Download,
  Trash2,
  Film,
  Sparkles,
  MousePointer,
  ArrowRight,
  Check,
  ChevronDown
} from 'lucide-react';

interface VariationData {
  id: '1.0' | '2.0' | '3.0';
  label: string;
  badge: string;
  step1Note: string;
  step2Note: string;
  step3Note: string;
}

const VARIATIONS: VariationData[] = [
  {
    id: '1.0',
    label: 'Mode C · Festival Subtitles',
    badge: 'Netflix 16 CPS · <35s',
    step1Note: 'Whisper Turbo transcription & Silero VAD voice isolation',
    step2Note: 'Netflix standard 16 CPS timing compliance (100% original actor audio preserved)',
    step3Note: 'Master SRT/VTT subtitle tracks + original video in <35 seconds',
  },
  {
    id: '2.0',
    label: 'Mode B · Broadcast Streaming',
    badge: 'Fast OTT · 25% Off',
    step1Note: 'Demucs HTDemucs 4-stem vocal separation & background M&E isolation',
    step2Note: 'Isometric syllable pacing & Edge-TTS neural speech in 170+ languages',
    step3Note: 'Broadcast master MP4 + master SRT track in ~1m 05s',
  },
  {
    id: '3.0',
    label: 'Mode A · Theatrical Cinema Master',
    badge: '6 Agents · 14% Off',
    step1Note: 'Character speaker diarization & scene emotional tone tagging',
    step2Note: 'Gemini 2.5 Pro cultural adaptation, character voice cloning & atempo sync',
    step3Note: 'Dual 5.1/Stereo WAV stems, EBU R128 mastering, & QA closed-loop repair',
  },
];

export function HowItWorksSteps() {
  const [activeVariation, setActiveVariation] = useState<'1.0' | '2.0' | '3.0'>('2.0');

  const currentVar = VARIATIONS.find((v) => v.id === activeVariation) || VARIATIONS[1];

  return (
    <section className="space-y-10 py-12">
      {/* Header & Subtitle */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1a1a]">
          How to Use Movie Dubbing for Film Translation
        </h2>
        <p className="text-xs sm:text-sm text-[#575268] max-w-xl mx-auto">
          Localize full-length cinema scenes in 3 automated steps. Choose your desired engine tier below to preview pipeline capabilities.
        </p>

        {/* Model Variation Switcher Tabs (From Photo 5 layout) */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
          {VARIATIONS.map((variation) => {
            const isActive = variation.id === activeVariation;
            return (
              <button
                key={variation.id}
                type="button"
                onClick={() => setActiveVariation(variation.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.96] cursor-pointer flex items-center space-x-2 ${
                  isActive
                    ? 'bg-[#7248ea] text-white shadow-[0_4px_12px_rgba(114,72,234,0.35)]'
                    : 'bg-white hover:bg-[#f8f9fa] text-[#575268] hover:text-[#1a1a1a] border border-[#dbd8e8]'
                }`}
              >
                <span>{variation.label}</span>
                <span
                  className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#f2eeff] text-[#7248ea]'
                  }`}
                >
                  {variation.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Step Cards (reproducing media_1789568859178.png) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* ==================================================================== */}
        {/* Step 1: Upload Your Movie File                                      */}
        {/* ==================================================================== */}
        <div className="p-6 rounded-3xl bg-white border border-[#dbd8e8] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
          <div>
            {/* Visual Illustration Mock representing Step 1 Photo */}
            <div className="h-44 rounded-2xl bg-[#fbfbfd] border border-[#f2f0f8] p-4 flex flex-col items-center justify-center relative overflow-hidden mb-6">
              {/* Drop Target Box */}
              <div className="w-40 h-16 rounded-xl border-2 border-dashed border-[#bd98ec] bg-[#f2eeff]/50 flex flex-col items-center justify-center text-center p-2 mb-3 shadow-xs">
                <UploadCloud className="w-5 h-5 text-[#7248ea] mb-0.5" />
                <span className="text-[10px] font-bold text-[#7248ea]">Upload Your Film Clip</span>
              </div>

              {/* Movie Frame Thumbnail with Forrest Gump / Actor Scene */}
              <div className="w-36 h-16 rounded-lg bg-[#111827] border border-[#dbd8e8] flex items-center justify-center relative shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/30 via-slate-800 to-sky-900/40" />
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center z-10">
                  <Film className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="absolute bottom-1 left-2 text-[8px] font-mono text-white/80">
                  scene_01.mp4
                </div>
              </div>

              {/* Curved Hand-drawn SVG Arrow */}
              <svg
                className="absolute left-6 top-16 w-12 h-16 text-[#7248ea] pointer-events-none"
                viewBox="0 0 50 60"
                fill="none"
              >
                <path
                  d="M15 50 C5 35, 10 20, 35 12"
                  stroke="#7248EA"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <polyline points="28,8 36,12 32,20" stroke="#7248EA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h3 className="text-base font-bold text-[#1a1a1a]">
              Step 1: Upload Your Movie File
            </h3>
            <p className="text-xs text-[#575268] mt-2 leading-relaxed">
              Drag and drop your MP4, MOV, or AVI file—or click to browse from your device, and AI will automatically recognize the language of the video.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f2f0f8] flex items-center space-x-2 text-[10px] font-mono text-[#7248ea]">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate">{currentVar.step1Note}</span>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* Step 2: Set Dubbing Parameters                                      */}
        {/* ==================================================================== */}
        <div className="p-6 rounded-3xl bg-white border border-[#dbd8e8] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
          <div>
            {/* Visual Illustration Mock representing Step 2 Photo */}
            <div className="h-44 rounded-2xl bg-[#fbfbfd] border border-[#f2f0f8] p-4 flex flex-col items-center justify-center relative overflow-hidden mb-6">
              {/* Dropdown Menu UI Mock */}
              <div className="w-48 bg-white rounded-xl border border-[#bd98ec] shadow-md p-2.5 space-y-1.5 z-10">
                <div className="text-[9px] text-[#575268] font-bold uppercase">Translate to</div>
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#f2eeff] text-[#7248ea] text-xs font-bold">
                  <span>🇺🇸 English</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
                <div className="flex items-center space-x-1.5 px-2 py-1 text-[11px] text-[#1a1a1a]">
                  <span>🇪🇸 Spanish</span>
                </div>
              </div>

              {/* Subtitles Toggle with Pointer Click */}
              <div className="mt-3 flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-[#dbd8e8] shadow-xs">
                <span className="text-[10px] font-bold text-[#1a1a1a]">Add Subtitles</span>
                <div className="w-7 h-4 bg-[#7248ea] rounded-full relative">
                  <div className="w-3 h-3 rounded-full bg-white absolute right-0.5 top-0.5 shadow-xs" />
                </div>
              </div>

              {/* Hand Click Pointer Cursor */}
              <div className="absolute right-8 top-12 text-[#1a1a1a] drop-shadow-md">
                <MousePointer className="w-5 h-5 fill-[#1a1a1a] text-white" />
              </div>
            </div>

            <h3 className="text-base font-bold text-[#1a1a1a]">
              Step 2: Set Dubbing Parameters
            </h3>
            <p className="text-xs text-[#575268] mt-2 leading-relaxed">
              Select from supported languages like English, Spanish, French, German, Japanese, and more via a clean dropdown menu, and then choose whether to add subtitles.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f2f0f8] flex items-center space-x-2 text-[10px] font-mono text-[#7248ea]">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate">{currentVar.step2Note}</span>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* Step 3: Review & Download                                           */}
        {/* ==================================================================== */}
        <div className="p-6 rounded-3xl bg-white border border-[#dbd8e8] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group">
          <div>
            {/* Visual Illustration Mock representing Step 3 Photo */}
            <div className="h-44 rounded-2xl bg-[#fbfbfd] border border-[#f2f0f8] p-4 flex flex-col items-center justify-center relative overflow-hidden mb-6">
              {/* History / Review Container Mock */}
              <div className="w-52 bg-white rounded-xl border border-[#dbd8e8] shadow-md p-3 space-y-2">
                <div className="flex items-center justify-between text-[9px] text-[#575268] font-bold uppercase">
                  <span>Preview / History</span>
                  <span className="text-[#7248ea]">Clear All</span>
                </div>

                {/* Output File Row */}
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#f8f9fa] border border-[#dbd8e8]">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded bg-[#111827] flex items-center justify-center">
                      <Film className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#1a1a1a]">demo.mp4</div>
                      <div className="text-[8px] text-[#9e9e9e]">2026/09/16 14:35</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-[#575268]">
                    <button type="button" className="p-1 hover:text-[#7248ea]" title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:text-[#b42318]" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Curved SVG Arrow */}
              <svg
                className="absolute right-4 bottom-4 w-10 h-12 text-[#7248ea] pointer-events-none"
                viewBox="0 0 40 50"
                fill="none"
              >
                <path
                  d="M10 40 C30 35, 30 20, 20 5"
                  stroke="#7248EA"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <polyline points="26,12 20,5 12,8" stroke="#7248EA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h3 className="text-base font-bold text-[#1a1a1a]">
              Step 3: Review & Download
            </h3>
            <p className="text-xs text-[#575268] mt-2 leading-relaxed">
              Click Generate, and watch your dubbed video appear instantly in the right-side history panel—with Play, Download, and Delete options.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f2f0f8] flex items-center space-x-2 text-[10px] font-mono text-[#7248ea]">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate">{currentVar.step3Note}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
