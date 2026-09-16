'use client';

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'circular' | 'pill' | 'button' | 'badge';
  animate?: 'shimmer' | 'pulse' | 'none';
  width?: string | number;
  height?: string | number;
  ariaLabel?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'default',
  animate = 'shimmer',
  width,
  height,
  className = '',
  style,
  ariaLabel = 'Loading content...',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'card':
        return 'rounded-[24px] bg-[#f8f9fa] border border-[#dbd8e8]/10 p-6';
      case 'text':
        return 'h-3.5 w-full rounded-md bg-[#130e30]/10 my-1';
      case 'circular':
        return 'rounded-full bg-[#130e30]/10 aspect-square';
      case 'pill':
        return 'rounded-full bg-[#130e30]/10 h-6 px-3';
      case 'button':
        return 'rounded-full bg-[#130e30]/15 h-9 px-4 border border-[#dbd8e8]';
      case 'badge':
        return 'rounded-md bg-[#130e30]/10 h-5 px-2 text-[10px]';
      default:
        return 'rounded-lg bg-[#130e30]/10';
    }
  };

  const getAnimationStyles = () => {
    switch (animate) {
      case 'shimmer':
        return 'animate-shimmer';
      case 'pulse':
        return 'animate-pulse';
      case 'none':
      default:
        return '';
    }
  };

  const inlineStyles: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style,
  };

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`relative overflow-hidden pointer-events-none select-none ${getVariantStyles()} ${getAnimationStyles()} ${className}`}
      style={inlineStyles}
      {...props}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};
