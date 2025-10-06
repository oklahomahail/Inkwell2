// React hook for managing Plot Board and Chapter integration
// Provides auto-sync, scene linking, and progress tracking

import { useEffect, useCallback, useRef } from 'react';

import { useChaptersStore } from '../../../stores/useChaptersStore';
import { trace } from '../../../utils/trace';
import { usePlotBoardStore } from '../store';

interface UsePlotBoardIntegrationOptions {
  boardId: string | null;
  projectId: string;
  autoSync?: boolean;
  syncInterval?: number;
}

interface PlotBoardIntegration {
  // Sync operations
  syncWithChapters: () => Promise<void>;
  syncWithTimeline: () => Promise<void>;
  createCardsFromChapters: (chapterIds: string[]) => Promise<void>;

  // Progress tracking
  getProgressMetrics: () => any | null;

  // Auto-sync status
  isAutoSyncEnabled: boolean;
  lastSyncTime: Date | null;
  syncInProgress: boolean;

  // Actions
  enableAutoSync: () => void;
  disableAutoSync: () => void;
  forcSync: () => Promise<void>;
}

export const usePlotBoardIntegration = (
  options: UsePlotBoardIntegrationOptions,
): PlotBoardIntegration => {
  const { boardId, projectId, autoSync = true, syncInterval = 30000 } = options;

  const {
    boards,
    autoSyncConfig,
    setAutoSyncConfig,
    syncWithChapters,
    createCardsFromChapters,
    autoSyncWithTimeline,
    getProgressMetrics,
  } = usePlotBoardStore();

  const { chapters } = useChaptersStore();

  // Auto-sync state
  const lastSyncTimeRef = useRef<Date | null>(null);
  const syncInProgressRef = useRef<boolean>(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current board and project chapters
  const _currentBoard = boardId ? boards[boardId] : null;
  // Filter chapters for current project (assuming chapters have projectId property)
  const projectChapters = chapters.filter((chapter) => chapter.projectId === projectId);

  // Sync operations
  const handleSyncWithChapters = useCallback(async () => {
    if (!boardId || syncInProgressRef.current) return;

    trace.log('syncWithChapters', 'user_action', 'debug', { boardId, projectId });

    try {
      syncInProgressRef.current = true;

      // Convert chapters array to record for integration utils
      const chaptersRecord = projectChapters.reduce(
        (acc: Record<string, any>, chapter: any) => {
          acc[chapter.id] = chapter;
          return acc;
        },
        {} as Record<string, any>,
      );

      await syncWithChapters(boardId, chaptersRecord);
      lastSyncTimeRef.current = new Date();
    } catch (error) {
      console.error('Failed to sync with chapters:', error);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [boardId, projectId, projectChapters, syncWithChapters]);

  const handleSyncWithTimeline = useCallback(async () => {
    if (!boardId || syncInProgressRef.current) return;

    trace.log('syncWithTimeline', 'user_action', 'debug', { boardId, projectId });

    try {
      syncInProgressRef.current = true;

      // Get timeline events from chapters (if they have timeline data)
      const timelineEvents: any[] = [];
      projectChapters.forEach((chapter) => {
        if (chapter.scenes) {
          chapter.scenes.forEach((scene) => {
            if (scene.storyDate) {
              timelineEvents.push({
                id: `scene_event_${scene.id}`,
                title: scene.title || `Scene in ${chapter.title}`,
                storyDate: scene.storyDate,
                tags: scene.tags || [],
                sceneId: scene.id,
                chapterId: chapter.id,
              });
            }
          });
        }
      });

      const chaptersRecord = projectChapters.reduce(
        (acc: Record<string, any>, chapter: any) => {
          acc[chapter.id] = chapter;
          return acc;
        },
        {} as Record<string, any>,
      );

      await autoSyncWithTimeline(boardId, timelineEvents, chaptersRecord);
      lastSyncTimeRef.current = new Date();
    } catch (error) {
      console.error('Failed to sync with timeline:', error);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [boardId, projectId, projectChapters, autoSyncWithTimeline]);

  const handleCreateCardsFromChapters = useCallback(
    async (chapterIds: string[]) => {
      if (!boardId) return;

      trace.log('createCardsFromChapters', 'user_action', 'debug', { boardId, chapterIds });

      try {
        const chaptersRecord = projectChapters.reduce(
          (acc: Record<string, any>, chapter: any) => {
            acc[chapter.id] = chapter;
            return acc;
          },
          {} as Record<string, any>,
        );

        await createCardsFromChapters(boardId, chapterIds, chaptersRecord);
      } catch (error) {
        console.error('Failed to create cards from chapters:', error);
      }
    },
    [boardId, projectChapters, createCardsFromChapters],
  );

  const handleGetProgressMetrics = useCallback(() => {
    if (!boardId) return null;

    const chaptersRecord = projectChapters.reduce(
      (acc: Record<string, any>, chapter: any) => {
        acc[chapter.id] = chapter;
        return acc;
      },
      {} as Record<string, any>,
    );

    return getProgressMetrics(boardId, chaptersRecord);
  }, [boardId, projectChapters, getProgressMetrics]);

  // Auto-sync management
  const enableAutoSync = useCallback(() => {
    trace.log('enableAutoSync', 'user_action', 'debug');
    setAutoSyncConfig({ enabled: true });
  }, [setAutoSyncConfig]);

  const disableAutoSync = useCallback(() => {
    trace.log('disableAutoSync', 'user_action', 'debug');
    setAutoSyncConfig({ enabled: false });

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, [setAutoSyncConfig]);

  const forceSync = useCallback(async () => {
    trace.log('forceSync', 'user_action', 'debug');

    await Promise.all([handleSyncWithChapters(), handleSyncWithTimeline()]);
  }, [handleSyncWithChapters, handleSyncWithTimeline]);

  // Set up auto-sync interval
  useEffect(() => {
    if (autoSyncConfig.enabled && boardId && autoSync) {
      const interval = syncInterval || autoSyncConfig.syncInterval;

      syncIntervalRef.current = setInterval(() => {
        if (!syncInProgressRef.current) {
          handleSyncWithChapters();

          if (autoSyncConfig.autoLinkTimeline) {
            handleSyncWithTimeline();
          }
        }
      }, interval);

      // Initial sync
      if (!lastSyncTimeRef.current) {
        setTimeout(() => {
          handleSyncWithChapters();
          if (autoSyncConfig.autoLinkTimeline) {
            handleSyncWithTimeline();
          }
        }, 1000); // Delay initial sync by 1 second
      }
    } else {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [
    autoSyncConfig.enabled,
    autoSyncConfig.syncInterval,
    autoSyncConfig.autoLinkTimeline,
    boardId,
    autoSync,
    syncInterval,
    handleSyncWithChapters,
    handleSyncWithTimeline,
  ]);

  // Sync when chapters change (debounced)
  useEffect(() => {
    if (autoSyncConfig.enabled && boardId && projectChapters.length > 0) {
      const timeoutId = setTimeout(() => {
        if (!syncInProgressRef.current) {
          handleSyncWithChapters();
        }
      }, 2000); // 2 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [autoSyncConfig.enabled, boardId, projectChapters, handleSyncWithChapters]);

  return {
    // Sync operations
    syncWithChapters: handleSyncWithChapters,
    syncWithTimeline: handleSyncWithTimeline,
    createCardsFromChapters: handleCreateCardsFromChapters,

    // Progress tracking
    getProgressMetrics: handleGetProgressMetrics,

    // Auto-sync status
    isAutoSyncEnabled: autoSyncConfig.enabled,
    lastSyncTime: lastSyncTimeRef.current,
    syncInProgress: syncInProgressRef.current,

    // Actions
    enableAutoSync,
    disableAutoSync,
    forcSync: forceSync,
  };
};
