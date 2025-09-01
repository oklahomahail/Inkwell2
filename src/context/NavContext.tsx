// src/context/NavContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface NavigationState {
  currentView: 'dashboard' | 'writing' | 'timeline' | 'analysis' | 'settings';
  currentProjectId: string | null;
  currentChapterId: string | null;
  currentSceneId: string | null;
  focusMode: boolean;
}

export interface NavigationActions {
  navigateToView: (view: NavigationState['currentView']) => void;
  navigateToProject: (projectId: string) => void;
  navigateToChapter: (projectId: string, chapterId: string) => void;
  navigateToScene: (projectId: string, chapterId: string, sceneId: string) => void;
  toggleFocusMode: () => void;
  goBack: () => void;
  canGoBack: boolean;
}

export type NavContextValue = NavigationState & NavigationActions;

const NavContext = createContext<NavContextValue | null>(null);

interface NavProviderProps {
  children: React.ReactNode;
  initialState?: Partial<NavigationState>;
}

/**
 * NavContext - Centralized navigation state management
 *
 * Replaces global event listeners and provides a single source of truth for navigation.
 * Includes safe fallbacks for stale IDs and deep linking support.
 */
export function NavProvider({ children, initialState = {} }: NavProviderProps) {
  const [state, setState] = useState<NavigationState>({
    currentView: 'dashboard',
    currentProjectId: null,
    currentChapterId: null,
    currentSceneId: null,
    focusMode: false,
    ...initialState,
  });

  const [history, setHistory] = useState<NavigationState[]>([]);

  // Load initial state from URL or localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('inkwell-navigation-state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setState((prev) => ({ ...prev, ...parsed }));
      }

      // Handle URL-based navigation (for deep linking)
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view') as NavigationState['currentView'];
      const projectId = params.get('project');
      const chapterId = params.get('chapter');
      const sceneId = params.get('scene');

      if (view) {
        setState((prev) => ({
          ...prev,
          currentView: view,
          currentProjectId: projectId || prev.currentProjectId,
          currentChapterId: chapterId || prev.currentChapterId,
          currentSceneId: sceneId || prev.currentSceneId,
        }));
      }
    } catch (error) {
      console.warn('NavContext: Error loading navigation state:', error);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('inkwell-navigation-state', JSON.stringify(state));
    } catch (error) {
      console.warn('NavContext: Error saving navigation state:', error);
    }
  }, [state]);

  // Update URL when navigation changes (optional, for deep linking)
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('view', state.currentView);

    if (state.currentProjectId) params.set('project', state.currentProjectId);
    if (state.currentChapterId) params.set('chapter', state.currentChapterId);
    if (state.currentSceneId) params.set('scene', state.currentSceneId);

    const newUrl = `${window.location.pathname}?${params.toString()}`;

    // Update URL without triggering page reload
    if (window.location.search !== params.toString()) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [state]);

  const addToHistory = useCallback((newState: NavigationState) => {
    setHistory((prev) => [...prev.slice(-9), newState]); // Keep last 10 states
  }, []);

  const navigateToView = useCallback(
    (view: NavigationState['currentView']) => {
      addToHistory(state);
      setState((prev) => ({
        ...prev,
        currentView: view,
        // Clear scene/chapter when switching views (except for writing view)
        currentChapterId: view === 'writing' ? prev.currentChapterId : null,
        currentSceneId: view === 'writing' ? prev.currentSceneId : null,
      }));
    },
    [state, addToHistory],
  );

  const navigateToProject = useCallback(
    (projectId: string) => {
      addToHistory(state);
      setState((prev) => ({
        ...prev,
        currentProjectId: projectId,
        currentChapterId: null,
        currentSceneId: null,
      }));
    },
    [state, addToHistory],
  );

  const navigateToChapter = useCallback(
    (projectId: string, chapterId: string) => {
      // Validate that the chapter exists (basic safety check)
      if (!chapterId || !projectId) {
        console.warn('NavContext: Invalid chapter navigation parameters');
        return;
      }

      addToHistory(state);
      setState((prev) => ({
        ...prev,
        currentProjectId: projectId,
        currentChapterId: chapterId,
        currentSceneId: null, // Clear scene when navigating to chapter
        currentView: 'writing', // Auto-switch to writing view
      }));
    },
    [state, addToHistory],
  );

  const navigateToScene = useCallback(
    (projectId: string, chapterId: string, sceneId: string) => {
      // Validate parameters
      if (!sceneId || !chapterId || !projectId) {
        console.warn('NavContext: Invalid scene navigation parameters');
        return;
      }

      addToHistory(state);
      setState((prev) => ({
        ...prev,
        currentProjectId: projectId,
        currentChapterId: chapterId,
        currentSceneId: sceneId,
        currentView: 'writing', // Auto-switch to writing view
      }));
    },
    [state, addToHistory],
  );

  const toggleFocusMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      focusMode: !prev.focusMode,
    }));
  }, []);

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      if (previousState) {
        setHistory((prev) => prev.slice(0, -1));
        setState(previousState);
      }
    }
  }, [history]);

  const canGoBack = history.length > 0;

  const contextValue: NavContextValue = {
    ...state,
    navigateToView,
    navigateToProject,
    navigateToChapter,
    navigateToScene,
    toggleFocusMode,
    goBack,
    canGoBack,
  };

  return <NavContext.Provider value={contextValue}>{children}</NavContext.Provider>;
}

