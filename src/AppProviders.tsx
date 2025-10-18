import { Suspense } from 'react';

import { CommandPaletteProvider } from './components/CommandPalette/CommandPaletteProvider';
import { FeatureDiscoveryProvider } from './components/Onboarding/FeatureDiscovery';
import { ProfileTourProvider } from './components/Onboarding/ProfileTourProvider';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ClaudeProvider } from './context/ClaudeProvider';
import { EditorProvider } from './context/EditorContext';
import { NavProvider } from './context/NavContext';
import { ProfileProvider } from './context/ProfileContext';
import { ToastProvider } from './context/ToastContext';
import { TourProvider } from './features/tour/TourContext';
import { FeatureFlagProvider } from './utils/featureFlags.react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
