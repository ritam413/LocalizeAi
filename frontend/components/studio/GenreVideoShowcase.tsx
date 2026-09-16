'use client';

import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
  CheckCircle2,
  Cpu,
  Layers,
  Music2,
  FileCheck
} from 'lucide-react';

interface GenrePreset {
  id: string;
  name: string;
  videoSrc: string;
  title: string;
  desc: string;
  directorNotes: string;
  targetBpm: number;
  stemCount: number;
  speechRatio: string;
}

const GENRE_PRESETS: GenrePreset[] = [
  {
    id: 'cartoon',
    name: 'Cartoon',
    videoSrc: '/storage/sample_movie.mp4',
    title: 'Animated Character Dubbing',
    desc: 'Exaggerated vocal formants, pitch tracking, and high-energy isometric sync for animated features.',
    directorNotes: 'Voice Director applies pitch-shifted emotional inflection with high syllable elasticity.',
    targetBpm: 128,
    stemCount: 4,
    speechRatio: '42% Dialogue / 58% SFX',
  },
  {
    id: 'concert',
    name: 'Concert',
    videoSrc: '/storage/sample_movie.mp4',
    title: 'Live Musical & Concert Footage',
    desc: 'Demucs 4-stem instrumental preservation with dynamic sidechain ducking (-6.0 dB) behind commentary.',
    directorNotes: 'Sync Engineer anchors live crowd ambience while seating translated speech directly in center channel.',
    targetBpm: 120,
    stemCount: 4,
    speechRatio: '25% Vocals / 75% Live Band',
  },
  {
    id: 'horror',
    name: 'Horror',
    videoSrc: '/storage/sample_movie.mp4',
    title: 'Psychological Thriller & Horror Dub',
    desc: 'Sub-bass drone preservation, whisper detection, and jump-scare acoustic isolation.',
    directorNotes: 'Story Analyst tags sudden volume transitions; Sync Engineer locks whisper acoustics.',
    targetBpm: 92,
    stemCount: 4,
    speechRatio: '18% Whispers / 82% Foley/Drones',
  },
  {
    id: 'comedy',
    name: 'Comedy',
    videoSrc: '/storage/sample_movie.mp4',
    title: 'Stand-up & Theatrical Comedy',
    desc: 'Rapid comedic timing, comedic pause preservation, and localized punchline adaptation.',
    directorNotes: 'Localization Director adapts cultural punchlines with rationale; atempo capped at 1.15x.',
    targetBpm: 110,
    stemCount: 4,
    speechRatio: '65% Monologue / 35% Laughter',
  },
  {
    id: 'scifi',
    name: 'Science Fiction',
    videoSrc: '/storage/sample_movie.mp4',
    title: 'Sci-Fi & Cinematic Action',
    desc: 'Cybernetic vocoder support, alien dialect adaptation, and immersive spatial surround mixing.',
    directorNotes: 'EBU R128 (-24 LUFS) mastering with true-peak limiting prevents dialogue masking.',
    targetBpm: 135,
    stemCount: 4,
    speechRatio: '30% Comms / 70% SFX Stems',
  },
];

