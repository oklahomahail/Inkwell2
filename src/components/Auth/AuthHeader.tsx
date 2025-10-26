import React from 'react';

type Props = {
  title?: string;
  subtitle?: string;
  logoSrc?: string;
  className?: string;
};

export default function AuthHeader({
  title = 'Sign in to Inkwell',
  subtitle = 'Welcome back, pick up where you left off.',
  logoSrc = '/assets/brand/inkwell-logo-horizontal.png',
  className = '',
}: Props) {
  return (
    <header className={`flex flex-col items-center text-center ${className}`}>
      <img
        src={logoSrc}
        alt="Inkwell"
        width={180}
        height={48}
        className="mb-4 h-12 w-auto"
        onError={(e) => {
          // Graceful fallback if image fails to load
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>

      {/* Primary brand tagline */}
      <p className="mt-2 text-base opacity-90">Find your story. Write it well.</p>

      {/* Context subtitle under the tagline */}
      {subtitle && <p className="mt-1 text-sm opacity-80">{subtitle}</p>}
    </header>
  );
}
