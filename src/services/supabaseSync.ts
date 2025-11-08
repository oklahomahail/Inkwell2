/**
 * Supabase Sync Service
 *
 * Handles manual and automatic syncing of writing data to Supabase.
 * Provides push/pull functionality with conflict resolution.
 *
 * Architecture:
 * - Manual push/pull for MVP
 * - Background sync for future enhancement
 * - Conflict resolution using timestamps
 * - Token-based authentication via Supabase client
 * - E2EE support for encrypted chapters
 */

import { supabase } from '@/lib/supabaseClient';
import type { EncryptResult } from '@/types/crypto';
import type { Chapter, Character } from '@/types/persistence';
import type { EnhancedProject } from '@/types/project';
import devLog from '@/utils/devLog';

import { encryptJSON, decryptJSON } from './cryptoService';
import { e2eeKeyManager } from './e2eeKeyManager';

export interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  errors: string[];
  timestamp: number;
}

export interface SyncConflict {
  type: 'project' | 'chapter' | 'character';
  localId: string;
  localUpdatedAt: number;
  remoteUpdatedAt: number;
  resolution: 'local-wins' | 'remote-wins' | 'manual-required';
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: number | null;
  lastSyncResult: 'success' | 'error' | 'conflict' | null;
  lastSyncError: string | null;
  pendingChanges: number;
  isAuthenticated: boolean;
  isOnline: boolean;
}

class SupabaseSyncService {
  private syncing = false;
  private lastSyncAt: number | null = null;
  private lastSyncResult: 'success' | 'error' | 'conflict' | null = null;
  private lastSyncError: string | null = null;
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();

  /**
   * Check if user is authenticated with Supabase
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session !== null;
    } catch (error) {
      devLog.error('[SupabaseSync] Auth check failed:', error);
      return false;
    }
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatus> {
    return {
      isSyncing: this.syncing,
      lastSyncAt: this.lastSyncAt,
      lastSyncResult: this.lastSyncResult,
      lastSyncError: this.lastSyncError,
      pendingChanges: 0, // TODO: Implement pending changes tracking
      isAuthenticated: await this.isAuthenticated(),
      isOnline: navigator.onLine,
    };
  }

  /**
   * Push local data to cloud (manual upload)
   */
  async pushToCloud(options: {
    projects?: EnhancedProject[];
    chapters?: Chapter[];
    characters?: Character[];
  }): Promise<SyncResult> {
    if (this.syncing) {
      throw new Error('Sync already in progress');
    }

    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }

    const authenticated = await this.isAuthenticated();
    if (!authenticated) {
      throw new Error('Not authenticated - please sign in to sync to cloud');
    }

    this.syncing = true;
    this.notifyListeners();

    const errors: string[] = [];
    let itemsProcessed = 0;

