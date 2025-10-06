// src/components/Onboarding/TourOverlay.tsx
import { X, ChevronLeft, Skip, CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';

import { useTour, TourStep } from './TourProvider';

interface TourOverlayProps {
  onClose?: () => void;
}

const TourOverlay: React.FC<TourOverlayProps> = ({ onClose }) => {
  const { tourState, nextStep, previousStep, skipTour, completeTour, getCurrentStep } = useTour();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = getCurrentStep();

  // Find and highlight target element
  useEffect(() => {
    if (!currentStep || !tourState.isActive) {
      setTargetElement(null);
      return;
    }

    const findTarget = () => {
      let element: HTMLElement | null = null;

      if (currentStep.target === 'body') {
        element = document.body;
      } else {
        element = document.querySelector(currentStep.target) as HTMLElement;
      }

      if (element) {
        setTargetElement(element);
        calculateTooltipPosition(element, currentStep.placement);
      } else {
        // If element not found, try again after a short delay
        setTimeout(findTarget, 100);
      }
    };

    findTarget();
  }, [currentStep, tourState.isActive]);

  const calculateTooltipPosition = (target: HTMLElement, placement: TourStep['placement']) => {
    if (!target || !tooltipRef.current) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 16;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + 16;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 16;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 16;
        break;
      case 'center':
        top = (viewportHeight - tooltipRect.height) / 2;
        left = (viewportWidth - tooltipRect.width) / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    top = Math.max(16, Math.min(top, viewportHeight - tooltipRect.height - 16));
    left = Math.max(16, Math.min(left, viewportWidth - tooltipRect.width - 16));

    setTooltipPosition({ top: top + window.scrollY, left: left + window.scrollX });
  };

  // Scroll target element into view
  useEffect(() => {
    if (targetElement && currentStep?.placement !== 'center') {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [targetElement, currentStep]);

  if (!tourState.isActive || !currentStep) {
    return null;
  }

  const isFirstStep = tourState.currentStep === 0;
  const isLastStep = tourState.currentStep === tourState.steps.length - 1;
  const progress = ((tourState.currentStep + 1) / tourState.steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      completeTour();
      onClose?.();
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    skipTour();
    onClose?.();
  };

  const getSpotlightStyles = () => {
    if (!targetElement || currentStep.placement === 'center') {
      return {};
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = 8;

    return {
      clipPath: `polygon(
        0% 0%, 
        0% 100%, 
        ${rect.left - padding}px 100%, 
        ${rect.left - padding}px ${rect.top - padding}px, 
        ${rect.right + padding}px ${rect.top - padding}px, 
        ${rect.right + padding}px ${rect.bottom + padding}px, 
        ${rect.left - padding}px ${rect.bottom + padding}px, 
        ${rect.left - padding}px 100%, 
        100% 100%, 
        100% 0%
      )`,
    };
  };

  return (
    <div className="tour-overlay fixed inset-0 z-50">
      {/* Backdrop with spotlight effect */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
        style={getSpotlightStyles()}
      />

      {/* Target element highlight */}
      {targetElement && currentStep.placement !== 'center' && (
        <div
          className="absolute pointer-events-none border-2 border-primary-400 rounded-lg shadow-lg animate-pulse"
          style={{
            top: targetElement.getBoundingClientRect().top + window.scrollY - 4,
            left: targetElement.getBoundingClientRect().left + window.scrollX - 4,
            width: targetElement.offsetWidth + 8,
            height: targetElement.offsetHeight + 8,
          }}
        />
      )}

      {/* Tour tooltip */}
      <div
        ref={tooltipRef}
        className="absolute tour-tooltip bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-600 max-w-sm z-10"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                {currentStep.optional ? (
                  <Lightbulb className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  {currentStep.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>
                    Step {tourState.currentStep + 1} of {tourState.steps.length}
                  </span>
                  {currentStep.optional && (
                    <>
                      <span>•</span>
                      <span className="text-yellow-600 dark:text-yellow-400">Optional</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
              title="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
            {currentStep.description}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button onClick={previousStep} className="btn btn-ghost btn-sm">
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentStep.optional && !isLastStep && (
                <button onClick={nextStep} className="btn btn-ghost btn-sm">
                  <Skip className="w-4 h-4" />
                  Skip
                </button>
              )}
              <button onClick={handleNext} className="btn btn-primary btn-sm">
                {isLastStep ? (
                  <>
                    Finish Tour
                    <CheckCircle className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    {currentStep.action === 'click' ? 'Got it' : 'Next'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Placement arrow */}
        {currentStep.placement !== 'center' && (
          <div
            className={`absolute w-3 h-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rotate-45 ${
              currentStep.placement === 'top'
                ? '-bottom-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0'
                : currentStep.placement === 'bottom'
                  ? '-top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0'
                  : currentStep.placement === 'left'
                    ? '-right-1.5 top-1/2 -translate-y-1/2 border-l-0 border-b-0'
                    : currentStep.placement === 'right'
                      ? '-left-1.5 top-1/2 -translate-y-1/2 border-r-0 border-t-0'
                      : 'hidden'
            }`}
          />
        )}
      </div>

      {/* Tour navigation dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          {tourState.steps.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === tourState.currentStep
                  ? 'bg-primary-500 scale-125'
                  : index < tourState.currentStep
                    ? 'bg-green-500'
                    : 'bg-slate-300 dark:bg-slate-600'
              }`}
              onClick={() => {
                // Allow jumping to previous steps only
                if (index <= tourState.currentStep) {
                  // goToStep(index);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="absolute top-6 right-6">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-xs text-slate-600 dark:text-slate-400">
          Press{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">ESC</kbd> to
          exit
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;

// Keyboard shortcut handler
export const useTourKeyboard = () => {
  const { tourState, skipTour, nextStep, previousStep } = useTour();

  useEffect(() => {
    if (!tourState.isActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skipTour();
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousStep();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [tourState.isActive, skipTour, nextStep, previousStep]);
};
