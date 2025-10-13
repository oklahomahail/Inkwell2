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

function _AppProviders({ children }: { children: React.ReactNode }) {
  return (
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
  );
}

// Named export
export const AppProviders = _AppProviders;

// Default export for legacy compatibility
export default _AppProviders;
