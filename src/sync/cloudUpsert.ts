/**
 * Cloud Upsert Service
 *
 * Handles batch upsert operations to Supabase for all sync tables.
 * Integrates with sync queue to persist local changes to cloud.
 *
 * Features:
 * - Batch operations (max 50 records per call)
 * - E2EE support for chapters
 * - Type-safe upserts per table
 * - Error handling and retry support
 */

import { supabase } from '@/lib/supabaseClient';
import { encryptJSON } from '@/services/cryptoService';
import { e2eeKeyManager } from '@/services/e2eeKeyManager';
import type { EncryptResult } from '@/types/crypto';
import devLog from '@/utils/devLog';
import { isValidUUID } from '@/utils/idUtils';

import { DEFAULT_BATCH_CONFIG } from './types';

import type { SyncTable, BatchConfig } from './types';

/**
 * Upsert result for a single table operation
 */
export interface UpsertResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  duration: number;
}

/**
 * Cloud Upsert Service
 */
class CloudUpsertService {
  private batchConfig: BatchConfig = DEFAULT_BATCH_CONFIG;

  /**
   * Upsert records to a specific table
   *
   * @param table - Target table
   * @param records - Records to upsert
   * @returns Upsert result with success status
   */
  async upsertRecords(table: SyncTable, records: any[]): Promise<UpsertResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    let recordsProcessed = 0;

    try {
      // Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated - cannot sync to cloud');
      }

      // Process in batches
      const batches = this.createBatches(records, this.batchConfig.maxBatchSize);

      devLog.log(
        `[CloudUpsert] Upserting ${records.length} records to ${table} in ${batches.length} batches`,
      );

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        if (!batch) continue;

