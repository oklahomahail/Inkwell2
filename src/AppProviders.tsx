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

  // Extract account ID from publishable key to construct default Clerk CDN URL
  // Format: pk_live_xxx or pk_test_xxx
  const accountId = pk.split('_')[2]; // Get the account-specific part

  // Force use of Clerk's default CDN to bypass custom domain SSL issues
  const clerkOptions = {
    publishableKey: pk,
    afterSignOutUrl: '/',
    // Override with Clerk's default CDN (bypass clerk.leadwithnexus.com)
    clerkJSUrl: `https://${accountId}.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js`,
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
