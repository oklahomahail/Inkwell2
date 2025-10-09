// src/components/Brand/BrandMark.tsx
import React from 'react';

// Import brand assets
import FeatherGold from '@/assets/brand/inkwell-feather-gold.svg';
import FeatherNavy from '@/assets/brand/inkwell-feather-navy.svg';
import WordmarkGold from '@/assets/brand/inkwell-wordmark-gold.svg';
import WordmarkNavy from '@/assets/brand/inkwell-wordmark-navy.svg';
import { cn } from '@/utils/cn';

interface BrandMarkProps {
  collapsed?: boolean;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandMark({
  collapsed = false,
  variant = 'light',
  size = 'md',
  className,
}: BrandMarkProps) {
  const featherSrc = variant === 'light' ? FeatherNavy : FeatherGold;
  const wordmarkSrc = variant === 'light' ? WordmarkNavy : WordmarkGold;

  const sizes = {
    sm: { feather: 'h-4 w-auto', wordmark: 'h-3 w-auto' },
    md: { feather: 'h-5 w-auto', wordmark: 'h-4 w-auto' },
    lg: { feather: 'h-6 w-auto', wordmark: 'h-5 w-auto' },
  };

  return (
    <div className={cn('flex items-center gap-2 overflow-hidden', className)}>
      <img
        src={featherSrc}
        alt="Inkwell feather"
        className={cn('transition-all duration-200', sizes[size].feather)}
      />
      <img
        src={wordmarkSrc}
        alt="Inkwell"
        className={cn(
          'transition-all duration-200',
          sizes[size].wordmark,
          collapsed ? 'opacity-0 w-0' : 'opacity-100',
        )}
      />
    </div>
  );
}
