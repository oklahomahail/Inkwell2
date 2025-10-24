import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// UI + panels
import ClaudeAssistant from './components/ClaudeAssistant';
import ClaudeErrorBoundary from './components/ClaudeErrorBoundary';
import CommandPaletteUI from './components/CommandPalette/CommandPaletteUI';
import DebugSearchPanel from './components/DebugSearchPanel';
import { AppErrorBoundary } from './components/ErrorBoundary';
import { ExportWizardModal } from './components/ExportWizard/ExportWizardModal';
import HealthCheck from './components/HealthCheck';
import MainLayout from './components/Layout/MainLayout';
import OnboardingOrchestrator from './components/Onboarding/OnboardingOrchestrator';
import { TutorialRouter } from './components/Onboarding/TutorialRouter';
import { PWAInstallButton, PWAUpdateNotification } from './components/PWA';
import {
  StorageRecoveryBanner,
  OfflineBanner,
  useStorageRecovery,
} from './components/Recovery/StorageRecoveryBanner';
import { ToastContainer } from './components/ToastContainer';
import ViewSwitcher from './components/ViewSwitcher';
// Context and providers
import { useAppContext } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { useEditorContext } from './context/EditorContext';
// Route guards
// Pages
import AuthCallback from './pages/AuthCallback';
import BrandPage from './pages/Brand';
import ForgotPassword from './pages/ForgotPassword';
import SignIn from './pages/SignInPage';
import SignUp from './pages/SignUpPage';
import UpdatePassword from './pages/UpdatePassword';
import AnonOnlyRoute from './routes/AnonOnlyRoute';
import ProtectedRoute from './routes/ProtectedRoute';
// Profile routing components
import { ProfileGate } from './routes/shell/ProfileGate';
// Services
import { connectivityService } from './services/connectivityService';
import { enhancedStorageService } from './services/enhancedStorageService';
import { isPublicRoute } from './utils/auth';

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
      console.log(
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
    console.log('[App] Auth loading state active, showing loading spinner');

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
      <Routes>
        {/* Health check route */}
        <Route path="/health" element={<HealthCheck />} />

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

        {/* Legacy login route - redirect to sign-in */}
        <Route path="/login" element={<Navigate to="/sign-in" replace />} />

        {/* Profile-specific routes - protected */}
        <Route
          path="/p/:profileId/*"
          element={
            <ProtectedRoute>
              <ProfileGate>
                <Routes>
                  {/* Tutorial routes */}
                  <Route path="tutorials/*" element={<TutorialRouter />} />

                  {/* Brand showcase route */}
                  <Route path="brand" element={<BrandPage />} />

                  {/* Main app routes */}
                  <Route path="*" element={<ProfileAppShell />} />
                </Routes>
              </ProfileGate>
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Dashboard route with proper auth guard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user ? (
                <Navigate to={`/p/${user.id}`} replace />
              ) : (
                // This fallback should never happen as ProtectedRoute will handle it
                <div>Error: User is authenticated but no user ID available</div>
              )}
            </ProtectedRoute>
          }
        />

        {/* Not Found - explicit redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// Profile-specific app shell (the original app logic)
function ProfileAppShell() {
  const { claude, currentProject } = useAppContext();
  const { insertText } = useEditorContext();

  // storage recovery
  const { showRecoveryBanner, dismissRecoveryBanner } = useStorageRecovery();

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

  // maintenance after start
  useEffect(() => {
    const performStartupMaintenance = async () => {
      try {
        const result = await enhancedStorageService.performMaintenance();
        if (result.actions.length > 0) {
          console.log('Startup maintenance completed:', result.actions);
        }
      } catch (error) {
        console.warn('Startup maintenance failed:', error);
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

      <MainLayout>
        <ViewSwitcher />
        <ToastContainer />

        {/* Claude Assistant with Error Boundary */}
        {claude?.isVisible && (
          <ClaudeErrorBoundary>
            <ClaudeAssistant
              selectedText=""
              onInsertText={(text) => {
                insertText(text);
              }}
            />
          </ClaudeErrorBoundary>
        )}

        {/* Export Wizard */}
        {currentProject && (
          <ExportWizardModal
            isOpen={isExportDialogOpen}
            projectId={currentProject.id}
            onClose={closeExportDialog}
          />
        )}

        {/* Offline Queue Modal */}
        {showOfflineQueue && (
          <OfflineQueueModal isOpen={showOfflineQueue} onClose={() => setShowOfflineQueue(false)} />
        )}

        {/* Command Palette UI */}
        <CommandPaletteUI />

        {/* Onboarding System */}
        <OnboardingOrchestrator />

        {/* Hidden global export trigger */}
        <div style={{ display: 'none' }}>
          <button onClick={openExportDialog} id="global-export-trigger">
            Export
          </button>
        </div>

        {/* Dev-only debug panels */}
        {import.meta.env.DEV && <DebugSearchPanel />}
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
      console.error('Failed to get storage stats:', error);
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
                console.log('Manual maintenance:', result);
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
                    console.error('Failed to reset:', error);
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

export default function _App() {
  return (
    <AppErrorBoundary level="app">
      <AppShell />
    </AppErrorBoundary>
  );
}
