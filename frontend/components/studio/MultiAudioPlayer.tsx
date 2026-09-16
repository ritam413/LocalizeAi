'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Film,
  Sparkles,
  Globe2,
  Subtitles,
  Check,
  ChevronDown,
  AudioWaveform,
  Sliders,
  ShieldCheck,
  Zap
} from 'lucide-react';

export interface AudioTrackOption {
  id: string;
  language_code: string;
  language_name: string;
  flag: string;
  voice: string;
  video_url: string;
  audio_url: string;
  subtitle_vtt_url?: string | null;
  subtitle_srt_url?: string | null;
  quality_score?: number;
  is_original?: boolean;
}

export interface MultiAudioPlayerProps {
  tracks?: AudioTrackOption[];
  defaultTrackId?: string;
  title?: string;
  onTrackChange?: (track: AudioTrackOption) => void;
}

const DEFAULT_TRACKS: AudioTrackOption[] = [
  {
    id: 'original',
    language_code: 'en',
    language_name: 'English (Original Master)',
    flag: '🇺🇸',
    voice: 'Original Cast (Studio Direct)',
    video_url: '/api/v1/clips/preview-stream?path=storage/sample_movie.mp4',
    audio_url: '/api/v1/clips/preview-stream?path=storage/trial1_raw.wav',
    subtitle_vtt_url: null,
    quality_score: 100.0,
    is_original: true,
  },
  {
    id: 'spanish',
    language_code: 'es',
    language_name: 'Spanish (Castilian Studio Dub)',
    flag: '🇪🇸',
    voice: 'Alvaro Neural (es-ES)',
    video_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/es/trial1_es_dubbed.mp4',
    audio_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/es/master_dub_es.wav',
    subtitle_vtt_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/es/subtitles_es.vtt',
    subtitle_srt_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/es/subtitles_es.srt',
    quality_score: 98.0,
    is_original: false,
  },
  {
    id: 'hindi',
    language_code: 'hi',
    language_name: 'Hindi (Bollywood Studio Dub)',
    flag: '🇮🇳',
    voice: 'Madhur Neural (hi-IN)',
    video_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/hi/trial1_hi_dubbed.mp4',
    audio_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/hi/master_dub_hi.wav',
    subtitle_vtt_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/hi/subtitles_hi.vtt',
    subtitle_srt_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/hi/subtitles_hi.srt',
    quality_score: 98.0,
    is_original: false,
  },
  {
    id: 'french',
    language_code: 'fr',
    language_name: 'French (Parisian Studio Dub)',
    flag: '🇫🇷',
    voice: 'Henri Neural (fr-FR)',
    video_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/fr/trial1_fr_dubbed.mp4',
    audio_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/fr/master_dub_fr.wav',
    subtitle_vtt_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/fr/subtitles_fr.vtt',
    subtitle_srt_url: '/api/v1/clips/preview-stream?path=storage/runs/trial1_multilingual/fr/subtitles_fr.srt',
    quality_score: 98.0,
    is_original: false,
  },
];

