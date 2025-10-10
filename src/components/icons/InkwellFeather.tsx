// src/components/icons/InkwellFeather.tsx
import React from 'react';

interface InkwellFeatherProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * InkwellFeather - A custom feather icon component designed to match Inkwell's brand
 * Can be used as a replacement for the generic Book icon throughout the app
 */
export function InkwellFeather({
  className = 'h-6 w-6',
  size,
  color = 'currentColor',
}: InkwellFeatherProps) {
  // If size is provided, use it for both width and height
  const sizeProps = size ? { width: size, height: size } : {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...sizeProps}
    >
      {/* Elegant feather design inspired by writing and creativity */}
      <path d="M12 2c4.5 0 8 3.5 8 8 0 8-8 12-8 12s-8-4-8-12c0-4.5 3.5-8 8-8z" />
      <path d="M12 6c2 0 4 1 4 3s-2 3-4 3-4-1-4-3 2-3 4-3z" />
      <path d="M8 10l8 8" />
      <path d="M10 8l6 6" />
      <path d="M12 6l4 4" />
    </svg>
  );
}

// Alternative simpler feather design
export function InkwellFeatherSimple({
  className = 'h-6 w-6',
  size,
  color = 'currentColor',
}: InkwellFeatherProps) {
  const sizeProps = size ? { width: size, height: size } : {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...sizeProps}
    >
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

export default InkwellFeather;
