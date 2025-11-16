/**
 * Realtime Sync Service
 *
 * Handles Supabase Realtime subscriptions for multi-device synchronization.
 * Listens for changes on all sync tables and triggers local hydration.
 *
 * Features:
 * - Multi-table subscriptions
 * - Automatic reconnection
 * - Per-project filtering
 * - Change event routing to hydration
 * - Connection status tracking
 */

import { supabase } from '@/lib/supabaseClient';
import devLog from '@/utils/devLog';

import { hydrationService } from './hydrationService';

import type {
  SyncTable,
  RealtimeChange,
  RealtimeStatus,
  RealtimeEventType,
  SyncStateCallback,
} from './types';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Realtime Service Configuration
 */
interface RealtimeConfig {
  /** Auto-reconnect on disconnect */
  autoReconnect: boolean;

  /** Debounce delay for change events (ms) */
  changeDebounce: number;

  /** Enable debug logging */
  debug: boolean;
}

const DEFAULT_CONFIG: RealtimeConfig = {
  autoReconnect: true,
  changeDebounce: 500, // 500ms debounce to batch rapid changes
  debug: false,
};

/**
 * Realtime Sync Service
 * Singleton pattern for global Realtime management
 */
class RealtimeService {
  private static instance: RealtimeService | null = null;

  private config: RealtimeConfig = DEFAULT_CONFIG;
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // projectId -> Set<table>
  private status: RealtimeStatus = 'disconnected';
  private listeners: Set<SyncStateCallback> = new Set();

  // Debounce timers for change events
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  // Track which project is currently active
  private activeProjectId: string | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Subscribe to Realtime changes for a project
   *
   * @param projectId - Project to subscribe to
   * @param tables - Tables to monitor (default: all sync tables)
   */
  async subscribeToProject(projectId: string, tables?: SyncTable[]): Promise<void> {
    this.activeProjectId = projectId;

    const tablesToSubscribe = tables || this.getAllSyncTables();

    devLog.log(`[Realtime] Subscribing to project ${projectId}`, {
      tables: tablesToSubscribe,
    });

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      devLog.warn('[Realtime] Not authenticated, skipping subscription');
      return;
    }

    // Track subscriptions
    if (!this.subscriptions.has(projectId)) {
      this.subscriptions.set(projectId, new Set());
    }

    // Subscribe to each table
    for (const table of tablesToSubscribe) {
      await this.subscribeToTable(projectId, table);
      this.subscriptions.get(projectId)?.add(table);
    }

