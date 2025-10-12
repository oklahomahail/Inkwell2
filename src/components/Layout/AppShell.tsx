// AppShell.tsx - Main application shell component
import React from 'react';

import { OnboardingOrchestrator } from '../../components/Onboarding/OnboardingOrchestrator';
import { TourProvider } from '../../components/Onboarding/TourProvider';
import { useSimpleTourAutostart } from '../Onboarding/hooks/useSimpleTourAutostart';
import { useSpotlightAutostart } from '../Onboarding/hooks/useSpotlightAutostart';
import '../Onboarding/styles/overlay.css';

interface AppShellProps {
  children: React.ReactNode;
}

function _AppShell({ children }: AppShellProps) {
  // Initialize tour autostart hooks after providers/portals are mounted
  useSimpleTourAutostart();
  useSpotlightAutostart();

  return (
    <TourProvider>
      <OnboardingOrchestrator />
      <div className="app-shell">
        <div id="overlay-root" />
        {children}
      </div>
    </TourProvider>
  );
}

export const AppShell = _AppShell;
