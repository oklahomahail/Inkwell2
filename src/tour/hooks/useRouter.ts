// File: src/tour/hooks/useRouter.ts
// Simple router hook for tour navigation

import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { useGo } from '@/utils/navigate';

export function useRouter() {
  const go = useGo();
  const location = useLocation();

  const getCurrentPath = useCallback(() => {
    return location.pathname;
  }, [location]);

  return {
    getCurrentPath,
    navigate: useCallback(
      (path: string) => {
        go(path);
      },
      [go],
    ),
  };
}
