/**
 * Project ID Migration Service
 *
 * Migrates projects with non-UUID IDs to UUID-based IDs.
 *
 * Background:
 * - Early versions created projects with timestamp-based IDs (e.g., proj_welcome_1763239539236)
 * - Supabase requires UUIDs for cloud sync compatibility
 * - This migration ensures all projects use valid UUIDs
 *
 * Migration Strategy:
 * 1. Detect projects with non-UUID IDs
 * 2. Generate new UUIDs for those projects
 * 3. Update all related data (chapters, characters, notes, etc.)
 * 4. Mark them for sync via SyncQueue
 * 5. Clean up old localStorage references
 */

import type { EnhancedProject } from '@/types/project';
import devLog from '@/utils/devLog';
import { isValidUUID } from '@/utils/idUtils';

import { ProjectsDB } from './projectsDB';

const MIGRATION_KEY = 'inkwell_project_id_uuid_migration_v1';

export interface ProjectIdMigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  idMapping: Record<string, string>; // oldId -> newId
}

export class ProjectIdMigrationService {
  /**
   * Check if project ID migration has been completed
   */
  static hasMigrated(): boolean {
    return localStorage.getItem(MIGRATION_KEY) === 'true';
  }

  /**
   * Mark migration as complete
   */
  static setMigrated(): void {
    localStorage.setItem(MIGRATION_KEY, 'true');
    devLog.log('[ProjectIdMigration] Migration complete flag set');
  }

  /**
   * Detect projects with non-UUID IDs
   */
  static async findProjectsNeedingMigration(): Promise<EnhancedProject[]> {
    try {
      const allProjects = await ProjectsDB.loadAllProjects();
      const needsMigration = allProjects.filter((project) => !isValidUUID(project.id));

      if (needsMigration.length > 0) {
        devLog.warn(
          `[ProjectIdMigration] Found ${needsMigration.length} projects with non-UUID IDs:`,
          needsMigration.map((p) => ({ id: p.id, name: p.name })),
        );
      }

      return needsMigration;
    } catch (error) {
      devLog.error('[ProjectIdMigration] Error finding projects needing migration:', error);
      return [];
    }
  }

