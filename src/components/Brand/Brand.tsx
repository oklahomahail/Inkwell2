// src/components/Brand/Brand.tsx
import React from 'react';

import { BrandMark } from './BrandMark';

interface BrandProps {
  collapsed?: boolean;
  variant?: 'light' | 'dark';
}

export function Brand({ collapsed = false, variant = 'light' }: BrandProps) {
  return (
    <div className="px-3 py-3">
      <BrandMark collapsed={collapsed} variant={variant} size="md" />
    </div>
  );
}
