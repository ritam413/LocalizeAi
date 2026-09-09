'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const MultiAudioPlayerSkeleton: React.FC = () => {
  return (
    <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 rounded-[24px] p-6 space-y-6 shadow-sm">
      {/* Header & Track Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#130e30]/10 pb-4">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width={24} height={24} />
          <div className="space-y-1">
            <Skeleton variant="text" width={200} height={16} />
            <Skeleton variant="text" width={140} height={11} />
          </div>
        </div>
        <Skeleton variant="button" width={180} height={36} className="rounded-full" />
      </div>

      {/* Video / Audio viewport */}
      <div className="relative w-full aspect-video bg-[#130e30]/15 rounded-2xl overflow-hidden flex items-center justify-center animate-shimmer">
        <Skeleton variant="circular" width={56} height={56} />
      </div>

      {/* Waveform Visualization Bars Skeleton */}
      <div className="bg-[#f9fbf2] border border-[#130e30]/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={120} height={12} />
          <Skeleton variant="pill" width={70} height={18} />
        </div>
        <div className="flex items-end justify-between h-14 space-x-1">
          {Array.from({ length: 32 }).map((_, idx) => (
            <div
              key={`wave-bar-${idx}`}
              className="w-full bg-[#130e30]/10 rounded-t"
              style={{ height: `${20 + (idx % 7) * 11}%` }}
            />
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width={36} height={36} />
          <Skeleton variant="text" width={90} height={12} />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton variant="pill" width={120} height={28} />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      </div>
    </div>
  );
};
