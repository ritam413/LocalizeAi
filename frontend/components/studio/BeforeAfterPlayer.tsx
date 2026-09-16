'use client';

import React, { useState } from 'react';
import { Play, Pause, Volume2, ArrowRightLeft, Radio } from 'lucide-react';

interface BeforeAfterPlayerProps {
  sourceAudioUrl?: string;
  localizedAudioUrl?: string;
  targetLanguage: string;
}

export const BeforeAfterPlayer: React.FC<BeforeAfterPlayerProps> = ({
  sourceAudioUrl,
  localizedAudioUrl,
  targetLanguage,
}) => {
  const [activeTrack, setActiveTrack] = useState<'source' | 'localized'>('localized');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  return (
    <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 rounded-[16px] p-6 shadow-sm space-y-4 font-sans text-[#1a1a1a]">
      <div className="flex items-center justify-between pb-3 border-b border-[#dbd8e8]">
        <div>
          <h4 className="text-xs font-black tracking-tight text-[#1a1a1a] uppercase flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#1a1a1a]" />
            <span>A/B Studio Comparison Monitor</span>
          </h4>
          <p className="text-[11px] text-[#575268]">Toggle instant playback between raw source audio and localized dub stem</p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#fbfbfd] border border-[#dbd8e8]">
          <button
            onClick={() => setActiveTrack('source')}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition active:scale-[0.97] cursor-pointer ${
              activeTrack === 'source'
                ? 'bg-[#130e30] text-white shadow-sm'
                : 'text-[#575268] hover:text-[#1a1a1a]'
            }`}
          >
            Raw Dialogue
          </button>
          <button
            onClick={() => setActiveTrack('localized')}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition active:scale-[0.97] cursor-pointer ${
              activeTrack === 'localized'
                ? 'bg-[#f2eeff] text-[#7248ea] border border-[#dbd8e8] shadow-sm'
                : 'text-[#575268] hover:text-[#1a1a1a]'
            }`}
          >
            Localized {targetLanguage.toUpperCase()}
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-[#dbd8e8] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-11 h-11 rounded-full bg-[#130e30] hover:bg-[#222222] text-[#7248ea] flex items-center justify-center transition active:scale-[0.97] border border-[#dbd8e8] shadow-sm cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <div>
            <div className="text-sm font-extrabold text-[#1a1a1a] flex items-center gap-2">
              <span>{activeTrack === 'source' ? 'Original Dialogue Audio Stem' : `Localized Dub Stem (${targetLanguage.toUpperCase()})`}</span>
              <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f8f9fa] text-[#1a1a1a] border border-[#dbd8e8]">
                48kHz Master
              </span>
            </div>
            <div className="text-xs text-[#575268] font-mono mt-0.5">
              Status: {isPlaying ? 'Playing Waveform' : 'Paused'} • Track: {activeTrack.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#575268]">
          <Volume2 className="w-4 h-4 text-[#1a1a1a]" />
          <span className="text-xs font-mono font-bold text-[#1a1a1a]">100%</span>
        </div>
      </div>
    </div>
  );
};
