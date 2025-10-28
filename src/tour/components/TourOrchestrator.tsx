// @ts-nocheck
// File: src/tour/components/TourOrchestrator.tsx
// Main tour orchestrator with state management

import React, { useState, useEffect, useCallback } from 'react';

import devLog from "@/utils/devLog";

import { useAnalytics } from '../hooks/useAnalytics';
import { useRouter } from '../hooks/useRouter';
import { useTourStorage } from '../hooks/useTourStorage';
import { getIdealPlacement } from '../targets';

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