/**
 * Hook to access navigation context
 */
export function useNavigation(): NavContextValue {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavProvider');
  }
  return context;
}

/**
 * Safe navigation helpers with fallback handling for stale IDs
 */
export const NavigationHelpers = {
  /**
   * Navigate to a scene with automatic fallback if the scene/chapter doesn't exist
   */
  navigateToSceneWithFallback: async (
    navigation: NavContextValue,
    projectId: string,
    chapterId: string,
    sceneId: string,
  ) => {
    try {
      // Here you would validate that the scene exists in your storage service
      // For now, we'll just attempt the navigation
      navigation.navigateToScene(projectId, chapterId, sceneId);

      // TODO: Add validation logic here
      // const scene = await storageService.getScene(projectId, chapterId, sceneId);
      // if (!scene) {
      //   console.warn(`Scene ${sceneId} not found, falling back to chapter`);
      //   navigation.navigateToChapter(projectId, chapterId);
      // }
    } catch (error) {
      console.warn('Failed to navigate to scene, falling back:', error);
      navigation.navigateToChapter(projectId, chapterId);
    }
  },

  /**
   * Navigate to a chapter with automatic fallback if the chapter doesn't exist
   */
  navigateToChapterWithFallback: async (
    navigation: NavContextValue,
    projectId: string,
    chapterId: string,
  ) => {
    try {
      navigation.navigateToChapter(projectId, chapterId);

      // TODO: Add validation logic here
      // const chapter = await storageService.getChapter(projectId, chapterId);
      // if (!chapter) {
      //   console.warn(`Chapter ${chapterId} not found, falling back to first chapter`);
      //   const chapters = await storageService.getChapters(projectId);
      //   if (chapters.length > 0) {
      //     navigation.navigateToChapter(projectId, chapters[0].id);
      //   } else {
      //     navigation.navigateToView('writing');
      //   }
      // }
    } catch (error) {
      console.warn('Failed to navigate to chapter, falling back:', error);
      navigation.navigateToView('writing');
    }
  },

  /**
   * Parse URL parameters and navigate accordingly
   */
  handleDeepLink: (navigation: NavContextValue, url: string) => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      const view = params.get('view') as NavigationState['currentView'];
      const projectId = params.get('project');
      const chapterId = params.get('chapter');
      const sceneId = params.get('scene');

      if (view) {
        if (sceneId && chapterId && projectId) {
          NavigationHelpers.navigateToSceneWithFallback(navigation, projectId, chapterId, sceneId);
        } else if (chapterId && projectId) {
          NavigationHelpers.navigateToChapterWithFallback(navigation, projectId, chapterId);
        } else if (projectId) {
          navigation.navigateToProject(projectId);
        } else {
          navigation.navigateToView(view);
        }
      }
    } catch (error) {
      console.warn('Failed to handle deep link:', error);
    }
  },
};
