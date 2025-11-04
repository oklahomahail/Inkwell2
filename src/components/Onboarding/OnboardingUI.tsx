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
import { useUI } from '@/hooks/useUI';
import analyticsService from '@/services/analyticsService';
// Tour imports temporarily stubbed during rebuild
const isTourDone = (_tourId: string) => false;
const startTour = (_tourId: string, _options?: any) => console.warn('Tour system being rebuilt');

import { CompletionChecklistComponent as CompletionChecklist } from './CompletionChecklistNew';
import { FeatureDiscoveryProvider } from './FeatureDiscovery';
import { WelcomeModal } from './WelcomeModalNew';

// Routes where welcome modal is allowed to auto-show
const FIRST_TIME_ALLOWED_ROUTES = ['/dashboard'];

export function OnboardingUI() {
  const location = useLocation();
  const { shouldShowModal, setTourActive, completeOnboarding } = useOnboardingGate();
  const { sidebarCollapsed, toggleSidebar } = useUI();

  const [showWelcome, setShowWelcome] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Auto-show welcome modal for first-time users
  useEffect(() => {
    console.warn('[OnboardingUI] Route check:', {
      pathname: location.pathname,
      allowed: FIRST_TIME_ALLOWED_ROUTES,
      isAllowed: FIRST_TIME_ALLOWED_ROUTES.includes(location.pathname),
      tourDone: isTourDone('spotlight'),
      shouldShow: shouldShowModal(),
    });

    // Only check on allowed routes
    if (!FIRST_TIME_ALLOWED_ROUTES.includes(location.pathname)) {
      console.warn('[OnboardingUI] Not on allowed route, skipping modal');
      return undefined;
    }

    // Check if tour is already completed
    if (isTourDone('spotlight')) {
      console.warn('[OnboardingUI] Tour already done, skipping modal');
      return undefined;
    }

    // Check gate conditions
    if (shouldShowModal()) {
      console.warn('[OnboardingUI] Gate conditions met, will show modal in 1s');
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        console.warn('[OnboardingUI] Showing welcome modal now');
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
    console.warn('[OnboardingUI] Gate conditions not met, skipping modal');
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

    // If not on dashboard, this shouldn't happen - but handle it gracefully
    if (location.pathname !== '/dashboard') {
      console.error(
        '[OnboardingUI] ERROR: Tour started from non-dashboard route:',
        location.pathname,
      );
      console.error('[OnboardingUI] Dashboard components are not mounted yet!');
      // Close modal and let the route redirect happen naturally
      setShowWelcome(false);
      return;
    }

    // Ensure sidebar is visible for tour (it contains tour anchors)
    const needsToOpenSidebar = sidebarCollapsed;
    if (needsToOpenSidebar) {
      console.warn('[OnboardingUI] Opening sidebar for tour');
      toggleSidebar();
    }

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

    // Wait for sidebar animation (300ms) + buffer time for components to mount
    const delayMs = needsToOpenSidebar ? 800 : 500; // Extra time if sidebar needs to animate
    console.warn('[OnboardingUI] Waiting', delayMs, 'ms for components to be ready');

    requestAnimationFrame(() => {
      setTimeout(() => {
        // Check if we have the required anchors before starting
        const anchors = document.querySelectorAll('[data-tour]');
        console.warn('[OnboardingUI] Found', anchors.length, 'tour anchors');

        if (anchors.length === 0) {
          console.error('[OnboardingUI] No tour anchors found! Dashboard may not be mounted.');
          console.error(
            '[OnboardingUI] Available elements:',
            document.body.innerHTML.substring(0, 500),
          );
        }

        // Start spotlight tour with the new system
        startTour('spotlight', { source: 'welcome', restart: true });
      }, delayMs);
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
