// @ts-nocheck
// File: src/tour/components/StepCard.tsx
// Tour step card with navigation and accessibility

import React, { useEffect, useRef } from 'react';

interface StepCardProps {
  title: string;
  content: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export function StepCard({
  title,
  content,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  onComplete,
  onDismiss,
}: StepCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const focusableElements = card.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function handleKeyDown(event: KeyboardEvent) {
      const isTab = event.key === 'Tab';
      const isEscape = event.key === 'Escape';

      if (isTab) {
        if (event.shiftKey) {
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
          }
        }
      }

      if (isEscape) {
        onClose();
      }
    }

    card.addEventListener('keydown', handleKeyDown);
    firstFocusable.focus();

    return () => {
      card.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-96"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
    >
      <div className="flex justify-between items-start mb-4">
        <h2 id="tour-step-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <button
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          onClick={onClose}
          aria-label="Close tour"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="prose dark:prose-invert mb-4">
        <p className="text-gray-600 dark:text-gray-300">{content}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={isLastStep ? onComplete : onNext}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            {isLastStep ? 'Complete' : 'Next'}
          </button>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="mt-4 w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Don't show this again
        </button>
      )}
    </div>
  );
}
