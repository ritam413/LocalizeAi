'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl font-sans text-[#1a1a1a]">
      {/* Header */}
      <div className="border-b border-[#dbd8e8] pb-6 space-y-2">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width={280} height={28} />
        </div>
        <Skeleton variant="text" width={420} height={12} />
      </div>

      {/* Settings Form Cards */}
      <div className="space-y-6">
        {/* Hardware & GPU Card */}
        <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 p-6 rounded-[24px] space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-[#dbd8e8] pb-3">
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width={180} height={16} />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" width={140} height={12} />
            <Skeleton variant="text" width="100%" height={24} className="rounded-lg" />
          </div>
        </div>

        {/* QA Thresholds Card */}
        <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 p-6 rounded-[24px] space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-[#dbd8e8] pb-3">
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width={190} height={16} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`setting-field-${idx}`} className="space-y-2">
                <Skeleton variant="text" width={130} height={12} />
                <Skeleton variant="text" width="100%" height={36} className="rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Skeleton variant="button" width={150} height={42} className="rounded-full" />
        </div>
      </div>
    </div>
  );
};
