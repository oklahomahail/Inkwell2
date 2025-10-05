// Chapters store using Zustand
// Centralized chapter and scene management with persistence and auto-save

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { ChaptersStoreState, Chapter, Scene } from '../domain/types';
import { storage } from '../utils/storage';
import { trace, traceStoreAction } from '../utils/trace';

/* ========= Store Interface ========= */
export interface ChaptersStore extends ChaptersStoreState {
  // Chapter Actions
  loadChapters: (projectId: string) => Promise<void>;
  addChapter: (
    projectId: string,
    chapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<void>;
  updateChapter: (projectId: string, chapterId: string, updates: Partial<Chapter>) => Promise<void>;
  deleteChapter: (projectId: string, chapterId: string) => Promise<void>;
  reorderChapters: (projectId: string, chapterIds: string[]) => Promise<void>;
  setCurrentChapter: (chapterId: string | null) => void;

  // Scene Actions
  addScene: (
    projectId: string,
    chapterId: string,
    scene: Omit<Scene, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<void>;
  updateScene: (projectId: string, sceneId: string, updates: Partial<Scene>) => Promise<void>;
  updateSceneContent: (projectId: string, sceneId: string, content: string) => Promise<void>;
  deleteScene: (projectId: string, sceneId: string) => Promise<void>;
  reorderScenes: (projectId: string, chapterId: string, sceneIds: string[]) => Promise<void>;
  setCurrentScene: (sceneId: string | null) => void;

  // Auto-save and Persistence
  saveToStorage: (projectId: string) => Promise<void>;
  markDirty: () => void;
  markSaved: () => void;

  // Utilities
  getChapterById: (chapterId: string) => Chapter | undefined;
  getSceneById: (sceneId: string) => Scene | undefined;
  getChapterForScene: (sceneId: string) => Chapter | undefined;
  getTotalWordCount: () => number;
  clearError: () => void;
}

/* ========= Helper Functions ========= */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateWordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/* ========= Store Implementation ========= */
export const useChaptersStore = create<ChaptersStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      chapters: [],
      currentChapterId: null,
      currentSceneId: null,
      isLoading: false,
      error: null,
      isDirty: false,
      isSaving: false,
      lastSaved: null,
      saveError: null,

      // Chapter Actions
      loadChapters: async (projectId: string) => {
        const traceId = traceStoreAction('ChaptersStore', 'loadChapters', { projectId });

        set({ isLoading: true, error: null });

        try {
          const chapters = (await storage.get<Chapter[]>(`project:${projectId}:chapters`)) || [];

          set({
            chapters,
            isLoading: false,
            isDirty: false,
            lastSaved: new Date(),
          });

          trace.end(traceId, { success: true, chaptersLoaded: chapters.length });
        } catch (error: any) {
          set({
            error: `Failed to load chapters: ${error.message}`,
            isLoading: false,
          });
          trace.end(traceId, { success: false, error: error.message });
        }
      },

      addChapter: async (projectId: string, chapterData) => {
        const traceId = traceStoreAction('ChaptersStore', 'addChapter', { projectId });

        try {
          const newChapter: Chapter = {
            ...chapterData,
            id: generateId(),
            scenes: [],
            totalWordCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set((state) => ({
            chapters: [...state.chapters, newChapter],
            isDirty: true,
          }));

          await get().saveToStorage(projectId);

          trace.end(traceId, { success: true, chapterId: newChapter.id });
        } catch (error: any) {
          set({ error: `Failed to add chapter: ${error.message}` });
          trace.end(traceId, { success: false, error: error.message });
        }
      },

      updateChapter: async (projectId: string, chapterId, updates) => {
        const traceId = traceStoreAction('ChaptersStore', 'updateChapter', {
          projectId,
          chapterId,
        });

        try {
          set((state) => ({
            chapters: state.chapters.map((chapter) =>
              chapter.id === chapterId
                ? { ...chapter, ...updates, updatedAt: new Date() }
                : chapter,
            ),
            isDirty: true,
          }));

          await get().saveToStorage(projectId);

          trace.end(traceId, { success: true });
        } catch (error: any) {
          set({ error: `Failed to update chapter: ${error.message}` });
          trace.end(traceId, { success: false, error: error.message });
        }
      },

      deleteChapter: async (projectId: string, chapterId) => {
        const traceId = traceStoreAction('ChaptersStore', 'deleteChapter', {
          projectId,
          chapterId,
        });

        try {
          set((state) => ({
            chapters: state.chapters.filter((chapter) => chapter.id !== chapterId),
            currentChapterId: state.currentChapterId === chapterId ? null : state.currentChapterId,
            isDirty: true,
          }));

          await get().saveToStorage(projectId);

          trace.end(traceId, { success: true });
        } catch (error: any) {
          set({ error: `Failed to delete chapter: ${error.message}` });
          trace.end(traceId, { success: false, error: error.message });
        }
      },

      reorderChapters: async (projectId: string, chapterIds) => {
        const traceId = traceStoreAction('ChaptersStore', 'reorderChapters', { projectId });

        try {
          const { chapters } = get();
          const reorderedChapters = chapterIds
            .map((id) => chapters.find((chapter) => chapter.id === id))
            .filter(Boolean) as Chapter[];

          // Update order property
          const updatedChapters = reorderedChapters.map((chapter, index) => ({
            ...chapter,
            order: index + 1,
            updatedAt: new Date(),
          }));

          set({ chapters: updatedChapters, isDirty: true });
          await get().saveToStorage(projectId);

          trace.end(traceId, { success: true });
        } catch (error: any) {
          set({ error: `Failed to reorder chapters: ${error.message}` });
          trace.end(traceId, { success: false, error: error.message });
        }
      },

      setCurrentChapter: (chapterId) => {
        set({ currentChapterId: chapterId });
      },

      // Scene Actions
      addScene: async (projectId: string, chapterId, sceneData) => {
        const traceId = traceStoreAction('ChaptersStore', 'addScene', { projectId, chapterId });

        try {
          const newScene: Scene = {
            ...sceneData,
            id: generateId(),
            wordCount: calculateWordCount(sceneData.content || ''),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          set((state) => ({
            chapters: state.chapters.map((chapter) =>
              chapter.id === chapterId
                ? {
                    ...chapter,
                    scenes: [...chapter.scenes, newScene],
                    totalWordCount: chapter.totalWordCount + newScene.wordCount,
                    updatedAt: new Date(),
                  }
                : chapter,
            ),
            isDirty: true,
          }));

          await get().saveToStorage(projectId);

          trace.end(traceId, { success: true, sceneId: newScene.id });
        } catch (error: any) {
          set({ error: `Failed to add scene: ${error.message}` });
          trace.end(traceId, { success: false, error: error.message });
        }
      },

      updateScene: async (projectId: string, sceneId, updates) => {
        const traceId = traceStoreAction('ChaptersStore', 'updateScene', { projectId, sceneId });

        try {
          set((state) => ({
            chapters: state.chapters.map((chapter) => ({
              ...chapter,
              scenes: chapter.scenes.map((scene) =>
                scene.id === sceneId ? { ...scene, ...updates, updatedAt: new Date() } : scene,
              ),
              totalWordCount: chapter.scenes.reduce(
                (total, scene) =>
                  total +
                  (scene.id === sceneId && updates.wordCount !== undefined
                    ? updates.wordCount
                    : scene.wordCount),
                0,
              ),
              updatedAt: new Date(),
            })),
            isDirty: true,
          }));

          await get().saveToStorage(projectId);

          trace.end(traceId, { success: true });
        } catch (error: any) {
          set({ error: `Failed to update scene: ${error.message}` });
          trace.end(traceId, { success: false, error: error.message });
        }
      },

      updateSceneContent: async (projectId: string, sceneId, content) => {
        const wordCount = calculateWordCount(content);
        await get().updateScene(projectId, sceneId, { content, wordCount });
      },

      deleteScene: async (projectId: string, sceneId) => {
        const traceId = traceStoreAction('ChaptersStore', 'deleteScene', { projectId, sceneId });

        try {
          set((state) => ({
            chapters: state.chapters.map((chapter) => ({
              ...chapter,
              scenes: chapter.scenes.filter((scene) => scene.id !== sceneId),
              totalWordCount: chapter.scenes
                .filter((scene) => scene.id !== sceneId)
                .reduce((total, scene) => total + scene.wordCount, 0),
              updatedAt: new Date(),
            })),
            currentSceneId: state.currentSceneId === sceneId ? null : state.currentSceneId,
            isDirty: true,
          }));

          await get().saveToStorage(projectId);

          trace.end(traceId, { success: true });
        } catch (error: any) {
          set({ error: `Failed to delete scene: ${error.message}` });
          trace.end(traceId, { success: false, error: error.message });
        }
      },

      reorderScenes: async (projectId: string, chapterId, sceneIds) => {
        const traceId = traceStoreAction('ChaptersStore', 'reorderScenes', {
          projectId,
          chapterId,
        });

        try {
          set((state) => ({
            chapters: state.chapters.map((chapter) => {
              if (chapter.id !== chapterId) return chapter;

              const reorderedScenes = sceneIds
                .map((id) => chapter.scenes.find((scene) => scene.id === id))
                .filter(Boolean) as Scene[];

              return {
                ...chapter,
                scenes: reorderedScenes.map((scene, index) => ({
                  ...scene,
                  order: index + 1,
                  updatedAt: new Date(),
                })),
                updatedAt: new Date(),
              };
            }),
            isDirty: true,
          }));

          await get().saveToStorage(projectId);

          trace.end(traceId, { success: true });
        } catch (error: any) {
          set({ error: `Failed to reorder scenes: ${error.message}` });
          trace.end(traceId, { success: false, error: error.message });
        }
      },

      setCurrentScene: (sceneId) => {
        set({ currentSceneId: sceneId });
      },

      // Auto-save and Persistence
      saveToStorage: async (projectId: string) => {
        const { chapters, isSaving } = get();

        if (isSaving) return; // Prevent concurrent saves

        set({ isSaving: true, saveError: null });

        try {
          await storage.put(`project:${projectId}:chapters`, chapters);

          set({
            isSaving: false,
            isDirty: false,
            lastSaved: new Date(),
          });
        } catch (error: any) {
          set({
            isSaving: false,
            saveError: `Failed to save: ${error.message}`,
          });
          throw error;
        }
      },

      markDirty: () => {
        set({ isDirty: true });
      },

      markSaved: () => {
        set({ isDirty: false, lastSaved: new Date() });
      },

      // Utilities
      getChapterById: (chapterId) => {
        return get().chapters.find((chapter) => chapter.id === chapterId);
      },

      getSceneById: (sceneId) => {
        const { chapters } = get();
        for (const chapter of chapters) {
          const scene = chapter.scenes.find((scene) => scene.id === sceneId);
          if (scene) return scene;
        }
        return undefined;
      },

      getChapterForScene: (sceneId) => {
        const { chapters } = get();
        return chapters.find((chapter) => chapter.scenes.some((scene) => scene.id === sceneId));
      },

      getTotalWordCount: () => {
        return get().chapters.reduce((total, chapter) => total + chapter.totalWordCount, 0);
      },

      clearError: () => {
        set({ error: null, saveError: null });
      },
    }),
    {
      name: 'chapters-store',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
);
