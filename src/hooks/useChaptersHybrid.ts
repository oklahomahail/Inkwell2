// src/hooks/useChaptersHybrid.ts
/**
 * useChaptersHybrid Hook
 *
 * Manages chapters with hybrid sync (IndexedDB + Supabase + Realtime)
 *
 * Features:
 * - Local-first: All edits saved to IndexedDB immediately
 * - Debounced autosave: Content changes synced after 600ms
 * - Background sync: Auto-sync every 3 minutes
 * - Real-time updates: Instant sync across devices via WebSocket
 * - Offline support: Works without network, syncs on reconnect
 */

import { nanoid } from 'nanoid';
import { useEffect, useState, useCallback, useMemo } from 'react';

import { Chapters } from '@/services/chaptersService';
import {
  pullRemoteChanges,
  syncChapters,
  subscribeToChapterChanges,
} from '@/services/chaptersSyncService';
import type {
  ChapterMeta,
  FullChapter,
  CreateChapterInput,
  UpdateChapterInput,
} from '@/types/writing';

/**
 * Debounce utility
 */
const debounce = (fn: Function, delay = 500) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export function useChaptersHybrid(projectId: string) {
  // Core state
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Realtime state
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [liveUpdateReceived, setLiveUpdateReceived] = useState(false);

  /**
   * Manual sync (push + pull)
   */
  const syncNow = useCallback(async () => {
    if (syncing) {
      return;
    }

    setSyncing(true);
    try {
      await syncChapters(projectId);
      const refreshed = await Chapters.list(projectId);
      setChapters(refreshed);
      setLastSynced(new Date());
    } catch (error) {
      console.error('[Hook] Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [syncing, projectId]);

  /**
   * Load chapters on mount
   */
  useEffect(() => {
    (async () => {
      // Load from local IndexedDB first
      const local = await Chapters.list(projectId);
      setChapters(local);

      // Restore last active chapter
      const lastActive = localStorage.getItem(`lastChapter-${projectId}`);
      if (lastActive && local.some((c) => c.id === lastActive)) {
        setActiveId(lastActive);
      } else if (local.length > 0 && local[0]) {
        setActiveId(local[0].id);
      }

      // Pull remote changes (background)
      try {
        await pullRemoteChanges(projectId);
        const refreshed = await Chapters.list(projectId);
        setChapters(refreshed);
      } catch (error) {
        console.error('[Hook] Failed to pull remote changes:', error);
      }
    })();
  }, [projectId]);

  /**
   * Auto-sync every 3 minutes
   */
  useEffect(() => {
    const interval = setInterval(
      () => {
        syncNow();
      },
      3 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [syncNow]);

  /**
   * Sync on network reconnect
   */
  useEffect(() => {
    const handleOnline = () => {
      syncNow();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncNow]);

  /**
   * Subscribe to realtime changes
   */
  useEffect(() => {
    setRealtimeConnected(true);

    const unsubscribe = subscribeToChapterChanges(projectId, async (_chapterId) => {
      // Refresh chapters from IndexedDB (already updated by sync service)
      const refreshed = await Chapters.list(projectId);
      setChapters(refreshed);

      // Show visual indicator
      setLiveUpdateReceived(true);
      setTimeout(() => setLiveUpdateReceived(false), 2000);
    });

    return () => {
      setRealtimeConnected(false);
      unsubscribe();
    };
  }, [projectId]);

  /**
   * Create chapter
   */
  const createChapter = useCallback(
    async (title = 'Untitled Chapter') => {
      const input: CreateChapterInput = {
        id: nanoid(),
        projectId,
        title,
        content: '',
        index: chapters.length,
        status: 'draft',
      };

      await Chapters.create(input);
      const refreshed = await Chapters.list(projectId);
      setChapters(refreshed);
      setActiveId(input.id!);

      // Persist active chapter
      localStorage.setItem(`lastChapter-${projectId}`, input.id!);
    },
    [projectId, chapters.length],
  );

  /**
   * Rename chapter
   */
  const renameChapter = useCallback(async (id: string, title: string) => {
    const update: UpdateChapterInput = { id, title };
    await Chapters.updateMeta(update);

    setChapters((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, title, updatedAt: new Date().toISOString() } : ch)),
    );
  }, []);

  /**
   * Delete chapter
   */
  const deleteChapter = useCallback(
    async (id: string) => {
      await Chapters.remove(id);
      setChapters((prev) => prev.filter((ch) => ch.id !== id));

      if (id === activeId) {
        const remaining = chapters.filter((c) => c.id !== id);
        const newActiveId = remaining.length > 0 && remaining[0] ? remaining[0].id : null;
        setActiveId(newActiveId);

        if (newActiveId) {
          localStorage.setItem(`lastChapter-${projectId}`, newActiveId);
        } else {
          localStorage.removeItem(`lastChapter-${projectId}`);
        }
      }
    },
    [activeId, chapters, projectId],
  );

  /**
   * Reorder chapters
   */
  const reorderChapters = useCallback(async (newOrder: ChapterMeta[]) => {
    const reordered = newOrder.map((ch, i) => ({ ...ch, index: i }));

    // Update local IndexedDB
    for (const ch of reordered) {
      await Chapters.updateMeta({ id: ch.id, index: ch.index } as UpdateChapterInput);
    }

    setChapters(reordered);
  }, []);

  /**
   * Update chapter content (debounced)
   */
  const updateContent = useMemo(
    () =>
      debounce(async (id: string, content: string) => {
        // Get current version
        const chapter = await Chapters.get(id);

        // Update content
        await Chapters.saveDoc({
          id,
          content,
          version: chapter.version + 1,
          scenes: chapter.scenes,
        });

        // Calculate and update word count
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        await Chapters.updateMeta({ id, wordCount } as UpdateChapterInput);

        setChapters((prev) =>
          prev.map((ch) =>
            ch.id === id ? { ...ch, wordCount, updatedAt: new Date().toISOString() } : ch,
          ),
        );
      }, 600),
    [setChapters],
  );

  /**
   * Get active chapter (full content)
   */
  const getActiveChapter = useCallback(async (): Promise<FullChapter | null> => {
    if (!activeId) return null;
    try {
      return await Chapters.get(activeId);
    } catch (error) {
      console.error('[Hook] Failed to get active chapter:', error);
      return null;
    }
  }, [activeId]);

  /**
   * Set active chapter
   */
  const setActive = useCallback(
    (id: string) => {
      setActiveId(id);
      localStorage.setItem(`lastChapter-${projectId}`, id);
    },
    [projectId],
  );

  return {
    // Core state
    chapters,
    activeId,
    getActiveChapter,
    setActive,

    // CRUD operations
    createChapter,
    renameChapter,
    deleteChapter,
    reorderChapters,
    updateContent,

    // Sync state
    syncing,
    lastSynced,
    syncNow,

    // Realtime state
    realtimeConnected,
    liveUpdateReceived,
  };
}
