// AppShell.tsx - Main application shell component
import React from 'react';

import { TourStorage } from '@/services/TourStorage';

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
  const storage = TourStorage.forCurrentProfile();
  const profileId = storage.profileId ?? 'default';
  useSimpleTourAutostart(profileId);
  useSpotlightAutostart(profileId);

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
