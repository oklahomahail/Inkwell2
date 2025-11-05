/**
 * Recovery Service
 *
 * Implements 3-tier recovery sequence for catastrophic failures:
 * 1. Supabase pull (latest cloud backup)
 * 2. localStorage shadow copy restore
 * 3. User upload exported JSON backup
 *
 * Also handles E2EE passphrase re-prompt on key loss.
 */

import type { Chapter } from '@/types/persistence';
import type { EnhancedProject } from '@/types/project';
import devLog from '@/utils/devLog';

import { supabaseSyncService } from './supabaseSync';

export interface RecoveryResult {
  success: boolean;
  tier: 'supabase' | 'localStorage' | 'userUpload' | 'none';
  recoveredProjects: number;
  recoveredChapters: number;
  error?: string;
  message?: string;
}

export interface RecoveryOptions {
  attemptSupabase?: boolean;
  attemptLocalStorage?: boolean;
  requireUserUpload?: boolean;
}

export interface ShadowCopyData {
  projects: EnhancedProject[];
  chapters: Chapter[];
  timestamp: number;
  version: string;
}

class RecoveryService {
  private static readonly SHADOW_COPY_KEY = 'inkwell_shadow_copy';
  private static readonly SHADOW_COPY_VERSION = '1.0.0';
  private static readonly MAX_SHADOW_COPY_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Attempt full 3-tier recovery sequence
   */
  async attemptRecovery(options: RecoveryOptions = {}): Promise<RecoveryResult> {
    const {
      attemptSupabase = true,
      attemptLocalStorage = true,
      requireUserUpload = false,
    } = options;

    devLog.log('[RecoveryService] Starting recovery sequence');

    // Tier 1: Supabase pull
    if (attemptSupabase) {
      const supabaseResult = await this.recoverFromSupabase();
      if (supabaseResult.success) {
        devLog.log('[RecoveryService] Tier 1 (Supabase) recovery successful');
        return supabaseResult;
      }
      devLog.warn('[RecoveryService] Tier 1 (Supabase) recovery failed:', supabaseResult.error);
    }

    // Tier 2: localStorage shadow copy
    if (attemptLocalStorage) {
      const shadowResult = await this.recoverFromShadowCopy();
      if (shadowResult.success) {
        devLog.log('[RecoveryService] Tier 2 (localStorage shadow) recovery successful');
        return shadowResult;
      }
      devLog.warn(
        '[RecoveryService] Tier 2 (localStorage shadow) recovery failed:',
        shadowResult.error,
      );
    }

    // Tier 3: User upload (requires UI interaction)
    if (requireUserUpload) {
      return {
        success: false,
        tier: 'none',
        recoveredProjects: 0,
        recoveredChapters: 0,
        message: 'Please upload a backup file to restore your data',
      };
    }

    // All tiers failed
    return {
      success: false,
      tier: 'none',
      recoveredProjects: 0,
      recoveredChapters: 0,
      error: 'All recovery tiers failed. Please upload a backup file.',
    };
  }

