import type { Dispatch } from 'react';
import { useMemo, useReducer } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Chapter, Scene } from '@/types/writing';

type WritingState = {
  chapters: Chapter[];
  currentProject: string | null; // Added missing property
};

type WritingAction =
  | { type: 'SET_CHAPTERS'; payload: Chapter[] }
  | { type: 'ADD_CHAPTER'; payload: Chapter }
  | { type: 'ADD_SCENE'; payload: { chapterId: string; scene: Scene } };

type WritingAPI = {
  state: WritingState;
  dispatch: Dispatch<WritingAction>; // Added missing dispatch
};

function writingReducer(state: WritingState, action: WritingAction): WritingState {
  switch (action.type) {
    case 'SET_CHAPTERS':
      return { ...state, chapters: action.payload };

    case 'ADD_CHAPTER':
      return { ...state, chapters: [...state.chapters, action.payload] };

    case 'ADD_SCENE':
      return {
        ...state,
        chapters: state.chapters.map((chapter) =>
          chapter.id === action.payload.chapterId
            ? { ...chapter, scenes: [...chapter.scenes, action.payload.scene] }
            : chapter,
        ),
      };

    default:
      return state;
  }
}

export default function useWriting(): WritingAPI {
  const { currentProject } = useAppContext();

  // Initialize state with currentProject ID
  const initialState: WritingState = {
    chapters: (currentProject?.chapters as Chapter[]) ?? [],
    currentProject: currentProject?.id ?? null, // Assuming currentProject has an id property
  };

  const [state, dispatch] = useReducer(writingReducer, initialState);

  // Update state when currentProject changes
  const updatedState = useMemo<WritingState>(
    () => ({
      ...state,
      currentProject: currentProject?.id ?? null,
      chapters: state.chapters, // Keep existing chapters unless explicitly set
    }),
    [currentProject?.id, state],
  );

  return { state: updatedState, dispatch };
}
