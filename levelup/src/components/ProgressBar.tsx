'use client';

import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  color,
  showLabel = true,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const heights = { sm: 'h-2', md: 'h-3', lg: 'h-4' };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-dark-400">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`${heights[size]} bg-dark-700 rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            background: color
              ? `linear-gradient(to right, ${color}, ${color}dd)`
              : 'linear-gradient(to right, #22c55e, #4ade80)',
          }}
        />
      </div>
    </div>
  );
}