  /**
   * Tier 1: Recover from Supabase cloud backup
   */
  async recoverFromSupabase(): Promise<RecoveryResult> {
    try {
      // Check if user is authenticated
      const isAuth = await supabaseSyncService.isAuthenticated();
      if (!isAuth) {
        return {
          success: false,
          tier: 'supabase',
          recoveredProjects: 0,
          recoveredChapters: 0,
          error: 'Not authenticated with Supabase',
        };
      }

      // Pull data from cloud
      const pullResult = await supabaseSyncService.pullFromCloud();

      // Restore to local storage
      await this.restoreProjects(pullResult.projects);
      await this.restoreChapters(pullResult.chapters);

      return {
        success: true,
        tier: 'supabase',
        recoveredProjects: pullResult.projects.length,
        recoveredChapters: pullResult.chapters.length,
        message: `Recovered ${pullResult.projects.length} projects and ${pullResult.chapters.length} chapters from cloud`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      devLog.error('[RecoveryService] Supabase recovery failed:', error);
      return {
        success: false,
        tier: 'supabase',
        recoveredProjects: 0,
        recoveredChapters: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Tier 2: Recover from localStorage shadow copy
   */
  async recoverFromShadowCopy(): Promise<RecoveryResult> {
    try {
      const shadowData = this.getShadowCopy();

      if (!shadowData) {
        return {
          success: false,
          tier: 'localStorage',
          recoveredProjects: 0,
          recoveredChapters: 0,
          error: 'No shadow copy found',
        };
      }

      // Check age
      const age = Date.now() - shadowData.timestamp;
      if (age > RecoveryService.MAX_SHADOW_COPY_AGE_MS) {
        return {
          success: false,
          tier: 'localStorage',
          recoveredProjects: 0,
          recoveredChapters: 0,
          error: 'Shadow copy is too old (>7 days)',
        };
      }

      // Restore from shadow copy
      await this.restoreProjects(shadowData.projects);
      await this.restoreChapters(shadowData.chapters);

      const ageMinutes = Math.round(age / 60000);
      return {
        success: true,
        tier: 'localStorage',
        recoveredProjects: shadowData.projects.length,
        recoveredChapters: shadowData.chapters.length,
        message: `Recovered ${shadowData.projects.length} projects and ${shadowData.chapters.length} chapters from shadow copy (${ageMinutes}m old)`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      devLog.error('[RecoveryService] Shadow copy recovery failed:', error);
      return {
        success: false,
        tier: 'localStorage',
        recoveredProjects: 0,
        recoveredChapters: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Tier 3: Recover from user-uploaded JSON backup
   */
  async recoverFromUserUpload(jsonData: string): Promise<RecoveryResult> {
    try {
      const backup = JSON.parse(jsonData);

      // Validate backup structure
      if (!backup.inkwellBackup || !backup.data) {
        return {
          success: false,
          tier: 'userUpload',
          recoveredProjects: 0,
          recoveredChapters: 0,
          error: 'Invalid backup file format',
        };
      }

      const { projects = [], chapters = [] } = backup.data;

      // Restore from backup
      await this.restoreProjects(projects);
      await this.restoreChapters(chapters);

      return {
        success: true,
        tier: 'userUpload',
        recoveredProjects: projects.length,
        recoveredChapters: chapters.length,
        message: `Recovered ${projects.length} projects and ${chapters.length} chapters from uploaded backup`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      devLog.error('[RecoveryService] User upload recovery failed:', error);
      return {
        success: false,
        tier: 'userUpload',
        recoveredProjects: 0,
        recoveredChapters: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Create/update shadow copy of critical data
   */
  saveShadowCopy(projects: EnhancedProject[], chapters: Chapter[]): void {
    try {
      const shadowData: ShadowCopyData = {
        projects,
        chapters,
        timestamp: Date.now(),
        version: RecoveryService.SHADOW_COPY_VERSION,
      };

      localStorage.setItem(RecoveryService.SHADOW_COPY_KEY, JSON.stringify(shadowData));
      devLog.debug('[RecoveryService] Shadow copy saved', {
        projects: projects.length,
        chapters: chapters.length,
      });
    } catch (error) {
      devLog.error('[RecoveryService] Failed to save shadow copy:', error);
    }
  }

  /**
   * Get shadow copy from localStorage
   */
  getShadowCopy(): ShadowCopyData | null {
    try {
      const raw = localStorage.getItem(RecoveryService.SHADOW_COPY_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw) as ShadowCopyData;

      // Validate structure
      if (!data.projects || !data.chapters || !data.timestamp || !data.version) {
        devLog.warn('[RecoveryService] Invalid shadow copy structure');
        return null;
      }

      return data;
    } catch (error) {
      devLog.error('[RecoveryService] Failed to load shadow copy:', error);
      return null;
    }
  }

  /**
   * Clear shadow copy (for testing or cleanup)
   */
  clearShadowCopy(): void {
    try {
      localStorage.removeItem(RecoveryService.SHADOW_COPY_KEY);
      devLog.debug('[RecoveryService] Shadow copy cleared');
    } catch (error) {
      devLog.error('[RecoveryService] Failed to clear shadow copy:', error);
    }
  }

  /**
   * Check if IndexedDB is corrupted or unavailable
   */
  async checkIndexedDBHealth(): Promise<{ healthy: boolean; error?: string }> {
    try {
      // Try to open a test database
      const testDB = indexedDB.open('inkwell_health_check', 1);

      return new Promise((resolve) => {
        testDB.onsuccess = () => {
          testDB.result.close();
          indexedDB.deleteDatabase('inkwell_health_check');
          resolve({ healthy: true });
        };

        testDB.onerror = () => {
          resolve({
            healthy: false,
            error: 'IndexedDB is unavailable or corrupted',
          });
        };

        testDB.onblocked = () => {
          resolve({
            healthy: false,
            error: 'IndexedDB is blocked',
          });
        };
      });
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Restore projects to localStorage (safe mode - no IndexedDB)
   */
  private async restoreProjects(projects: EnhancedProject[]): Promise<void> {
    try {
      // Import dynamically to avoid circular dependency
      const { EnhancedStorageService } = await import('./enhancedStorageService');

      for (const project of projects) {
        EnhancedStorageService.saveProject(project);
      }

      devLog.log(`[RecoveryService] Restored ${projects.length} projects to localStorage`);
    } catch (error) {
      devLog.error('[RecoveryService] Failed to restore projects:', error);
      throw error;
    }
  }

  /**
   * Restore chapters to storage
   */
  private async restoreChapters(chapters: Chapter[]): Promise<void> {
    try {
      // Import dynamically to avoid circular dependency
      const { ChapterGateway } = await import('@/model/chapters');

      for (const chapter of chapters) {
        // Convert persistence Chapter to canonical Chapter format
        const projectId = (chapter as any).project_id || (chapter as any).projectId || '';
        const canonicalChapter: any = {
          id: chapter.id,
          title: chapter.title || 'Untitled Chapter',
          summary: (chapter as any).summary || '',
          content: (chapter as any).body || (chapter as any).content || '',
          wordCount: (chapter as any).wordCount || 0,
          targetWordCount: (chapter as any).targetWordCount,
          status: (chapter as any).status || 'planning',
          order: (chapter as any).index_in_project || (chapter as any).order || 0,
          charactersInChapter: [],
          plotPointsResolved: [],
          notes: '',
          createdAt: new Date(
            (chapter as any).created_at || (chapter as any).createdAt || Date.now(),
          ).getTime(),
          updatedAt: new Date(
            (chapter as any).updated_at || (chapter as any).updatedAt || Date.now(),
          ).getTime(),
        };

        await ChapterGateway.saveChapter(projectId, canonicalChapter);
      }

      devLog.log(`[RecoveryService] Restored ${chapters.length} chapters`);
    } catch (error) {
      devLog.error('[RecoveryService] Failed to restore chapters:', error);
      throw error;
    }
  }

  /**
   * Handle E2EE passphrase re-prompt scenario
   * (Placeholder - actual E2EE implementation would be needed)
   */
  async promptForPassphrase(): Promise<{ success: boolean; passphrase?: string }> {
    // This would integrate with actual E2EE service when available
    // For now, return a placeholder
    devLog.warn('[RecoveryService] E2EE passphrase prompt not yet implemented');
    return {
      success: false,
    };
  }

  /**
   * Re-derive E2EE key from passphrase
   * (Placeholder - actual E2EE implementation would be needed)
   */
  async reDeriveEncryptionKey(passphrase: string): Promise<{ success: boolean; error?: string }> {
    // This would integrate with actual E2EE service when available
    // For now, return a placeholder
    devLog.warn('[RecoveryService] E2EE key derivation not yet implemented');
    return {
      success: false,
      error: 'E2EE not yet implemented',
    };
  }
}

// Export singleton instance
export const recoveryService = new RecoveryService();
export default recoveryService;
