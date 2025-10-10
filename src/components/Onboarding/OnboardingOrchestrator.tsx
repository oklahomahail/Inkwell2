// src/components/Onboarding/OnboardingOrchestrator.tsx
import React, { useState, useEffect } from 'react';

import { CompletionChecklistComponent } from './CompletionChecklist';
import { TourNudgeManager } from './TourNudges';
import TourOverlay from './TourOverlay';
import { useTour, TOUR_MAP } from './TourProvider';
import WelcomeModal from './WelcomeModal';

interface OnboardingOrchestratorProps {
  // Optional props for customizing behavior
  autoShowWelcome?: boolean;
  delayWelcomeMs?: number;
}

export const OnboardingOrchestrator: React.FC<OnboardingOrchestratorProps> = ({
  autoShowWelcome = true,
  delayWelcomeMs = 2000,
}) => {
  const {
    startTour,
    setTourSteps,
    shouldShowTourPrompt,
    tourState,
    logAnalytics,
    updateChecklist,
  } = useTour();

  const [showWelcome, setShowWelcome] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Auto-show welcome modal for first-time users
  useEffect(() => {
    if (!autoShowWelcome) return;

    // Prevent multiple launches in the same session
    if (sessionStorage.getItem('inkwell-welcome-shown-this-session')) {
      return;
    }

    let timeoutId: NodeJS.Timeout;

    if (shouldShowTourPrompt() && !showWelcome) {
      timeoutId = setTimeout(() => {
        setShowWelcome(true);
        sessionStorage.setItem('inkwell-welcome-shown-this-session', 'true');
        logAnalytics('welcome_modal_auto_shown');
      }, delayWelcomeMs);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [shouldShowTourPrompt, autoShowWelcome, delayWelcomeMs, logAnalytics, showWelcome]);

  // Handle starting different types of tours
  const handleStartTour = (tourType: string) => {
    const tourSteps = TOUR_MAP[tourType as keyof typeof TOUR_MAP];

    if (tourSteps) {
      setTourSteps(tourSteps);

      // Map tour types to the TourState type
      let mappedTourType: 'full-onboarding' | 'feature-tour' | 'contextual-help';
      switch (tourType) {
        case 'core-onboarding':
          mappedTourType = 'full-onboarding';
          break;
        case 'writing-panel':
        case 'timeline-panel':
        case 'analytics-panel':
        case 'dashboard-panel':
          mappedTourType = 'feature-tour';
          break;
        default:
          mappedTourType = 'contextual-help';
      }

      startTour(mappedTourType, tourSteps);

      // Auto-update relevant checklist items when tours are started
      switch (tourType) {
        case 'core-onboarding':
          updateChecklist('createProject');
          break;
        case 'writing-panel':
          updateChecklist('writeContent');
          break;
        case 'timeline-panel':
          updateChecklist('useTimeline');
          break;
        case 'analytics-panel':
          // Analytics tour doesn't directly correspond to a checklist item
          break;
      }
    } else {
      console.warn('Unknown tour type:', tourType);
    }
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
  };

  const handleOpenChecklist = () => {
    setShowChecklist(true);
  };

  const handleCloseChecklist = () => {
    setShowChecklist(false);
  };

  return (
    <>
      {/* Welcome Modal - First-run experience */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleCloseWelcome}
        onStartTour={handleStartTour}
        onOpenChecklist={handleOpenChecklist}
      />

      {/* Completion Checklist */}
      <CompletionChecklistComponent
        isOpen={showChecklist}
        onClose={handleCloseChecklist}
        onStartTour={handleStartTour}
      />

      {/* Active Tour Overlay */}
      {tourState.isActive && (
        <TourOverlay
          onClose={() => {
            // TourOverlay handles its own closing through the tour context
          }}
        />
      )}

      {/* Smart Tour Nudges */}
      <TourNudgeManager onStartTour={handleStartTour} />
    </>
  );
};

// Convenience hook for other components to interact with the onboarding system
export const useOnboarding = () => {
  const tour = useTour();

  return {
    ...tour,
    // Convenient methods for triggering specific actions
    showWelcomeModal: () => {
      // This would need to be implemented by managing state in a parent component
      console.warn('showWelcomeModal not implemented - use OnboardingOrchestrator state');
    },
    showChecklist: () => {
      console.warn('showChecklist not implemented - use OnboardingOrchestrator state');
    },
    startContextualTour: (panelName: 'writing' | 'timeline' | 'analytics' | 'dashboard') => {
      const _tourType = `${panelName}-panel`;
      // This would need access to the handleStartTour function
      console.warn('startContextualTour not fully implemented - use TourProvider directly');
    },
  };
};

export default OnboardingOrchestrator;