export const MultiAudioPlayer: React.FC<MultiAudioPlayerProps> = ({
  tracks = DEFAULT_TRACKS,
  defaultTrackId = 'hindi',
  title = 'Hackathon Winner Release Clip - Afan Mustafa Claude Code',
  onTrackChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(defaultTrackId);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showAudioMenu, setShowAudioMenu] = useState<boolean>(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState<boolean>(false);
  const [activeSubtitleLang, setActiveSubtitleLang] = useState<string | null>(defaultTrackId);
  const [trackNotification, setTrackNotification] = useState<string | null>(null);

  const activeTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];

  // Switch track while preserving current playback position and state
  const handleSelectTrack = (track: AudioTrackOption) => {
    if (track.id === selectedTrackId) {
      setShowAudioMenu(false);
      return;
    }

    const prevTime = videoRef.current?.currentTime || currentTime;
    const wasPlaying = isPlaying;

    setSelectedTrackId(track.id);
    setActiveSubtitleLang(track.language_code);
    setShowAudioMenu(false);

    setTrackNotification(`Switched to ${track.flag} ${track.language_name}`);
    setTimeout(() => setTrackNotification(null), 3000);

    if (onTrackChange) {
      onTrackChange(track);
    }

    // Restore playback time on source load
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = prevTime;
        if (wasPlaying) {
          videoRef.current.play().catch((err) => console.warn('Play interrupted:', err));
        }
      }
    }, 100);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => console.warn('Autoplay error:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    videoRef.current.muted = newMute;
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch((err) => console.warn('Play prevented:', err));
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00.00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const ms = Math.floor((timeInSeconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#f8f9fa] border border-[#dbd8e8] rounded-[20px] p-6 sm:p-8 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] font-sans text-[#1a1a1a]">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dbd8e8]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#130e30] text-[#7248ea] flex items-center justify-center font-black text-base border border-[#dbd8e8] shadow-xs">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#1a1a1a]">
                {title}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#14804a] text-[#1a1a1a] border border-[#dbd8e8] text-[10px] font-mono font-black uppercase shadow-2xs">
                RELEASE READY • QA 98.0
              </span>
            </div>
            <p className="text-xs text-[#575268] font-medium">
              Multi-Language Dubbed Release Cut • YouTube-Style Multi-Track Audio Switcher
            </p>
          </div>
        </div>

        {/* Current Active Language Pill */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 bg-[#fbfbfd] border border-[#dbd8e8] px-4 py-1.5 rounded-full shadow-2xs">
            <span className="text-lg">{activeTrack.flag}</span>
            <span className="text-xs font-black uppercase text-[#1a1a1a]">
              {activeTrack.language_name}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#14804a] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Cinema Screen & Video Viewport */}
      <div className="relative rounded-[16px] overflow-hidden bg-[#130e30] border border-[#dbd8e8] shadow-inner group">
        <video
          ref={videoRef}
          src={activeTrack.video_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full max-h-[520px] object-contain mx-auto bg-black cursor-pointer"
          onClick={togglePlay}
          playsInline
        >
          {activeTrack.subtitle_vtt_url && activeSubtitleLang && (
            <track
              kind="subtitles"
              src={activeTrack.subtitle_vtt_url}
              srcLang={activeTrack.language_code}
              label={activeTrack.language_name}
              default
            />
          )}
        </video>

        {/* On-screen Toast Notification */}
        {trackNotification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#f2eeff] text-[#7248ea] border border-[#dbd8e8] font-black text-xs px-4 py-1.5 rounded-full shadow-md animate-bounce flex items-center gap-2">
            <AudioWaveform className="w-4 h-4 animate-pulse" />
            <span>{trackNotification}</span>
          </div>
        )}

        {/* Top Viewfinder Overlays */}
        <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 bg-[#130e30]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-[#14804a] animate-ping" />
          <span>BROADCAST MASTER</span>
          <span className="text-white/40">|</span>
          <span className="text-[#7248ea]">{formatTime(currentTime)}</span>
        </div>

        <div className="absolute top-4 right-4 pointer-events-none flex items-center gap-2">
          <div className="bg-[#130e30]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-[#14804a] text-xs font-mono font-bold">
            {activeTrack.voice}
          </div>
        </div>

        {/* YouTube-Style Floating Audio Track Selection Menu */}
        {showAudioMenu && (
          <div className="absolute bottom-20 right-4 z-40 w-72 bg-[#130e30]/95 backdrop-blur-xl border-[2px] border-[#ffe228] rounded-2xl p-3 text-white shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10 text-xs font-black uppercase text-[#7248ea] tracking-wider">
              <span className="flex items-center gap-1.5">
                <Globe2 className="w-4 h-4" />
                <span>Audio Track (Multi-Dub)</span>
              </span>
              <span className="text-[10px] font-mono text-white/60">YouTube Style</span>
            </div>

            <div className="space-y-1">
              {tracks.map((track) => {
                const isSelected = track.id === selectedTrackId;
                return (
                  <button
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition text-xs font-medium cursor-pointer ${
                      isSelected
                        ? 'bg-[#f2eeff] text-[#7248ea] font-black border border-[#dbd8e8] shadow-xs'
                        : 'hover:bg-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{track.flag}</span>
                      <div>
                        <div className="font-bold">{track.language_name}</div>
                        <div
                          className={`text-[10px] font-mono ${
                            isSelected ? 'text-[#1a1a1a]/80' : 'text-white/60'
                          }`}
                        >
                          {track.voice}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* YouTube-Style Floating Subtitles Selection Menu */}
        {showSubtitlesMenu && (
          <div className="absolute bottom-20 right-16 z-40 w-64 bg-[#130e30]/95 backdrop-blur-xl border-[2px] border-white/30 rounded-2xl p-3 text-white shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10 text-xs font-black uppercase text-white tracking-wider">
              <span className="flex items-center gap-1.5">
                <Subtitles className="w-4 h-4" />
                <span>Subtitles / CC</span>
              </span>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveSubtitleLang(null);
                  setShowSubtitlesMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                  activeSubtitleLang === null
                    ? 'bg-white/20 text-white font-bold'
                    : 'hover:bg-white/10 text-white/80'
                }`}
              >
                <span>Off</span>
                {activeSubtitleLang === null && <Check className="w-4 h-4" />}
              </button>

              {tracks
                .filter((t) => t.subtitle_vtt_url)
                .map((t) => {
                  const isSelected = activeSubtitleLang === t.language_code;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveSubtitleLang(t.language_code);
                        setShowSubtitlesMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#f2eeff] text-[#7248ea] font-black'
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{t.flag}</span>
                        <span>{t.language_name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Player Bottom HUD Controls */}
        <div className="p-4 bg-gradient-to-t from-[#130e30] via-[#130e30]/90 to-transparent border-t border-white/10 space-y-3">
          {/* Interactive Scrub Bar */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Video seek scrubber"
              aria-valuemin={0}
              aria-valuemax={duration || 100}
              aria-valuenow={currentTime}
              aria-valuetext={formatTime(currentTime)}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#7248ea] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7248ea]"
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-white/70 font-semibold px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Playback & Volume */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-10 h-10 rounded-xl bg-[#7248ea] hover:bg-[#6847ff] text-white flex items-center justify-center font-black border border-[#dbd8e8] shadow-xs active:scale-[0.95] transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                aria-label="Restart"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 active:scale-[0.95] transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label="Mute"
                  className="text-white hover:text-[#7248ea] transition cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume level"
                  className="w-16 sm:w-20 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#7248ea]"
                />
              </div>
            </div>

            {/* YouTube Style Multi-Audio & Subtitles Buttons */}
            <div className="flex items-center space-x-2">
              {/* Subtitles Button */}
              <button
                type="button"
                onClick={() => {
                  setShowSubtitlesMenu(!showSubtitlesMenu);
                  setShowAudioMenu(false);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeSubtitleLang
                    ? 'bg-[#f2eeff] text-[#7248ea] border-[#ffe228]'
                    : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                }`}
              >
                <Subtitles className="w-4 h-4" />
                <span className="hidden sm:inline">CC</span>
              </button>

              {/* YouTube Style Multi-Audio Track Selector Button */}
              <button
                type="button"
                id="btn-audio-track-menu"
                aria-label="Select audio track language"
                onClick={() => {
                  setShowAudioMenu(!showAudioMenu);
                  setShowSubtitlesMenu(false);
                }}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-[0.97] ${
                  showAudioMenu
                    ? 'bg-[#f2eeff] text-[#7248ea] border-[#ffe228]'
                    : 'bg-[#130e30] hover:bg-[#222222] text-[#7248ea] border-[#ffe228]/50'
                }`}
              >
                <Globe2 className="w-4 h-4" />
                <span className="text-sm">{activeTrack.flag}</span>
                <span className="font-sans">{activeTrack.language_name.split(' ')[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={handleFullscreen}
                aria-label="Toggle Fullscreen"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-[0.95] transition cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Track Switcher Bar */}
      <div className="bg-[#fbfbfd] border border-[#dbd8e8]/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-[#1a1a1a]" />
          <span className="text-xs font-black uppercase text-[#1a1a1a] tracking-wider">
            Available Audio Tracks:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {tracks.map((track) => {
            const isSelected = track.id === selectedTrackId;
            return (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 active:scale-[0.97] cursor-pointer ${
                  isSelected
                    ? 'bg-[#130e30] text-[#7248ea] border border-[#dbd8e8] shadow-xs'
                    : 'bg-[#f8f9fa] hover:bg-[#f2eeff]/40 text-[#1a1a1a] border border-[#dbd8e8]'
                }`}
              >
                <span>{track.flag}</span>
                <span>{track.language_name}</span>
                {isSelected && <span className="text-[10px] font-mono text-[#14804a]">● Active</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
