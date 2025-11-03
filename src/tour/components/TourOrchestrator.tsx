// @ts-nocheck
// File: src/tour/components/TourOrchestrator.tsx
// Main tour orchestrator with state management + layout stability guards

import React, { useState, useEffect, useCallback, useRef } from 'react';

import devLog from '@/utils/devLog';

import { useAnalytics } from '../hooks/useAnalytics';
import { useRouter } from '../hooks/useRouter';
import { useTourStorage } from '../hooks/useTourStorage';
import { getIdealPlacement } from '../targets';
import {
  waitForLayoutSettled,
  observeAnchor,
  createDebouncedMeasure,
  recordMeasurement,
  recordAdjustment,
} from '../utils/layoutGuards';

import { Spotlight } from './Spotlight';
import { StepCard } from './StepCard';

import type { TourStep } from '../types';

interface TourOrchestratorProps {
  tourId: string;
  steps: TourStep[];
  initialStep?: number;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export function TourOrchestrator({
  tourId,
  steps,
  initialStep = 0,
  onComplete,
  onDismiss,
}: TourOrchestratorProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const router = useRouter();
  const storage = useTourStorage(tourId);
  const analytics = useAnalytics();
  const unobserveRef = useRef<(() => void) | null>(null);

  const step = steps[currentStep];

  // Find and track the target element
  useEffect(() => {
    if (!step?.target) {
      setTargetElement(null);
      return;
    }

    let timeout: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 10;

    const findTarget = () => {
      const element = document.querySelector<HTMLElement>(step.target);
      if (element) {
        setTargetElement(element);
        return true;
      }
      return false;
    };

    const attemptToFindTarget = () => {
      if (attempts >= maxAttempts) {
        devLog.warn(`Could not find tour target: ${step.target}`);
        return;
      }

      if (!findTarget()) {
        attempts++;
        timeout = setTimeout(attemptToFindTarget, 500);
      }
    };

    attemptToFindTarget();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [step?.target]);

  // Wait for layout to settle before first measurement and set up anchor observation
  useEffect(() => {
    if (!targetElement || !step?.id) {
      // Clean up previous observer if target changed
      if (unobserveRef.current) {
        unobserveRef.current();
        unobserveRef.current = null;
      }
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        // Wait for fonts, images, and layout to settle
        await waitForLayoutSettled();

        if (!isMounted) return;

        // Record initial measurement for telemetry
        const initialMeasurement = recordMeasurement(step.id, targetElement);
        devLog.debug('[Tour] Initial measurement:', initialMeasurement);

        // Fire telemetry event (can be tracked by analytics)
        analytics?.trackEvent('tour_step_measured', {
          tourId,
          stepId: step.id,
          ...initialMeasurement,
        });

        // Set up observation for layout changes
        if (unobserveRef.current) {
          unobserveRef.current();
        }

        // Create debounced re-measure to avoid thrashing
        const debouncedRemeasure = createDebouncedMeasure(() => {
          if (!isMounted || !targetElement) return;

          const _newMeasurement = recordMeasurement(step.id, targetElement);
          const oldRect = targetElement.getBoundingClientRect();

          // Check if position actually changed significantly
          const hasChanged =
            Math.abs(oldRect.left - initialMeasurement.x) > 2 ||
            Math.abs(oldRect.top - initialMeasurement.y) > 2 ||
            Math.abs(oldRect.width - initialMeasurement.w) > 2 ||
            Math.abs(oldRect.height - initialMeasurement.h) > 2;

          if (hasChanged) {
            const adjustment = recordAdjustment(
              step.id,
              {
                left: initialMeasurement.x,
                top: initialMeasurement.y,
                width: initialMeasurement.w,
                height: initialMeasurement.h,
              } as DOMRect,
              oldRect,
              'intersection',
            );

            devLog.debug('[Tour] Measurement adjusted:', adjustment);

            analytics?.trackEvent('tour_step_adjusted', {
              tourId,
              stepId: step.id,
              ...adjustment,
            });
          }
        }, 16);

        // Observe anchor for changes
        unobserveRef.current = observeAnchor(targetElement, (reason) => {
          devLog.debug(`[Tour] Anchor changed (${reason}), scheduling re-measure`);
          debouncedRemeasure.trigger();
        });

        // Clean up debounce on unmount
        return () => {
          debouncedRemeasure.cancel();
        };
      } catch (error) {
        devLog.warn('[Tour] Layout settlement failed:', error);
      }
    })();

    return () => {
      isMounted = false;
      if (unobserveRef.current) {
        unobserveRef.current();
        unobserveRef.current = null;
      }
    };
  }, [targetElement, step?.id, tourId, analytics]);

  // Handle route changes if needed
  useEffect(() => {
    if (!step?.route || !router) return;

    const currentPath = router.getCurrentPath();
    if (currentPath !== step.route) {
      router.navigate(step.route);
    }
  }, [step?.route, router]);

  // Track step changes
  useEffect(() => {
    analytics?.trackEvent('tour_step_viewed', {
      tourId,
      stepIndex: currentStep,
      stepId: step?.id,
    });
  }, [currentStep, tourId, step?.id, analytics]);

  const handleNext = useCallback(() => {
    if (currentStep === steps.length - 1) {
      storage.markComplete();
      analytics?.trackEvent('tour_completed', { tourId });
      const { tourController } = require('../../components/Onboarding/hooks/TourController');
      tourController.endTour(tourId);
      onComplete?.();
    } else {
      setCurrentStep((prev) => prev + 1);
      storage.saveProgress(currentStep + 1);
    }
  }, [currentStep, steps.length, storage, analytics, tourId, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      storage.saveProgress(currentStep - 1);
    }
  }, [currentStep, storage]);

  const handleClose = useCallback(() => {
    storage.saveProgress(currentStep);
    analytics?.trackEvent('tour_closed', {
      tourId,
      stepIndex: currentStep,
      completed: false,
    });
    onComplete?.();
  }, [currentStep, storage, analytics, tourId, onComplete]);

  const handleDismiss = useCallback(() => {
    storage.markDismissed();
    analytics?.trackEvent('tour_dismissed', { tourId });
    onDismiss?.();
  }, [storage, analytics, tourId, onDismiss]);

  if (!step) return null;

  return (
    <Spotlight
      targetElement={targetElement}
      placement={getIdealPlacement(targetElement, step.placement)}
      padding={step.padding}
      isActive={true}
    >
      <StepCard
        title={step.title}
        content={step.content}
        currentStep={currentStep}
        totalSteps={steps.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onClose={handleClose}
        onDismiss={currentStep === 0 ? handleDismiss : undefined}
      />
    </Spotlight>
  );
}
