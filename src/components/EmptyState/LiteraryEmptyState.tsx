/**
 * LiteraryEmptyState - Elegant empty state component
 *
 * Displays beautiful, literary-themed empty states.
 * Part of "Sophisticated Simplicity" design language.
 */

import { LucideIcon } from 'lucide-react';
import React from 'react';

import { InkDotFlourish, InkUnderline } from '../Brand/InkDotFlourish';

export interface LiteraryEmptyStateProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Primary heading */
  title: string;
  /** Descriptive text */
  description: string;
  /** Optional call-to-action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  /** Optional secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Show ink flourish above title */
  showFlourish?: boolean;
  /** Icon color variant */
  iconColor?: 'gold' | 'ink' | 'muted' | 'purple' | 'blue';
}

export const LiteraryEmptyState: React.FC<LiteraryEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  showFlourish = true,
  iconColor = 'gold',
}) => {
  // Icon color mapping
  const iconColors = {
    gold: 'text-inkwell-gold dark:text-inkwell-gold-light',
    ink: 'text-inkwell-ink dark:text-inkwell-dark-text',
    muted: 'text-inkwell-ink/40 dark:text-inkwell-dark-muted',
    purple: 'text-purple-600 dark:text-purple-400',
    blue: 'text-inkwell-focus dark:text-blue-400',
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8 bg-gradient-to-b from-inkwell-canvas to-inkwell-parchment dark:from-inkwell-dark-bg dark:to-inkwell-dark-surface">
      <div className="max-w-md text-center">
        {/* Icon with flourish */}
        <div className="mb-6 flex flex-col items-center gap-4 animate-fade-in">
          {showFlourish && <InkDotFlourish size="md" variant="gold" className="opacity-60" />}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center bg-inkwell-panel/30 dark:bg-inkwell-dark-elevated/50 ${iconColors[iconColor]}`}
          >
            <Icon className="w-10 h-10" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title with underline flourish */}
        <div className="mb-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-heading-lg font-serif text-inkwell-ink dark:text-inkwell-dark-text mb-2">
            {title}
          </h2>
          <div className="flex justify-center">
            <InkUnderline width={60} variant="gold" />
          </div>
        </div>

        {/* Description */}
        <p
          className="text-body text-inkwell-ink/70 dark:text-inkwell-dark-muted mb-8 max-w-sm mx-auto animate-fade-in"
          style={{ animationDelay: '200ms' }}
        >
          {description}
        </p>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div
            className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up"
            style={{ animationDelay: '300ms' }}
          >
            {action && (
              <button
                onClick={action.onClick}
                className={`
                  px-6 py-3 rounded-button font-medium transition-all duration-200
                  ${
                    action.variant === 'secondary'
                      ? 'border border-inkwell-panel dark:border-inkwell-dark-elevated text-inkwell-ink dark:text-inkwell-dark-text hover:bg-inkwell-panel/30 dark:hover:bg-inkwell-dark-elevated'
                      : 'bg-gradient-to-r from-inkwell-gold to-inkwell-gold-600 hover:from-inkwell-gold-600 hover:to-inkwell-gold-700 text-white shadow-card hover:shadow-elevated focus:shadow-focus'
                  }
                `}
              >
                {action.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="px-6 py-3 text-inkwell-focus dark:text-inkwell-gold-light hover:underline font-medium transition-all duration-200"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiteraryEmptyState;
