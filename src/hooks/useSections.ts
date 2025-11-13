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

import { useEffect, useState, useCallback, useMemo } from 'react';
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

    // Valid formats: UUID or proj_welcome_* pattern
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
    const isWelcomeProject = projectId.startsWith('proj_welcome_');

    if (!isUUID && !isWelcomeProject) {
      console.error(
        `[useSections] Invalid projectId format: "${projectId}". Expected UUID or proj_welcome_* pattern.`,
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

  /**
   * Convert chapter data to section format
   */
  const chapterToSection = useCallback((chapter: any): Section => {
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
    if (syncing) {
      return;
    }

    // Skip syncing demo projects
    if (projectId.startsWith('proj_welcome_')) {
      return;
    }

    setSyncing(true);
    try {
      await syncChapters(projectId);
      const refreshed = await Chapters.list(projectId);
      setSections(refreshed.map(chapterToSection));
      setLastSynced(new Date());
    } catch (error) {
      console.error('[useSections] Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [syncing, projectId, chapterToSection]);

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
      const sectionsData = local.map(chapterToSection);
      setSections(sectionsData);

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
          setSections(refreshed.map(chapterToSection));
        } catch (error) {
          console.error('[useSections] Failed to pull remote changes:', error);
        }
      }
    })();
  }, [projectId, chapterToSection, isValidProjectId]);

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
      // Refresh sections from IndexedDB (already updated by sync service)
      const refreshed = await Chapters.list(projectId);
      setSections(refreshed.map(chapterToSection));

      // Show visual indicator
      setLiveUpdateReceived(true);
      setTimeout(() => setLiveUpdateReceived(false), 2000);
    });

    return () => {
      setRealtimeConnected(false);
      unsubscribe();
    };
  }, [projectId, chapterToSection, isValidProjectId]);

  /**
   * Create section
   */
  const createSection = useCallback(
    async (title = 'Untitled Section', type: SectionType = 'chapter') => {
      const newSection: Section = {
        id: uuidv4(), // Use UUID for Supabase compatibility
        title,
        type,
        order: sections.length,
        content: '',
        createdAt: new Date().toISOString(),
      };

      // Convert to chapter format for storage
      const chapterData = sectionToChapter(newSection);
      await Chapters.create(chapterData);

      const refreshed = await Chapters.list(projectId);
      setSections(refreshed.map(chapterToSection));
      setActiveId(newSection.id);

      // Persist active section
      localStorage.setItem(`lastSection-${projectId}`, newSection.id);

      return newSection;
    },
    [projectId, sections.length, sectionToChapter, chapterToSection],
  );

  /**
   * Update section (title, type, etc.)
   */
  const updateSection = useCallback(async (id: string, updates: Partial<Section>) => {
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
      await Chapters.remove(id);
      setSections((prev) => prev.filter((s) => s.id !== id));

      if (id === activeId) {
        const remaining = sections.filter((s) => s.id !== id);
        const newActiveId = remaining.length > 0 && remaining[0] ? remaining[0].id : null;
        setActiveId(newActiveId);

        if (newActiveId) {
          localStorage.setItem(`lastSection-${projectId}`, newActiveId);
        } else {
          localStorage.removeItem(`lastSection-${projectId}`);
        }
      }
    },
    [activeId, sections, projectId],
  );

  /**
   * Reorder sections
   */
  const reorderSections = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const reordered = [...sections];
      const [moved] = reordered.splice(fromIndex, 1);
      if (!moved) return;

      reordered.splice(toIndex, 0, moved);

      // Update order indices
      const updated = reordered.map((s, i) => ({ ...s, order: i }));

      // Update local IndexedDB
      for (const section of updated) {
        await Chapters.updateMeta({ id: section.id, index: section.order } as any);
      }

      setSections(updated);
    },
    [sections],
  );

  /**
   * Apply a new section order (used by AI suggestions)
   */
  const applySectionOrder = useCallback(async (newOrder: Section[]) => {
    const updated = newOrder.map((s, i) => ({ ...s, order: i }));

    // Update local IndexedDB
    for (const section of updated) {
      await Chapters.updateMeta({ id: section.id, index: section.order } as any);
    }

    setSections(updated);
  }, []);

  /**
   * Duplicate section
   */
  const duplicateSection = useCallback(
    async (id: string) => {
      const original = sections.find((s) => s.id === id);
      if (!original) return null;

      return createSection(`${original.title} (Copy)`, original.type);
    },
    [sections, createSection],
  );

  /**
   * Update section content (debounced)
   */
  const updateContent = useMemo(
    () =>
      debounce(async (id: string, content: string) => {
        try {
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
          await Chapters.updateMeta({ id, wordCount } as any);

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
   * Get active section (full content)
   */
  const getActiveSection = useCallback(async (): Promise<Section | null> => {
    if (!activeId) return null;
    try {
      const chapter = await Chapters.get(activeId);
      return chapterToSection(chapter);
    } catch (error) {
      console.error('[useSections] Failed to get active section:', error);
      // Clear invalid active ID
      if (error instanceof Error && error.message.includes('not found')) {
        setActiveId(null);
        localStorage.removeItem(`lastSection-${projectId}`);
      }
      return null;
    }
  }, [activeId, chapterToSection, projectId]);

  /**
   * Set active section
   */
  const setActive = useCallback(
    (id: string) => {
      setActiveId(id);
      localStorage.setItem(`lastSection-${projectId}`, id);
    },
    [projectId],
  );

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
  };
}
