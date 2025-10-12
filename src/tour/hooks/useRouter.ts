// File: src/tour/hooks/useRouter.ts
// Simple router hook for tour navigation

import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentPath = useCallback(() => {
    return location.pathname;
  }, [location]);

  return {
    getCurrentPath,
    navigate: useCallback(
      (path: string) => {
        navigate(path);
      },
      [navigate],
    ),
  };
}