        try {
          // Table-specific upsert logic
          const result = await this.upsertBatch(table, batch, user.id);
          recordsProcessed += result.recordsProcessed;
          errors.push(...(result.errors || []));

          // Delay between batches to avoid rate limiting
          if (i < batches.length - 1) {
            await this.delay(this.batchConfig.batchDelay);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Batch ${i + 1} failed: ${errorMessage}`);
          devLog.error(`[CloudUpsert] Batch ${i + 1} failed:`, error);
        }
      }

      const duration = performance.now() - startTime;

      devLog.log(
        `[CloudUpsert] Complete: ${recordsProcessed}/${records.length} records in ${duration.toFixed(0)}ms`,
      );

      return {
        success: errors.length === 0,
        recordsProcessed,
        errors,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      devLog.error('[CloudUpsert] Upsert failed:', error);

      return {
        success: false,
        recordsProcessed,
        errors: [errorMessage, ...errors],
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Upsert a single batch to a table
   */
  private async upsertBatch(
    table: SyncTable,
    records: any[],
    userId: string,
  ): Promise<UpsertResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    try {
      // Table-specific processing
      switch (table) {
        case 'projects':
          return await this.upsertProjects(records, userId);

        case 'chapters':
          return await this.upsertChapters(records, userId);

        case 'sections':
          return await this.upsertSections(records, userId);

        case 'characters':
          return await this.upsertCharacters(records, userId);

        case 'notes':
          return await this.upsertNotes(records, userId);

        case 'project_settings':
          return await this.upsertProjectSettings(records, userId);

        default:
          throw new Error(`Unknown table: ${table}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        recordsProcessed,
        errors: [errorMessage],
        duration: 0,
      };
    }
  }

  /**
   * Upsert projects
   */
  private async upsertProjects(records: any[], userId: string): Promise<UpsertResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    for (const record of records) {
      try {
        // Validate project ID is a UUID
        if (!isValidUUID(record.id)) {
          devLog.warn(
            `[CloudUpsert] Skipping project with invalid UUID: ${record.id}. Projects must use UUIDs for cloud sync.`,
          );
          errors.push(
            `Project ${record.id}: Invalid ID format. Projects must use UUIDs for cloud sync.`,
          );
          continue;
        }

        const payload = {
          id: record.id,
          owner_id: userId,
          title: record.name || record.title,
          summary: record.description,
          genre: record.genre,
          target_word_count: record.targetWordCount,
          current_word_count: record.currentWordCount,
          claude_context: record.claudeContext,
          story_template_id: record.storyTemplateId,
          story_template_version: record.storyTemplateVersion,
          beat_mapping: record.beatMapping,
          is_demo: record.isDemo || false,
          creation_mode: record.creationMode,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('projects').upsert(payload, { onConflict: 'id' });

        if (error) {
          errors.push(`Project ${record.id}: ${error.message}`);
        } else {
          recordsProcessed++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Project ${record.id}: ${msg}`);
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed,
      errors,
      duration: 0,
    };
  }

  /**
   * Upsert chapters (with E2EE support)
   */
  private async upsertChapters(records: any[], userId: string): Promise<UpsertResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    for (const record of records) {
      try {
        const projectId = record.project_id || record.projectId;
        if (!projectId) {
          errors.push(`Chapter ${record.id}: missing project_id`);
          continue;
        }

        // Ensure parent project exists in cloud before syncing chapter
        const projectExists = await this.ensureProjectExists(projectId, userId);
        if (!projectExists) {
          errors.push(`Chapter ${record.id}: parent project ${projectId} does not exist in cloud`);
          continue;
        }

        // Check if E2EE is enabled and unlocked
        const e2eeReady = await this.isE2EEReady(projectId);
        let payload: any;

        if (e2eeReady) {
          // Encrypt chapter content
          payload = await this.encryptChapter(record, projectId, userId);
        } else {
          // Plain text chapter
          payload = {
            id: record.id,
            project_id: projectId,
            title: record.title,
            body: record.content || record.body,
            summary: record.summary,
            status: record.status,
            word_count: record.wordCount,
            target_word_count: record.targetWordCount,
            index_in_project: record.order ?? record.index_in_project ?? 0,
            characters_in_chapter: record.charactersInChapter || [],
            plot_points_resolved: record.plotPointsResolved || [],
            notes: record.notes || '',
            client_rev: (record.client_rev || 0) + 1,
            updated_at: new Date().toISOString(),
          };
        }

        const { error } = await supabase.from('chapters').upsert(payload, { onConflict: 'id' });

        if (error) {
          errors.push(`Chapter ${record.id}: ${error.message}`);
        } else {
          recordsProcessed++;
          devLog.debug(`[CloudUpsert] Chapter ${record.id} upserted (encrypted: ${e2eeReady})`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Chapter ${record.id}: ${msg}`);
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed,
      errors,
      duration: 0,
    };
  }

  /**
   * Upsert sections
   */
  private async upsertSections(records: any[], _userId: string): Promise<UpsertResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    for (const record of records) {
      try {
        const payload = {
          id: record.id,
          chapter_id: record.chapterId || record.chapter_id,
          project_id: record.projectId || record.project_id,
          title: record.title,
          content: record.content,
          order_in_chapter: record.orderInChapter ?? record.order_in_chapter,
          word_count: record.wordCount,
          client_rev: (record.client_rev || 0) + 1,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('sections').upsert(payload, { onConflict: 'id' });

        if (error) {
          errors.push(`Section ${record.id}: ${error.message}`);
        } else {
          recordsProcessed++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Section ${record.id}: ${msg}`);
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed,
      errors,
      duration: 0,
    };
  }

  /**
   * Upsert characters
   */
  private async upsertCharacters(records: any[], _userId: string): Promise<UpsertResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    for (const record of records) {
      try {
        const payload = {
          id: record.id,
          project_id: record.projectId || record.project_id,
          name: record.name,
          bio: record.description || record.bio,
          traits: {
            role: record.role,
            personality: record.personality,
            backstory: record.backstory,
            goals: record.goals,
            conflicts: record.conflicts,
            appearance: record.appearance,
            relationships: record.relationships,
          },
          client_rev: (record.client_rev || 0) + 1,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('characters').upsert(payload, { onConflict: 'id' });

        if (error) {
          errors.push(`Character ${record.id}: ${error.message}`);
        } else {
          recordsProcessed++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Character ${record.id}: ${msg}`);
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed,
      errors,
      duration: 0,
    };
  }

  /**
   * Upsert notes
   */
  private async upsertNotes(records: any[], _userId: string): Promise<UpsertResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    for (const record of records) {
      try {
        const payload = {
          id: record.id,
          project_id: record.projectId || record.project_id,
          kind: record.type || record.kind,
          content: record.content,
          tags: record.tags || [],
          client_rev: (record.client_rev || 0) + 1,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('notes').upsert(payload, { onConflict: 'id' });

        if (error) {
          errors.push(`Note ${record.id}: ${error.message}`);
        } else {
          recordsProcessed++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Note ${record.id}: ${msg}`);
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed,
      errors,
      duration: 0,
    };
  }

  /**
   * Upsert project settings
   */
  private async upsertProjectSettings(records: any[], _userId: string): Promise<UpsertResult> {
    const errors: string[] = [];
    let recordsProcessed = 0;

    for (const record of records) {
      try {
        const payload = {
          project_id: record.projectId || record.project_id,
          font_family: record.fontFamily,
          font_size: record.fontSize,
          line_height: record.lineHeight,
          indent_paragraphs: record.indentParagraphs,
          theme: record.theme,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('project_settings')
          .upsert(payload, { onConflict: 'project_id' });

        if (error) {
          errors.push(`Settings for project ${record.projectId}: ${error.message}`);
        } else {
          recordsProcessed++;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Settings for project ${record.projectId}: ${msg}`);
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed,
      errors,
      duration: 0,
    };
  }

  /**
   * Ensure project exists in Supabase (fetch from local and upsert if needed)
   * Returns true if project exists or was created, false otherwise
   */
  private async ensureProjectExists(projectId: string, userId: string): Promise<boolean> {
    try {
      // Validate project ID is a UUID before querying Supabase
      if (!isValidUUID(projectId)) {
        devLog.error(
          `[CloudUpsert] Invalid project ID format: ${projectId}. Projects must use UUIDs for cloud sync.`,
        );
        return false;
      }

      // Check if project already exists in Supabase
      const { data: existing, error: selectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .maybeSingle();

      // If SELECT fails with 500 error, try INSERT anyway (it will fail with 409 if exists)
      if (selectError) {
        devLog.warn(
          `[CloudUpsert] Failed to check if project ${projectId} exists (${selectError.code}). Will attempt insert.`,
        );
        // Don't return false - continue to INSERT attempt below
      } else if (existing) {
        return true; // Project already exists
      }

      // Project doesn't exist - fetch from local IndexedDB and create in cloud
      devLog.log(`[CloudUpsert] Project ${projectId} not in cloud, fetching from local...`);

      const { ProjectsDB } = await import('@/services/projectsDB');
      const localProject = await ProjectsDB.loadProject(projectId);

      if (!localProject) {
        devLog.error(
          `[CloudUpsert] Project ${projectId} not found in local storage. This may be an orphaned sync operation.`,
        );
        devLog.warn(
          `[CloudUpsert] Tip: Run cleanupOrphanedSyncOperations() from console to remove orphaned operations.`,
        );
        return false;
      }

      // Create project in Supabase
      const { error } = await supabase.from('projects').insert({
        id: localProject.id,
        title: localProject.name, // Map 'name' to 'title' for Supabase
        summary: localProject.description,
        owner_id: userId,
        genre: localProject.genre,
        target_word_count: localProject.targetWordCount,
        current_word_count: localProject.currentWordCount,
        claude_context: localProject.claudeContext,
        story_template_id: localProject.storyTemplateId,
        story_template_version: localProject.storyTemplateVersion,
        beat_mapping: localProject.beatMapping,
        is_demo: localProject.isDemo || false,
        creation_mode: localProject.creationMode,
        created_at: new Date(localProject.createdAt).toISOString(),
        updated_at: new Date(localProject.updatedAt || localProject.createdAt).toISOString(),
      });

      if (error) {
        // 409 Conflict means the project already exists (race condition or SELECT failed)
        // This is actually a success case - the project is in the cloud
        if (error.code === '23505') {
          devLog.log(
            `[CloudUpsert] Project ${projectId} already exists in cloud (detected via insert conflict)`,
          );
          return true;
        }

        devLog.error(`[CloudUpsert] Failed to create project ${projectId} in cloud:`, error);
        return false;
      }

      devLog.log(`[CloudUpsert] Created project ${projectId} in cloud`);
      return true;
    } catch (error) {
      devLog.error(`[CloudUpsert] Error ensuring project exists:`, error);
      return false;
    }
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
        devLog.warn(`[CloudUpsert] Project ${projectId} has E2EE enabled but is locked`);
        return false;
      }

      return true;
    } catch (error) {
      devLog.error('[CloudUpsert] E2EE readiness check failed:', error);
      return false;
    }
  }

  /**
   * Encrypt chapter for E2EE project
   */
  private async encryptChapter(record: any, projectId: string, _userId: string): Promise<any> {
    const dek = e2eeKeyManager.getDEK(projectId);

    const contentToEncrypt = {
      title: record.title,
      body: record.content || record.body,
      summary: record.summary,
      notes: record.notes,
    };

    const encrypted: EncryptResult = await encryptJSON(contentToEncrypt, dek);

    return {
      id: record.id,
      project_id: projectId,
      title: '[Encrypted]',
      body: '',
      // Map encrypted_content object to separate DB columns
      content_ciphertext: encrypted.ciphertext,
      content_nonce: encrypted.nonce,
      crypto_version: 1,
      index_in_project: record.order ?? record.index_in_project ?? 0,
      status: record.status,
      word_count: record.wordCount,
      target_word_count: record.targetWordCount,
      characters_in_chapter: record.charactersInChapter || [],
      plot_points_resolved: record.plotPointsResolved || [],
      client_rev: (record.client_rev || 0) + 1,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Split records into batches
   */
  private createBatches<T>(records: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const cloudUpsert = new CloudUpsertService();
export default cloudUpsert;
