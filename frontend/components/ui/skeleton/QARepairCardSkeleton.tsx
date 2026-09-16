'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const QARepairCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 p-6 rounded-[16px] space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#dbd8e8] pb-3">
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" width={18} height={18} />
          <Skeleton variant="text" width={170} height={15} />
        </div>
        <Skeleton variant="badge" width={60} height={20} className="rounded-full" />
      </div>

      {/* Description text */}
      <div className="space-y-2">
        <Skeleton variant="text" width="95%" height={12} />
        <Skeleton variant="text" width="85%" height={12} />
      </div>

      {/* Metric comparison box */}
      <div className="bg-[#fbfbfd] border border-[#dbd8e8] rounded-xl p-3.5 flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton variant="text" width={80} height={10} />
          <Skeleton variant="text" width={60} height={14} />
        </div>
        <Skeleton variant="circular" width={24} height={24} />
        <div className="space-y-1 text-right">
          <Skeleton variant="text" width={80} height={10} />
          <Skeleton variant="text" width={60} height={14} />
        </div>
      </div>

      {/* Action button */}
      <Skeleton variant="button" width="100%" height={36} className="rounded-full" />
    </div>
  );
};
