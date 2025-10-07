import React, { useEffect, useState } from 'react';

interface InkwellSplashProps {
  loading?: boolean;
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

export const InkwellSplash: React.FC<InkwellSplashProps> = ({
  loading = true,
  onComplete,
  duration = 3000,
  className = '',
}) => {
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'filling' | 'complete'>(
    'initial',
  );

  useEffect(() => {
    if (!loading) return;

    const timer1 = setTimeout(() => {
      setAnimationPhase('filling');
    }, 500);

    const timer2 = setTimeout(() => {
      setAnimationPhase('complete');
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loading, duration, onComplete]);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-ink-bg text-ink-text z-50 ${className}`}
    >
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern
            id="inkwell-pattern"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="60" cy="60" r="1" fill="currentColor" opacity="0.3" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#inkwell-pattern)" />
        </svg>
      </div>

      {/* Main logo mark */}
      <div className="relative mb-8">
        <div
          className={`w-24 h-24 transition-all duration-1000 ${
            animationPhase === 'initial'
              ? 'opacity-0 scale-95 transform translate-y-4'
              : animationPhase === 'filling'
                ? 'opacity-100 scale-100 transform translate-y-0'
                : 'opacity-100 scale-105 glow-ink'
          }`}
        >
          <img
            src="/assets/inkwell-mark.svg"
            alt="Inkwell"
            className={`w-full h-full transition-all duration-500 ${
              animationPhase === 'filling' ? 'ink-loading' : ''
            }`}
          />
        </div>

        {/* Loading pulse ring */}
        {animationPhase === 'filling' && (
          <div className="absolute inset-0 rounded-full border-2 border-ink-primary opacity-30 animate-ping" />
        )}
      </div>

      {/* Brand wordmark */}
      <div className="text-center">
        <h1
          className={`font-display font-semibold tracking-wide transition-all duration-800 delay-300 ${
            animationPhase === 'initial'
              ? 'opacity-0 transform translate-y-4'
              : 'opacity-100 transform translate-y-0'
          }`}
        >
          <span className="text-3xl md:text-4xl text-ink-text">inkwell</span>
        </h1>

        <p
          className={`mt-3 text-lg text-ink-muted font-body transition-all duration-800 delay-500 ${
            animationPhase === 'initial'
              ? 'opacity-0 transform translate-y-4'
              : 'opacity-100 transform translate-y-0'
          }`}
        >
          Where stories take shape
        </p>
      </div>

      {/* Loading indicator */}
      {animationPhase === 'filling' && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 text-ink-muted">
            <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-current rounded-full animate-pulse delay-100" />
            <div className="w-1 h-1 bg-current rounded-full animate-pulse delay-200" />
          </div>
          <p className="mt-2 text-sm font-body text-center opacity-60">Gathering your thoughts…</p>
        </div>
      )}

      {/* Subtle ink drops animation */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-ink-primary rounded-full opacity-20 animate-bounce delay-1000" />
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-ink-accent rounded-full opacity-30 animate-pulse delay-1500" />
      <div className="absolute bottom-1/3 left-1/5 w-1.5 h-1.5 bg-ink-primary rounded-full opacity-15 animate-ping delay-2000" />
    </div>
  );
};

// Loading variant for quick use
export const InkwellLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizeClasses[size]} text-ink-primary`}>
      <img src="/assets/icon-inkwell.svg" alt="Loading..." className="w-full h-full pulse-ink" />
    </div>
  );
};

// Brand wordmark component for headers
export const InkwellWordmark: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  withIcon?: boolean;
  className?: string;
}> = ({ size = 'md', withIcon = true, className = '' }) => {
  const sizeClasses = {
    sm: withIcon ? 'text-lg' : 'text-base',
    md: withIcon ? 'text-xl' : 'text-lg',
    lg: withIcon ? 'text-2xl' : 'text-xl',
  };

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {withIcon && (
        <img
          src="/assets/icon-inkwell.svg"
          alt="Inkwell"
          className={`${iconSizeClasses[size]} text-ink-primary transition-ink hover:glow-ink`}
        />
      )}
      <span className={`font-display font-medium tracking-wide text-ink-text ${sizeClasses[size]}`}>
        inkwell
      </span>
    </div>
  );
};

// Autosave indicator with brand styling
export const InkwellSaveIndicator: React.FC<{
  saving?: boolean;
  saved?: boolean;
  className?: string;
}> = ({ saving = false, saved = false, className = '' }) => {
  if (saving) {
    return (
      <div className={`flex items-center space-x-2 text-ink-muted ${className}`}>
        <InkwellLoader size="sm" />
        <span className="text-sm font-body">Saving…</span>
      </div>
    );
  }

  if (saved) {
    return (
      <div
        className={`flex items-center space-x-2 text-ink-success transition-all ink-save-pulse ${className}`}
      >
        <div className="w-2 h-2 bg-current rounded-full" />
        <span className="text-sm font-body">Saved to your Inkwell</span>
      </div>
    );
  }

  return null;
};

export default InkwellSplash;
