import React from 'react';

interface InkwellLogoProps {
  variant?: 'full' | 'mark' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'navy' | 'gold' | 'white' | 'auto';
  className?: string;
}

export const InkwellLogo: React.FC<InkwellLogoProps> = ({
  variant = 'full',
  size = 'md',
  color = 'auto',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 w-auto',
  };

  const colorClasses = {
    navy: 'text-inkwell-navy',
    gold: 'text-inkwell-gold',
    white: 'text-white',
    auto: '', // Let the current context determine color
  };

  if (variant === 'mark') {
    return (
      <svg
        className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}
        viewBox="0 0 24 32"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Inkwell Feather Mark */}
        <path
          d="M12 0C8.5 0 6 2.5 6 6c0 2.5 1.5 4.5 3.5 5.5L8 24c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2l-1.5-12.5C16.5 10.5 18 8.5 18 6c0-3.5-2.5-6-6-6zm0 2c2.5 0 4 1.5 4 4s-1.5 4-4 4-4-1.5-4-4 1.5-4 4-4z"
          fillRule="evenodd"
          clipRule="evenodd"
        />
        {/* Feather details */}
        <path
          d="M10 4c0-.5.5-1 1-1s1 .5 1 1-.5 1-1 1-1-.5-1-1zm2 2c0-.5.5-1 1-1s1 .5 1 1-.5 1-1 1-1-.5-1-1z"
          fillRule="evenodd"
          clipRule="evenodd"
          opacity="0.6"
        />
      </svg>
    );
  }

  if (variant === 'wordmark') {
    return (
      <div className={`${sizeClasses[size]} ${colorClasses[color]} ${className} flex items-center`}>
        <span className="font-serif font-semibold tracking-wide text-current">Inkwell</span>
      </div>
    );
  }

  // Full logo (mark + wordmark)
  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} ${className} flex items-center gap-2`}
    >
      <svg
        className="h-full w-auto"
        viewBox="0 0 24 32"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Inkwell Feather Mark */}
        <path
          d="M12 0C8.5 0 6 2.5 6 6c0 2.5 1.5 4.5 3.5 5.5L8 24c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2l-1.5-12.5C16.5 10.5 18 8.5 18 6c0-3.5-2.5-6-6-6zm0 2c2.5 0 4 1.5 4 4s-1.5 4-4 4-4-1.5-4-4 1.5-4 4-4z"
          fillRule="evenodd"
          clipRule="evenodd"
        />
        {/* Feather details */}
        <path
          d="M10 4c0-.5.5-1 1-1s1 .5 1 1-.5 1-1 1-1-.5-1-1zm2 2c0-.5.5-1 1-1s1 .5 1 1-.5 1-1 1-1-.5-1-1z"
          fillRule="evenodd"
          clipRule="evenodd"
          opacity="0.6"
        />
      </svg>
      <span className="font-serif font-semibold tracking-wide text-current">Inkwell</span>
    </div>
  );
};

export default InkwellLogo;
