/**
 * InkDotFlourish - Elegant ink dot accent for brand cohesion
 *
 * A subtle, literary flourish that appears beside the logo.
 * Part of "Sophisticated Simplicity" design language.
 */

import React from 'react';

export interface InkDotFlourishProps {
  /** Size of the flourish - default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant - uses design tokens */
  variant?: 'gold' | 'ink' | 'muted';
  /** Optional className for positioning */
  className?: string;
  /** Animate on mount */
  animate?: boolean;
}

export const InkDotFlourish: React.FC<InkDotFlourishProps> = ({
  size = 'md',
  variant = 'gold',
  className = '',
  animate = true,
}) => {
  // Size configurations
  const sizes = {
    sm: { width: 24, height: 8, dotSize: 1.5 },
    md: { width: 32, height: 10, dotSize: 2 },
    lg: { width: 40, height: 12, dotSize: 2.5 },
  };

  const dimensions = sizes[size];

  // Color variants using design tokens
  const colors = {
    gold: 'var(--inkwell-gold, #D4AF37)',
    ink: 'var(--inkwell-ink, #1C1C1C)',
    muted: 'var(--text-secondary, #6B7280)',
  };

  const fillColor = colors[variant];

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`ink-dot-flourish ${className}`}
      aria-hidden="true"
    >
      {/* Three dots in a gentle arc - like ink drops */}
      <circle
        cx={dimensions.dotSize}
        cy={dimensions.height / 2}
        r={dimensions.dotSize}
        fill={fillColor}
        opacity="0.9"
        className={animate ? 'animate-fade-in' : ''}
        style={animate ? { animationDelay: '0ms' } : undefined}
      />
      <circle
        cx={dimensions.width / 2}
        cy={dimensions.dotSize}
        r={dimensions.dotSize * 0.8}
        fill={fillColor}
        opacity="0.7"
        className={animate ? 'animate-fade-in' : ''}
        style={animate ? { animationDelay: '100ms' } : undefined}
      />
      <circle
        cx={dimensions.width - dimensions.dotSize}
        cy={dimensions.height / 2}
        r={dimensions.dotSize}
        fill={fillColor}
        opacity="0.9"
        className={animate ? 'animate-fade-in' : ''}
        style={animate ? { animationDelay: '200ms' } : undefined}
      />
    </svg>
  );
};

/**
 * InkUnderline - Handwritten-style underline accent
 *
 * A subtle flourish for emphasizing important text.
 */
export interface InkUnderlineProps {
  /** Width in pixels - default 80 */
  width?: number;
  /** Color variant */
  variant?: 'gold' | 'ink' | 'muted';
  /** Optional className for positioning */
  className?: string;
}

export const InkUnderline: React.FC<InkUnderlineProps> = ({
  width = 80,
  variant = 'gold',
  className = '',
}) => {
  const colors = {
    gold: 'var(--inkwell-gold, #D4AF37)',
    ink: 'var(--inkwell-ink, #1C1C1C)',
    muted: 'var(--text-secondary, #6B7280)',
  };

  const strokeColor = colors[variant];

  return (
    <svg
      width={width}
      height="6"
      viewBox={`0 0 ${width} 6`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`ink-underline ${className}`}
      aria-hidden="true"
    >
      {/* Handwritten-style curved underline */}
      <path
        d={`M 2 4 Q ${width / 4} 2, ${width / 2} 3 T ${width - 2} 4`}
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
        className="animate-slide-up"
      />
    </svg>
  );
};

export default InkDotFlourish;
