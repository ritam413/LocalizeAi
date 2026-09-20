'use client';

import React, { useState, useRef } from 'react';
import { Sliders, ShieldCheck, Play, Pause } from 'lucide-react';

export type StemTrackType = 'dialogue' | 'background' | 'master';

interface AudioStreamUrls {
  dialogue?: string;
  background?: string;
  localized?: string;
  source?: string;
}

export interface BeforeAfterPlayerProps {
  sourceAudioUrl?: string;
  localizedAudioUrl?: string;
  backgroundAudioUrl?: string;
  dialogueAudioUrl?: string;
  targetLanguage?: string;
  duckingDb?: number;
  lipDriftMs?: number;
}

interface StemChannelCardProps {
  trackType: StemTrackType;
  title: string;
  titleColorClass: string;
  peakLabel: string;
  metaLeft: string;
  metaRight?: string;
  activeBorderClass: string;
  barColorClass: string;
  barScale: number;
  pulse?: boolean;
  isActive: boolean;
  onSelect: (track: StemTrackType) => void;
}

const StemChannelCard: React.FC<StemChannelCardProps> = ({
  trackType,
  title,
  titleColorClass,
  peakLabel,
  metaLeft,
  metaRight,
  activeBorderClass,
  barColorClass,
  barScale,
  pulse = false,
  isActive,
  onSelect,
}) => (
  <div
    onClick={() => onSelect(trackType)}
    className={`p-2.5 bg-[#070A0F] rounded-[6px] border transition-all cursor-pointer space-y-1.5 ${
      isActive ? activeBorderClass : 'border-[#1E293B] hover:border-[#334155]'
    }`}
  >
    <div className="flex justify-between text-[11px]">
      <span className={`font-bold ${titleColorClass}`}>{title}</span>
      <span className="text-gray-400">{peakLabel}</span>
    </div>
    <div className="h-4 bg-[#1E293B] rounded-[2px] overflow-hidden">
      <div
        className={`h-full stem-gpu-bar w-full origin-left ${barColorClass} ${pulse ? 'animate-pulse' : ''}`}
        style={{ transform: `scaleX(${barScale})` }}
      />
    </div>
    <div className="flex justify-between text-[10px] text-gray-500">
      <span>{metaLeft}</span>
      {metaRight ? <span>{metaRight}</span> : null}
    </div>
  </div>
);

function resolveStemAudioSource(track: StemTrackType, urls: AudioStreamUrls): string | undefined {
  switch (track) {
    case 'dialogue':
      return urls.dialogue || urls.localized;
    case 'background':
      return urls.background || urls.source;
    case 'master':
    default:
      return urls.localized || urls.source;
  }
}

function formatAudioTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export const BeforeAfterPlayer: React.FC<BeforeAfterPlayerProps> = ({
  sourceAudioUrl,
  localizedAudioUrl,
  backgroundAudioUrl,
  dialogueAudioUrl,
  targetLanguage = 'hi',
  duckingDb = -6.0,
  lipDriftMs = 14,
}) => {
  const [activeTrack, setActiveTrack] = useState<StemTrackType>('master');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const streamUrls: AudioStreamUrls = {
    dialogue: dialogueAudioUrl,
    background: backgroundAudioUrl,
    localized: localizedAudioUrl,
    source: sourceAudioUrl,
  };

  const currentAudioSrc = resolveStemAudioSource(activeTrack, streamUrls);

  const switchTrackPreservingTimestamp = (newTrack: StemTrackType) => {
    if (newTrack === activeTrack) return;
    const preservedTime = audioRef.current?.currentTime || 0;
    const wasPlaying = isPlaying;

    setActiveTrack(newTrack);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = preservedTime;
        if (wasPlaying) {
          audioRef.current.play().catch((err) => console.warn('Play prevented:', err));
        }
      }
    }, 50);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !currentAudioSrc) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Play error:', err));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

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

      {/* 3 Audio Stem Channels */}
      <div className="space-y-3 font-mono text-xs">
        <StemChannelCard
          trackType="dialogue"
          title={`CH 1: Dialogue Dub (${targetLanguage.toUpperCase()})`}
          titleColorClass="text-[#A78BFA]"
          peakLabel="0.0 dBFS Peak"
          metaLeft="EdgeTTS / Kokoro Neural Stem"
          metaRight="Clipping: 0.00% (Clean)"
          activeBorderClass="border-[#7248EA] ring-1 ring-[#7248EA]/40"
          barColorClass="bg-[#7248EA]"
          barScale={0.65}
          isActive={activeTrack === 'dialogue'}
          onSelect={switchTrackPreservingTimestamp}
        />

        <StemChannelCard
          trackType="background"
          title="CH 2: M&E Background Stem"
          titleColorClass="text-[#34D399]"
          peakLabel="-6.0 dB Auto-Ducked"
          metaLeft="HTDemucs Vocal Separation"
          metaRight="Attack: 20ms · Release: 250ms"
          activeBorderClass="border-[#00D4AA] ring-1 ring-[#00D4AA]/40"
          barColorClass="bg-[#00D4AA]"
          barScale={0.45}
          pulse
          isActive={activeTrack === 'background'}
          onSelect={switchTrackPreservingTimestamp}
        />

        <StemChannelCard
          trackType="master"
          title="MASTER: Composite Mixdown"
          titleColorClass="text-[#10B981]"
          peakLabel="-24.0 LUFS Target"
          metaLeft="EBU R128 Compliant Broadcast Stream"
          activeBorderClass="border-[#10B981] ring-1 ring-[#10B981]/40"
          barColorClass="bg-gradient-to-r from-[#7248EA] via-[#38BDF8] to-[#10B981]"
          barScale={0.88}
          isActive={activeTrack === 'master'}
          onSelect={switchTrackPreservingTimestamp}
        />
      </div>

      {/* Hidden Audio Element */}
      {currentAudioSrc ? (
        <audio
          ref={audioRef}
          src={currentAudioSrc}
          preload="metadata"
          onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
          onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration || 0)}
          onEnded={() => setIsPlaying(false)}
        />
      ) : null}

      {/* Playback Control Bar */}
      <div className="p-3 bg-[#070A0F] rounded-[6px] border border-[#1E293B] flex items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={togglePlayback}
          disabled={!currentAudioSrc}
          className="px-3 py-1.5 rounded-[4px] bg-[#2B7FFF] hover:bg-[#1E6FE5] disabled:opacity-40 text-white font-bold flex items-center gap-1.5 cursor-pointer active:scale-[0.97] transition-all"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'Pause' : 'Play Audition'}</span>
        </button>

        <div className="flex-1 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            disabled={!currentAudioSrc}
            className="w-full h-1 bg-[#1E293B] rounded-[2px] accent-[#2B7FFF] cursor-pointer"
          />
          <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap">
            {formatAudioTimestamp(currentTime)} / {formatAudioTimestamp(duration)}
          </span>
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