export function GenreVideoShowcase() {
  const [selectedGenreId, setSelectedGenreId] = useState('concert');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedStem, setSelectedStem] = useState<'dubbed' | 'original' | 'm_and_e'>('dubbed');

  const videoRef = useRef<HTMLVideoElement>(null);
  const activeGenre = GENRE_PRESETS.find((g) => g.id === selectedGenreId) || GENRE_PRESETS[1];

  const handleSelectGenre = (id: string) => {
    setSelectedGenreId(id);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <section className="space-y-6 pt-4 pb-8">
      {/* Title & Pill Tabs Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]">
          Tailored Dubbing for Every Film Genre
        </h2>
        <p className="text-xs sm:text-sm text-[#575268] max-w-xl mx-auto">
          Explore how the autonomous post-production crew tunes acoustic mastering, stem ducking, and voice pacing for diverse cinema styles.
        </p>

        {/* Emil-style Floating Pill Tabs (from media_1789568510686.png) */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {GENRE_PRESETS.map((genre) => {
            const isSelected = genre.id === selectedGenreId;
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => handleSelectGenre(genre.id)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-[0.96] cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-[#7248ea] text-white shadow-[0_4px_14px_rgba(114,72,234,0.4)] scale-105'
                    : 'bg-white hover:bg-[#f8f9fa] text-[#575268] hover:text-[#1a1a1a] border border-[#dbd8e8]'
                }`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cinematic Studio Video Frame */}
      <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden bg-[#07060c] border border-[#1f2438] shadow-2xl relative group">
        <div className="aspect-video w-full relative flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={activeGenre.videoSrc}
            playsInline
            muted={isMuted}
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-cover"
          />

          {/* Floating Genre Tag Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-[11px] font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
            <span>Preset: {activeGenre.name}</span>
            <span className="text-white/40">|</span>
            <span className="text-[#c2e7b0]">{activeGenre.stemCount} Demucs Stems</span>
          </div>

          {/* Stem Selector Floating Overlay */}
          <div className="absolute top-4 right-4 z-10 flex items-center space-x-1 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setSelectedStem('dubbed')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedStem === 'dubbed'
                  ? 'bg-[#7248ea] text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Dubbed Master
            </button>
            <button
              type="button"
              onClick={() => setSelectedStem('original')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedStem === 'original'
                  ? 'bg-[#7248ea] text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Original ES
            </button>
            <button
              type="button"
              onClick={() => setSelectedStem('m_and_e')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedStem === 'm_and_e'
                  ? 'bg-[#7248ea] text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              M&E Stem
            </button>
          </div>

          {/* Overlay Big Play Button if paused */}
          {!isPlaying && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Play video"
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#7248ea]/90 hover:bg-[#6847ff] text-white flex items-center justify-center shadow-[0_4px_24px_rgba(114,72,234,0.6)] transition-transform hover:scale-110 active:scale-95 z-20 cursor-pointer"
            >
              <Play className="w-7 h-7 fill-current ml-1" />
            </button>
          )}

          {/* Bottom Video Transport Controls */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex items-center justify-between text-white text-xs z-10">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="hover:text-[#bd98ec] transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="hover:text-[#bd98ec] transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="font-mono text-[11px] text-white/80">
                00:08 / 00:35 · 1080p 24fps
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono text-[#00d4aa]">
                Sync Lock: 100% (Isochronous)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Emil-style Expandable Engine Specs Button & Accordion */}
      <div className="max-w-4xl mx-auto text-center">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#f2eeff] text-[#7248ea] border border-[#bd98ec]/60 font-bold text-xs shadow-xs transition-all duration-150 active:scale-[0.98] cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isExpanded ? 'Hide Engine Specs & Acoustic Details' : 'View Engine Specs & Acoustic Information'}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>

        {/* Expandable Specifications Panel */}
        {isExpanded && (
          <div className="mt-4 p-6 rounded-2xl bg-white border border-[#dbd8e8] text-left shadow-lg animate-in fade-in slide-in-from-top-3 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-[#f2f0f8] pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#1a1a1a]">{activeGenre.title}</h4>
                <p className="text-xs text-[#575268] mt-0.5">{activeGenre.desc}</p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#f0f9eb] text-[#14804a] border border-[#c2e7b0]">
                EBU R128 VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Acoustic Separation */}
              <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dbd8e8]">
                <div className="flex items-center space-x-2 text-[#7248ea] mb-1.5">
                  <Music2 className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-xs font-bold text-[#1a1a1a]">Stem Separation</span>
                </div>
                <p className="text-xs text-[#575268]">
                  Demucs HTDemucs 4-stem pipeline splits dialogue, drums, bass, and other music with zero bleed.
                </p>
                <div className="mt-2 text-[10px] font-mono text-[#575268]">
                  Separation: <span className="text-[#14804a] font-bold">99.2% SNR</span>
                </div>
              </div>

              {/* Card 2: Isometric Syllable Sync */}
              <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dbd8e8]">
                <div className="flex items-center space-x-2 text-[#7248ea] mb-1.5">
                  <Layers className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-xs font-bold text-[#1a1a1a]">Isometric Lip-Sync</span>
                </div>
                <p className="text-xs text-[#575268]">
                  Sync Engineer aligns syllable budgets ($S \approx \Delta t \times 3.2$) to match original mouth motion.
                </p>
                <div className="mt-2 text-[10px] font-mono text-[#575268]">
                  Syllable Lock: <span className="text-[#14804a] font-bold">98.4% Match</span>
                </div>
              </div>

              {/* Card 3: Broadcast Loudness Mastering */}
              <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#dbd8e8]">
                <div className="flex items-center space-x-2 text-[#7248ea] mb-1.5">
                  <Cpu className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-xs font-bold text-[#1a1a1a]">Mastering Bus</span>
                </div>
                <p className="text-xs text-[#575268]">
                  Integrated loudness normalized to -24.0 LUFS, -2.0 dB True Peak, and dynamic sidechain ducking.
                </p>
                <div className="mt-2 text-[10px] font-mono text-[#575268]">
                  Target: <span className="text-[#14804a] font-bold">-24.0 LUFS (EBU)</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#f2eeff] border border-[#bd98ec]/40 flex items-start space-x-3 text-xs text-[#1a1a1a]">
              <Sparkles className="w-4 h-4 text-[#7248ea] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#7248ea]">Autonomous Director Note: </span>
                <span>{activeGenre.directorNotes}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
