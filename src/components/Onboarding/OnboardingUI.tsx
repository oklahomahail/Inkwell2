/**
 * OnboardingUI
 *
 * Consolidated onboarding experience integrating:
 * - WelcomeModal: First-run choice modal
 * - CompletionChecklist: Progress tracking
 * - FeatureDiscovery: Contextual hints
 *
 * Works with the new spotlight tour system (src/tour/)
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import analyticsService from '@/services/analyticsService';
import { isTourDone } from '@/tour/persistence';
import { startTour } from '@/tour/tourLauncher';

import { CompletionChecklistComponent as CompletionChecklist } from './CompletionChecklistNew';
import { FeatureDiscoveryProvider } from './FeatureDiscovery';
import { WelcomeModal } from './WelcomeModalNew';

// Routes where welcome modal is allowed to auto-show
const FIRST_TIME_ALLOWED_ROUTES = ['/dashboard'];

export function OnboardingUI() {
  const location = useLocation();
  const { shouldShowModal, setTourActive, completeOnboarding } = useOnboardingGate();

  const [showWelcome, setShowWelcome] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Auto-show welcome modal for first-time users
  useEffect(() => {
    // Only check on allowed routes
    if (!FIRST_TIME_ALLOWED_ROUTES.includes(location.pathname)) {
      return undefined;
    }

    // Check if tour is already completed
    if (isTourDone('spotlight')) {
      return undefined;
    }

    // Check gate conditions
    if (shouldShowModal()) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setShowWelcome(true);

        // Track analytics
        try {
          analyticsService.trackEvent('welcome_modal_auto_shown', {
            route: location.pathname,
          });
        } catch (error) {
          console.warn('Failed to track welcome modal analytics:', error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [location.pathname, shouldShowModal]);

  // Listen for tour completion events
  useEffect(() => {
    const handleTourComplete = () => {
      completeOnboarding();
      setTourActive(false);
    };

    window.addEventListener('inkwell:tour:completed', handleTourComplete);
    return () => window.removeEventListener('inkwell:tour:completed', handleTourComplete);
  }, [completeOnboarding, setTourActive]);

  const handleStartTour = () => {
    console.warn('[OnboardingUI] Starting tour, current route:', location.pathname);

    // Mark tour as active to prevent modal from re-opening
    setTourActive(true);
    setShowWelcome(false);

    // Track analytics
    try {
      analyticsService.trackEvent('welcome_modal_start_tour', {
        source: 'welcome_modal',
      });
    } catch (error) {
      console.warn('Failed to track tour start analytics:', error);
    }

    // Longer delay to ensure dashboard components are fully mounted
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Check if we have the required anchors before starting
        const anchors = document.querySelectorAll('[data-spotlight-id]');
        console.warn('[OnboardingUI] Found', anchors.length, 'spotlight anchors');

        if (anchors.length === 0) {
          console.error('[OnboardingUI] No tour anchors found! Dashboard may not be mounted.');
        }

        // Start spotlight tour with the new system
        startTour('spotlight', { source: 'welcome', restart: true });
      }, 500); // Increased from 100ms to 500ms
    });
  };

  const handleOpenChecklist = () => {
    setShowWelcome(false);
    setShowChecklist(true);

    // Track analytics
    try {
      analyticsService.trackEvent('welcome_modal_open_checklist', {
        source: 'welcome_modal',
      });
    } catch (error) {
      console.warn('Failed to track checklist analytics:', error);
    }
  };

  const handleChecklistTour = (tourType: string) => {
    setShowChecklist(false);

    // Track analytics
    try {
      analyticsService.trackEvent('checklist_tour_requested', {
        tourType,
        source: 'checklist',
      });
    } catch (error) {
      console.warn('Failed to track checklist tour analytics:', error);
    }

    // Launch spotlight tour
    startTour('spotlight', { source: 'checklist', restart: true });
  };

  return (
    <FeatureDiscoveryProvider>
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        onStartTour={handleStartTour}
        onOpenChecklist={handleOpenChecklist}
      />

      <CompletionChecklist
        isOpen={showChecklist}
        onClose={() => setShowChecklist(false)}
        onStartTour={handleChecklistTour}
      />
    </FeatureDiscoveryProvider>
  );
}

export default OnboardingUI;
