'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export interface ModelRegistrySkeletonProps {
  cards?: number;
}

export const ModelRegistrySkeleton: React.FC<ModelRegistrySkeletonProps> = ({ cards = 6 }) => {
  return (
    <div className="space-y-8 max-w-5xl font-sans text-[#130e30]">
      {/* Header */}
      <div className="border-b border-[#130e30]/10 pb-6 space-y-2">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width={320} height={28} />
        </div>
        <Skeleton variant="text" width={480} height={12} />
      </div>

      {/* Grid of Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: cards }).map((_, idx) => (
          <div
            key={`model-skel-${idx}`}
            className="bg-[#eff2e5] border-[1.5px] border-[#130e30]/15 p-6 rounded-[24px] space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton variant="badge" width={90} height={22} className="rounded-full" />
              <div className="flex items-center space-x-1.5">
                <Skeleton variant="circular" width={8} height={8} />
                <Skeleton variant="text" width={55} height={12} />
              </div>
            </div>

            <div className="space-y-1">
              <Skeleton variant="text" width="70%" height={18} />
              <Skeleton variant="text" width="50%" height={11} />
            </div>

            <div className="pt-2 border-t border-[#130e30]/10 flex items-center justify-between">
              <Skeleton variant="pill" width={110} height={20} />
              <Skeleton variant="pill" width={80} height={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
