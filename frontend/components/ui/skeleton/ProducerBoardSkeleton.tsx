'use client';

import React from 'react';
import { Skeleton } from './Skeleton';
import { ReadinessGaugeSkeleton } from './ReadinessGaugeSkeleton';

export const ProducerBoardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 p-6 rounded-[16px] space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#dbd8e8] pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Skeleton variant="circular" width={18} height={18} />
            <Skeleton variant="text" width={160} height={16} />
          </div>
          <Skeleton variant="text" width={220} height={11} />
        </div>
        <Skeleton variant="pill" width={70} height={22} />
      </div>

      {/* Readiness Gauge */}
      <ReadinessGaugeSkeleton />

      {/* Metrics breakdown */}
      <div className="space-y-3 pt-2 border-t border-[#dbd8e8]">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={`metric-skel-${idx}`} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton variant="circular" width={14} height={14} />
              <Skeleton variant="text" width={100} height={12} />
            </div>
            <Skeleton variant="pill" width={50} height={18} />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="pt-2">
        <Skeleton variant="button" width="100%" height={38} className="rounded-full" />
      </div>
    </div>
  );
};
