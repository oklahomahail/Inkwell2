/**
 * Database Initialization Service
 *
 * Ensures all IndexedDB databases are initialized before the app fully loads.
 * Prevents "Database not yet initialized" errors in storage health checks.
 *
 * NOTE: This service now uses the centralized dbSchema module for
 * self-healing schema initialization. The schema definitions are in
 * src/services/dbSchema.ts
 */

import { ensureDatabaseSchema } from '@/services/dbSchema';
import devLog from '@/utils/devLog';
import { hasIndexedDB } from '@/utils/idbUtils';

/**
 * Database initialization state
 */
class DBInitService {
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize all databases
   * Safe to call multiple times - subsequent calls return the same promise
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    if (!hasIndexedDB()) {
      devLog.warn('[DBInit] IndexedDB not available - skipping initialization');
      return;
    }

    const startTime = performance.now();
    devLog.log('[DBInit] Starting database initialization...');

    try {
      // Use centralized schema-based initialization
      // This initializes ALL databases defined in dbSchema.ts
      await ensureDatabaseSchema();

      this.initialized = true;
      const duration = performance.now() - startTime;
      devLog.log(`[DBInit] All databases ready (${duration.toFixed(1)}ms)`);
    } catch (error) {
      devLog.error('[DBInit] Initialization failed:', error);
      // Don't throw - allow app to continue with degraded functionality
      // The storage health check will show appropriate warnings
    }
  }

  /**
   * Check if databases have been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Wait for database initialization to complete
   */
  async waitForInit(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      await this.initPromise;
    } else {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const dbInitService = new DBInitService();

/**
 * Convenience function - initialize databases
 */
export async function ensureDatabaseReady(): Promise<void> {
  await dbInitService.initialize();
}
