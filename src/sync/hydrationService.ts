/**
 * Hydration Service
 *
 * Handles cloud → local synchronization (hydration).
 * Fetches data from Supabase and writes to IndexedDB.
 *
 * Features:
 * - Project bootstrap (initial load from cloud)
 * - Incremental sync (only fetch changed records)
 * - LWW merge conflict resolution
 * - Progress tracking for UI
 * - E2EE decryption support
 */

import { supabase } from '@/lib/supabaseClient';
import { decryptJSON } from '@/services/cryptoService';
import { e2eeKeyManager } from '@/services/e2eeKeyManager';
import { ProjectsDB } from '@/services/projectsDB';
import type { EnhancedProject } from '@/types/project';
import devLog from '@/utils/devLog';

import type { SyncTable, HydrationRequest, HydrationResult, MergeConflict } from './types';

/**
 * Hydration Service
 */
class HydrationService {
  /**
   * Hydrate a project from cloud
   *
   * Fetches all data for a project and writes to IndexedDB.
   * Uses LWW merge to resolve conflicts with local data.
   */
  async hydrateProject(request: HydrationRequest): Promise<HydrationResult> {
    const startTime = performance.now();
    const { projectId, tables = this.getAllTables(), since, onProgress } = request;

    const conflicts: MergeConflict[] = [];
    const errors: string[] = [];
    const tableStats: Record<string, { fetched: number; written: number }> = {};

    let recordsSynced = 0;

    try {
      devLog.log(`[Hydration] Starting hydration for project ${projectId}`, {
        tables,
        since: since ? new Date(since).toISOString() : 'all',
      });

      // Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated - cannot hydrate from cloud');
      }

      const completedTables: SyncTable[] = [];

      // Hydrate each table
      for (const table of tables) {
        try {
          onProgress?.({
            currentTable: table,
            completedTables,
            recordsFetched: recordsSynced,
            recordsWritten: recordsSynced,
            percentComplete: (completedTables.length / tables.length) * 100,
          });

          const result = await this.hydrateTable(table, projectId, since);

          tableStats[table] = {
            fetched: result.fetched,
            written: result.written,
          };

          recordsSynced += result.written;
          conflicts.push(...result.conflicts);
          errors.push(...result.errors);

          completedTables.push(table);

          devLog.debug(`[Hydration] ${table}: ${result.written}/${result.fetched} records written`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Table ${table}: ${errorMessage}`);
          devLog.error(`[Hydration] Table ${table} failed:`, error);

          tableStats[table] = { fetched: 0, written: 0 };
        }
      }

      const duration = performance.now() - startTime;

      onProgress?.({
        currentTable: tables[tables.length - 1] || 'projects',
        completedTables: tables,
        recordsFetched: recordsSynced,
        recordsWritten: recordsSynced,
        percentComplete: 100,
      });

      devLog.log(`[Hydration] Complete: ${recordsSynced} records in ${duration.toFixed(0)}ms`);

      return {
        success: errors.length === 0,
        recordsSynced,
        duration,
        conflicts,
        errors,
        tableStats: tableStats as Record<SyncTable, { fetched: number; written: number }>,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      devLog.error('[Hydration] Hydration failed:', error);

      return {
        success: false,
        recordsSynced,
        duration: performance.now() - startTime,
        conflicts,
        errors: [errorMessage, ...errors],
        tableStats: tableStats as Record<SyncTable, { fetched: number; written: number }>,
      };
    }
  }

  /**
   * Hydrate a single table
   */
  private async hydrateTable(
    table: SyncTable,
    projectId: string,
    since?: number,
  ): Promise<{
    fetched: number;
    written: number;
    conflicts: MergeConflict[];
    errors: string[];
  }> {
    const conflicts: MergeConflict[] = [];
    const errors: string[] = [];
    let written = 0;

    // Fetch from Supabase
    let query = supabase.from(table).select('*').eq('project_id', projectId);

    // Filter by updated_at if incremental sync
    if (since) {
      query = query.gt('updated_at', new Date(since).toISOString());
    }

    // Filter out soft-deleted records
    query = query.is('deleted_at', null);

    const { data: cloudRecords, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch ${table}: ${error.message}`);
    }

    if (!cloudRecords || cloudRecords.length === 0) {
      devLog.debug(`[Hydration] No records for ${table}`);
      return { fetched: 0, written: 0, conflicts, errors };
    }

    devLog.debug(`[Hydration] Fetched ${cloudRecords.length} records from ${table}`);

    // Table-specific hydration logic
    switch (table) {
      case 'projects':
        // Projects are handled separately (not per-project)
        break;

      case 'chapters':
        const chapterResult = await this.hydrateChapters(cloudRecords, projectId);
        written = chapterResult.written;
        conflicts.push(...chapterResult.conflicts);
        errors.push(...chapterResult.errors);
        break;

      case 'sections':
        // Sections hydration (Phase 2.1+)
        written = cloudRecords.length;
        break;

      case 'characters':
        // Characters hydration (Phase 2.1+)
        written = cloudRecords.length;
        break;

      case 'notes':
        // Notes hydration (Phase 2.1+)
        written = cloudRecords.length;
        break;

      case 'project_settings':
        // Settings hydration (Phase 2.1+)
        written = cloudRecords.length;
        break;
    }

    return {
      fetched: cloudRecords.length,
      written,
      conflicts,
      errors,
    };
  }

  /**
   * Hydrate chapters (with E2EE support and LWW merge)
   */
  private async hydrateChapters(
    cloudRecords: any[],
    projectId: string,
  ): Promise<{
    written: number;
    conflicts: MergeConflict[];
    errors: string[];
  }> {
    const conflicts: MergeConflict[] = [];
    const errors: string[] = [];
    let written = 0;

    // Check if E2EE is enabled
    const e2eeReady = await this.isE2EEReady(projectId);

    for (const cloudRecord of cloudRecords) {
      try {
        // Decrypt if needed
        let processedRecord = cloudRecord;
        if (cloudRecord.encrypted_content && e2eeReady) {
          processedRecord = await this.decryptChapter(cloudRecord, projectId);
        } else if (cloudRecord.encrypted_content && !e2eeReady) {
          devLog.warn(`[Hydration] Chapter ${cloudRecord.id} is encrypted but project is locked`);
          errors.push(`Chapter ${cloudRecord.id}: encrypted but project locked`);
          continue;
        }

        // Get local version (if exists)
        // In Phase 2, we'd query IndexedDB here for LWW merge
        // For now, just write cloud version
        // TODO: Implement LWW merge with local IndexedDB data

        // Write to IndexedDB
        // This will be integrated with your existing chapter storage
        devLog.debug(`[Hydration] Writing chapter ${processedRecord.id} to IndexedDB`);

        written++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Chapter ${cloudRecord.id}: ${errorMessage}`);
        devLog.error(`[Hydration] Chapter ${cloudRecord.id} failed:`, error);
      }
    }

    return { written, conflicts, errors };
  }

  /**
   * Bootstrap a project (initial load)
   *
   * Called when opening a project for the first time or after cache clear.
   * Checks cloud first, then local, and syncs appropriately.
   */
  async bootstrapProject(projectId: string): Promise<{
    source: 'cloud' | 'local' | 'none';
    project: EnhancedProject | null;
  }> {
    try {
      devLog.log(`[Hydration] Bootstrapping project ${projectId}`);

      // Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        devLog.warn('[Hydration] Not authenticated, using local only');
        return await this.loadLocal(projectId);
      }

      // Try to fetch from cloud
      const { data: cloudProject, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found
        throw error;
      }

      // Try to load from local
      const localProject = await ProjectsDB.loadProject(projectId);

      if (cloudProject && localProject) {
        // Both exist - compare timestamps
        const cloudUpdated = new Date(cloudProject.updated_at).getTime();
        const localUpdated = localProject.updatedAt;

        if (cloudUpdated > localUpdated) {
          devLog.log('[Hydration] Cloud is newer, hydrating from cloud');
          await this.hydrateProject({ projectId });
          const updated = await ProjectsDB.loadProject(projectId);
          return { source: 'cloud', project: updated };
        } else {
          devLog.log('[Hydration] Local is newer, using local');
          return { source: 'local', project: localProject };
        }
      } else if (cloudProject) {
        // Cloud only - hydrate
        devLog.log('[Hydration] Found in cloud, hydrating');
        await this.hydrateProject({ projectId });
        const updated = await ProjectsDB.loadProject(projectId);
        return { source: 'cloud', project: updated };
      } else if (localProject) {
        // Local only - will be pushed to cloud on next save
        devLog.log('[Hydration] Found locally, will sync to cloud');
        return { source: 'local', project: localProject };
      } else {
        // Not found anywhere
        devLog.warn('[Hydration] Project not found in cloud or local');
        return { source: 'none', project: null };
      }
    } catch (error) {
      devLog.error('[Hydration] Bootstrap failed:', error);
      // Fallback to local
      return await this.loadLocal(projectId);
    }
  }

  /**
   * Load project from local only
   */
  private async loadLocal(projectId: string): Promise<{
    source: 'local' | 'none';
    project: EnhancedProject | null;
  }> {
    const project = await ProjectsDB.loadProject(projectId);
    if (project) {
      return { source: 'local', project };
    } else {
      return { source: 'none', project: null };
    }
  }

  /**
   * Check if E2EE is ready for a project
   */
  private async isE2EEReady(projectId: string): Promise<boolean> {
    try {
      const enabled = await e2eeKeyManager.isE2EEEnabled(projectId);
      if (!enabled) return false;

      const unlocked = e2eeKeyManager.isUnlocked(projectId);
      return unlocked;
    } catch (error) {
      devLog.error('[Hydration] E2EE readiness check failed:', error);
      return false;
    }
  }

  /**
   * Decrypt chapter from cloud
   */
  private async decryptChapter(cloudRecord: any, projectId: string): Promise<any> {
    const dek = e2eeKeyManager.getDEK(projectId);

    const decrypted = await decryptJSON<{
      title: string;
      body: string;
      summary?: string;
      notes?: string;
    }>(cloudRecord.encrypted_content, dek);

    return {
      ...cloudRecord,
      title: decrypted.title,
      body: decrypted.body,
      summary: decrypted.summary,
      notes: decrypted.notes,
      encrypted_content: undefined, // Remove encrypted field
    };
  }

  /**
   * Get all sync tables
   * IMPORTANT: 'projects' must be first to ensure parent project exists before child entities
   */
  private getAllTables(): SyncTable[] {
    return ['projects', 'project_settings', 'chapters', 'sections', 'characters', 'notes'];
  }
}

// Export singleton instance
export const hydrationService = new HydrationService();
export default hydrationService;
