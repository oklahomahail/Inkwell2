import { Suspense } from 'react';

import { CommandPaletteProvider } from './components/CommandPalette/CommandPaletteProvider';
import { FeatureDiscoveryProvider } from './components/Onboarding/FeatureDiscovery';
import { AiSettingsProvider } from './context/AiSettingsContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ChaptersProvider } from './context/ChaptersContext';
import { ClaudeProvider } from './context/ClaudeProvider';
import { EditorProvider } from './context/EditorContext';
import { NavProvider } from './context/NavContext';
import { ToastProvider } from './context/ToastContext';
import { UIProvider } from './hooks/useUI';
import { FeatureFlagProvider } from './utils/featureFlags.react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <FeatureFlagProvider>
          <ToastProvider>
            <UIProvider>
              <AiSettingsProvider>
                <NavProvider>
                  <EditorProvider>
                    <ChaptersProvider>
                      <ClaudeProvider>
                        <FeatureDiscoveryProvider>
                          <AppProvider>
                            <CommandPaletteProvider>{children}</CommandPaletteProvider>
                          </AppProvider>
                        </FeatureDiscoveryProvider>
                      </ClaudeProvider>
                    </ChaptersProvider>
                  </EditorProvider>
                </NavProvider>
              </AiSettingsProvider>
            </UIProvider>
          </ToastProvider>
        </FeatureFlagProvider>
      </Suspense>
    </AuthProvider>
  );
}
