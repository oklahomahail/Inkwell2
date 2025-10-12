// AppShell.tsx - Main application shell component
import React from 'react';

import { OnboardingOrchestrator } from '../../components/Onboarding/OnboardingOrchestrator';
import { TourProvider } from '../../components/Onboarding/TourProvider';

interface AppShellProps {
  children: React.ReactNode;
}

function _AppShell({ children }: AppShellProps) {
  return (
    <TourProvider>
      <OnboardingOrchestrator />
      <div className="app-shell">{children}</div>
    </TourProvider>
  );
}

export const AppShell = _AppShell;
