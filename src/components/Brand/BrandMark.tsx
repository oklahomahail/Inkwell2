// src/components/Brand/BrandMark.tsx
import React from 'react';

import Logo from '@/components/Logo';
import { cn } from '@/lib/utils';

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
  const featherVariant = variant === 'light' ? 'svg-feather-navy' : 'svg-feather-gold';
  const wordmarkVariant = variant === 'light' ? 'wordmark-light' : 'wordmark-dark';

  const sizes = {
    sm: { feather: 16, wordmark: 12 },
    md: { feather: 20, wordmark: 16 },
    lg: { feather: 24, wordmark: 20 },
  };

  return (
    <div className={cn('flex items-center gap-2 overflow-hidden', className)}>
      <Logo
        variant={featherVariant}
        size={sizes[size].feather}
        className="transition-all duration-200 shrink-0"
      />
      {!collapsed && (
        <Logo
          variant={wordmarkVariant}
          size={sizes[size].wordmark}
          className="transition-all duration-200"
        />
      )}
    </div>
  );
}
