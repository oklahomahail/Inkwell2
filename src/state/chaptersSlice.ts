import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { ChapterMeta } from '@/types/writing';

type State = {
  byId: Record<string, ChapterMeta>;
  byProject: Record<string, string[]>; // ordered ids
  activeId?: string;
};

const initialState: State = { byId: {}, byProject: {} };

const chapters = createSlice({
  name: 'chapters',
  initialState,
  reducers: {
    loadForProject(s, a: PayloadAction<{ projectId: string; chapters: ChapterMeta[] }>) {
      const { projectId, chapters } = a.payload;
      chapters.forEach((c) => (s.byId[c.id] = c));
      s.byProject[projectId] = chapters.sort((a, b) => a.index - b.index).map((c) => c.id);
      if (!s.activeId && chapters[0]) s.activeId = chapters[0].id;
    },
    addChapter(s, a: PayloadAction<ChapterMeta>) {
      const c = a.payload;
      s.byId[c.id] = c;
      (s.byProject[c.projectId] ??= []).splice(c.index, 0, c.id);
      // normalize indexes
      s.byProject[c.projectId].forEach((id, i) => (s.byId[id].index = i));
      s.activeId = c.id;
    },
    updateMeta(s, a: PayloadAction<ChapterMeta>) {
      s.byId[a.payload.id] = a.payload;
    },
    setActive(s, a: PayloadAction<string | undefined>) {
      s.activeId = a.payload;
    },
    reorder(s, a: PayloadAction<{ projectId: string; orderedIds: string[] }>) {
      const { projectId, orderedIds } = a.payload;
      s.byProject[projectId] = orderedIds;
      orderedIds.forEach((id, i) => (s.byId[id].index = i));
    },
    remove(s, a: PayloadAction<{ id: string; projectId: string }>) {
      const { id, projectId } = a.payload;
      delete s.byId[id];
      s.byProject[projectId] = (s.byProject[projectId] ?? []).filter((x) => x !== id);
      if (s.activeId === id) s.activeId = s.byProject[projectId][0];
    },
  },
});

export const { loadForProject, addChapter, updateMeta, setActive, reorder, remove } =
  chapters.actions;
export default chapters.reducer;

// selectors
export const selectChapterIds = (s: any, pid: string) => s.chapters.byProject[pid] ?? [];
export const selectChapters = (s: any, pid: string) =>
  (s.chapters.byProject[pid] ?? []).map((id: string) => s.chapters.byId[id]);
export const selectActiveChapter = (s: any) =>
  s.chapters.activeId ? s.chapters.byId[s.chapters.activeId] : undefined;
export const selectChapterCount = (s: any, pid: string) => s.chapters.byProject[pid]?.length ?? 0;
