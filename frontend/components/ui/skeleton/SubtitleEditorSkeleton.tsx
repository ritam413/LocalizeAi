'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export interface SubtitleEditorSkeletonProps {
  rows?: number;
}

export const SubtitleEditorSkeleton: React.FC<SubtitleEditorSkeletonProps> = ({ rows = 5 }) => {
  return (
    <div className="space-y-8 max-w-6xl font-sans text-[#1a1a1a]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dbd8e8] pb-6">
        <div className="space-y-2">
          <Skeleton variant="text" width={180} height={12} />
          <div className="flex items-center space-x-3">
            <Skeleton variant="circular" width={28} height={28} />
            <Skeleton variant="text" width={280} height={26} />
          </div>
        </div>

        {/* QA Status Badge */}
        <Skeleton variant="pill" width={180} height={34} className="rounded-full" />
      </div>

      {/* Subtitle Table */}
      <div className="bg-[#f8f9fa] border border-[#dbd8e8]/15 rounded-[16px] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-[#1a1a1a]">
          <thead className="bg-[#f8f9fa] text-[10px] font-extrabold text-[#575268] uppercase tracking-wider border-b border-[#dbd8e8]">
            <tr>
              <th className="px-4 py-4 w-16">#</th>
              <th className="px-4 py-4 w-44">Dialogue Window</th>
              <th className="px-4 py-4">Source &amp; Translated Subtitle</th>
              <th className="px-4 py-4 w-28">Reading CPS</th>
              <th className="px-4 py-4 w-48">QA Status</th>
              <th className="px-4 py-4 w-20 text-center">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#130e30]/8 bg-[#fbfbfd]">
            {Array.from({ length: rows }).map((_, idx) => (
              <tr key={`sub-skel-${idx}`}>
                <td className="px-4 py-4">
                  <Skeleton variant="text" width={24} height={12} />
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <Skeleton variant="text" width={110} height={12} />
                    <Skeleton variant="text" width={60} height={10} />
                  </div>
                </td>
                <td className="px-4 py-4 space-y-2">
                  <Skeleton variant="text" width="90%" height={12} />
                  <Skeleton variant="text" width="95%" height={28} className="rounded-lg" />
                </td>
                <td className="px-4 py-4">
                  <Skeleton variant="pill" width={55} height={20} />
                </td>
                <td className="px-4 py-4">
                  <Skeleton variant="pill" width={120} height={22} className="rounded-full" />
                </td>
                <td className="px-4 py-4 text-center">
                  <Skeleton variant="circular" width={28} height={28} className="mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
