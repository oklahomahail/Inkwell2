import React from 'react';

interface PanelProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  titleSize?: 'sm' | 'md' | 'lg';
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'medium' | 'strong';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  headerActions?: React.ReactNode;
  fullHeight?: boolean;
  variant?: 'default' | 'brand' | 'muted';
}

const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  children,
  className = '',
  titleSize = 'md',
  padding = 'md',
  shadow = 'soft',
  rounded = '2xl',
  headerActions,
  fullHeight = false,
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'bg-white border-gray-200',
    brand: 'bg-blue-50 border-blue-200',
    muted: 'bg-gray-50 border-gray-300',
  };

  const shadowClasses = {
    none: '',
    soft: 'shadow-sm',
    medium: 'shadow-md',
    strong: 'shadow-lg',
  };

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const titleSizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-semibold leading-snug',
    lg: 'text-2xl font-bold',
  };

  const textColorClasses = {
    default: 'text-gray-900',
    brand: 'text-blue-900',
    muted: 'text-gray-700',
  };

  const subtitleColorClasses = {
    default: 'text-gray-600',
    brand: 'text-blue-700',
    muted: 'text-gray-500',
  };

  const borderColorClasses = {
    default: 'border-gray-200',
    brand: 'border-blue-200',
    muted: 'border-gray-300',
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${shadowClasses[shadow]}
        ${roundedClasses[rounded]}
        ${fullHeight && 'h-full flex flex-col'}
        border transition-all duration-200
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      {(title || subtitle || headerActions) && (
        <div
          className={`
            border-b
            ${borderColorClasses[variant]}
            ${paddingClasses[padding]}
            flex items-center justify-between
          `
            .trim()
            .replace(/\s+/g, ' ')}
        >
          <div className="flex-1">
            {title && (
              <h3
                className={`
                  font-semibold mb-1
                  ${titleSizeClasses[titleSize]}
                  ${textColorClasses[variant]}
                `
                  .trim()
                  .replace(/\s+/g, ' ')}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                className={`
                  text-sm
                  ${subtitleColorClasses[variant]}
                `
                  .trim()
                  .replace(/\s+/g, ' ')}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && <div className="flex items-center space-x-2">{headerActions}</div>}
        </div>
      )}
      <div
        className={`
          ${paddingClasses[padding]}
          ${(title || subtitle || headerActions) && 'pt-4'}
          ${fullHeight && 'flex-1'}
        `
          .trim()
          .replace(/\s+/g, ' ')}
      >
        {children}
      </div>
    </div>
  );
};

export default Panel;
