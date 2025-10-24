import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

import type { ChapterMeta } from '@/types/writing';

type State = {
  byId: Record<string, ChapterMeta>;
  byProject: Record<string, string[]>; // ordered ids
  activeId?: string;
};

type Action =
  | { type: 'LOAD_FOR_PROJECT'; payload: { projectId: string; chapters: ChapterMeta[] } }
  | { type: 'ADD_CHAPTER'; payload: ChapterMeta }
  | { type: 'UPDATE_META'; payload: ChapterMeta }
  | { type: 'SET_ACTIVE'; payload: string | undefined }
  | { type: 'REORDER'; payload: { projectId: string; orderedIds: string[] } }
  | { type: 'REMOVE'; payload: { id: string; projectId: string } };

const initialState: State = { byId: {}, byProject: {} };

function chaptersReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_FOR_PROJECT': {
      const { projectId, chapters } = action.payload;
      const newById = { ...state.byId };
      chapters.forEach((c) => (newById[c.id] = c));
      const orderedIds = chapters.sort((a, b) => a.index - b.index).map((c) => c.id);
      return {
        ...state,
        byId: newById,
        byProject: { ...state.byProject, [projectId]: orderedIds },
        activeId: state.activeId || chapters[0]?.id,
      };
    }
    case 'ADD_CHAPTER': {
      const c = action.payload;
      const newById = { ...state.byId, [c.id]: c };
      const projectChapters = [...(state.byProject[c.projectId] ?? [])];
      projectChapters.splice(c.index, 0, c.id);
      // normalize indexes
      projectChapters.forEach((id, i) => {
        if (newById[id]) {
          newById[id] = { ...newById[id], index: i };
        }
      });
      return {
        ...state,
        byId: newById,
        byProject: { ...state.byProject, [c.projectId]: projectChapters },
        activeId: c.id,
      };
    }
    case 'UPDATE_META': {
      return {
        ...state,
        byId: { ...state.byId, [action.payload.id]: action.payload },
      };
    }
    case 'SET_ACTIVE': {
      return { ...state, activeId: action.payload };
    }
    case 'REORDER': {
      const { projectId, orderedIds } = action.payload;
      const newById = { ...state.byId };
      orderedIds.forEach((id, i) => {
        if (newById[id]) {
          newById[id] = { ...newById[id], index: i };
        }
      });
      return {
        ...state,
        byId: newById,
        byProject: { ...state.byProject, [projectId]: orderedIds },
      };
    }
    case 'REMOVE': {
      const { id, projectId } = action.payload;
      const newById = { ...state.byId };
      delete newById[id];
      const projectChapters = (state.byProject[projectId] ?? []).filter((x) => x !== id);
      return {
        ...state,
        byId: newById,
        byProject: { ...state.byProject, [projectId]: projectChapters },
        activeId: state.activeId === id ? projectChapters[0] : state.activeId,
      };
    }
    default:
      return state;
  }
}

type ChaptersContextValue = {
  state: State;
  dispatch: React.Dispatch<Action>;
  // Helper selectors
  getChapters: (projectId: string) => ChapterMeta[];
  getActiveChapter: () => ChapterMeta | undefined;
  getChapterCount: (projectId: string) => number;
};

const ChaptersContext = createContext<ChaptersContextValue | null>(null);

export function ChaptersProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chaptersReducer, initialState);

  const value: ChaptersContextValue = {
    state,
    dispatch,
    getChapters: (projectId: string) =>
      (state.byProject[projectId] ?? [])
        .map((id) => state.byId[id])
        .filter((c): c is ChapterMeta => !!c),
    getActiveChapter: () => (state.activeId ? state.byId[state.activeId] : undefined),
    getChapterCount: (projectId: string) => state.byProject[projectId]?.length ?? 0,
  };

  return <ChaptersContext.Provider value={value}>{children}</ChaptersContext.Provider>;
}

export function useChapters() {
  const context = useContext(ChaptersContext);
  if (!context) {
    throw new Error('useChapters must be used within ChaptersProvider');
  }
  return context;
}

// ============================================================================
// PHASE 1: Dashboard & Analytics Integration Selectors
// ============================================================================

/**
 * Get all chapters for a project as an array
 */
export function useChapterList(projectId: string): ChapterMeta[] {
  const { getChapters } = useChapters();
  return getChapters(projectId);
}

/**
 * Get chapter count for a project
 */
export function useChapterCount(projectId: string): number {
  const { getChapterCount } = useChapters();
  return getChapterCount(projectId);
}

/**
 * Get the most recently edited chapter for a project
 */
export function useLastEditedChapter(projectId: string): ChapterMeta | undefined {
  const chapters = useChapterList(projectId);
  if (chapters.length === 0) return undefined;

  return chapters.slice().sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return dateB - dateA;
  })[0];
}

/**
 * Get comprehensive chapter word count statistics for analytics
 */
export function useChapterWordTotals(projectId: string) {
  const chapters = useChapterList(projectId);

  const total = chapters.reduce((n, c) => n + (c.wordCount || 0), 0);
  const count = chapters.length;
  const avg = count > 0 ? Math.round(total / count) : 0;
  const longest = chapters.reduce((max, c) => (c.wordCount > max.wordCount ? c : max), {
    id: '',
    title: '',
    wordCount: 0,
  } as ChapterMeta);

  return {
    total,
    avg,
    longest: longest.wordCount > 0 ? longest : undefined,
    count,
  };
}

/**
 * Get the currently active chapter
 */
export function useActiveChapter(): ChapterMeta | undefined {
  const { getActiveChapter } = useChapters();
  return getActiveChapter();
}

/**
 * Get active chapter ID
 */
export function useActiveChapterId(): string | undefined {
  const { state } = useChapters();
  return state.activeId;
}

// Action creators for convenience
export const chaptersActions = {
  loadForProject: (projectId: string, chapters: ChapterMeta[]) => ({
    type: 'LOAD_FOR_PROJECT' as const,
    payload: { projectId, chapters },
  }),
  addChapter: (chapter: ChapterMeta) => ({ type: 'ADD_CHAPTER' as const, payload: chapter }),
  updateMeta: (chapter: ChapterMeta) => ({ type: 'UPDATE_META' as const, payload: chapter }),
  setActive: (id: string | undefined) => ({ type: 'SET_ACTIVE' as const, payload: id }),
  reorder: (projectId: string, orderedIds: string[]) => ({
    type: 'REORDER' as const,
    payload: { projectId, orderedIds },
  }),
  remove: (id: string, projectId: string) => ({
    type: 'REMOVE' as const,
    payload: { id, projectId },
  }),
};
