'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const MasterVideoPreviewSkeleton: React.FC = () => {
  return (
    <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 rounded-[16px] overflow-hidden shadow-sm space-y-4 p-6">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between border-b border-[#dbd8e8] pb-4">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width={24} height={24} />
          <div className="space-y-1">
            <Skeleton variant="text" width={180} height={15} />
            <Skeleton variant="text" width={120} height={10} />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton variant="pill" width={70} height={24} />
          <Skeleton variant="pill" width={90} height={24} />
        </div>
      </div>

      {/* Main 16:9 Video Viewport Skeleton */}
      <div className="relative w-full aspect-video bg-[#130e30]/15 rounded-2xl overflow-hidden flex items-center justify-center animate-shimmer">
        <div className="w-16 h-16 rounded-full bg-[#130e30]/20 flex items-center justify-center">
          <Skeleton variant="circular" width={48} height={48} />
        </div>
      </div>

      {/* Timeline Scrubber & Controls Bar */}
      <div className="space-y-3 pt-2">
        {/* Scrubber track */}
        <Skeleton variant="text" width="100%" height={8} className="rounded-full my-0" />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="text" width={80} height={12} />
          </div>

          <div className="flex items-center space-x-2">
            <Skeleton variant="circular" width={28} height={28} />
            <Skeleton variant="pill" width={70} height={24} />
            <Skeleton variant="circular" width={28} height={28} />
          </div>
        </div>
      </div>
    </div>
  );
};
