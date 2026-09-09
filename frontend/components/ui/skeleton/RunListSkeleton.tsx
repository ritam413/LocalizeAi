'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export interface RunListSkeletonProps {
  rows?: number;
}

export const RunListSkeleton: React.FC<RunListSkeletonProps> = ({ rows = 4 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <tr key={`run-skeleton-${idx}`} className="border-b border-[#130e30]/8 bg-[#f9fbf2]">
          {/* Run ID */}
          <td className="px-6 py-4">
            <Skeleton variant="pill" width={72} height={24} className="rounded" />
          </td>

          {/* Source Master */}
          <td className="px-6 py-4">
            <div className="space-y-1.5 max-w-xs">
              <Skeleton variant="text" width="80%" height={14} />
              <Skeleton variant="text" width="40%" height={10} />
            </div>
          </td>

          {/* Pipeline Mode */}
          <td className="px-6 py-4">
            <Skeleton variant="text" width={110} height={12} />
          </td>

          {/* Execution Status */}
          <td className="px-6 py-4">
            <Skeleton variant="pill" width={80} height={22} className="rounded-full" />
          </td>

          {/* Timestamp */}
          <td className="px-6 py-4">
            <Skeleton variant="text" width={64} height={12} />
          </td>

          {/* Studio Controls */}
          <td className="px-6 py-4 text-right">
            <div className="flex items-center justify-end space-x-2">
              <Skeleton variant="button" width={78} height={28} className="rounded-full" />
              <Skeleton variant="button" width={68} height={28} className="rounded-full" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};