    this.updateStatus('connected');
  }

  /**
   * Subscribe to a specific table for a project
   */
  private async subscribeToTable(projectId: string, table: SyncTable): Promise<void> {
    const channelName = `${projectId}:${table}`;

    // Don't subscribe twice
    if (this.channels.has(channelName)) {
      devLog.debug(`[Realtime] Already subscribed to ${channelName}`);
      return;
    }

    devLog.debug(`[Realtime] Subscribing to ${channelName}`);

    // Create channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table,
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          this.handleChange(table, payload);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          devLog.log(`[Realtime] Subscribed to ${channelName}`);
          this.updateStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          devLog.error(`[Realtime] Error subscribing to ${channelName}`);
          this.updateStatus('error');
        } else if (status === 'TIMED_OUT') {
          devLog.warn(`[Realtime] Subscription timeout for ${channelName}`);
          this.updateStatus('disconnected');

          // Auto-reconnect
          if (this.config.autoReconnect) {
            setTimeout(() => {
              devLog.log(`[Realtime] Reconnecting to ${channelName}`);
              this.subscribeToTable(projectId, table);
            }, 3000);
          }
        }
      });

    this.channels.set(channelName, channel);
  }

  /**
   * Handle change event from Realtime
   */
  private handleChange(table: SyncTable, payload: any): void {
    const eventType = payload.eventType as RealtimeEventType;
    const record = payload.new || payload.old;

    devLog.debug(`[Realtime] Change received: ${table}.${eventType}`, {
      recordId: record?.id,
    });

    // Skip changes we made ourselves (client_hash matches)
    if (this.isOwnChange(record)) {
      devLog.debug(`[Realtime] Skipping own change for ${record.id}`);
      return;
    }

    // Create change event
    const change: RealtimeChange = {
      eventType,
      table,
      new: payload.new,
      old: payload.old,
      timestamp: Date.now(),
    };

    // Debounce rapid changes
    this.debounceChange(change);
  }

  /**
   * Debounce change event to batch rapid updates
   */
  private debounceChange(change: RealtimeChange): void {
    const key = `${change.table}:${change.new?.id || change.old?.id}`;

    // Clear existing timer
    const existing = this.debounceTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.processChange(change);
      this.debounceTimers.delete(key);
    }, this.config.changeDebounce);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Process a change event (after debounce)
   */
  private async processChange(change: RealtimeChange): Promise<void> {
    const recordId = change.new?.id || change.old?.id;
    const projectId = change.new?.project_id || change.old?.project_id;

    devLog.log(`[Realtime] Processing change: ${change.table}.${change.eventType}`, {
      recordId,
      projectId,
    });

    // For UPDATE/INSERT: hydrate the changed record
    if (change.eventType === 'INSERT' || change.eventType === 'UPDATE') {
      try {
        // Hydrate this specific table for this project
        await hydrationService.hydrateProject({
          projectId,
          tables: [change.table],
        });

        devLog.log(`[Realtime] Hydrated ${change.table} for project ${projectId}`);
      } catch (error) {
        devLog.error(`[Realtime] Failed to hydrate ${change.table}:`, error);
      }
    }

    // For DELETE: remove from local IndexedDB
    if (change.eventType === 'DELETE') {
      // TODO: Implement delete handling in hydration service
      devLog.warn(`[Realtime] DELETE not yet implemented for ${change.table}:${recordId}`);
    }
  }

  /**
   * Check if this change was made by us (to avoid sync loops)
   */
  private isOwnChange(record: any): boolean {
    // TODO: Implement client fingerprinting to detect own changes
    // For now, assume all changes are from other devices
    return false;
  }

  /**
   * Unsubscribe from a project
   */
  async unsubscribeFromProject(projectId: string): Promise<void> {
    devLog.log(`[Realtime] Unsubscribing from project ${projectId}`);

    const tables = this.subscriptions.get(projectId);
    if (!tables) {
      devLog.debug(`[Realtime] No subscriptions for project ${projectId}`);
      return;
    }

    // Unsubscribe from all tables
    for (const table of tables) {
      const channelName = `${projectId}:${table}`;
      const channel = this.channels.get(channelName);

      if (channel) {
        await supabase.removeChannel(channel);
        this.channels.delete(channelName);
        devLog.debug(`[Realtime] Unsubscribed from ${channelName}`);
      }
    }

    // CRITICAL FIX: Clear all debounce timers for this project
    // This prevents memory leaks from pending timers
    const timersToDelete: string[] = [];
    for (const [key, timer] of this.debounceTimers.entries()) {
      // Check if this timer belongs to this project's tables
      const [table] = key.split(':');
      if (tables.has(table as SyncTable)) {
        clearTimeout(timer);
        timersToDelete.push(key);
      }
    }

    for (const key of timersToDelete) {
      this.debounceTimers.delete(key);
    }

    devLog.debug(
      `[Realtime] Cleared ${timersToDelete.length} debounce timers for project ${projectId}`,
    );

    this.subscriptions.delete(projectId);

    // Update status
    if (this.channels.size === 0) {
      this.updateStatus('disconnected');
    }

    if (this.activeProjectId === projectId) {
      this.activeProjectId = null;
    }
  }

  /**
   * Unsubscribe from all projects
   */
  async unsubscribeAll(): Promise<void> {
    devLog.log('[Realtime] Unsubscribing from all projects');

    // Remove all channels
    for (const channel of this.channels.values()) {
      await supabase.removeChannel(channel);
    }

    // CRITICAL FIX: Clear all debounce timers
    // This prevents memory leaks from pending timers
    const timerCount = this.debounceTimers.size;
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    devLog.debug(`[Realtime] Cleared ${timerCount} debounce timers`);

    this.channels.clear();
    this.subscriptions.clear();
    this.activeProjectId = null;
    this.updateStatus('disconnected');
  }

  /**
   * Update Realtime connection status
   */
  private updateStatus(status: RealtimeStatus): void {
    if (this.status === status) return;

    const oldStatus = this.status;
    this.status = status;

    devLog.log(`[Realtime] Status changed: ${oldStatus} → ${status}`);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get current Realtime status
   */
  getStatus(): RealtimeStatus {
    return this.status;
  }

  /**
   * Add listener for status changes
   */
  addListener(callback: SyncStateCallback): void {
    this.listeners.add(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback: SyncStateCallback): void {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    // Create minimal sync state for listeners
    const state = {
      status: this.status === 'connected' ? ('online' as const) : ('offline' as const),
      isSyncing: false,
      pendingOperations: 0,
      lastSyncAt: null,
      lastError: null,
      isOnline: navigator.onLine,
      isAuthenticated: this.status !== 'disconnected',
      realtimeStatus: this.status,
      retryDelay: 0,
    };

    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (error) {
        devLog.error('[Realtime] Listener error:', error);
      }
    }
  }

  /**
   * Get all sync tables
   */
  private getAllSyncTables(): SyncTable[] {
    return ['chapters', 'sections', 'characters', 'notes', 'project_settings'];
  }

  /**
   * Get active subscriptions
   */
  getSubscriptions(): Map<string, Set<string>> {
    return new Map(this.subscriptions);
  }

  /**
   * Check if subscribed to a project
   */
  isSubscribed(projectId: string): boolean {
    return this.subscriptions.has(projectId);
  }

  /**
   * Get active project ID
   */
  getActiveProjectId(): string | null {
    return this.activeProjectId;
  }
}

// Export singleton instance
export const realtimeService = RealtimeService.getInstance();
export default realtimeService;
