// src/components/TourLauncher.tsx
/**
 * TourLauncher Component
 *
 * Provides a simple button or link to launch a specific tour set.
 * Can be placed anywhere in the UI to trigger contextual help.
 *
 * Usage:
 * ```tsx
 * // Button variant (default)
 * <TourLauncher setKey="gettingStarted" />
 *
 * // Link variant
 * <TourLauncher setKey="chapterManager" variant="link" />
 *
 * // Custom button with children
 * <TourLauncher setKey="aiAssistant">
 *   <HelpCircle className="w-4 h-4" />
 *   <span>Help</span>
 * </TourLauncher>
 * ```
 */

import { HelpCircle, Play } from 'lucide-react';
import React from 'react';

import { useTour } from '@/hooks/useTour';

interface TourLauncherProps {
  /** Tour set ID to launch */
  setKey: string;
  /** Visual variant */
  variant?: 'button' | 'link' | 'icon';
  /** Optional label text (defaults to tour name) */
  label?: string;
  /** Custom children (overrides label) */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Force restart tour even if completed */
  force?: boolean;
}

export const TourLauncher: React.FC<TourLauncherProps> = ({
  setKey,
  variant = 'button',
  label,
  children,
  className = '',
  force = false,
}) => {
  const { start } = useTour();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const started = start(setKey, force);

    if (!started && import.meta.env.DEV) {
      console.warn(`[TourLauncher] Tour "${setKey}" already completed or not available`);
    }
  };

  // Determine display content
  const content = children || (
    <>
      {variant === 'icon' ? (
        <HelpCircle className="h-4 w-4" />
      ) : (
        <>
          <Play className="h-3.5 w-3.5" />
          <span>{label || 'Start Tour'}</span>
        </>
      )}
    </>
  );

  // Render based on variant
  switch (variant) {
    case 'link':
      return (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 text-sm text-blue-400 transition-colors hover:text-blue-300 hover:underline ${className}`}
        >
          {content}
        </button>
      );

    case 'icon':
      return (
        <button
          onClick={handleClick}
          className={`inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-300 ${className}`}
          title={label || 'Start tour'}
        >
          {content}
        </button>
      );

    case 'button':
    default:
      return (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-blue-500 active:bg-blue-700 ${className}`}
        >
          {content}
        </button>
      );
  }
};

/**
 * TourMenu Component
 *
 * Displays a dropdown menu with all available tours.
 * Useful for settings pages or help menus.
 *
 * Usage:
 * ```tsx
 * <TourMenu />
 * ```
 */
export const TourMenu: React.FC = () => {
  const { start } = useTour();
  const [isOpen, setIsOpen] = React.useState(false);

  const tours = [
    { id: 'gettingStarted', name: 'Getting Started', description: 'Learn the basics' },
    { id: 'chapterManager', name: 'Chapter Management', description: 'Manage your chapters' },
    { id: 'aiAssistant', name: 'AI Assistant', description: 'Use the AI writing assistant' },
    { id: 'worldBuilder', name: 'World Builder', description: 'Organize your story world' },
    { id: 'autosave', name: 'Autosave System', description: 'Understand how saving works' },
  ];

  const handleTourClick = (tourId: string) => {
    start(tourId, true); // Force restart
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
      >
        <HelpCircle className="h-4 w-4" />
        <span>Tours & Help</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
            <div className="border-b border-slate-800 p-3">
              <h3 className="text-sm font-semibold text-slate-200">Available Tours</h3>
              <p className="mt-0.5 text-xs text-slate-500">Learn how to use different features</p>
            </div>

            <div className="p-2">
              {tours.map((tour) => (
                <button
                  key={tour.id}
                  onClick={() => handleTourClick(tour.id)}
                  className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-slate-800"
                >
                  <Play className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-200">{tour.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{tour.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
