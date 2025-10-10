// src/components/ui/BrandedEmptyState.tsx
import { ArrowRight } from 'lucide-react';
import React from 'react';

import Logo from '@/components/Logo';
import { cn } from '@/utils/cn';

import { KeyboardShortcut } from './KeyboardHints';

// ==========================================
// BRANDED EMPTY STATE COMPONENT
// ==========================================

interface BrandedEmptyStateProps {
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    shortcut?: string[];
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    shortcut?: string[];
  };
  suggestions?: Array<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    onClick?: () => void;
  }>;
  className?: string;
  variant?: 'default' | 'subtle';
}

export const BrandedEmptyState: React.FC<BrandedEmptyStateProps> = ({
  title,
  description,
  primaryAction,
  secondaryAction,
  suggestions,
  className = '',
  variant = 'default',
}) => {
  const isSubtle = variant === 'subtle';

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}
    >
      {/* Branded Logo Circle */}
      <div
        className={cn(
          'mx-auto mb-6 flex items-center justify-center rounded-full border transition-all duration-200',
          isSubtle
            ? 'h-16 w-16 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            : 'h-20 w-20 bg-gradient-to-br from-inkwell-navy-50 to-inkwell-gold-50 dark:from-inkwell-navy-800 dark:to-inkwell-gold-700/20 border-inkwell-navy-200 dark:border-inkwell-navy-700',
        )}
      >
        <Logo
          variant={isSubtle ? 'outline-dark' : 'mark-light'}
          size={isSubtle ? 32 : 40}
          className="opacity-80"
        />
      </div>

      {/* Content */}
      <div className="max-w-md">
        <h3
          className={cn(
            'font-semibold mb-2',
            isSubtle
              ? 'text-lg text-slate-700 dark:text-slate-300'
              : 'text-xl text-slate-900 dark:text-slate-100',
          )}
        >
          {title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">{description}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-inkwell-navy text-white rounded-lg hover:bg-inkwell-navy-700 transition-colors shadow-sm hover:shadow-md"
            >
              <span>{primaryAction.label}</span>
              {primaryAction.shortcut && (
                <KeyboardShortcut keys={primaryAction.shortcut} size="sm" variant="subtle" />
              )}
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <span>{secondaryAction.label}</span>
              {secondaryAction.shortcut && (
                <KeyboardShortcut keys={secondaryAction.shortcut} size="sm" variant="subtle" />
              )}
            </button>
          )}
        </div>

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Get started with:
            </h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => {
                const SuggestionIcon = suggestion.icon;
                return (
                  <button
                    key={index}
                    onClick={suggestion.onClick}
                    className="w-full flex items-center gap-3 p-3 text-left bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                  >
                    <SuggestionIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {suggestion.title}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {suggestion.description}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// SIMPLE BRANDED EMPTY STATE
// ==========================================

interface SimpleBrandedEmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const SimpleBrandedEmptyState: React.FC<SimpleBrandedEmptyStateProps> = ({
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={cn('text-center py-8', className)}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <Logo variant="outline-dark" size={24} className="opacity-60" />
      </div>
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="text-xs text-inkwell-navy dark:text-inkwell-gold hover:underline font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
