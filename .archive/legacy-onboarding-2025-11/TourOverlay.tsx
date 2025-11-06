/**
 * Tour Overlay
 *
 * Listens to TourController events and displays an interactive tour overlay
 * with spotlight effects highlighting tour anchors.
 */

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import devLog from '@/utils/devLog';

import { spotlightSteps } from './tour-core/spotlightSteps';
import { stopTour, emitTourComplete } from './tour-core/TourController';

interface TourStartDetail {
  id: string;
}

export function TourOverlay() {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightPos, setSpotlightPos] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const currentStep = spotlightSteps[currentStepIndex];

  // Listen for tour events
  useEffect(() => {
    const handleTourStart = (event: Event) => {
      const detail = (event as CustomEvent<TourStartDetail>).detail;
      devLog.debug('[TourOverlay] Tour started:', detail.id);
      setIsActive(true);
      setCurrentStepIndex(0);
      updateSpotlight(0);
    };

    const handleTourStop = () => {
      devLog.debug('[TourOverlay] Tour stopped');
      setIsActive(false);
    };

    window.addEventListener('tour:start', handleTourStart);
    window.addEventListener('tour:stop', handleTourStop);

    return () => {
      window.removeEventListener('tour:start', handleTourStart);
      window.removeEventListener('tour:stop', handleTourStop);
    };
  }, []);

  // Update spotlight position when step changes
  useEffect(() => {
    if (isActive) {
      updateSpotlight(currentStepIndex);
    }
  }, [currentStepIndex, isActive]);

  const updateSpotlight = (stepIndex: number) => {
    const step = spotlightSteps[stepIndex];
    if (!step) return;

    // Try to find the target element
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setSpotlightPos({
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      });
      devLog.debug('[TourOverlay] Found element, spotlight updated:', {
        target: step.target,
        rect,
      });
    } else {
      // Fallback to provided fallback position or center
      const fallback = step.fallback;
      if (fallback) {
        setSpotlightPos({
          x: fallback.x === 'center' ? window.innerWidth / 2 : fallback.x,
          y: fallback.y === 'center' ? window.innerHeight / 2 : fallback.y,
          width: 200,
          height: 200,
        });
        devLog.debug('[TourOverlay] Using fallback position for step:', step.id);
      } else {
        setSpotlightPos(null);
      }
    }
  };

  const handleNext = () => {
    if (currentStepIndex < spotlightSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Tour complete
      emitTourComplete();
      setIsActive(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleClose = () => {
    stopTour('user');
    setIsActive(false);
  };

  if (!isActive || !currentStep) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Spotlight SVG overlay */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-[9999]"
        style={{ zIndex: 9999 }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightPos && (
              <rect
                x={spotlightPos.x - 8}
                y={spotlightPos.y - 8}
                width={spotlightPos.width + 16}
                height={spotlightPos.height + 16}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Darkened overlay */}
        <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.7)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Tooltip content */}
      {spotlightPos && (
        <div
          className="fixed z-[10000] bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 max-w-sm pointer-events-auto"
          style={{
            left: `${Math.min(spotlightPos.x + spotlightPos.width + 20, window.innerWidth - 320)}px`,
            top: `${Math.min(Math.max(spotlightPos.y, 20), window.innerHeight - 400)}px`,
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
              {currentStep.id.replace('-', ' ')}
            </h3>
            <button
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              aria-label="Close tour"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-slate-600 dark:text-slate-300 mb-4">{currentStep.content}</p>

          {/* Progress */}
          <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Step {currentStepIndex + 1} of {spotlightSteps.length}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / spotlightSteps.length) * 100}%`,
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              {currentStepIndex === spotlightSteps.length - 1 ? 'Done' : 'Next'}
              {currentStepIndex < spotlightSteps.length - 1 && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
