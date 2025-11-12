import { Suspense, useEffect } from 'react';

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
import { analyticsService } from './services/analytics';
import { ensureDatabaseReady } from './services/dbInitService';
import devLog from './utils/devLog';
import { FeatureFlagProvider } from './utils/featureFlags.react';

/**
 * Database Initializer Component
 * Ensures all databases are ready before the app renders
 */
function DatabaseInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize databases on mount
    const initDatabases = async () => {
      try {
        // Initialize main database (inkwell_v1)
        await ensureDatabaseReady();

        // Initialize analytics database (inkwell_analytics)
        await analyticsService.initialize();

        devLog.log('[App] All databases initialized successfully');
      } catch (error) {
        devLog.error('[App] Database initialization error:', error);
        // Don't block app - allow it to continue with degraded functionality
      }
    };

    initDatabases();
  }, []);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <DatabaseInitializer>
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
        </DatabaseInitializer>
      </Suspense>
    </AuthProvider>
  );
}
