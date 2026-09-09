'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export interface DecisionFeedSkeletonProps {
  items?: number;
}

export const DecisionFeedSkeleton: React.FC<DecisionFeedSkeletonProps> = ({ items = 3 }) => {
  return (
    <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 p-6 rounded-[24px] space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#130e30]/10 pb-4">
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width={180} height={16} />
        </div>
        <Skeleton variant="pill" width={75} height={22} />
      </div>

      {/* Decision Feed Items */}
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, idx) => (
          <div
            key={`decision-skel-${idx}`}
            className="bg-[#f9fbf2] border border-[#130e30]/10 rounded-2xl p-4 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton variant="pill" width={110} height={20} className="rounded" />
                <Skeleton variant="text" width={60} height={10} />
              </div>
              <Skeleton variant="text" width={50} height={10} />
            </div>

            <Skeleton variant="text" width="92%" height={13} />
            <Skeleton variant="text" width="70%" height={11} />

            <div className="flex items-center justify-between pt-1">
              <Skeleton variant="pill" width={80} height={18} />
              <Skeleton variant="text" width={90} height={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
