import type { Dispatch } from 'react';
import { useMemo, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';

type Chapter = any;

type WritingState = {
  currentProject: string | null; // project ID
  chapters: Chapter[];
};

type WritingAPI = {
  state: WritingState;
  dispatch: Dispatch<any>;
};

export default function useWriting(): WritingAPI {
  const { currentProject, dispatch } = useAppContext();

  const state = useMemo<WritingState>(() => {
    const id = currentProject?.id ?? null;
    const chapters = (currentProject?.chapters as Chapter[]) ?? [];
    return { currentProject: id, chapters };
  }, [currentProject?.id, currentProject?.chapters]);

  const passthroughDispatch = useCallback<Dispatch<any>>(
    (action) => dispatch(action as any),
    [dispatch],
  );

  return { state, dispatch: passthroughDispatch };
}
