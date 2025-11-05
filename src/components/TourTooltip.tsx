// src/components/TourTooltip.tsx
/**
 * TourTooltip Component
 *
 * Displays a floating tooltip that follows the current tour step's anchor element.
 * Features:
 * - Automatic positioning based on step's placement preference
 * - Smooth transitions between steps
 * - Keyboard hints (Arrow keys, Escape)
 * - Progress indicator
 * - Skip/End tour options
 *
 * Usage:
 * ```tsx
 * import { TourTooltip } from '@/components/TourTooltip';
 * import { useTour } from '@/hooks/useTour';
 *
 * function App() {
 *   const tour = useTour();
 *
 *   return (
 *     <>
 *       <YourApp />
 *       {tour.isActive && <TourTooltip />}
 *     </>
 *   );
 * }
 * ```
 */

import { X, ChevronLeft, ChevronRight, Keyboard } from 'lucide-react';
import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useTour } from '@/hooks/useTour';

interface Position {
  top: number;
  left: number;
}

export const TourTooltip: React.FC = () => {
  const { isActive, currentStep, index, totalSteps, next, prev, skip } = useTour();
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  /**
   * Calculate tooltip position based on anchor element and placement preference
   */
  useLayoutEffect(() => {
    if (!currentStep?.selector) return;

    const element = document.querySelector(currentStep.selector) as HTMLElement | null;
    if (!element) {
      console.warn(`[TourTooltip] Anchor not found: ${currentStep.selector}`);
      return;
    }

    const rect = element.getBoundingClientRect();
    setAnchorRect(rect);

    // Calculate position based on placement preference
    const tooltipWidth = 360; // Max width of tooltip
    const tooltipHeight = 200; // Approximate height
    const gap = 12; // Gap between anchor and tooltip

    let top = 0;
    let left = 0;

    switch (currentStep.placement) {
      case 'top':
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
      default:
        // Default to bottom
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Clamp to viewport bounds
    const padding = 16;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    setPosition({ top, left });

    // Scroll anchor into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

    // Add highlight effect to anchor
    element.classList.add('tour-anchor-highlight');
    return () => {
      element.classList.remove('tour-anchor-highlight');
    };
  }, [currentStep]);

  if (!isActive || !currentStep) {
    return null;
  }

  const isFirstStep = index === 0;
  const isLastStep = index === totalSteps - 1;

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm transition-opacity" />

      {/* Anchor highlight box */}
      {anchorRect && (
        <div
          className="fixed z-[9999] rounded-lg border-2 border-blue-400 shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all duration-300"
          style={{
            top: anchorRect.top - 4,
            left: anchorRect.left - 4,
            width: anchorRect.width + 8,
            height: anchorRect.height + 8,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[10000] w-[360px] max-w-[calc(100vw-32px)] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl transition-all duration-300"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 p-4 pb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-100">{currentStep.title}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Step {index + 1} of {totalSteps}
            </p>
          </div>
          <button
            onClick={skip}
            className="ml-2 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
            title="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm leading-relaxed text-slate-300">{currentStep.content}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 p-4 pt-3">
          {/* Keyboard hint */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Keyboard className="h-3 w-3" />
            <span>Use arrow keys</span>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              disabled={isFirstStep}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-800"
              title="Previous step (← Arrow Left)"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={next}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-blue-500 active:bg-blue-700"
              title={isLastStep ? 'Complete tour' : 'Next step (→ Arrow Right)'}
            >
              <span>{isLastStep ? 'Finish' : 'Next'}</span>
              {!isLastStep && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full overflow-hidden rounded-b-xl bg-slate-800">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((index + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </>,
    document.body,
  );
};
