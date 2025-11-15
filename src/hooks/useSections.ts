// src/hooks/useSections.ts
/**
 * useSections Hook
 *
 * Manages sections (chapters, prologues, epilogues, etc.) with hybrid sync
 * Extends useChaptersHybrid to support full manuscript structure
 *
 * Features:
 * - Local-first: All edits saved to IndexedDB immediately
 * - Debounced autosave: Content changes synced after 600ms
 * - Background sync: Auto-sync every 3 minutes
 * - Real-time updates: Instant sync across devices via WebSocket
 * - Offline support: Works without network, syncs on reconnect
 * - Section types: Supports chapters, prologues, epilogues, and more
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Chapters } from '@/services/chaptersService';
import {
  pullRemoteChanges,
  syncChapters,
  subscribeToChapterChanges,
} from '@/services/chaptersSyncService';
import { autoMigrate } from '@/services/sectionMigration';
import type { Section, SectionType } from '@/types/section';

/**
 * Extended chapter interface to include section type
 * Maintains backward compatibility with existing chapter system
 */
interface SectionData extends Omit<Section, 'order'> {
  projectId: string;
  index: number; // Using 'index' to match existing chapter system
  status?: 'draft' | 'final' | 'revising'; // Match chapter status types
  version: number;
  scenes?: any[];
}

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

