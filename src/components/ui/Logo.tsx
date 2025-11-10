// src/components/ui/Logo.tsx
import React from 'react';

interface LogoProps {
  /**
   * Size of the logo in pixels
   * @default 24
   */
  size?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Centralized Inkwell logo component
 * Single source of truth for brand mark across the application
 *
 * Uses /brand/1.svg (the square icon) everywhere in the UI.
 * Do NOT use favicon.svg in UI components - that's for browser tabs only.
 */
export function Logo({ size = 24, className = '' }: LogoProps) {
  return (
    <img
      src="/brand/1.svg"
      alt="Inkwell"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
