import React, { useEffect } from 'react';
import useWriting from '@/hooks/useWriting';
import { Chapter, Scene, SceneStatus, ChapterStatus } from '@/types/writing';
import { storageService } from '@/services/storageService';
import { generateId } from '@/utils/idUtils';

export const WritingPanel: React.FC = () => {
  const { state, dispatch } = useWriting();

  // Load chapters from the writing store when a project is selected/available
  useEffect(() => {
    if (!state.currentProject) return;
    const chapters = storageService.loadWritingChapters(state.currentProject);
    if (chapters.length) {
      dispatch({ type: 'SET_CHAPTERS', payload: chapters });
    }
  }, [state.currentProject, dispatch]);

  const persistChapters = (chapters: Chapter[]) => {
    if (!state.currentProject) return;
    storageService.saveWritingChapters(state.currentProject, chapters);
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: generateId('chap'),
      title: 'Untitled Chapter',
      order: state.chapters.length,
      scenes: [],
      totalWordCount: 0,
      status: ChapterStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const chapters = [...state.chapters, newChapter];
    dispatch({ type: 'ADD_CHAPTER', payload: newChapter });
    persistChapters(chapters);
  };

  const addScene = (chapterId: string) => {
    const newScene: Scene = {
      id: generateId('scene'),
      title: 'Untitled Scene',
      content: '',
      status: SceneStatus.DRAFT,
      order: 0,
      wordCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'ADD_SCENE', payload: { chapterId, scene: newScene } });

    // Persist after state update
    const chapters = state.chapters.map((c) =>
      c.id === chapterId ? { ...c, scenes: [...c.scenes, newScene] } : c,
    );
    persistChapters(chapters);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Writing Panel</h1>

      <button onClick={addChapter} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">
        Add Chapter
      </button>

      {state.chapters.map((chapter) => (
        <div key={chapter.id} className="mb-4 p-3 border rounded">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{chapter.title}</h2>
            <button
              onClick={() => addScene(chapter.id)}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Add Scene
            </button>
          </div>

          <ul className="ml-4 mt-2 list-disc">
            {chapter.scenes.map((scene) => (
              <li key={scene.id} className="text-sm">
                {scene.title || 'Untitled Scene'}{' '}
                <span className="text-xs text-slate-500">({scene.status})</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