export function useSections(projectId: string) {
  // Validate projectId format before proceeding
  const isValidProjectId = useMemo(() => {
    if (!projectId || typeof projectId !== 'string') {
      console.error('[useSections] Invalid projectId: not a string', projectId);
      return false;
    }

    // Valid formats: UUID, proj_welcome_*, or legacy project-{timestamp}
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
    const isWelcomeProject = projectId.startsWith('proj_welcome_');
    const isLegacyFormat = projectId.startsWith('project-') && /^project-\d+$/.test(projectId);

    if (!isUUID && !isWelcomeProject && !isLegacyFormat) {
      console.error(
        `[useSections] Invalid projectId format: "${projectId}". Expected UUID, proj_welcome_*, or project-{timestamp} pattern.`,
      );
      return false;
    }

    return true;
  }, [projectId]);

  // Core state
  const [sections, setSections] = useState<Section[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Realtime state
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [liveUpdateReceived, setLiveUpdateReceived] = useState(false);

  // Lazy loading state
  const contentCache = useRef<Map<string, { content: string; timestamp: number }>>(new Map());
  const [loadingContent, setLoadingContent] = useState<Set<string>>(new Set());

  // Track if we're making local changes to prevent realtime refresh loops
  const isLocalChange = useRef(false);

  /**
   * Convert chapter data to section format
   * Only processes chapters that belong to the current project
   */
  const chapterToSection = useCallback(
    (chapter: any): Section | null => {
      // Filter out chapters that don't belong to this project
      if (chapter.projectId !== projectId) {
        console.warn(
          `[useSections] Skipping chapter ${chapter.id} - belongs to project ${chapter.projectId}, expected ${projectId}`,
        );
        return null;
      }

      return {
        id: chapter.id,
        title: chapter.title,
        type: (chapter.type as SectionType) || 'chapter', // Default to chapter if no type
        order: chapter.index,
        content: chapter.content || '',
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
        wordCount: chapter.wordCount,
      };
    },
    [projectId],
  );

  /**
   * Deduplicate and sort sections by order
   */
  const deduplicateSections = useCallback((sections: Section[]): Section[] => {
    const seen = new Map<string, Section>();

    for (const section of sections) {
      const existing = seen.get(section.id);
      if (!existing || new Date(section.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
        seen.set(section.id, section);
      }
    }

    return Array.from(seen.values()).sort((a, b) => a.order - b.order);
  }, []);

  /**
   * Convert section to chapter data format for storage
   */
  const sectionToChapter = useCallback(
    (section: Section): SectionData => {
      return {
        id: section.id,
        projectId,
        title: section.title,
        type: section.type,
        index: section.order,
        content: section.content,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
        wordCount: section.wordCount,
        status: 'draft',
        version: 1,
        scenes: [],
      };
    },
    [projectId],
  );

  /**
   * Manual sync (push + pull)
   */
  const syncNow = useCallback(async () => {
    // Skip syncing demo projects
    if (projectId.startsWith('proj_welcome_')) {
      return;
    }

    setSyncing((prevSyncing) => {
      if (prevSyncing) {
        return prevSyncing; // Already syncing
      }
      return true;
    });

    try {
      await syncChapters(projectId);
      const refreshed = await Chapters.list(projectId);
      const mappedSections = refreshed
        .map(chapterToSection)
        .filter((s): s is Section => s !== null);
      setSections(deduplicateSections(mappedSections));
      setLastSynced(new Date());
    } catch (error) {
      console.error('[useSections] Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [projectId, chapterToSection, deduplicateSections]);

  /**
   * Load sections on mount
   */
  useEffect(() => {
    // Prevent infinite loops with invalid projectIds
    if (!isValidProjectId) {
      console.error('[useSections] Skipping load effect due to invalid projectId:', projectId);
      return;
    }

    (async () => {
      // Run automatic migration first
      await autoMigrate(projectId);

      // Load from local IndexedDB first
      const local = await Chapters.list(projectId);
      const sectionsData = local.map(chapterToSection).filter((s): s is Section => s !== null);
      setSections(deduplicateSections(sectionsData));

      // Restore last active section
      const lastActive = localStorage.getItem(`lastSection-${projectId}`);
      if (lastActive && sectionsData.some((s) => s.id === lastActive)) {
        setActiveId(lastActive);
      } else if (sectionsData.length > 0 && sectionsData[0]) {
        // Clean up stale localStorage entry
        if (lastActive) {
          localStorage.removeItem(`lastSection-${projectId}`);
        }
        setActiveId(sectionsData[0].id);
        localStorage.setItem(`lastSection-${projectId}`, sectionsData[0].id);
      }

      // Pull remote changes (background) - skip for demo projects
      if (!projectId.startsWith('proj_welcome_')) {
        try {
          await pullRemoteChanges(projectId);
          const refreshed = await Chapters.list(projectId);
          const mappedSections = refreshed
            .map(chapterToSection)
            .filter((s): s is Section => s !== null);
          setSections(deduplicateSections(mappedSections));
        } catch (error) {
          console.error('[useSections] Failed to pull remote changes:', error);
        }
      }
    })();
  }, [projectId, chapterToSection, isValidProjectId, deduplicateSections]);

  /**
   * Auto-sync every 3 minutes
   */
  useEffect(() => {
    // Prevent infinite loops with invalid projectIds
    if (!isValidProjectId) {
      return;
    }

    const interval = setInterval(
      () => {
        syncNow();
      },
      3 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [syncNow, isValidProjectId]);

  /**
   * Sync on network reconnect
   */
  useEffect(() => {
    // Prevent infinite loops with invalid projectIds
    if (!isValidProjectId) {
      return;
    }

    const handleOnline = () => {
      syncNow();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncNow, isValidProjectId]);

  /**
   * Subscribe to realtime changes
   */
  useEffect(() => {
    // Prevent infinite loops with invalid projectIds
    if (!isValidProjectId) {
      return;
    }

    setRealtimeConnected(true);

    const unsubscribe = subscribeToChapterChanges(projectId, async (_chapterId) => {
      // Skip refresh if this is a local change to prevent loops
      if (isLocalChange.current) {
        // eslint-disable-next-line no-console
        console.debug('[useSections] Skipping realtime refresh - local change');
        isLocalChange.current = false;
        return;
      }

      // Refresh sections from IndexedDB (already updated by sync service)
      const refreshed = await Chapters.list(projectId);
      const mappedSections = refreshed
        .map(chapterToSection)
        .filter((s): s is Section => s !== null);
      setSections(deduplicateSections(mappedSections));

      // Show visual indicator
      setLiveUpdateReceived(true);
      setTimeout(() => setLiveUpdateReceived(false), 2000);
    });

    return () => {
      setRealtimeConnected(false);
      unsubscribe();
    };
  }, [projectId, chapterToSection, isValidProjectId, deduplicateSections]);

  /**
   * Create section
   */
  const createSection = useCallback(
    async (title = 'Untitled Section', type: SectionType = 'chapter') => {
      // Get current sections to determine order
      const currentSections = await Chapters.list(projectId);
      const order = currentSections.length;

      const newSection: Section = {
        id: uuidv4(), // Use UUID for Supabase compatibility
        title,
        type,
        order,
        content: '',
        createdAt: new Date().toISOString(),
      };

      // Mark as local change to prevent realtime loop
      isLocalChange.current = true;

      // Convert to chapter format for storage
      const chapterData = sectionToChapter(newSection);
      await Chapters.create(chapterData);

      const refreshed = await Chapters.list(projectId);
      const mappedSections = refreshed
        .map(chapterToSection)
        .filter((s): s is Section => s !== null);
      setSections(deduplicateSections(mappedSections));
      setActiveId(newSection.id);

      // Persist active section
      localStorage.setItem(`lastSection-${projectId}`, newSection.id);

      return newSection;
    },
    [projectId, sectionToChapter, chapterToSection, deduplicateSections],
  );

  /**
   * Update section (title, type, etc.)
   */
  const updateSection = useCallback(async (id: string, updates: Partial<Section>) => {
    // Mark as local change
    isLocalChange.current = true;

    await Chapters.updateMeta({ id, ...updates } as any);

    setSections((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s,
      ),
    );
  }, []);

  /**
   * Rename section (convenience method)
   */
  const renameSection = useCallback(
    async (id: string, title: string) => {
      await updateSection(id, { title });
    },
    [updateSection],
  );

  /**
   * Change section type
   */
  const changeSectionType = useCallback(
    async (id: string, type: SectionType) => {
      await updateSection(id, { type });
    },
    [updateSection],
  );

  /**
   * Delete section
   */
  const deleteSection = useCallback(
    async (id: string) => {
      // Mark as local change
      isLocalChange.current = true;

      await Chapters.remove(id);

      // Update sections state and capture the new state
      let newActiveId: string | null = null;
      setSections((prev) => {
        const filtered = prev.filter((s) => s.id !== id);

        // Calculate new active ID if we're deleting the active section
        setActiveId((currentActiveId) => {
          if (id === currentActiveId) {
            newActiveId = filtered.length > 0 && filtered[0] ? filtered[0].id : null;
            if (newActiveId) {
              localStorage.setItem(`lastSection-${projectId}`, newActiveId);
            } else {
              localStorage.removeItem(`lastSection-${projectId}`);
            }
            return newActiveId;
          }
          return currentActiveId;
        });

        return filtered;
      });
    },
    [projectId],
  );

  /**
   * Reorder sections
   */
  const reorderSections = useCallback(async (fromIndex: number, toIndex: number) => {
    // Mark as local change
    isLocalChange.current = true;

    setSections((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(fromIndex, 1);
      if (!moved) return prev;

      reordered.splice(toIndex, 0, moved);

      // Update order indices
      const updated = reordered.map((s, i) => ({ ...s, order: i }));

      // Update local IndexedDB (async, but don't await in setState)
      Promise.all(
        updated.map((section) =>
          Chapters.updateMeta({ id: section.id, index: section.order } as any),
        ),
      ).catch((error) => {
        console.error('[useSections] Failed to update section order in IndexedDB:', error);
      });

      return updated;
    });
  }, []);

  /**
   * Apply a new section order (used by AI suggestions)
   */
  const applySectionOrder = useCallback(async (newOrder: Section[]) => {
    const updated = newOrder.map((s, i) => ({ ...s, order: i }));

    // Update local IndexedDB
    await Promise.all(
      updated.map((section) =>
        Chapters.updateMeta({ id: section.id, index: section.order } as any),
      ),
    );

    setSections(updated);
  }, []);

  /**
   * Duplicate section
   */
  const duplicateSection = useCallback(
    async (id: string) => {
      // Fetch the original section directly from IndexedDB
      const original = await Chapters.get(id);
      if (!original) return null;

      return createSection(`${original.title} (Copy)`, original.type as SectionType);
    },
    [createSection],
  );

  /**
   * Update section content (debounced)
   * Now uses Web Worker for content preparation to prevent UI freezes
   */
  const updateContent = useMemo(
    () =>
      debounce(async (id: string, content: string) => {
        try {
          // Get current version
          const chapter = await Chapters.get(id);

          // Prepare document in Web Worker (offloads sanitization, checksum, scene extraction)
          const { autosaveWorker } = await import('@/services/autosaveWorkerService');
          const preparedDoc = await autosaveWorker.prepareDocument(
            id,
            content,
            chapter.version + 1,
            chapter.scenes,
          );

          // Save to IndexedDB (must stay on main thread)
          await Chapters.saveDoc(preparedDoc);

          // Calculate and update word count
          const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
          await Chapters.updateMeta({ id, wordCount } as any);

          // Update cache with new content
          contentCache.current.set(id, { content, timestamp: Date.now() });

          setSections((prev) =>
            prev.map((s) =>
              s.id === id ? { ...s, wordCount, updatedAt: new Date().toISOString() } : s,
            ),
          );
        } catch (error) {
          console.error(`[useSections] Failed to update content for section ${id}:`, error);
          // Clear invalid active ID
          if (error instanceof Error && error.message.includes('not found')) {
            setActiveId(null);
            localStorage.removeItem(`lastSection-${projectId}`);
          }
        }
      }, 600),
    [projectId],
  );

  /**
   * Lazy load section content by ID
   * Uses cache to avoid redundant IndexedDB reads
   */
  const loadSectionContent = useCallback(
    async (id: string): Promise<string> => {
      // Check cache first (5 minute TTL)
      const cached = contentCache.current.get(id);
      const now = Date.now();
      if (cached && now - cached.timestamp < 5 * 60 * 1000) {
        return cached.content;
      }

      // Prevent duplicate loading requests
      if (loadingContent.has(id)) {
        // Wait for the existing request to complete
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            const cachedAfterWait = contentCache.current.get(id);
            if (cachedAfterWait) {
              clearInterval(checkInterval);
              resolve(cachedAfterWait.content);
            }
          }, 50);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve('');
          }, 10000);
        });
      }

      // Mark as loading
      setLoadingContent((prev) => new Set(prev).add(id));

      try {
        const chapter = await Chapters.get(id);
        const content = chapter.content || '';

        // Update cache
        contentCache.current.set(id, { content, timestamp: now });

        return content;
      } catch (error) {
        console.error(`[useSections] Failed to load content for section ${id}:`, error);
        return '';
      } finally {
        // Mark as done loading
        setLoadingContent((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [loadingContent],
  );

  /**
   * Get active section (full content)
   * Uses lazy loading with cache
   */
  const getActiveSection = useCallback(async (): Promise<Section | null> => {
    if (!activeId) return null;

    try {
      // Get metadata from state (already loaded)
      const sectionMeta = sections.find((s) => s.id === activeId);
      if (!sectionMeta) {
        console.error(`[useSections] Active section ${activeId} not found in state`);
        setActiveId(null);
        localStorage.removeItem(`lastSection-${projectId}`);
        return null;
      }

      // Lazy load content
      const content = await loadSectionContent(activeId);

      return {
        ...sectionMeta,
        content,
      };
    } catch (error) {
      console.error('[useSections] Failed to get active section:', error);
      // Clear invalid active ID
      if (error instanceof Error && error.message.includes('not found')) {
        setActiveId(null);
        localStorage.removeItem(`lastSection-${projectId}`);
      }
      return null;
    }
  }, [activeId, sections, projectId, loadSectionContent]);

  /**
   * Set active section
   * Prefetches content when changing active section
   */
  const setActive = useCallback(
    (id: string) => {
      setActiveId(id);
      localStorage.setItem(`lastSection-${projectId}`, id);

      // Prefetch content in the background
      loadSectionContent(id).catch((error) => {
        console.error(`[useSections] Failed to prefetch content for section ${id}:`, error);
      });
    },
    [projectId, loadSectionContent],
  );

  /**
   * Prefetch multiple section contents (for performance)
   * Useful for preloading adjacent sections
   */
  const prefetchSections = useCallback(
    async (ids: string[]) => {
      const prefetchPromises = ids.map((id) =>
        loadSectionContent(id).catch((error) => {
          console.error(`[useSections] Failed to prefetch section ${id}:`, error);
        }),
      );

      await Promise.allSettled(prefetchPromises);
    },
    [loadSectionContent],
  );

  /**
   * Clear content cache (useful for memory management)
   */
  const clearContentCache = useCallback(() => {
    contentCache.current.clear();
  }, []);

  /**
   * Invalidate cache for specific section
   */
  const invalidateSectionCache = useCallback((id: string) => {
    contentCache.current.delete(id);
  }, []);

  /**
   * Get sections by type
   */
  const getSectionsByType = useCallback(
    (type: SectionType) => {
      return sections.filter((s) => s.type === type);
    },
    [sections],
  );

  /**
   * Get chapter count (only actual chapters)
   */
  const getChapterCount = useCallback(() => {
    return sections.filter((s) => s.type === 'chapter').length;
  }, [sections]);

  /**
   * Get total word count (only narrative sections)
   */
  const getTotalWordCount = useCallback(() => {
    const narrativeTypes: SectionType[] = ['chapter', 'prologue', 'epilogue', 'custom'];
    return sections
      .filter((s) => narrativeTypes.includes(s.type))
      .reduce((total, s) => total + (s.wordCount || 0), 0);
  }, [sections]);

  /**
   * Memoized sorted sections (by order field)
   * Consumers should use this instead of sorting manually
   */
  const ordered = useMemo(
    () => [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [sections],
  );

  /**
   * Prefetch adjacent sections when active section changes
   * Improves perceived performance when navigating between sections
   */
  useEffect(() => {
    if (!activeId || !isValidProjectId || ordered.length === 0) return;

    const currentIndex = ordered.findIndex((s) => s.id === activeId);
    if (currentIndex === -1) return;

    // Prefetch next and previous sections
    const adjacentIds: string[] = [];
    const prevSection = ordered[currentIndex - 1];
    if (currentIndex > 0 && prevSection) {
      adjacentIds.push(prevSection.id);
    }
    const nextSection = ordered[currentIndex + 1];
    if (currentIndex < ordered.length - 1 && nextSection) {
      adjacentIds.push(nextSection.id);
    }

    if (adjacentIds.length > 0) {
      prefetchSections(adjacentIds);
    }
  }, [activeId, ordered, isValidProjectId, prefetchSections]);

  return {
    // Core state
    sections,
    ordered, // Memoized sorted list
    activeId,
    getActiveSection,
    setActive,

    // CRUD operations
    createSection,
    updateSection,
    renameSection,
    changeSectionType,
    deleteSection,
    duplicateSection,
    reorderSections,
    applySectionOrder,
    updateContent,

    // Query helpers
    getSectionsByType,
    getChapterCount,
    getTotalWordCount,

    // Sync state
    syncing,
    lastSynced,
    syncNow,

    // Realtime state
    realtimeConnected,
    liveUpdateReceived,

    // Lazy loading
    loadSectionContent,
    prefetchSections,
    clearContentCache,
    invalidateSectionCache,
    isLoadingContent: (id: string) => loadingContent.has(id),
  };
}
