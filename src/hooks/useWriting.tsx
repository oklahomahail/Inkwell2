import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { writingReducer, WritingState, WritingAction } from '@/reducers/writingReducer';

const initialState: WritingState = {
  currentProject: null, // project ID string (or null)
  chapters: [],
  currentScene: null,
  isLoading: false,
  error: null,
};

type Ctx = {
  state: WritingState;
  dispatch: Dispatch<WritingAction>;
};

const WritingContext = createContext<Ctx | undefined>(undefined);

export const WritingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(writingReducer, initialState);
  return <WritingContext.Provider value={{ state, dispatch }}>{children}</WritingContext.Provider>;
};

export default function useWriting() {
  const ctx = useContext(WritingContext);
  if (!ctx) {
    throw new Error('useWriting must be used within a WritingProvider');
  }
  return ctx;
}
