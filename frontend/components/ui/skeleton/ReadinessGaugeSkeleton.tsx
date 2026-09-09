'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const ReadinessGaugeSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-3">
      {/* Circle Gauge Skeleton */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <Skeleton variant="circular" width={112} height={112} />
      </div>
      <Skeleton variant="text" width={120} height={14} />
      <Skeleton variant="text" width={80} height={10} />
    </div>
  );
};
