import React, { useState } from 'react';
import { Play, Pause, Volume2, ArrowRightLeft } from 'lucide-react';

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
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h4 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            A/B Studio Comparison Monitor
          </h4>
          <p className="text-xs text-zinc-400">Toggle between raw source audio and localized dub stem</p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => setActiveTrack('source')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
              activeTrack === 'source'
                ? 'bg-zinc-800 text-zinc-100 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Raw English
          </button>
          <button
            onClick={() => setActiveTrack('localized')}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
              activeTrack === 'localized'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Localized {targetLanguage.toUpperCase()}
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center transition shadow-lg shadow-emerald-500/20"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <div>
            <div className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <span>{activeTrack === 'source' ? 'Original Dialogue Stem' : `Localized Dub Stem (${targetLanguage.toUpperCase()})`}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                16kHz PCM
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              Status: {isPlaying ? 'Playing' : 'Paused'} • Active Track: {activeTrack.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <Volume2 className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-mono">100%</span>
        </div>
      </div>
    </div>
  );
};
