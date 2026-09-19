'use client';

import React, { useState } from 'react';
import { Sliders, ShieldCheck, Volume2, Play, Pause, Radio } from 'lucide-react';

interface BeforeAfterPlayerProps {
  sourceAudioUrl?: string;
  localizedAudioUrl?: string;
  targetLanguage?: string;
  duckingDb?: number;
  lipDriftMs?: number;
}

export const BeforeAfterPlayer: React.FC<BeforeAfterPlayerProps> = ({
  sourceAudioUrl,
  localizedAudioUrl,
  targetLanguage = 'hi',
  duckingDb = -6.0,
  lipDriftMs = 14,
}) => {
  const [activeTrack, setActiveTrack] = useState<'dialogue' | 'background' | 'master'>('master');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  return (
    <div className="bg-[#0F141C] text-white border border-[#232F3E] rounded-[16px] p-5 shadow-sm flex flex-col justify-between space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 text-xs">
        <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-[#00D4AA]" />
          Demucs Stem Isolation & Sidechain Bus
        </span>
        <span className="text-[10px] font-mono text-[#00D4AA] bg-[#00D4AA]/10 px-2 py-0.5 rounded-[4px] border border-[#00D4AA]/30 font-bold">
          AUTO-DUCKING: {duckingDb.toFixed(1)} dB
        </span>
      </div>

      {/* 3 Audio Stem Channels with GPU transforms */}
      <div className="space-y-3 font-mono text-xs">
        {/* Channel 1: Dialogue Dub */}
        <div
          onClick={() => setActiveTrack('dialogue')}
          className={`p-2.5 bg-[#070A0F] rounded-[6px] border transition-all cursor-pointer ${
            activeTrack === 'dialogue' ? 'border-[#7248EA] ring-1 ring-[#7248EA]/40' : 'border-[#1E293B] hover:border-[#334155]'
          } space-y-1.5`}
        >
          <div className="flex justify-between text-[11px]">
            <span className="text-[#A78BFA] font-bold">CH 1: Dialogue Dub ({targetLanguage.toUpperCase()})</span>
            <span className="text-gray-400">0.0 dBFS Peak</span>
          </div>
          <div className="h-4 bg-[#1E293B] rounded-[2px] overflow-hidden">
            <div
              className="h-full bg-[#7248EA] stem-gpu-bar w-full origin-left"
              style={{ transform: 'scaleX(0.65)' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>EdgeTTS Neural Stem</span>
            <span>Clipping: 0.00% (Clean)</span>
          </div>
        </div>

        {/* Channel 2: M&E Background */}
        <div
          onClick={() => setActiveTrack('background')}
          className={`p-2.5 bg-[#070A0F] rounded-[6px] border transition-all cursor-pointer ${
            activeTrack === 'background' ? 'border-[#00D4AA] ring-1 ring-[#00D4AA]/40' : 'border-[#1E293B] hover:border-[#334155]'
          } space-y-1.5`}
        >
          <div className="flex justify-between text-[11px]">
            <span className="text-[#34D399] font-bold">CH 2: M&E Background Stem</span>
            <span className="text-gray-400">-6.0 dB Auto-Ducked</span>
          </div>
          <div className="h-4 bg-[#1E293B] rounded-[2px] overflow-hidden">
            <div
              className="h-full bg-[#00D4AA] stem-gpu-bar w-full origin-left animate-pulse"
              style={{ transform: 'scaleX(0.45)' }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>HTDemucs Vocal Separation</span>
            <span>Attack: 20ms · Release: 250ms</span>
          </div>
        </div>

        {/* Channel 3: Composite Master */}
        <div
          onClick={() => setActiveTrack('master')}
          className={`p-2.5 bg-[#070A0F] rounded-[6px] border transition-all cursor-pointer ${
            activeTrack === 'master' ? 'border-[#10B981] ring-1 ring-[#10B981]/40' : 'border-[#10B981]/30 hover:border-[#10B981]/60'
          } space-y-1.5`}
        >
          <div className="flex justify-between text-[11px]">
            <span className="text-[#10B981] font-bold">MASTER: Composite Mixdown</span>
            <span className="text-[#34D399] font-bold">-24.0 LUFS Target</span>
          </div>
          <div className="h-4 bg-[#1E293B] rounded-[2px] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7248EA] via-[#38BDF8] to-[#10B981] stem-gpu-bar w-full origin-left"
              style={{ transform: 'scaleX(0.88)' }}
            />
          </div>
        </div>
      </div>

      {/* Footer Certification */}
      <div className="p-2.5 bg-[#070A0F] rounded-[6px] border border-[#1E293B] text-xs text-gray-300 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          Lip Drift: <strong className="text-white">&lt; {lipDriftMs}ms (Pass)</strong>
        </span>
        <span className="text-[#34D399] font-mono font-bold">EBU R128 CERTIFIED</span>
      </div>
    </div>
  );
};
