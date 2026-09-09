'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const AgentSequenceTrackSkeleton: React.FC = () => {
  return (
    <div className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 p-6 rounded-[24px] space-y-6 shadow-sm">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#130e30]/10 pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width={220} height={16} />
          </div>
          <Skeleton variant="text" width={320} height={12} />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton variant="pill" width={100} height={24} />
          <Skeleton variant="pill" width={80} height={24} />
        </div>
      </div>

      {/* Nodes Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div
            key={`node-skel-${idx}`}
            className="bg-[#f9fbf2] border border-[#130e30]/15 rounded-2xl p-3.5 flex flex-col items-center text-center space-y-2.5 relative overflow-hidden"
          >
            {/* Step badge */}
            <div className="w-full flex justify-between items-center">
              <Skeleton variant="badge" width={32} height={16} />
              <Skeleton variant="circular" width={8} height={8} />
            </div>

            {/* Icon Avatar */}
            <Skeleton variant="circular" width={40} height={40} className="my-1" />

            {/* Agent Name & Role */}
            <div className="w-full space-y-1">
              <Skeleton variant="text" width="90%" height={12} className="mx-auto" />
              <Skeleton variant="text" width="70%" height={9} className="mx-auto" />
            </div>

            {/* Status indicator bar */}
            <Skeleton variant="pill" width="100%" height={18} className="rounded-full mt-1" />
          </div>
        ))}
      </div>

      {/* Track Footnote Metrics */}
      <div className="flex items-center justify-between pt-2 border-t border-[#130e30]/10 text-xs">
        <Skeleton variant="text" width={140} height={12} />
        <Skeleton variant="text" width={180} height={12} />
      </div>
    </div>
  );
};
