/**
 * useProject Hook
 *
 * React hook that wraps the model gateway to provide type-safe,
 * reactive access to project data with loading states.
 *
 * Usage:
 * ```typescript
 * const { chapters, loading, error, refreshChapters, saveChapter } = useProject(projectId);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

import {
  getChapters,
  getChapter,
  saveChapter as saveChapterGateway,
  createChapter as createChapterGateway,
  updateChapterContent,
  deleteChapter as deleteChapterGateway,
  reorderChapters as reorderChaptersGateway,
  getChapterCount,
  getTotalWordCount,
  getCharacters,
  saveCharacter as saveCharacterGateway,
  createCharacter as createCharacterGateway,
  deleteCharacter as deleteCharacterGateway,
  type Chapter,
  type Character,
} from '@/model';

interface UseProjectChaptersResult {
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  refreshChapters: () => Promise<void>;
  getChapterById: (id: string) => Promise<Chapter | null>;
  saveChapter: (chapter: Chapter) => Promise<void>;
  createChapter: (title: string, options?: Partial<Chapter>) => Promise<Chapter>;
  updateContent: (chapterId: string, content: string, wordCount?: number) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  reorderChapters: (chapterIds: string[]) => Promise<void>;
  chapterCount: number;
  totalWordCount: number;
}

interface UseProjectCharactersResult {
  characters: Character[];
  loading: boolean;
  error: string | null;
  refreshCharacters: () => Promise<void>;
  saveCharacter: (character: Character) => Promise<void>;
  createCharacter: (name: string, role?: Character['role'], overrides?: Partial<Character>) => Promise<Character>;
  deleteCharacter: (characterId: string) => Promise<void>;
}

/**
 * Hook for managing project chapters
 */
export function useProjectChapters(projectId: string | null): UseProjectChaptersResult {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterCount, setChapterCount] = useState(0);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshChapters = useCallback(async () => {
    if (!projectId) {
      setChapters([]);
      setChapterCount(0);
      setTotalWordCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [chapterData, count, wordCount] = await Promise.all([
        getChapters(projectId),
        getChapterCount(projectId),
        getTotalWordCount(projectId),
      ]);

      setChapters(chapterData);
      setChapterCount(count);
      setTotalWordCount(wordCount);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load chapters';
      setError(message);
      console.error('Error loading chapters:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load chapters on mount and when projectId changes
  useEffect(() => {
    refreshChapters();
  }, [refreshChapters]);

  const getChapterById = useCallback(
    async (id: string): Promise<Chapter | null> => {
      try {
        return await getChapter(id);
      } catch (err) {
        console.error('Error getting chapter:', err);
        return null;
      }
    },
    []
  );

  const saveChapter = useCallback(
    async (chapter: Chapter) => {
      if (!projectId) throw new Error('No project ID');

      try {
        await saveChapterGateway(projectId, chapter);
        await refreshChapters();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save chapter';
        setError(message);
        throw err;
      }
    },
    [projectId, refreshChapters]
  );

  const createChapter = useCallback(
    async (title: string, options?: Partial<Chapter>): Promise<Chapter> => {
      if (!projectId) throw new Error('No project ID');

      try {
        const chapter = await createChapterGateway(projectId, title, options);
        await refreshChapters();
        return chapter;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create chapter';
        setError(message);
        throw err;
      }
    },
    [projectId, refreshChapters]
  );

  const updateContent = useCallback(
    async (chapterId: string, content: string, wordCount?: number) => {
      if (!projectId) throw new Error('No project ID');

      try {
        await updateChapterContent(projectId, chapterId, content, wordCount);
        await refreshChapters();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update content';
        setError(message);
        throw err;
      }
    },
    [projectId, refreshChapters]
  );

  const deleteChapter = useCallback(
    async (chapterId: string) => {
      if (!projectId) throw new Error('No project ID');

      try {
        await deleteChapterGateway(projectId, chapterId);
        await refreshChapters();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete chapter';
        setError(message);
        throw err;
      }
    },
    [projectId, refreshChapters]
  );

  const reorderChapters = useCallback(
    async (chapterIds: string[]) => {
      if (!projectId) throw new Error('No project ID');

      try {
        await reorderChaptersGateway(projectId, chapterIds);
        await refreshChapters();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reorder chapters';
        setError(message);
        throw err;
      }
    },
    [projectId, refreshChapters]
  );

  return {
    chapters,
    loading,
    error,
    refreshChapters,
    getChapterById,
    saveChapter,
    createChapter,
    updateContent,
    deleteChapter,
    reorderChapters,
    chapterCount,
    totalWordCount,
  };
}

/**
 * Hook for managing project characters
 */
export function useProjectCharacters(projectId: string | null): UseProjectCharactersResult {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCharacters = useCallback(async () => {
    if (!projectId) {
      setCharacters([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const characterData = await getCharacters(projectId);
      setCharacters(characterData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load characters';
      setError(message);
      console.error('Error loading characters:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load characters on mount and when projectId changes
  useEffect(() => {
    refreshCharacters();
  }, [refreshCharacters]);

  const saveCharacter = useCallback(
    async (character: Character) => {
      if (!projectId) throw new Error('No project ID');

      try {
        await saveCharacterGateway(projectId, character);
        await refreshCharacters();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save character';
        setError(message);
        throw err;
      }
    },
    [projectId, refreshCharacters]
  );

  const createCharacter = useCallback(
    async (
      name: string,
      role: Character['role'] = 'supporting',
      overrides?: Partial<Character>
    ): Promise<Character> => {
      if (!projectId) throw new Error('No project ID');

      try {
        const character = await createCharacterGateway(projectId, name, role, overrides);
        await refreshCharacters();
        return character;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create character';
        setError(message);
        throw err;
      }
    },
    [projectId, refreshCharacters]
  );

  const deleteCharacter = useCallback(
    async (characterId: string) => {
      if (!projectId) throw new Error('No project ID');

      try {
        await deleteCharacterGateway(projectId, characterId);
        await refreshCharacters();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete character';
        setError(message);
        throw err;
      }
    },
    [projectId, refreshCharacters]
  );

  return {
    characters,
    loading,
    error,
    refreshCharacters,
    saveCharacter,
    createCharacter,
    deleteCharacter,
  };
}

/**
 * Combined hook for full project data
 */
export function useProject(projectId: string | null) {
  const chaptersData = useProjectChapters(projectId);
  const charactersData = useProjectCharacters(projectId);

  return {
    // Chapters
    chapters: chaptersData.chapters,
    chaptersLoading: chaptersData.loading,
    chaptersError: chaptersData.error,
    refreshChapters: chaptersData.refreshChapters,
    getChapterById: chaptersData.getChapterById,
    saveChapter: chaptersData.saveChapter,
    createChapter: chaptersData.createChapter,
    updateChapterContent: chaptersData.updateContent,
    deleteChapter: chaptersData.deleteChapter,
    reorderChapters: chaptersData.reorderChapters,
    chapterCount: chaptersData.chapterCount,
    totalWordCount: chaptersData.totalWordCount,

    // Characters
    characters: charactersData.characters,
    charactersLoading: charactersData.loading,
    charactersError: charactersData.error,
    refreshCharacters: charactersData.refreshCharacters,
    saveCharacter: charactersData.saveCharacter,
    createCharacter: charactersData.createCharacter,
    deleteCharacter: charactersData.deleteCharacter,

    // Combined loading state
    loading: chaptersData.loading || charactersData.loading,
    error: chaptersData.error || charactersData.error,
  };
}
