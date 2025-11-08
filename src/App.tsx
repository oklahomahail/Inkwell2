import React, { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { TourProvider, useTourContext } from '@/components/Tour/TourProvider';
import devLog from '@/utils/devLog';
import { log } from '@/utils/logger';

// Core UI components (needed immediately)
import ClaudeErrorBoundary from './components/ClaudeErrorBoundary';
import HealthCheck from './components/HealthCheck';
import MainLayout from './components/Layout/MainLayout';
import { PWAInstallButton, PWAUpdateNotification } from './components/PWA';
import {
  StorageRecoveryBanner,
  OfflineBanner,
  useStorageRecovery,
} from './components/Recovery/StorageRecoveryBanner';
import { PreviewGuard } from './components/RouteGuards/PreviewGuard';
import { StorageBanner } from './components/Storage/StorageBanner';
import { StorageErrorToast } from './components/Storage/StorageErrorToast';
import { ToastContainer } from './components/ToastContainer';
// Context and providers
import { useAppContext } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { useEditorContext } from './context/EditorContext';
// Route guards
import { useOnboardingGate } from './hooks/useOnboardingGate';
import { usePrivateModeWarning } from './hooks/usePrivateModeWarning';
import AnonOnlyRoute from './routes/AnonOnlyRoute';
import ProtectedRoute from './routes/ProtectedRoute';
// Hooks
// Services
import { connectivityService } from './services/connectivityService';
import { enhancedStorageService } from './services/enhancedStorageService';
import { storageErrorLogger } from './services/storageErrorLogger';
import { storageManager } from './services/storageManager';
import { isPublicRoute } from './utils/auth';

// Lazy-loaded heavy components (loaded on-demand)
const ClaudeAssistant = lazy(() => import('./components/ClaudeAssistant'));
const CommandPaletteUI = lazy(() => import('./components/CommandPalette/CommandPaletteUI'));
const DebugSearchPanel = lazy(() => import('./components/DebugSearchPanel'));
const ExportWizardModal = lazy(() =>
  import('./components/ExportWizard/ExportWizardModal').then((m) => ({
    default: m.ExportWizardModal,
  })),
);
const ViewSwitcher = lazy(() => import('./components/ViewSwitcher'));
const WelcomeModal = lazy(() => import('./components/Onboarding/WelcomeModal'));
const OnboardingPreferencesModal = lazy(
  () => import('./components/Onboarding/OnboardingPreferencesModal'),
);

// Lazy-loaded pages
const PreviewDashboard = lazy(() => import('./features/preview/PreviewDashboard'));
const PreviewLandingPage = lazy(() => import('./features/preview/PreviewLandingPage'));
const PreviewWriter = lazy(() => import('./features/preview/PreviewWriter'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const BrandPage = lazy(() => import('./pages/Brand'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const SignIn = lazy(() => import('./pages/SignInPage'));
const SignUp = lazy(() => import('./pages/SignUpPage'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const SupabaseHealth = lazy(() => import('./routes/Health'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-inkwell-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Debug utilities (development only)
if (import.meta.env.DEV) {
  import('./utils/debugOnboardingGate');
}

// Types for connectivity status
interface ConnectivityStatus {
  isOnline: boolean;
  queuedWrites: number;
}

type QueuedOperation = {
  id: string | number;
  operation: string;
  timestamp: number;
  retryCount?: number;
};

// RootRedirect component to intelligently handle the root route based on auth state
function RootRedirect() {
  const { user, loading } = useAuth();
  // Use state to track if we've already initiated a redirect
  const [hasInitiatedRedirect, setHasInitiatedRedirect] = useState(false);

  // Only redirect once auth state is fully loaded and we haven't already redirected
  useEffect(() => {
    if (!loading && !hasInitiatedRedirect) {
      setHasInitiatedRedirect(true);
      devLog.debug(
        '[RootRedirect] Auth loaded, user state:',
        user ? 'authenticated' : 'unauthenticated',
      );
    }
  }, [loading, user, hasInitiatedRedirect]);

  if (loading || !hasInitiatedRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-inkwell-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, go to dashboard
  // If not authenticated, go to sign-in page (without any confusing query parameters)
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/sign-in" replace />;
}

// All app logic lives here, safely *inside* the providers.
function AppShell() {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const isPublic = isPublicRoute(location.pathname);

  // Show loading spinner while checking auth (prevents content flash)
  if (loading) {
    // Log loading state for debugging
    devLog.debug('[App] Auth loading state active, showing loading spinner');

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-inkwell-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading authentication...</p>
          <p className="text-xs text-gray-500 mt-2">
            If this persists, please check console for errors.
          </p>
          <p className="text-xs text-gray-500">
            Inkwell v{import.meta.env.VITE_APP_VERSION || '1.0.2'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not on public route and not signed in
  if (!isPublic && !user) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <>
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-4">
          {!user ? (
            <a href="/sign-in" className="text-blue-600 hover:text-blue-700">
              Sign in
            </a>
          ) : (
            <button onClick={signOut} className="text-sm text-gray-600 hover:text-gray-900">
              Sign out
            </button>
          )}
        </div>
      </header>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Health check route */}
          <Route path="/health" element={<HealthCheck />} />

          {/* Supabase integration health check */}
          <Route path="/health/supabase" element={<SupabaseHealth />} />

          {/* Auth callback route - handles magic link code exchange and password reset flow */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Auth routes - protected from authenticated users */}
          <Route
            path="/sign-in"
            element={
              <AnonOnlyRoute>
                <SignIn />
              </AnonOnlyRoute>
            }
          />
          <Route
            path="/sign-up"
            element={
              <AnonOnlyRoute>
                <SignUp />
              </AnonOnlyRoute>
            }
          />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/update-password" element={<UpdatePassword />} />

          {/* Legacy routes - redirects */}
          <Route path="/login" element={<Navigate to="/sign-in" replace />} />
          <Route path="/signup" element={<Navigate to="/sign-up" replace />} />

          {/* Preview mode routes - for unauthenticated users */}
          <Route
            path="/preview"
            element={
              <PreviewGuard>
                <PreviewLandingPage />
              </PreviewGuard>
            }
          />
          <Route
            path="/preview/write"
            element={
              <PreviewGuard>
                <PreviewWriter />
              </PreviewGuard>
            }
          />
          <Route
            path="/preview/dashboard"
            element={
              <PreviewGuard>
                <PreviewDashboard />
              </PreviewGuard>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Dashboard route - main app */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ProfileAppShell />
              </ProtectedRoute>
            }
          />

          {/* Brand showcase route */}
          <Route
            path="/brand"
            element={
              <ProtectedRoute>
                <BrandPage />
              </ProtectedRoute>
            }
          />

          {/* Not Found - explicit redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

// Profile-specific app shell (the original app logic)
function ProfileAppShell() {
  const { claude, currentProject, setCurrentProjectId } = useAppContext();
  const { insertText } = useEditorContext();

  // storage recovery
  const { showRecoveryBanner, dismissRecoveryBanner } = useStorageRecovery();

  // Onboarding state
  const [showPreferences, setShowPreferences] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [_showChecklist, _setShowChecklist] = useState(false);
  const { shouldShowModal, completeOnboarding, setTourActive } = useOnboardingGate();
  const tour = useTourContext();

  // Helper to check if preferences have been completed
  const hasCompletedPreferences = useCallback(() => {
    try {
      const stored = localStorage.getItem('inkwell.user.preferences');
      return stored !== null;
    } catch {
      return false;
    }
  }, []);

  // Check if we should show onboarding modals on mount
  useEffect(() => {
    if (shouldShowModal()) {
      // Check if user has completed preferences
      const completedPreferences = hasCompletedPreferences();
      if (!completedPreferences) {
        // Show preferences modal first
        setShowPreferences(true);
      } else {
        // Show welcome modal directly
        setShowWelcome(true);
      }
    }
  }, [shouldShowModal, hasCompletedPreferences]);

  // Handle preferences completion
  const handlePreferencesComplete = useCallback(() => {
    setShowPreferences(false);
    // After preferences, show the welcome modal
    setShowWelcome(true);
  }, []);

  // Handle welcome modal actions
  const handleStartTour = useCallback(
    async (_tourType: string) => {
      try {
        devLog.log('[App] Starting tour flow...');

        // Track onboarding start
        try {
          const { track } = await import('./services/telemetry');
          track('onboarding.started', { method: 'tour', sample: 1 });
        } catch {
          // Ignore telemetry errors
        }

        // Create welcome project if needed
        const { ensureWelcomeProject } = await import('./onboarding/welcomeProject');
        const projectId = await ensureWelcomeProject();
        devLog.log('[App] Welcome project created:', projectId);

        // CRITICAL: Set the welcome project as current project
        if (projectId) {
          setCurrentProjectId(projectId);
          devLog.log('[App] Welcome project set as current:', projectId);
        }

        // Mark that a tour is active
        setTourActive(true);
        devLog.log('[App] Tour active flag set');

        // Close welcome modal
        setShowWelcome(false);
        devLog.log('[App] Welcome modal closed');

        // Mark onboarding as complete (before starting tour so it doesn't interfere)
        completeOnboarding();
        devLog.log('[App] Onboarding marked complete');

        // Start the actual tour after a brief delay to let the welcome project load
        if (tour && projectId) {
          devLog.log('[App] Attempting to start tour after 500ms delay...');
          setTimeout(() => {
            devLog.log('[App] Calling tour.start("gettingStarted", true)...');
            const started = tour.start('gettingStarted', true);
            if (started) {
              devLog.log('[App] ✓ Getting Started tour launched successfully');
            } else {
              devLog.warn('[App] ✗ Failed to start tour - DOM elements may not be ready');
              // Log available tour anchors
              const anchors = [
                "[data-tour='sidebar']",
                "[data-tour='create-project-btn']",
                "[data-tour='projects']",
              ];
              anchors.forEach((selector) => {
                const element = document.querySelector(selector);
                devLog.log(`[App] Tour anchor ${selector}:`, element ? 'FOUND' : 'MISSING');
              });
            }
          }, 500);
        } else {
          devLog.error('[App] Tour or projectId not available:', { tour: !!tour, projectId });
        }

        // Track onboarding completion
        try {
          const { track } = await import('./services/telemetry');
          track('onboarding.completed', { method: 'tour', sample: 1 });
        } catch {
          // Ignore telemetry errors
        }

        devLog.log('[App] Tour flow completed');
      } catch (error) {
        devLog.error('[App] Failed to start tour:', error);

        // Track onboarding failure
        try {
          const { track } = await import('./services/telemetry');
          track('onboarding.failed', { method: 'tour', error: String(error), sample: 1 });
        } catch {
          // Ignore telemetry errors
        }
      }
    },
    [setTourActive, completeOnboarding, tour, setCurrentProjectId],
  );

  const handleOpenChecklist = useCallback(async () => {
    // Track checklist selection
    try {
      const { track } = await import('./services/telemetry');
      track('onboarding.started', { method: 'checklist', sample: 1 });
      track('onboarding.completed', { method: 'checklist', sample: 1 });
    } catch {
      // Ignore telemetry errors
    }

    setShowWelcome(false);
    _setShowChecklist(true);
    completeOnboarding();
  }, [completeOnboarding]);

  // Private mode warning - warns before closing if in private mode
  usePrivateModeWarning(false); // Can be enhanced to track actual unsaved changes

  // connectivity
  const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus>({
    isOnline: true,
    queuedWrites: 0,
  });

  useEffect(() => {
    const unsubscribe = connectivityService.onStatusChange((status) => {
      setConnectivityStatus({
        isOnline: status.isOnline,
        queuedWrites: status.queuedWrites,
      });
    });

    const initialStatus = connectivityService.getStatus();
    setConnectivityStatus({
      isOnline: initialStatus.isOnline,
      queuedWrites: initialStatus.queuedWrites,
    });

    return unsubscribe;
  }, []);

  // Initialize storage manager and error logger
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Initialize error logger
        storageErrorLogger.initialize();

        // Initialize storage manager (requests persistence, starts monitoring)
        const result = await storageManager.initialize();

        if (result.granted) {
          devLog.log('[App] Storage persistence granted');
        } else {
          devLog.warn('[App] Storage persistence not granted - data may be cleared');
        }
      } catch (error) {
        devLog.error('[App] Failed to initialize storage manager:', error);
      }
    };

    void initializeStorage();

    // Cleanup on unmount
    return () => {
      storageManager.stopMonitoring();
    };
  }, []);

  // maintenance after start
  useEffect(() => {
    const performStartupMaintenance = async () => {
      try {
        const result = await enhancedStorageService.performMaintenance();
        if (result.actions.length > 0) {
          devLog.debug('Startup maintenance completed:', result.actions);
        }
      } catch (error) {
        log.warn('Startup maintenance failed:', error);
      }
    };

    const timeoutId = setTimeout(performStartupMaintenance, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  // export dialog state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const openExportDialog = () => setIsExportDialogOpen(true);
  const closeExportDialog = () => setIsExportDialogOpen(false);

  // offline queue modal
  const [showOfflineQueue, setShowOfflineQueue] = useState(false);
  const handleViewQueue = () => setShowOfflineQueue(true);
  const handleDismissOfflineBanner = () => {
    // optional: persist snooze preference
  };

  return (
    <>
      {/* Stable tour anchor - always present for tour steps */}
      <div
        id="tour-viewport-anchor"
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
      />

      {/* Storage Health Banner - shows warnings about private mode, non-persistent storage, etc */}
      <StorageBanner />

      {/* Storage Recovery Banner */}
      {showRecoveryBanner && <StorageRecoveryBanner onDismiss={dismissRecoveryBanner} />}

      {/* Offline Banner */}
      {!connectivityStatus.isOnline && connectivityStatus.queuedWrites > 0 && (
        <OfflineBanner
          queuedOperations={connectivityStatus.queuedWrites}
          onViewQueue={handleViewQueue}
          onDismiss={handleDismissOfflineBanner}
        />
      )}

      {/* PWA Update Notification */}
      <PWAUpdateNotification />

      {/* PWA Install Prompt */}
      <PWAInstallButton variant="fab" />

      {/* Storage Error Toast Notifications */}
      <StorageErrorToast />

      {/* Preferences Modal - User preferences selection (shows first) */}
      {showPreferences && (
        <Suspense fallback={null}>
          <OnboardingPreferencesModal
            isOpen={showPreferences}
            onComplete={handlePreferencesComplete}
          />
        </Suspense>
      )}

      {/* Welcome Modal - First-time user onboarding */}
      {showWelcome && (
        <Suspense fallback={null}>
          <WelcomeModal
            isOpen={showWelcome}
            onClose={() => setShowWelcome(false)}
            onStartTour={handleStartTour}
            onOpenChecklist={handleOpenChecklist}
          />
        </Suspense>
      )}

      <MainLayout>
        <Suspense fallback={null}>
          <ViewSwitcher />
        </Suspense>
        <ToastContainer />

        {/* Claude Assistant with Error Boundary */}
        {claude?.isVisible && (
          <ClaudeErrorBoundary>
            <Suspense fallback={null}>
              <ClaudeAssistant
                selectedText=""
                onInsertText={(text) => {
                  insertText(text);
                }}
              />
            </Suspense>
          </ClaudeErrorBoundary>
        )}

        {/* Export Wizard */}
        {currentProject && (
          <Suspense fallback={null}>
            <ExportWizardModal
              isOpen={isExportDialogOpen}
              projectId={currentProject.id}
              onClose={closeExportDialog}
            />
          </Suspense>
        )}

        {/* Offline Queue Modal */}
        {showOfflineQueue && (
          <OfflineQueueModal isOpen={showOfflineQueue} onClose={() => setShowOfflineQueue(false)} />
        )}

        {/* Command Palette UI */}
        <Suspense fallback={null}>
          <CommandPaletteUI />
        </Suspense>

        {/* Hidden global export trigger */}
        <div style={{ display: 'none' }}>
          <button onClick={openExportDialog} id="global-export-trigger">
            Export
          </button>
        </div>

        {/* Dev-only debug panels */}
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <DebugSearchPanel />
          </Suspense>
        )}
        {import.meta.env.DEV && <StorageDebugPanel />}
      </MainLayout>
    </>
  );
}

// Offline Queue Management Modal
function OfflineQueueModal(_props: OfflineQueueModalProps) {
  const { isOpen, onClose } = _props;
  const [queuedOperations, setQueuedOperations] = useState<QueuedOperation[]>([]);

  useEffect(() => {
    if (isOpen) {
      const operations = (connectivityService.getQueuedOperations?.() ?? []) as QueuedOperation[];
      setQueuedOperations(Array.isArray(operations) ? operations : []);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Queued Operations</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {queuedOperations.length === 0 ? (
            <p className="text-gray-500">No operations queued</p>
          ) : (
            queuedOperations.map((op) => (
              <div key={String(op.id)} className="p-2 bg-gray-100 rounded">
                <div className="text-sm font-medium">{op.operation}</div>
                <div className="text-xs text-gray-500">
                  {new Date(op.timestamp).toLocaleTimeString()}
                  {op.retryCount && op.retryCount > 0 ? ` (Retry ${op.retryCount})` : ''}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={async () => {
              await connectivityService.clearQueue?.();
              setQueuedOperations([]);
            }}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear Queue
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Development Storage Debug Panel
function StorageDebugPanel() {
  const [stats, setStats] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const refreshStats = async () => {
    try {
      const storageStats = await enhancedStorageService.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      log.error('Failed to get storage stats:', error);
    }
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  const mb = (n: number) => (n > 0 ? (n / 1024 / 1024).toFixed(1) : '0.0');

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-gray-900 text-white text-xs rounded-lg shadow-lg">
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="w-full px-3 py-2 text-left hover:bg-gray-800 rounded-lg"
        >
          Storage: {mb(stats.storageUsed)} MB
        </button>
        {isExpanded && (
          <div className="px-3 pb-3 space-y-1 border-t border-gray-700 pt-2">
            <div>Projects: {stats.totalProjects}</div>
            <div>Words: {stats.totalWordCount?.toLocaleString?.() ?? '—'}</div>
            <div>Sessions: {stats.writingSessions}</div>
            <div>Snapshots: {stats.snapshotCount}</div>
            <div>
              Usage:{' '}
              {stats.quotaInfo
                ? `${((stats.quotaInfo.percentUsed ?? 0) * 100).toFixed(1)}%`
                : 'Unknown'}
            </div>
            <button
              onClick={async () => {
                const result = await enhancedStorageService.performMaintenance();
                devLog.debug('Manual maintenance:', result);
                refreshStats();
              }}
              className="w-full mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              Run Maintenance
            </button>
            <button
              onClick={async () => {
                if (
                  confirm('Reset all data and reload? This will clear IndexedDB and localStorage.')
                ) {
                  try {
                    // Clear localStorage
                    localStorage.clear();

                    // Clear IndexedDB
                    if ('indexedDB' in window) {
                      const databases = await indexedDB.databases();
                      await Promise.all(
                        databases.map((db) =>
                          db.name
                            ? new Promise<void>((resolve, reject) => {
                                const deleteReq = indexedDB.deleteDatabase(db.name!);
                                deleteReq.onsuccess = () => resolve();
                                deleteReq.onerror = () =>
                                  reject(deleteReq.error || new Error('Failed to delete database'));
                              })
                            : Promise.resolve(),
                        ),
                      );
                    }

                    // Reload the page
                    window.location.reload();
                  } catch (error) {
                    log.error('Failed to reset:', error);
                    alert('Reset failed. Check console for details.');
                  }
                }
              }}
              className="w-full mt-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
            >
              🔄 Reset & Reload
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Root export: use centralized Providers component for clean composition
// Interfaces
interface OfflineQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface _ProfileAppShellProps {}

interface _StorageDebugPanelProps {}

interface _AppShellProps {}

export default function App() {
  // Remove loading class after React mounts to enable transitions
  useEffect(() => {
    // Wait for one frame to ensure React has fully mounted and painted
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('loading');
      devLog.log('[App] Loading class removed - transitions enabled');
    });
  }, []);

  return (
    <TourProvider>
      <AppShell />
    </TourProvider>
  );
}
