/**
 * TourTooltip - Floating tooltip UI for tour steps
 *
 * Renders a positioned tooltip next to the highlighted element using React portals.
 * Handles missing anchors gracefully and provides step navigation controls.
 */

import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useTourContext } from './TourProvider';

export function TourTooltip() {
  const { steps, currentStep, next, prev, skip, isFirstStep, isLastStep, progress } =
    useTourContext();
  const step = steps[currentStep];
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);

  // Find anchor element and calculate position
  useEffect(() => {
    if (!step) return;

    const anchor = document.querySelector(step.selector);

    if (!anchor) {
      console.warn(`[Tour] Missing anchor for step "${step.id}": ${step.selector}`);
      // Auto-skip to next step if anchor is missing
      const timer = setTimeout(() => {
        if (!isLastStep) {
          next();
        } else {
          skip();
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const tooltipEl = tooltipRef.current;
      if (!tooltipEl) return;

      const tooltipRect = tooltipEl.getBoundingClientRect();
      const spacing = 16;
      let top = 0;
      let left = 0;

      // Calculate position based on placement
      switch (step.placement) {
        case 'top':
          top = rect.top - tooltipRect.height - spacing;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + spacing;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.left - tooltipRect.width - spacing;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.right + spacing;
          break;
        default:
          // Default to bottom
          top = rect.bottom + spacing;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      }

      // Keep tooltip within viewport
      const maxLeft = window.innerWidth - tooltipRect.width - spacing;
      const maxTop = window.innerHeight - tooltipRect.height - spacing;
      left = Math.max(spacing, Math.min(left, maxLeft));
      top = Math.max(spacing, Math.min(top, maxTop));

      setPosition({ top, left });
      setVisible(true);

      // Scroll anchor into view if needed
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Initial position + delay for smooth appearance
    const timer = setTimeout(updatePosition, 100);

    // Update on window resize
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [step, next, skip, isLastStep]);

  if (!step) return null;

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={skip}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-blue-500 max-w-sm transition-opacity duration-300"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-2">
              {step.title}
            </h3>
            <button
              onClick={skip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
              aria-label="Skip tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            {step.content}
          </p>

          {/* Step indicator */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={prev}
              disabled={isFirstStep}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {isLastStep ? (
              <button
                onClick={skip}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Finish
              </button>
            ) : (
              <button
                onClick={next}
                className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
