'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export interface OutputDeliverablesSkeletonProps {
  cards?: number;
}

export const OutputDeliverablesSkeleton: React.FC<OutputDeliverablesSkeletonProps> = ({ cards = 4 }) => {
  return (
    <div className="space-y-8 max-w-5xl font-sans text-[#130e30]">
      {/* Header */}
      <div className="border-b border-[#130e30]/10 pb-6 space-y-2">
        <Skeleton variant="text" width={180} height={12} />
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width={340} height={28} />
        </div>
        <Skeleton variant="text" width={440} height={12} />
      </div>

      {/* Artifact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: cards }).map((_, idx) => (
          <div
            key={`art-skel-${idx}`}
            className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 p-6 rounded-[24px] flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#f9fbf2] border border-[#130e30]/15 flex items-center justify-center">
                <Skeleton variant="circular" width={24} height={24} />
              </div>
              <div className="space-y-1.5">
                <Skeleton variant="text" width={140} height={15} />
                <Skeleton variant="text" width={200} height={11} />
              </div>
            </div>

            <Skeleton variant="button" width={100} height={34} className="rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
