// PWA Service for managing offline functionality and app updates

// Type for the PWA register hook from vite-plugin-pwa
type RegisterSWOptions = {
  onRegistered?: (_r: ServiceWorkerRegistration | undefined) => void;
  onRegisterError?: (_error: any) => void;
  onOfflineReady?: () => void;
  onNeedRefresh?: () => void;
};

// Stub the PWA registration hook for development
let useRegisterSW:
  | ((options: RegisterSWOptions) => {
      offlineReady: [boolean, (_value: boolean) => void];
      needRefresh: [boolean, (_value: boolean) => void];
      updateServiceWorker: () => Promise<void>;
    })
  | undefined;
// We'll use an optional dynamic import of the PWA register hook
let registerSW: undefined | ((opts?: any) => void);

export interface PWAInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Service for managing PWA functionality
export class PWAService {
  private deferredPrompt: PWAInstallPromptEvent | null = null;
  private isOffline = false;
  private listeners = {
    installPrompt: [] as Array<(_event: PWAInstallPromptEvent) => void>,
    offline: [] as Array<(_isOffline: boolean) => void>,
    update: [] as Array<() => void>,
  };

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as PWAInstallPromptEvent;
      this.listeners.installPrompt.forEach((listener) => listener(this.deferredPrompt!));
    });

    // Listen for offline/online status
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.listeners.offline.forEach((listener) => listener(false));
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.listeners.offline.forEach((listener) => listener(true));
    });

    // Set initial offline status
    this.isOffline = !navigator.onLine;
  }

  // Install the PWA
  async installPWA(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('PWA install accepted');
        this.deferredPrompt = null;
        return true;
      } else {
        console.log('PWA install dismissed');
        return false;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }

  // Check if PWA can be installed
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  // Check if app is currently offline
  getOfflineStatus(): boolean {
    return this.isOffline;
  }

  // Listen for install prompt availability
  onInstallPromptReady(_callback: (event: PWAInstallPromptEvent) => void) {
    this.listeners.installPrompt.push(_callback);

    // If prompt is already available, call immediately
    if (this.deferredPrompt) {
      _callback(this.deferredPrompt);
    }

    return () => {
      const index = this.listeners.installPrompt.indexOf(callback);
      if (index > -1) {
        this.listeners.installPrompt.splice(index, 1);
      }
    };
  }

  // Listen for offline status changes
  onOfflineStatusChange(_callback: (isOffline: boolean) => void) {
    this.listeners.offline.push(_callback);

    // Call immediately with current status
    _callback(this.isOffline);

    return () => {
      const index = this.listeners.offline.indexOf(callback);
      if (index > -1) {
        this.listeners.offline.splice(index, 1);
      }
    };
  }

  // Listen for app updates
  onUpdateAvailable(_callback: () => void) {
    this.listeners.update.push(_callback);

    return () => {
      const index = this.listeners.update.indexOf(callback);
      if (index > -1) {
        this.listeners.update.splice(index, 1);
      }
    };
  }

  // Trigger update listeners (called by SW registration hook)
  triggerUpdateAvailable() {
    this.listeners.update.forEach((listener) => listener());
  }
}

// Create singleton instance
export const pwaService = new PWAService();

// React hook for PWA functionality
// Wrap the PWA functionality in a development-safe hook
export const usePWA = _usePWA;

export function _usePWA() {
  const defaultState = {
    isOfflineReady: false,
    needsRefresh: false,
    updateApp: () => {},
    installApp: () => Promise.resolve(false),
    canInstall: false,
    isOffline: false,
  };

  // Only use PWA functionality in production
  if (process.env.NODE_ENV !== 'production') {
    return defaultState;
  }

  if (!registerSW) {
    return defaultState;
  }
  // Only try to use PWA in production
  if (process.env.NODE_ENV === 'production') {
    try {
      // Use require-like dynamic import without await to avoid async in hook

      const mod = null as any as { useRegisterSW: any };
      if (!mod || !mod.useRegisterSW) return defaultState;
      const { useRegisterSW } = mod;
      const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
        onRegistered(r: any) {
          console.log('SW Registered:', r);
        },
        onRegisterError(error: any) {
          console.warn('SW registration error:', error);
        },
        onNeedRefresh() {
          pwaService.triggerUpdateAvailable();
        },
        onOfflineReady() {
          console.log('App ready to work offline');
        },
      });

      return {
        isOfflineReady: offlineReady?.[0] || false,
        needsRefresh: needRefresh?.[0] || false,
        updateApp: updateServiceWorker,
        installApp: () => pwaService.installPWA(),
        canInstall: pwaService.canInstall(),
        isOffline: pwaService.getOfflineStatus(),
      };
    } catch (err) {
      console.warn('PWA hooks not available:', err);
      return defaultState;
    }
  }

  // Fallback
  return defaultState;
}

// Utilities for offline storage management
export class OfflineStorageManager {
  private static readonly SYNC_QUEUE_KEY = 'inkwell_sync_queue';
  private static readonly DRAFT_PREFIX = 'inkwell_draft_';

  // Save draft for offline editing
  static saveDraft(projectId: string, content: string) {
    try {
      const draftKey = `${this.DRAFT_PREFIX}${projectId}`;
      const draft = {
        content,
        timestamp: Date.now(),
        projectId,
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }

  // Get draft for offline editing
  static getDraft(projectId: string): { content: string; timestamp: number } | null {
    try {
      const draftKey = `${this.DRAFT_PREFIX}${projectId}`;
      const draftJson = localStorage.getItem(draftKey);
      return draftJson ? JSON.parse(draftJson) : null;
    } catch (error) {
      console.error('Failed to get draft:', error);
      return null;
    }
  }

  // Remove draft after successful sync
  static removeDraft(projectId: string) {
    try {
      const draftKey = `${this.DRAFT_PREFIX}${projectId}`;
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error('Failed to remove draft:', error);
    }
  }

  // Add operation to sync queue for when online
  static addToSyncQueue(operation: {
    type: 'save' | 'delete' | 'create';
    projectId: string;
    data: any;
    timestamp: number;
  }) {
    try {
      const queue = this.getSyncQueue();
      queue.push(operation);
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  // Get sync queue
  static getSyncQueue(): Array<{
    type: 'save' | 'delete' | 'create';
    projectId: string;
    data: any;
    timestamp: number;
  }> {
    try {
      const queueJson = localStorage.getItem(this.SYNC_QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  }

  // Clear sync queue after successful sync
  static clearSyncQueue() {
    try {
      localStorage.removeItem(this.SYNC_QUEUE_KEY);
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }

  // Get storage usage information
  static async getStorageInfo(): Promise<{
    quota: number;
    usage: number;
    percentUsed: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

        return { quota, usage, percentUsed };
      } catch (error) {
        console.error('Failed to get storage info:', error);
      }
    }

    return { quota: 0, usage: 0, percentUsed: 0 };
  }
}
