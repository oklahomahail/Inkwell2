/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ChaptersProvider, useChapters, useChapterList } from '../ChaptersContext';
import type { ChapterMeta } from '@/types/writing';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChaptersProvider>{children}</ChaptersProvider>
);

describe('ChaptersContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('LOAD_FOR_PROJECT', () => {
    it('should load chapters for a project', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      const chapters: ChapterMeta[] = [
        {
          id: 'ch1',
          projectId: 'project1',
          title: 'Chapter 1',
          wordCount: 500,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ch2',
          projectId: 'project1',
          title: 'Chapter 2',
          wordCount: 800,
          index: 1,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters },
        });
      });

      expect(result.current.state.byId['ch1']).toEqual(chapters[0]);
      expect(result.current.state.byId['ch2']).toEqual(chapters[1]);
      expect(result.current.state.byProject['project1']).toEqual(['ch1', 'ch2']);
    });

    it('should replace existing chapters for the same project', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      const initialChapters: ChapterMeta[] = [
        {
          id: 'ch1',
          projectId: 'project1',
          title: 'Chapter 1',
          wordCount: 500,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters: initialChapters },
        });
      });

      expect(result.current.state.byProject['project1']).toEqual(['ch1']);

      const updatedChapters: ChapterMeta[] = [
        {
          id: 'ch2',
          projectId: 'project1',
          title: 'Chapter 2',
          wordCount: 800,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters: updatedChapters },
        });
      });

      expect(result.current.state.byProject['project1']).toEqual(['ch2']);
    });

    it('should sort chapters by index', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      const chapters: ChapterMeta[] = [
        {
          id: 'ch3',
          projectId: 'project1',
          title: 'Chapter 3',
          wordCount: 300,
          index: 2,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ch1',
          projectId: 'project1',
          title: 'Chapter 1',
          wordCount: 100,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ch2',
          projectId: 'project1',
          title: 'Chapter 2',
          wordCount: 200,
          index: 1,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters },
        });
      });

      expect(result.current.state.byProject['project1']).toEqual(['ch1', 'ch2', 'ch3']);
    });

    it('should restore last active chapter from localStorage', () => {
      localStorage.setItem('lastChapter-project1', 'ch2');

      const { result } = renderHook(() => useChapters(), { wrapper });

      const chapters: ChapterMeta[] = [
        {
          id: 'ch1',
          projectId: 'project1',
          title: 'Chapter 1',
          wordCount: 100,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ch2',
          projectId: 'project1',
          title: 'Chapter 2',
          wordCount: 200,
          index: 1,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters },
        });
      });

      expect(result.current.state.activeId).toBe('ch2');
    });

    it('should fallback to first chapter if last active not found', () => {
      localStorage.setItem('lastChapter-project1', 'nonexistent');

      const { result } = renderHook(() => useChapters(), { wrapper });

      const chapters: ChapterMeta[] = [
        {
          id: 'ch1',
          projectId: 'project1',
          title: 'Chapter 1',
          wordCount: 100,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters },
        });
      });

      expect(result.current.state.activeId).toBe('ch1');
    });
  });

  describe('ADD_CHAPTER', () => {
    it('should add a new chapter', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      const newChapter: ChapterMeta = {
        id: 'ch-new',
        projectId: 'project1',
        title: 'New Chapter',
        wordCount: 0,
        index: 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.dispatch({
          type: 'ADD_CHAPTER',
          payload: newChapter,
        });
      });

      expect(result.current.state.byId['ch-new']).toEqual(newChapter);
      expect(result.current.state.byProject['project1']).toContain('ch-new');
      expect(result.current.state.activeId).toBe('ch-new');
    });

    it('should normalize indexes when inserting chapter', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      // Load initial chapters
      const initialChapters: ChapterMeta[] = [
        {
          id: 'ch1',
          projectId: 'project1',
          title: 'Chapter 1',
          wordCount: 100,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ch2',
          projectId: 'project1',
          title: 'Chapter 2',
          wordCount: 200,
          index: 1,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters: initialChapters },
        });
      });

      // Insert chapter at index 1
      const newChapter: ChapterMeta = {
        id: 'ch-middle',
        projectId: 'project1',
        title: 'Middle Chapter',
        wordCount: 150,
        index: 1,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.dispatch({
          type: 'ADD_CHAPTER',
          payload: newChapter,
        });
      });

      // Check that indexes are normalized
      expect(result.current.state.byId['ch1'].index).toBe(0);
      expect(result.current.state.byId['ch-middle'].index).toBe(1);
      expect(result.current.state.byId['ch2'].index).toBe(2);
    });

    it('should persist active chapter to localStorage', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      const newChapter: ChapterMeta = {
        id: 'ch-new',
        projectId: 'project1',
        title: 'New Chapter',
        wordCount: 0,
        index: 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.dispatch({
          type: 'ADD_CHAPTER',
          payload: newChapter,
        });
      });

      expect(localStorage.getItem('lastChapter-project1')).toBe('ch-new');
    });
  });

  describe('UPDATE_META', () => {
    it('should update chapter metadata', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      const chapter: ChapterMeta = {
        id: 'ch1',
        projectId: 'project1',
        title: 'Original Title',
        wordCount: 100,
        index: 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.dispatch({
          type: 'ADD_CHAPTER',
          payload: chapter,
        });
      });

      const updatedChapter: ChapterMeta = {
        ...chapter,
        title: 'Updated Title',
        wordCount: 500,
      };

      act(() => {
        result.current.dispatch({
          type: 'UPDATE_META',
          payload: updatedChapter,
        });
      });

      expect(result.current.state.byId['ch1'].title).toBe('Updated Title');
      expect(result.current.state.byId['ch1'].wordCount).toBe(500);
    });
  });

  describe('SET_ACTIVE', () => {
    it('should set active chapter', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      const chapters: ChapterMeta[] = [
        {
          id: 'ch1',
          projectId: 'project1',
          title: 'Chapter 1',
          wordCount: 100,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ch2',
          projectId: 'project1',
          title: 'Chapter 2',
          wordCount: 200,
          index: 1,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters },
        });
      });

      act(() => {
        result.current.dispatch({
          type: 'SET_ACTIVE',
          payload: 'ch2',
        });
      });

      expect(result.current.state.activeId).toBe('ch2');
      expect(localStorage.getItem('lastChapter-project1')).toBe('ch2');
    });

    it('should clear active chapter when set to undefined', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: 'SET_ACTIVE',
          payload: undefined,
        });
      });

      expect(result.current.state.activeId).toBeUndefined();
    });
  });

  describe('REORDER', () => {
    it('should reorder chapters and update indexes', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      const chapters: ChapterMeta[] = [
        {
          id: 'ch1',
          projectId: 'project1',
          title: 'Chapter 1',
          wordCount: 100,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ch2',
          projectId: 'project1',
          title: 'Chapter 2',
          wordCount: 200,
          index: 1,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ch3',
          projectId: 'project1',
          title: 'Chapter 3',
          wordCount: 300,
          index: 2,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters },
        });
      });

      // Reorder: ch3, ch1, ch2
      act(() => {
        result.current.dispatch({
          type: 'REORDER',
          payload: { projectId: 'project1', orderedIds: ['ch3', 'ch1', 'ch2'] },
        });
      });

      expect(result.current.state.byProject['project1']).toEqual(['ch3', 'ch1', 'ch2']);
      expect(result.current.state.byId['ch3'].index).toBe(0);
      expect(result.current.state.byId['ch1'].index).toBe(1);
      expect(result.current.state.byId['ch2'].index).toBe(2);
    });
  });

  describe('REMOVE', () => {
    it('should remove a chapter', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      const chapters: ChapterMeta[] = [
        {
          id: 'ch1',
          projectId: 'project1',
          title: 'Chapter 1',
          wordCount: 100,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ch2',
          projectId: 'project1',
          title: 'Chapter 2',
          wordCount: 200,
          index: 1,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters },
        });
      });

      act(() => {
        result.current.dispatch({
          type: 'REMOVE',
          payload: { id: 'ch1', projectId: 'project1' },
        });
      });

      expect(result.current.state.byId['ch1']).toBeUndefined();
      expect(result.current.state.byProject['project1']).toEqual(['ch2']);
    });

    it('should update active chapter when removing active', () => {
      const { result } = renderHook(() => useChapters(), { wrapper });

      const chapters: ChapterMeta[] = [
        {
          id: 'ch1',
          projectId: 'project1',
          title: 'Chapter 1',
          wordCount: 100,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ch2',
          projectId: 'project1',
          title: 'Chapter 2',
          wordCount: 200,
          index: 1,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      act(() => {
        result.current.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters },
        });
      });

      // Set ch1 as active
      act(() => {
        result.current.dispatch({
          type: 'SET_ACTIVE',
          payload: 'ch1',
        });
      });

      // Remove active chapter
      act(() => {
        result.current.dispatch({
          type: 'REMOVE',
          payload: { id: 'ch1', projectId: 'project1' },
        });
      });

      // Active should switch to next chapter
      expect(result.current.state.activeId).not.toBe('ch1');
    });
  });

  describe('useChapterList', () => {
    it('should return chapters for a project', () => {
      const chapters: ChapterMeta[] = [
        {
          id: 'ch1',
          projectId: 'project1',
          title: 'Chapter 1',
          wordCount: 100,
          index: 0,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ch2',
          projectId: 'project1',
          title: 'Chapter 2',
          wordCount: 200,
          index: 1,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const { result } = renderHook(
        () => {
          const context = useChapters();
          const list = useChapterList('project1');
          return { context, list };
        },
        { wrapper },
      );

      act(() => {
        result.current.context.dispatch({
          type: 'LOAD_FOR_PROJECT',
          payload: { projectId: 'project1', chapters },
        });
      });

      expect(result.current.list).toHaveLength(2);
      expect(result.current.list[0].id).toBe('ch1');
      expect(result.current.list[1].id).toBe('ch2');
    });

    it('should return empty array for unknown project', () => {
      const { result } = renderHook(() => useChapterList('unknown-project'), { wrapper });

      expect(result.current).toEqual([]);
    });
  });
});