    try {
      devLog.log('[SupabaseSync] Starting push to cloud');

      // Push projects
      if (options.projects && options.projects.length > 0) {
        const projectResult = await this.pushProjects(options.projects);
        itemsProcessed += projectResult.itemsProcessed;
        errors.push(...projectResult.errors);
      }

      // Push chapters
      if (options.chapters && options.chapters.length > 0) {
        const chapterResult = await this.pushChapters(options.chapters);
        itemsProcessed += chapterResult.itemsProcessed;
        errors.push(...chapterResult.errors);
      }

      // Push characters
      if (options.characters && options.characters.length > 0) {
        const characterResult = await this.pushCharacters(options.characters);
        itemsProcessed += characterResult.itemsProcessed;
        errors.push(...characterResult.errors);
      }

      this.lastSyncAt = Date.now();
      this.lastSyncResult = errors.length === 0 ? 'success' : 'error';
      this.lastSyncError = errors.length > 0 ? errors.join('; ') : null;

      devLog.log('[SupabaseSync] Push completed', { itemsProcessed, errors });

      return {
        success: errors.length === 0,
        itemsProcessed,
        errors,
        timestamp: this.lastSyncAt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      devLog.error('[SupabaseSync] Push failed:', errorMessage);

      this.lastSyncResult = 'error';
      this.lastSyncError = errorMessage;

      return {
        success: false,
        itemsProcessed,
        errors: [errorMessage, ...errors],
        timestamp: Date.now(),
      };
    } finally {
      this.syncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Pull data from cloud (manual download)
   */
  async pullFromCloud(): Promise<{
    projects: EnhancedProject[];
    chapters: Chapter[];
    characters: Character[];
    conflicts: SyncConflict[];
  }> {
    if (this.syncing) {
      throw new Error('Sync already in progress');
    }

    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }

    const authenticated = await this.isAuthenticated();
    if (!authenticated) {
      throw new Error('Not authenticated - please sign in to sync from cloud');
    }

    this.syncing = true;
    this.notifyListeners();

    try {
      devLog.log('[SupabaseSync] Starting pull from cloud');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Fetch all data for current user
      const [projectsResult, chaptersResult, charactersResult] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('chapters').select('*').eq('user_id', user.id),
        supabase.from('characters').select('*').eq('user_id', user.id),
      ]);

      // Handle errors
      if (projectsResult.error) throw projectsResult.error;
      if (chaptersResult.error) throw chaptersResult.error;
      if (charactersResult.error) throw charactersResult.error;

      const projects = this.convertToEnhancedProjects(projectsResult.data || []);
      const rawChapters = chaptersResult.data || [];
      const characters = charactersResult.data || [];

      // Decrypt chapters if they are encrypted
      const chapters: Chapter[] = [];
      for (const rawChapter of rawChapters) {
        try {
          const projectId = rawChapter.project_id;
          if (!projectId) {
            devLog.warn(`[SupabaseSync] Chapter ${rawChapter.id} missing project_id`);
            chapters.push(rawChapter as Chapter);
            continue;
          }

          const decryptedChapter = await this.decryptChapterIfNeeded(rawChapter, projectId);
          chapters.push(decryptedChapter);
        } catch (error) {
          devLog.error(`[SupabaseSync] Failed to decrypt chapter ${rawChapter.id}:`, error);
          // Include the encrypted chapter with a warning
          chapters.push({
            ...rawChapter,
            title: '[Decryption Failed]',
            body: '',
          } as Chapter);
        }
      }

      this.lastSyncAt = Date.now();
      this.lastSyncResult = 'success';
      this.lastSyncError = null;

      devLog.log('[SupabaseSync] Pull completed', {
        projects: projects.length,
        chapters: chapters.length,
        characters: characters.length,
      });

      return {
        projects,
        chapters,
        characters,
        conflicts: [], // TODO: Implement conflict detection
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      devLog.error('[SupabaseSync] Pull failed:', errorMessage);

      this.lastSyncResult = 'error';
      this.lastSyncError = errorMessage;

      throw error;
    } finally {
      this.syncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to sync status updates
   */
  onStatusUpdate(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(callback);

    // Immediately call with current status
    void this.getStatus().then(callback);

    return () => {
      this.syncListeners.delete(callback);
    };
  }

  // Private methods

  /**
   * Push projects to Supabase
   */
  private async pushProjects(projects: EnhancedProject[]): Promise<SyncResult> {
    const errors: string[] = [];
    let itemsProcessed = 0;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      for (const project of projects) {
        try {
          // Convert to Supabase format
          const supabaseProject = {
            id: project.id,
            user_id: user.id,
            name: project.name,
            description: project.description,
            metadata: {
              genre: project.genre,
              targetWordCount: project.targetWordCount,
              currentWordCount: project.currentWordCount,
              claudeContext: project.claudeContext,
            },
            created_at: new Date(project.createdAt).toISOString(),
            updated_at: new Date(project.updatedAt).toISOString(),
            client_rev: 1,
          };

          // Upsert (insert or update)
          const { error } = await supabase.from('projects').upsert(supabaseProject, {
            onConflict: 'id',
          });

          if (error) {
            errors.push(`Failed to push project ${project.id}: ${error.message}`);
          } else {
            itemsProcessed++;
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to push project ${project.id}: ${msg}`);
        }
      }

      return {
        success: errors.length === 0,
        itemsProcessed,
        errors,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        itemsProcessed,
        errors: [errorMessage],
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Push chapters to Supabase (with E2EE support)
   */
  private async pushChapters(chapters: Chapter[]): Promise<SyncResult> {
    const errors: string[] = [];
    let itemsProcessed = 0;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      for (const chapter of chapters) {
        try {
          // Extract project_id from chapter
          const projectId = (chapter as any).project_id;
          if (!projectId) {
            errors.push(`Chapter ${chapter.id} missing project_id`);
            continue;
          }

          // Encrypt chapter if E2EE is enabled for the project
          const processedChapter = await this.encryptChapterIfNeeded(chapter, projectId);

          // Convert to Supabase format
          const supabaseChapter = {
            ...processedChapter,
            user_id: user.id,
          };

          const { error } = await supabase.from('chapters').upsert(supabaseChapter, {
            onConflict: 'id',
          });

          if (error) {
            errors.push(`Failed to push chapter ${chapter.id}: ${error.message}`);
          } else {
            itemsProcessed++;
            devLog.log(
              `[SupabaseSync] Pushed chapter ${chapter.id} (encrypted: ${!!processedChapter.encrypted_content})`,
            );
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to push chapter ${chapter.id}: ${msg}`);
        }
      }

      return {
        success: errors.length === 0,
        itemsProcessed,
        errors,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        itemsProcessed,
        errors: [errorMessage],
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Push characters to Supabase
   */
  private async pushCharacters(characters: Character[]): Promise<SyncResult> {
    const errors: string[] = [];
    let itemsProcessed = 0;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      for (const character of characters) {
        try {
          const supabaseCharacter = {
            ...character,
            user_id: user.id,
          };

          const { error } = await supabase.from('characters').upsert(supabaseCharacter, {
            onConflict: 'id',
          });

          if (error) {
            errors.push(`Failed to push character ${character.id}: ${error.message}`);
          } else {
            itemsProcessed++;
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to push character ${character.id}: ${msg}`);
        }
      }

      return {
        success: errors.length === 0,
        itemsProcessed,
        errors,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        itemsProcessed,
        errors: [errorMessage],
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Convert Supabase projects to EnhancedProject format
   */
  private convertToEnhancedProjects(supabaseProjects: any[]): EnhancedProject[] {
    return supabaseProjects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      genre: p.metadata?.genre || '',
      targetWordCount: p.metadata?.targetWordCount || 0,
      currentWordCount: p.metadata?.currentWordCount || 0,
      createdAt: new Date(p.created_at).getTime(),
      updatedAt: new Date(p.updated_at).getTime(),
      claudeContext: p.metadata?.claudeContext || {},
      // Additional fields
      chapters: [],
      characters: [],
      sessions: [],
      recentContent: '',
      plotNotes: [],
      worldBuilding: [],
    }));
  }

  /**
   * Notify listeners of status change
   */
  private notifyListeners(): void {
    void this.getStatus().then((status) => {
      this.syncListeners.forEach((listener) => {
        try {
          listener(status);
        } catch (error) {
          devLog.error('[SupabaseSync] Listener error:', error);
        }
      });
    });
  }

  /**
   * Check if E2EE is enabled and unlocked for a project
   */
  private async isE2EEReady(projectId: string): Promise<boolean> {
    try {
      const enabled = await e2eeKeyManager.isE2EEEnabled(projectId);
      if (!enabled) return false;

      const unlocked = e2eeKeyManager.isUnlocked(projectId);
      if (!unlocked) {
        devLog.warn(`[SupabaseSync] Project ${projectId} has E2EE enabled but is locked`);
        return false;
      }

      return true;
    } catch (error) {
      devLog.error('[SupabaseSync] E2EE readiness check failed:', error);
      return false;
    }
  }

  /**
   * Encrypt chapter content if E2EE is enabled
   */
  private async encryptChapterIfNeeded(
    chapter: Chapter,
    projectId: string,
  ): Promise<Chapter & { encrypted_content?: EncryptResult }> {
    const e2eeReady = await this.isE2EEReady(projectId);

    if (!e2eeReady) {
      // Return unencrypted chapter
      return chapter;
    }

    try {
      const dek = e2eeKeyManager.getDEK(projectId);

      // Encrypt the body/content field
      const contentToEncrypt = {
        body: chapter.body,
        title: chapter.title,
      };

      const encrypted = await encryptJSON(contentToEncrypt, dek);

      // Return chapter with encrypted content
      return {
        ...chapter,
        body: '', // Clear plaintext body
        title: '[Encrypted]', // Placeholder title
        encrypted_content: encrypted,
      };
    } catch (error) {
      devLog.error('[SupabaseSync] Chapter encryption failed:', error);
      throw new Error(
        `Failed to encrypt chapter ${chapter.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Decrypt chapter content if encrypted
   */
  private async decryptChapterIfNeeded(
    chapter: Chapter & { encrypted_content?: EncryptResult },
    projectId: string,
  ): Promise<Chapter> {
    // If no encrypted content, return as-is
    if (!chapter.encrypted_content) {
      return chapter;
    }

    const e2eeReady = await this.isE2EEReady(projectId);

    if (!e2eeReady) {
      devLog.warn(
        `[SupabaseSync] Chapter ${chapter.id} is encrypted but project ${projectId} is not unlocked`,
      );
      // Return chapter with encrypted indicator
      return {
        ...chapter,
        title: '[Locked - Please unlock project]',
        body: '',
      };
    }

    try {
      const dek = e2eeKeyManager.getDEK(projectId);

      // Decrypt content
      const decrypted = await decryptJSON<{ body: string; title: string }>(
        chapter.encrypted_content,
        dek,
      );

      // Return decrypted chapter
      return {
        ...chapter,
        title: decrypted.title,
        body: decrypted.body,
        // Remove encrypted_content from final object
      };
    } catch (error) {
      devLog.error('[SupabaseSync] Chapter decryption failed:', error);
      throw new Error(
        `Failed to decrypt chapter ${chapter.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

// Export singleton instance
export const supabaseSyncService = new SupabaseSyncService();
export default supabaseSyncService;
