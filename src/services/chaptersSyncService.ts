// src/services/chaptersSyncService.ts
/**
 * Chapter Sync Service
 *
 * Handles bidirectional sync between IndexedDB and Supabase:
 * - pushLocalChanges: Upload local chapters to Supabase
 * - pullRemoteChanges: Download remote chapters from Supabase
 * - subscribeToChapterChanges: Real-time updates via WebSocket
 *
 * Architecture: Local-first with cloud backup and real-time sync
 */

import { supabase } from '@/lib/supabaseClient';
import type { ChapterMeta, CreateChapterInput } from '@/types/writing';
import { isValidUUID } from '@/utils/idUtils';

import { Chapters } from './chaptersService';

/**
 * Push local chapters to Supabase (upload)
 *
 * Compares local vs remote timestamps and only pushes if local is newer.
 * Uses upsert to handle both inserts and updates.
 */
export async function pushLocalChanges(projectId: string): Promise<void> {
  // Skip projects with invalid UUIDs (demo projects, legacy local projects, etc.)
  if (!isValidUUID(projectId)) {
    // Intentional debug logging for sync behavior tracking
    // Legacy format project-{timestamp} - skip sync but don't spam logs
    if (projectId.startsWith('project-')) {
      // eslint-disable-next-line no-console
      console.debug(`[Sync] Skipping legacy local project ${projectId} (no cloud sync)`);
    } else if (projectId.startsWith('proj_welcome_')) {
      // eslint-disable-next-line no-console
      console.debug(`[Sync] Skipping welcome project ${projectId} (no cloud sync)`);
    } else {
      console.warn(`[Sync] Skipping project ${projectId} (not a valid UUID)`);
    }
    return;
  }

  const local = await Chapters.list(projectId);
  if (!local.length) {
    return;
  }

  for (const ch of local) {
    try {
      // Get full chapter (meta + content)
      const full = await Chapters.get(ch.id);

      // Check if remote exists
      const { data: remote } = await supabase
        .from('chapters')
        .select('updated_at')
        .eq('id', ch.id)
        .maybeSingle();

      const localTime = new Date(ch.updatedAt).getTime();
      const remoteTime = remote ? new Date(remote.updated_at).getTime() : 0;

      // Only push if local is newer
      if (localTime > remoteTime) {
        const { error } = await supabase.from('chapters').upsert({
          id: ch.id,
          project_id: projectId,
          title: ch.title,
          content: full.content,
          summary: ch.summary,
          word_count: ch.wordCount,
          order_index: ch.index,
          status: ch.status,
          updated_at: ch.updatedAt,
        });

        if (error) {
          console.error('[Sync] Failed to push chapter:', ch.id, error);
        }
      }
    } catch (error) {
      console.error('[Sync] Error pushing chapter:', ch.id, error);
    }
  }
}

/**
 * Pull remote chapters from Supabase (download)
 *
 * Compares remote vs local timestamps and only pulls if remote is newer.
 * Updates local IndexedDB cache.
 */
