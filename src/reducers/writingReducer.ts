// src/reducers/writingReducer.ts
import { Scene, Chapter, SceneStatus, ChapterStatus } from '@/types/writing';

export interface WritingState {
  currentProject: string | null;
  chapters: Chapter[];
  currentScene: Scene | null;
  isLoading: boolean;
  error: string | null;
}

export type WritingAction =
  | { type: 'SET_CURRENT_SCENE'; payload: Scene }
  | { type: 'UPDATE_SCENE'; payload: { sceneId: string; updates: Partial<Scene> } }
  | {
      type: 'UPDATE_SCENE_CONTENT';
      payload: { sceneId: string; content: string; wordCount: number };
    }
  | { type: 'SET_SCENE_STATUS'; payload: { sceneId: string; status: SceneStatus } }
  | { type: 'SET_CHAPTERS'; payload: Chapter[] }
  | { type: 'ADD_CHAPTER'; payload: Chapter }
  | { type: 'UPDATE_CHAPTER_STATUS'; payload: { chapterId: string; status: ChapterStatus } }
  | { type: 'ADD_SCENE'; payload: { chapterId: string; scene: Scene } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

export const writingReducer = (state: WritingState, action: WritingAction): WritingState => {
  switch (action.type) {
    case 'SET_CURRENT_SCENE':
      return {
        ...state,
        currentScene: action.payload,
      };

    case 'UPDATE_SCENE': {
      const { sceneId, updates } = action.payload;
      return {
        ...state,
        chapters: state.chapters.map((chapter) => ({
          ...chapter,
          scenes: chapter.scenes.map((scene) =>
            scene.id === sceneId ? { ...scene, ...updates, updatedAt: new Date() } : scene,
          ),
        })),
        currentScene:
          state.currentScene?.id === sceneId
            ? { ...state.currentScene, ...updates, updatedAt: new Date() }
            : state.currentScene,
      };
    }

    case 'UPDATE_SCENE_CONTENT':
      return {
        ...state,
        chapters: state.chapters.map((chapter) => ({
          ...chapter,
          scenes: chapter.scenes.map((scene) =>
            scene.id === action.payload.sceneId
              ? {
                  ...scene,
                  content: action.payload.content,
                  wordCount: action.payload.wordCount,
                  updatedAt: new Date(),
                }
              : scene,
          ),
        })),
        currentScene:
          state.currentScene?.id === action.payload.sceneId
            ? {
                ...state.currentScene,
                content: action.payload.content,
                wordCount: action.payload.wordCount,
                updatedAt: new Date(),
              }
            : state.currentScene,
      };

    case 'SET_SCENE_STATUS':
      return {
        ...state,
        chapters: state.chapters.map((chapter) => ({
          ...chapter,
          scenes: chapter.scenes.map((scene) =>
            scene.id === action.payload.sceneId
              ? { ...scene, status: action.payload.status, updatedAt: new Date() }
              : scene,
          ),
        })),
        currentScene:
          state.currentScene?.id === action.payload.sceneId
            ? { ...state.currentScene, status: action.payload.status, updatedAt: new Date() }
            : state.currentScene,
      };

    case 'SET_CHAPTERS':
      return {
        ...state,
        chapters: action.payload,
      };

    case 'ADD_CHAPTER':
      return {
        ...state,
        chapters: [...state.chapters, action.payload],
      };

    case 'UPDATE_CHAPTER_STATUS':
      return {
        ...state,
        chapters: state.chapters.map((chapter) =>
          chapter.id === action.payload.chapterId
            ? { ...chapter, status: action.payload.status, updatedAt: new Date() }
            : chapter,
        ),
      };

    case 'ADD_SCENE':
      return {
        ...state,
        chapters: state.chapters.map((chapter) =>
          chapter.id === action.payload.chapterId
            ? { ...chapter, scenes: [...chapter.scenes, action.payload.scene] }
            : chapter,
        ),
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
};
