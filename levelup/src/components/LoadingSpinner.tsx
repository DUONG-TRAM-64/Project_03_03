'use client';

import React from 'react';

export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} border-2 border-dark-600 border-t-primary-500 rounded-full animate-spin`} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-3 border-dark-600 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-dark-400 text-sm animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
