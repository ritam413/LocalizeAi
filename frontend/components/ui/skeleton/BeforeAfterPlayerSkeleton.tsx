'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const BeforeAfterPlayerSkeleton: React.FC = () => {
  return (
    <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 rounded-[16px] p-6 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#dbd8e8] pb-4">
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width={220} height={16} />
        </div>
        <Skeleton variant="pill" width={90} height={24} />
      </div>

      {/* Dual Audio Track Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Track A: Original */}
        <div className="bg-[#fbfbfd] border border-[#dbd8e8] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton variant="pill" width={100} height={20} />
            <Skeleton variant="circular" width={28} height={28} />
          </div>
          <Skeleton variant="text" width="90%" height={12} />
          <Skeleton variant="text" width="60%" height={10} />
          <Skeleton variant="text" width="100%" height={6} className="rounded-full my-1" />
        </div>

        {/* Track B: Localized Dub */}
        <div className="bg-[#fbfbfd] border border-[#dbd8e8] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton variant="pill" width={100} height={20} />
            <Skeleton variant="circular" width={28} height={28} />
          </div>
          <Skeleton variant="text" width="90%" height={12} />
          <Skeleton variant="text" width="60%" height={10} />
          <Skeleton variant="text" width="100%" height={6} className="rounded-full my-1" />
        </div>
      </div>
    </div>
  );
};
