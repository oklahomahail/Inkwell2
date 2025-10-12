// AppShell.tsx - Main application shell component
import React from 'react';

import { OnboardingOrchestrator } from '@/onboarding/OnboardingOrchestrator';
import { TourProvider } from '@/onboarding/TourProvider';

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
