// src/services/projectsMigration.ts
/**
 * Projects Migration Service
 *
 * Handles migration from localStorage to IndexedDB for project metadata.
 *
 * Migration Strategy:
 * 1. Check if migration has already been completed (flag in localStorage)
 * 2. If not migrated:
 *    a. Read all projects from localStorage (`inkwell_enhanced_projects`)
 *    b. Write each project to IndexedDB
 *    c. Set migration flag
 * 3. Hybrid mode: Continue writing to both localStorage and IndexedDB for a transition period
 * 4. Eventually: Remove localStorage writes (v2.0.0+)
 *
 * This ensures:
 * - Zero data loss
 * - Graceful degradation if IndexedDB fails
 * - Backward compatibility with older code
 */

import type { EnhancedProject } from '@/types/project';
import devLog from '@/utils/devLog';

import { ProjectsDB } from './projectsDB';

const MIGRATION_KEY = 'inkwell_projects_migrated_to_idb';
const PROJECTS_LOCALSTORAGE_KEY = 'inkwell_enhanced_projects';

export class ProjectsMigrationService {
  /**
   * Check if projects have been migrated to IndexedDB
   */
  static hasMigrated(): boolean {
    return localStorage.getItem(MIGRATION_KEY) === 'true';
  }

  /**
   * Mark migration as complete
   */
  static setMigrated(): void {
    localStorage.setItem(MIGRATION_KEY, 'true');
    devLog.debug('[ProjectsMigration] Migration flag set');
  }

  /**
   * Load projects from localStorage (legacy storage)
   */
  static loadFromLocalStorage(): EnhancedProject[] {
    try {
      const stored = localStorage.getItem(PROJECTS_LOCALSTORAGE_KEY);
      if (!stored) return [];

      const projects: EnhancedProject[] = JSON.parse(stored);
      devLog.debug(`[ProjectsMigration] Loaded ${projects.length} projects from localStorage`);
      return projects;
    } catch (error) {
      devLog.error('[ProjectsMigration] Failed to load from localStorage:', error);
      return [];
    }
  }

  /**
   * Migrate all projects from localStorage to IndexedDB
   *
   * @returns Number of projects successfully migrated
   */
  static async migrateToIndexedDB(): Promise<number> {
    if (this.hasMigrated()) {
      devLog.debug('[ProjectsMigration] Already migrated, skipping');
      return 0;
    }

    devLog.debug('[ProjectsMigration] Starting migration to IndexedDB');

    const projects = this.loadFromLocalStorage();
    if (projects.length === 0) {
      devLog.debug('[ProjectsMigration] No projects to migrate');
      this.setMigrated();
      return 0;
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const project of projects) {
      try {
        await ProjectsDB.saveProject(project);
        successCount++;
      } catch (error) {
        const errorMsg = `Failed to migrate project ${project.id}: ${error}`;
        devLog.error(`[ProjectsMigration] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    if (successCount === projects.length) {
      this.setMigrated();
      devLog.debug(
        `[ProjectsMigration] ✅ Successfully migrated all ${successCount} projects to IndexedDB`,
      );
    } else {
      devLog.warn(
        `[ProjectsMigration] ⚠️ Partial migration: ${successCount}/${projects.length} succeeded`,
      );
      if (errors.length > 0) {
        devLog.warn('[ProjectsMigration] Migration errors:', errors);
      }
    }

    return successCount;
  }

  /**
   * Verify migration integrity by comparing localStorage and IndexedDB
   *
   * @returns Object with comparison results
   */
  static async verifyMigration(): Promise<{
    success: boolean;
    localStorageCount: number;
    indexedDBCount: number;
    missingInIndexedDB: string[];
  }> {
    const localProjects = this.loadFromLocalStorage();
    const indexedDBProjects = await ProjectsDB.loadAllProjects();

    const indexedDBProjectIds = new Set(indexedDBProjects.map((p) => p.id));

    const missingInIndexedDB = localProjects
      .filter((p) => !indexedDBProjectIds.has(p.id))
      .map((p) => p.id);

    const success = missingInIndexedDB.length === 0;

    devLog.debug('[ProjectsMigration] Verification results:', {
      localStorageCount: localProjects.length,
      indexedDBCount: indexedDBProjects.length,
      missingInIndexedDB,
      success,
    });

    return {
      success,
      localStorageCount: localProjects.length,
      indexedDBCount: indexedDBProjects.length,
      missingInIndexedDB,
    };
  }

  /**
   * Rollback migration (emergency use only)
   * Clears IndexedDB and resets migration flag
   */
  static async rollback(): Promise<void> {
    devLog.warn('[ProjectsMigration] Rolling back migration');

    try {
      await ProjectsDB.clearAll();
      localStorage.removeItem(MIGRATION_KEY);
      devLog.debug('[ProjectsMigration] Rollback complete');
    } catch (error) {
      devLog.error('[ProjectsMigration] Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Force re-migration (useful for testing or recovery)
   */
  static async forceMigration(): Promise<number> {
    localStorage.removeItem(MIGRATION_KEY);
    return this.migrateToIndexedDB();
  }
}

/**
 * Auto-run migration on module load
 * This ensures migration happens as early as possible in the app lifecycle
 */
if (typeof window !== 'undefined') {
  // Run migration after a short delay to avoid blocking initial render
  setTimeout(async () => {
    try {
      await ProjectsMigrationService.migrateToIndexedDB();
    } catch (error) {
      devLog.error('[ProjectsMigration] Auto-migration failed:', error);
    }
  }, 1000);
}
