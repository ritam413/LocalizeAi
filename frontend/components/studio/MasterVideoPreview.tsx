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
  Zap,
  HardDrive,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { AccessibleErrorReport } from '../ui/AccessibleErrorReport';

export interface MasterVideoPreviewProps {
  /** Local File object from drag-and-drop or file input */
  file?: File | null;
  /** Direct disk path (e.g. storage/sample_movie.mp4 or C:\path\to\movie.mp4) */
  diskPath?: string;
  /** Clip ID if already registered on backend */
  clipId?: string;
  /** Whether sample reel is currently loaded */
  isSampleReel?: boolean;
  /** Callback to switch back to setup tab */
  onBackToSetup?: () => void;
}

export const MasterVideoPreview: React.FC<MasterVideoPreviewProps> = ({
  file,
  diskPath,
  clipId,
  isSampleReel,
  onBackToSetup,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [sourceType, setSourceType] = useState<'blob' | 'stream' | 'sample' | 'none'>('none');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Manage video source URL and cleanup blob URLs
  useEffect(() => {
    let objectUrl = '';
    setVideoError(null);

    if (file) {
      objectUrl = URL.createObjectURL(file);
      setVideoSrc(objectUrl);
      setSourceType('blob');
    } else if (clipId) {
      setVideoSrc(`/api/v1/clips/${clipId}/stream`);
      setSourceType('stream');
    } else if (isSampleReel) {
      setVideoSrc('/api/v1/clips/preview-stream?path=storage/sample_movie.mp4');
      setSourceType('sample');
    } else if (diskPath && diskPath.trim()) {
      setVideoSrc(`/api/v1/clips/preview-stream?path=${encodeURIComponent(diskPath.trim())}`);
      setSourceType('stream');
    } else {
      setVideoSrc('');
      setSourceType('none');
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file, diskPath, clipId, isSampleReel]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => console.warn('Autoplay prevented:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
    setVideoDimensions({
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    });
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

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch((err) => console.warn('Play prevented:', err));
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00.00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const ms = Math.floor((timeInSeconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filename = file
    ? file.name
    : isSampleReel
    ? 'sample_movie.mp4 (Studio 4K Reel)'
    : diskPath
    ? diskPath.split(/[\\/]/).pop() || diskPath
    : 'Unknown Master Footage';

  if (!videoSrc) {
    return (
      <div className="bg-white border border-[#dbd8e8] rounded-[20px] p-8 sm:p-12 text-center space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="w-16 h-16 rounded-2xl bg-[#f8f9fa] border border-[#dbd8e8] flex items-center justify-center mx-auto text-[#1a1a1a]">
          <Film className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div>
          <h3 className="text-xl font-black text-[#1a1a1a] uppercase tracking-tight">No Master Footage Loaded</h3>
          <p className="text-xs sm:text-sm text-[#575268] mt-1 font-medium">
            Please ingest a video file via drag-and-drop, disk path, or sample reel to unlock preview.
          </p>
        </div>
        {onBackToSetup && (
          <button
            onClick={onBackToSetup}
            className="px-6 py-2.5 rounded-full bg-[#f2eeff] text-[#7248ea] border border-[#dbd8e8] font-black text-xs uppercase tracking-wider shadow-xs hover:bg-[#6847ff] active:scale-[0.97] cursor-pointer"
          >
            Go to Ingestion Setup
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#dbd8e8] rounded-[20px] p-6 sm:p-8 space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] font-sans text-[#1a1a1a]">
      {/* Top Monitor Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#dbd8e8]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#130e30] text-[#7248ea] flex items-center justify-center font-black text-sm border border-[#dbd8e8]">
            <Film className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#1a1a1a] truncate max-w-md">
                {filename}
              </h3>
            </div>
            <p className="text-[11px] font-mono text-[#575268]">
              Master Studio Viewfinder • Live Local Direct Stream
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {sourceType === 'blob' && (
            <span className="inline-flex items-center gap-1.5 bg-[#14804a] text-[#1a1a1a] border border-[#dbd8e8] px-3 py-1 rounded-full text-xs font-mono font-black uppercase shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Direct Local Disk Zero-Copy</span>
            </span>
          )}
          {sourceType === 'sample' && (
            <span className="inline-flex items-center gap-1.5 bg-[#f2eeff] text-[#7248ea] border border-[#dbd8e8] px-3 py-1 rounded-full text-xs font-mono font-black uppercase shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio 4K Reel</span>
            </span>
          )}
          {sourceType === 'stream' && (
            <span className="inline-flex items-center gap-1.5 bg-[#f8f9fa] text-[#1a1a1a] border border-[#dbd8e8] px-3 py-1 rounded-full text-xs font-mono font-black uppercase shadow-xs">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Direct Disk NVMe Stream</span>
            </span>
          )}

          {onBackToSetup && (
            <button
              onClick={onBackToSetup}
              className="px-3.5 py-1 rounded-full bg-[#f8f9fa] hover:bg-[#f2eeff] text-[#7248ea] border border-[#dbd8e8] text-xs font-bold transition active:scale-[0.97] cursor-pointer"
            >
              Configure Run ⚙️
            </button>
          )}
        </div>
      </div>

      {/* Cinema Monitor Screen Container */}
      <div className="relative rounded-[16px] overflow-hidden bg-[#130e30] border border-[#dbd8e8] shadow-inner group">
        <video
          ref={videoRef}
          src={videoSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() =>
            setVideoError(
              'The browser HTML5 video player failed to decode this cinema footage (MEDIA_ERR_SRC_NOT_SUPPORTED). Transcode to standard H.264 (libx264) + AAC or load the sample reel.'
            )
          }
          className="w-full max-h-[500px] object-contain mx-auto bg-black cursor-pointer"
          onClick={togglePlay}
          playsInline
        />

        {/* Viewfinder Corner Overlays */}
        <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 bg-[#130e30]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white text-xs font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-[#7248ea] animate-ping" />
          <span>REC MASTER</span>
          <span className="text-white/40">|</span>
          <span className="text-[#7248ea]">{formatTime(currentTime)}</span>
        </div>

        {videoDimensions && (
          <div className="absolute top-4 right-4 pointer-events-none bg-[#130e30]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-[#14804a] text-xs font-mono font-bold">
            {videoDimensions.width}x{videoDimensions.height} DCI
          </div>
        )}

        {/* Custom Cinema Player Bottom HUD Controls */}
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

          {/* Control Actions Row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
                className="w-10 h-10 rounded-xl bg-[#7248ea] hover:bg-[#6847ff] text-white flex items-center justify-center font-black border border-[#dbd8e8] shadow-xs active:scale-[0.95] transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7248ea]"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" aria-hidden="true" /> : <Play className="w-5 h-5 fill-current ml-0.5" aria-hidden="true" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                aria-label="Restart video from beginning"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 active:scale-[0.95] transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7248ea]"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted || volume === 0 ? 'Unmute video audio' : 'Mute video audio'}
                  className="text-white hover:text-[#7248ea] transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7248ea] rounded p-0.5"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume level"
                  className="w-16 sm:w-20 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#7248ea] focus-visible:ring-2 focus-visible:ring-[#7248ea]"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleFullscreen}
                aria-label="Toggle full-screen cinema view"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-[0.95] transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7248ea]"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {videoError && (
        <AccessibleErrorReport
          error={videoError}
          context="video_preview"
          onRetry={() => {
            setVideoError(null);
            if (videoRef.current) {
              videoRef.current.load();
            }
          }}
          onUseSample={onBackToSetup}
          onDismiss={() => setVideoError(null)}
        />
      )}

      {/* Ingestion Technical Specs Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#dbd8e8] space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#575268] block">
            Container Resolution
          </span>
          <span className="text-sm font-black text-[#1a1a1a] font-mono">
            {videoDimensions ? `${videoDimensions.width}x${videoDimensions.height}` : 'Probing...'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#dbd8e8] space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#575268] block">
            Total Footage Duration
          </span>
          <span className="text-sm font-black text-[#1a1a1a] font-mono">
            {duration ? `${duration.toFixed(2)}s` : 'Probing...'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#dbd8e8] space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#575268] block">
            File Size
          </span>
          <span className="text-sm font-black text-[#1a1a1a] font-mono">
            {file ? formatFileSize(file.size) : isSampleReel ? '12.4 MB' : 'Direct Disk File'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#dbd8e8] space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#575268] block">
            Playback Transport
          </span>
          <span className="text-sm font-black text-[#1a1a1a] font-mono text-[#14804a]">
            {sourceType === 'blob' ? '⚡ 0-Latency Blob' : '📡 Range Stream'}
          </span>
        </div>
      </div>
    </div>
  );
};
