// src/components/ui/Avatar.tsx
import React from 'react';

import { cn } from '@/utils/cn';

interface AvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ initials, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div
      className={cn(
        'rounded-full bg-indigo-100 flex items-center justify-center font-medium text-indigo-600',
        sizeClasses[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