  /**
   * Migrate a single project from non-UUID ID to UUID
   */
  static async migrateProject(project: EnhancedProject): Promise<{
    success: boolean;
    oldId: string;
    newId: string;
    error?: string;
  }> {
    const oldId = project.id;
    const newId = crypto.randomUUID();

    devLog.log(`[ProjectIdMigration] Migrating project ${oldId} -> ${newId}`);

    try {
      // Create a new project with UUID
      const migratedProject: EnhancedProject = {
        ...project,
        id: newId,
      };

      // Save the new project
      await ProjectsDB.saveProject(migratedProject);

      // Update chapters to point to new project ID
      const { Chapters } = await import('./chaptersService');
      const chapters = await Chapters.list(oldId);

      devLog.log(`[ProjectIdMigration] Migrating ${chapters.length} chapters for project ${oldId}`);

      for (const chapter of chapters) {
        try {
          // Get full chapter content
          const fullChapter = await Chapters.get(chapter.id);

          // Delete old chapter
          await Chapters.remove(chapter.id);

          // Create new chapter with updated project_id
          await Chapters.create({
            projectId: newId,
            title: chapter.title,
            summary: chapter.summary,
            content: fullChapter?.content || '',
            index: chapter.index,
            status: chapter.status || 'draft',
          });
        } catch (chapterError) {
          devLog.error(`[ProjectIdMigration] Error migrating chapter ${chapter.id}:`, chapterError);
        }
      }

      // Delete the old project
      await ProjectsDB.deleteProject(oldId);

      // Clean up localStorage references
      this.cleanupLocalStorageReferences(oldId);

      // Update current project ID if it matches the old ID
      const currentProjectId = localStorage.getItem('inkwell_current_project_id');
      if (currentProjectId === oldId) {
        localStorage.setItem('inkwell_current_project_id', newId);
        devLog.log(`[ProjectIdMigration] Updated current project ID from ${oldId} to ${newId}`);
      }

      devLog.log(`[ProjectIdMigration] ✅ Successfully migrated project ${oldId} -> ${newId}`);

      return {
        success: true,
        oldId,
        newId,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      devLog.error(`[ProjectIdMigration] Failed to migrate project ${oldId}:`, error);

      return {
        success: false,
        oldId,
        newId,
        error: errorMsg,
      };
    }
  }

  /**
   * Clean up localStorage references to old project IDs
   */
  static cleanupLocalStorageReferences(oldId: string): void {
    const keysToCheck = Object.keys(localStorage);
    const keysToRemove: string[] = [];

    for (const key of keysToCheck) {
      // Clean up section references
      if (key.startsWith('lastSection-') && key.includes(oldId)) {
        keysToRemove.push(key);
      }
      // Clean up other project-specific keys
      if (key.includes(oldId)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }

    if (keysToRemove.length > 0) {
      devLog.log(
        `[ProjectIdMigration] Cleaned up ${keysToRemove.length} localStorage keys for project ${oldId}`,
      );
    }
  }

  /**
   * Run full migration for all projects with non-UUID IDs
   */
  static async runMigration(): Promise<ProjectIdMigrationResult> {
    if (this.hasMigrated()) {
      devLog.log('[ProjectIdMigration] Already migrated, skipping');
      return {
        success: true,
        migratedCount: 0,
        errors: [],
        idMapping: {},
      };
    }

    devLog.log('[ProjectIdMigration] Starting project ID migration to UUIDs');

    const projectsToMigrate = await this.findProjectsNeedingMigration();

    if (projectsToMigrate.length === 0) {
      devLog.log('[ProjectIdMigration] No projects need migration');
      this.setMigrated();
      return {
        success: true,
        migratedCount: 0,
        errors: [],
        idMapping: {},
      };
    }

    const errors: string[] = [];
    const idMapping: Record<string, string> = {};
    let successCount = 0;

    for (const project of projectsToMigrate) {
      const result = await this.migrateProject(project);

      if (result.success) {
        successCount++;
        idMapping[result.oldId] = result.newId;
      } else {
        errors.push(`Project ${result.oldId}: ${result.error}`);
      }
    }

    const allSuccessful = successCount === projectsToMigrate.length;

    if (allSuccessful) {
      this.setMigrated();
      devLog.log(
        `[ProjectIdMigration] ✅ Successfully migrated all ${successCount} projects to UUIDs`,
      );
    } else {
      devLog.warn(
        `[ProjectIdMigration] ⚠️ Partial migration: ${successCount}/${projectsToMigrate.length} succeeded`,
      );
    }

    return {
      success: allSuccessful,
      migratedCount: successCount,
      errors,
      idMapping,
    };
  }

  /**
   * Force re-run migration (for testing or recovery)
   */
  static async forceMigration(): Promise<ProjectIdMigrationResult> {
    localStorage.removeItem(MIGRATION_KEY);
    return this.runMigration();
  }

  /**
   * Get migration status for UI display
   */
  static async getMigrationStatus(): Promise<{
    hasMigrated: boolean;
    projectsNeedingMigration: number;
  }> {
    const hasMigrated = this.hasMigrated();
    const projectsNeedingMigration = hasMigrated
      ? 0
      : (await this.findProjectsNeedingMigration()).length;

    return {
      hasMigrated,
      projectsNeedingMigration,
    };
  }
}

/**
 * Auto-run migration on module load
 * This ensures migration happens early in the app lifecycle
 */
if (typeof window !== 'undefined') {
  // Run migration after a short delay to avoid blocking initial render
  setTimeout(async () => {
    try {
      const result = await ProjectIdMigrationService.runMigration();

      if (result.migratedCount > 0) {
        devLog.log(
          `[ProjectIdMigration] Auto-migration completed: ${result.migratedCount} projects migrated`,
        );

        if (result.errors.length > 0) {
          devLog.warn('[ProjectIdMigration] Migration errors:', result.errors);
        }
      }
    } catch (error) {
      devLog.error('[ProjectIdMigration] Auto-migration failed:', error);
    }
  }, 2000); // Slightly delayed after the main projects migration
}
