import { ClerkProvider } from '@clerk/clerk-react';
import { Suspense } from 'react';

import { CommandPaletteProvider } from './components/CommandPalette/CommandPaletteProvider';
import { FeatureDiscoveryProvider } from './components/Onboarding/FeatureDiscovery';
import { ProfileTourProvider } from './components/Onboarding/ProfileTourProvider';
import { AppProvider } from './context/AppContext';
import { ClaudeProvider } from './context/ClaudeProvider';
import { EditorProvider } from './context/EditorContext';
import { NavProvider } from './context/NavContext';
import { ProfileProvider } from './context/ProfileContext';
import { ToastProvider } from './context/ToastContext';
import { TourProvider } from './features/tour/TourContext';
import { FeatureFlagProvider } from './utils/featureFlags.react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pk = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!pk) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in env');

  // Force use of Clerk's default infrastructure to bypass custom domain SSL issues
  const clerkOptions = {
    publishableKey: pk,
    afterSignOutUrl: '/',
    ...(import.meta.env.PROD && {
      proxyUrl: undefined, // Disable proxy in production, use default Clerk infrastructure
    }),
  };

  return (
    <ClerkProvider {...clerkOptions}>
      <Suspense fallback={null}>
        <FeatureFlagProvider>
          <ToastProvider>
            <ProfileProvider>
              <NavProvider>
                <EditorProvider>
                  <ClaudeProvider>
                    <TourProvider>
                      <ProfileTourProvider>
                        <FeatureDiscoveryProvider>
                          <AppProvider>
                            <CommandPaletteProvider>{children}</CommandPaletteProvider>
                          </AppProvider>
                        </FeatureDiscoveryProvider>
                      </ProfileTourProvider>
                    </TourProvider>
                  </ClaudeProvider>
                </EditorProvider>
              </NavProvider>
            </ProfileProvider>
          </ToastProvider>
        </FeatureFlagProvider>
      </Suspense>
    </ClerkProvider>
  );
}