export async function pullRemoteChanges(projectId: string): Promise<ChapterMeta[]> {
  // Skip projects with invalid UUIDs (demo projects, legacy local projects, etc.)
  if (!isValidUUID(projectId)) {
    // Intentional debug logging for sync behavior tracking
    // Legacy format project-{timestamp} - skip sync but don't spam logs
    if (projectId.startsWith('project-')) {
      // eslint-disable-next-line no-console
      console.debug(`[Sync] Skipping legacy local project ${projectId} (no cloud sync)`);
    } else if (projectId.startsWith('proj_welcome_')) {
      // eslint-disable-next-line no-console
      console.debug(`[Sync] Skipping welcome project ${projectId} (no cloud sync)`);
    } else {
      console.warn(`[Sync] Skipping project ${projectId} (not a valid UUID)`);
    }
    return [];
  }

  const { data: remote, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index');

  if (error) {
    console.error('[Sync] Failed to pull chapters:', error);
    throw error;
  }

  if (!remote?.length) {
    return [];
  }

  const merged: ChapterMeta[] = [];

  for (const r of remote) {
    try {
      const localMeta = await Chapters.getMeta(r.id).catch(() => null);
      const remoteTime = new Date(r.updated_at).getTime();
      const localTime = localMeta ? new Date(localMeta.updatedAt).getTime() : 0;

      // Only pull if remote is newer
      if (remoteTime > localTime) {
        const input: CreateChapterInput = {
          id: r.id,
          projectId: projectId,
          title: r.title,
          content: r.content || '',
          summary: r.summary,
          index: r.order_index,
          status: r.status as 'draft' | 'revising' | 'final',
        };

        await Chapters.create(input);

        merged.push({
          id: r.id,
          projectId: projectId,
          title: r.title,
          index: r.order_index,
          summary: r.summary,
          status: r.status as 'draft' | 'revising' | 'final',
          wordCount: r.word_count || 0,
          tags: [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        });
      }
    } catch (error) {
      console.error('[Sync] Error pulling chapter:', r.id, error);
    }
  }

  return merged;
}

/**
 * Full bidirectional sync
 */
export async function syncChapters(projectId: string): Promise<void> {
  await pushLocalChanges(projectId);
  await pullRemoteChanges(projectId);
}

/**
 * Subscribe to real-time chapter changes from Supabase
 *
 * Listens to INSERT, UPDATE, DELETE events on the chapters table
 * and automatically updates the local IndexedDB cache.
 *
 * @param projectId - Project to monitor
 * @param onChange - Callback when chapter changes (chapterId provided)
 * @returns Unsubscribe function
 *
 * @example
 * useEffect(() => {
 *   const unsubscribe = subscribeToChapterChanges(projectId, (chapterId) => {
 *     console.log('Chapter changed:', chapterId);
 *     refreshChapters();
 *   });
 *   return unsubscribe;
 * }, [projectId]);
 */
export function subscribeToChapterChanges(
  projectId: string,
  onChange: (chapterId?: string) => void,
): () => void {
  // Skip projects with invalid UUIDs (demo projects, legacy local projects, etc.)
  if (!isValidUUID(projectId)) {
    // Intentional debug logging for sync behavior tracking
    // Legacy format project-{timestamp} - skip sync but don't spam logs
    if (projectId.startsWith('project-')) {
      // eslint-disable-next-line no-console
      console.debug(
        `[Sync] Skipping realtime subscription for legacy local project ${projectId} (no cloud sync)`,
      );
    } else if (projectId.startsWith('proj_welcome_')) {
      // eslint-disable-next-line no-console
      console.debug(
        `[Sync] Skipping realtime subscription for welcome project ${projectId} (no cloud sync)`,
      );
    } else {
      console.warn(
        `[Sync] Skipping realtime subscription for project ${projectId} (not a valid UUID)`,
      );
    }
    return () => {}; // Return no-op unsubscribe function
  }

  const channel = supabase
    .channel(`chapters:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'chapters',
        filter: `project_id=eq.${projectId}`,
      },
      async (payload: any) => {
        const {
          eventType,
          new: newRow,
          old: oldRow,
        } = payload as {
          eventType: 'INSERT' | 'UPDATE' | 'DELETE';
          new: any;
          old: any;
        };

        try {
          if (eventType === 'DELETE' && oldRow?.id) {
            // Remote deletion - remove from local IndexedDB
            await Chapters.remove(oldRow.id);
          } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
            // Remote insert/update - upsert to local IndexedDB
            if (newRow) {
              const input: CreateChapterInput = {
                id: newRow.id,
                projectId: projectId,
                title: newRow.title,
                content: newRow.content || '',
                summary: newRow.summary,
                index: newRow.order_index,
                status: newRow.status || 'draft',
              };

              await Chapters.create(input);
            }
          }

          // Notify listener (triggers UI refresh)
          onChange(newRow?.id || oldRow?.id);
        } catch (error) {
          console.error('[Realtime] Failed to process change:', error);
        }
      },
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Check if realtime is connected
 */
export function isRealtimeConnected(): boolean {
  const channels = supabase.getChannels();
  return channels.some((ch: any) => ch.state === 'joined');
}
