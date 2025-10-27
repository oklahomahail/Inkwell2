// AppShell.tsx - Robust application shell with locked geometry
import { useEffect } from 'react';
import React from 'react';

import { OnboardingOrchestrator } from '../../onboarding/OnboardingOrchestrator';
import { useSimpleTourAutostart } from '../Onboarding/hooks/useSimpleTourAutostart';
import { useSpotlightAutostart } from '../Onboarding/hooks/useSpotlightAutostart';
import { TourProvider } from '../Onboarding/TourProvider';

import '../Onboarding/styles/overlay.css';
import { cn } from '@/utils/cn';

interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  banner?: React.ReactNode;
}

function AppShellComponent({ children, header, sidebar, banner }: AppShellProps) {
  // Initialize tour autostart hooks after providers/portals are mounted
  // Use a simple default profile identifier; no storage coupling needed
  const profileId = 'default';
  useSimpleTourAutostart(profileId);
  useSpotlightAutostart([profileId]);

  // Prevent double scroll on body - lock scrolling to main content only
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Lock body/html to full height with no scroll
    html.classList.add('h-full');
    body.classList.add('h-full', 'overflow-hidden');

    return () => {
      html.classList.remove('h-full');
      body.classList.remove('h-full', 'overflow-hidden');
    };
  }, []);

  return (
    <TourProvider>
      <OnboardingOrchestrator />
      <div
        className={cn(
          // Full viewport height including mobile chrome (dvh handles iOS Safari)
          'min-h-dvh bg-background text-foreground',
          // Grid: sticky header/banners row, then content area
          'grid grid-rows-[auto,1fr]',
        )}
        // iOS notch/safe-area support
        style={{
          paddingTop: 'env(safe-area-inset-top, 0)',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
        }}
      >
        {/* Top region: banner (optional) + sticky header */}
        <div className="relative">
          {banner ? <div className="w-full">{banner}</div> : null}

          {header ? (
            <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/95 border-b">
              {header}
            </div>
          ) : null}
        </div>

        {/* Main region: sidebar + scrollable content */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-0 overflow-hidden">
          {sidebar ? (
            <aside className="hidden lg:block border-r overflow-auto">{sidebar}</aside>
          ) : null}

          <main className="overflow-auto">
            {/* Overlay root for tour/onboarding portals */}
            <div id="overlay-root" />
            {children}
          </main>
        </div>
      </div>
    </TourProvider>
  );
}

export const AppShell = AppShellComponent;
