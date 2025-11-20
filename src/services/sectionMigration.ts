// src/services/sectionMigration.ts
/**
 * Chapter to Section Migration Service
 *
 * Automatically migrates existing chapters to the new section system
 * Runs once per project and marks migration as complete
 */

import { Chapters } from '@/services/chaptersService';
import devLog from '@/utils/devLog';
import { isMissingStoreError } from '@/utils/idbUtils';

const MIGRATION_KEY_PREFIX = 'inkwell_section_migration_';

/**
 * Check if a project has been migrated to the section system
 */
export function isMigrated(projectId: string): boolean {
  try {
    const migrated = localStorage.getItem(`${MIGRATION_KEY_PREFIX}${projectId}`);
    return migrated === 'true';
  } catch (error) {
    devLog.warn('[SectionMigration] Failed to check migration status:', error);
    return false;
  }
}

/**
 * Mark a project as migrated
 */
export function markAsMigrated(projectId: string): void {
  try {
    localStorage.setItem(`${MIGRATION_KEY_PREFIX}${projectId}`, 'true');
    devLog.debug(`[SectionMigration] Marked project ${projectId} as migrated`);
  } catch (error) {
    devLog.warn('[SectionMigration] Failed to mark migration status:', error);
  }
}

/**
 * Migrate existing chapters to sections
 *
 * This function:
 * 1. Reads all existing chapters for a project
 * 2. Adds a `type: 'chapter'` field to each (if missing)
 * 3. Updates them in IndexedDB
 * 4. Marks the project as migrated
 */
export async function migrateChaptersToSections(projectId: string): Promise<{
  success: boolean;
  migratedCount: number;
  error?: string;
}> {
  // Skip if already migrated
  if (isMigrated(projectId)) {
    devLog.debug(`[SectionMigration] Project ${projectId} already migrated, skipping`);
    return { success: true, migratedCount: 0 };
  }

  try {
    devLog.debug(`[SectionMigration] Starting migration for project ${projectId}`);

    // Get all chapters for this project
    const chapters = await Chapters.list(projectId);

    if (chapters.length === 0) {
      // No chapters to migrate, mark as migrated anyway
      markAsMigrated(projectId);
      return { success: true, migratedCount: 0 };
    }

    let migratedCount = 0;

    // Add type field to each chapter if missing
    for (const chapter of chapters) {
      // Check if already has type field
      const hasType = 'type' in chapter && chapter.type;

      if (!hasType) {
        // Update chapter to include type: 'chapter'
        await Chapters.updateMeta({
          id: chapter.id,
          type: 'chapter' as any, // Type assertion needed for backward compat
        });
        migratedCount++;
      }
    }

    // Mark migration as complete
    markAsMigrated(projectId);

    devLog.debug(
      `[SectionMigration] Successfully migrated ${migratedCount} chapters for project ${projectId}`,
    );

    return { success: true, migratedCount };
  } catch (error: any) {
    // Special handling for missing store errors - don't fail the app
    if (isMissingStoreError(error, 'chapter_meta')) {
      devLog.warn('[SectionMigration] chapter_meta store missing, skipping migration', {
        projectId,
        error,
      });
      // Mark as migrated to prevent retry loops - when the store is created later,
      // chapters will have their type set to 'chapter' by default anyway
      markAsMigrated(projectId);
      return { success: true, migratedCount: 0 };
    }

    devLog.error(`[SectionMigration] Failed to migrate project ${projectId}:`, error);
    return {
      success: false,
      migratedCount: 0,
      error: error.message || 'Unknown migration error',
    };
  }
}

/**
 * Automatically migrate projects when needed
 *
 * Call this function when:
 * - App initializes
 * - User switches to a project
 * - Before using useSections hook
 */
export async function autoMigrate(projectId: string): Promise<void> {
  if (!projectId) return;

  try {
    const result = await migrateChaptersToSections(projectId);
    if (result.success && result.migratedCount > 0) {
      devLog.debug(`[SectionMigration] Auto-migrated ${result.migratedCount} chapters to sections`);
    }
  } catch (error) {
    // Silent failure - migration should not block the app
    devLog.warn('[SectionMigration] Auto-migration failed:', error);
  }
}

/**
 * Reset migration status (for testing/debugging)
 */
export function resetMigration(projectId: string): void {
  try {
    localStorage.removeItem(`${MIGRATION_KEY_PREFIX}${projectId}`);
    devLog.debug(`[SectionMigration] Reset migration status for project ${projectId}`);
  } catch (error) {
    devLog.warn('[SectionMigration] Failed to reset migration status:', error);
  }
}
