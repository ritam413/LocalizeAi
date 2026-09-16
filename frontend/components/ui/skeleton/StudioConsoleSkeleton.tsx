'use client';

import React from 'react';
import { Skeleton } from './Skeleton';
import { AgentSequenceTrackSkeleton } from './AgentSequenceTrackSkeleton';
import { ProducerBoardSkeleton } from './ProducerBoardSkeleton';
import { QARepairCardSkeleton } from './QARepairCardSkeleton';
import { BeforeAfterPlayerSkeleton } from './BeforeAfterPlayerSkeleton';
import { DecisionFeedSkeleton } from './DecisionFeedSkeleton';

export const StudioConsoleSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 font-sans text-[#1a1a1a]">
      {/* Top Banner Info Skeleton */}
      <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 p-6 rounded-[16px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Skeleton variant="text" width={160} height={28} />
            <Skeleton variant="pill" width={110} height={26} className="rounded-full" />
          </div>
          <div className="flex items-center space-x-3 flex-wrap">
            <Skeleton variant="text" width={140} height={12} />
            <Skeleton variant="text" width={100} height={12} />
            <Skeleton variant="text" width={120} height={12} />
          </div>
        </div>

        {/* Action Controls & Navigation Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <Skeleton variant="button" width={120} height={36} className="rounded-full" />
          <div className="flex items-center space-x-1 bg-[#fbfbfd] p-1.5 rounded-full border border-[#dbd8e8]">
            <Skeleton variant="button" width={120} height={32} className="rounded-full" />
            <Skeleton variant="button" width={110} height={32} className="rounded-full" />
            <Skeleton variant="button" width={110} height={32} className="rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Studio Track Skeleton */}
      <div className="space-y-6">
        <AgentSequenceTrackSkeleton />

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 space-y-6">
            <ProducerBoardSkeleton />
            <QARepairCardSkeleton />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <BeforeAfterPlayerSkeleton />
            <DecisionFeedSkeleton items={3} />
          </div>
        </div>
      </div>
    </div>
  );
};
