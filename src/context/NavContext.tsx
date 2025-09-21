// src/context/NavContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useCallback,
} from 'react';

/** =========================
 *  Public Types (unchanged)
 *  ========================= */
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

/** =========================
 *  Internal: Reducer & Intents
 *  ========================= */
type NavIntent =
  | { type: 'GO_VIEW'; view: NavigationState['currentView'] }
  | { type: 'GO_PROJECT'; projectId: string }
  | { type: 'GO_CHAPTER'; projectId: string; chapterId: string }
  | { type: 'GO_SCENE'; projectId: string; chapterId: string; sceneId: string }
  | { type: 'TOGGLE_FOCUS' }
  | { type: 'BACK' }
  | { type: 'HYDRATE_FROM_URL'; snapshot: Partial<NavigationState> }
  | { type: 'HYDRATE_FROM_STORAGE'; snapshot: Partial<NavigationState> };

interface StateWithHistory {
  nav: NavigationState;
  history: NavigationState[]; // stack of prior states
}

const hasWindow = typeof window !== 'undefined';
const STORAGE_KEY = 'inkwell-navigation-state';
const HISTORY_LIMIT = 50;

/** Default starting state */
const defaultNav: NavigationState = {
  currentView: 'dashboard',
  currentProjectId: null,
  currentChapterId: null,
  currentSceneId: null,
  focusMode: false,
};

const initialState: StateWithHistory = {
  nav: defaultNav,
  history: [],
};

/** Build URL search params from nav */
function buildSearchParams(nav: NavigationState): string {
  const params = new URLSearchParams();
  params.set('view', nav.currentView);
  if (nav.currentProjectId) params.set('project', nav.currentProjectId);
  if (nav.currentChapterId) params.set('chapter', nav.currentChapterId);
  if (nav.currentSceneId) params.set('scene', nav.currentSceneId);
  return params.toString(); // no leading '?'
}

/** Parse URL search params into partial nav */
function parseSearchParams(search: string): Partial<NavigationState> {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const viewParam = params.get('view') as NavigationState['currentView'] | null;
  const snapshot: Partial<NavigationState> = {};
  if (viewParam) snapshot.currentView = viewParam;
  const p = params.get('project');
  const c = params.get('chapter');
  const s = params.get('scene');
  if (p) snapshot.currentProjectId = p;
  if (c) snapshot.currentChapterId = c;
  if (s) snapshot.currentSceneId = s;
  return snapshot;
}

/** History dedup helper (dedupe within recent window) */
function pushHistory(prev: StateWithHistory, nextNav: NavigationState): StateWithHistory {
  const { history } = prev;
  const top = history[history.length - 1];

  const same =
    !!top &&
    top.currentView === nextNav.currentView &&
    top.currentProjectId === nextNav.currentProjectId &&
    top.currentChapterId === nextNav.currentChapterId &&
    top.currentSceneId === nextNav.currentSceneId &&
    top.focusMode === nextNav.focusMode;

  if (same) {
    return { ...prev, nav: nextNav };
  }

  // recent dedup window: last 3 entries
  const recentIndexFromTop = [...history]
    .reverse()
    .findIndex(
      (e) =>
        e.currentView === nextNav.currentView &&
        e.currentProjectId === nextNav.currentProjectId &&
        e.currentChapterId === nextNav.currentChapterId &&
        e.currentSceneId === nextNav.currentSceneId &&
        e.focusMode === nextNav.focusMode,
    );

  if (recentIndexFromTop >= 0) {
    const abs = history.length - 1 - recentIndexFromTop;
    if (abs >= history.length - 3) {
      const trimmed = [...history.slice(0, abs), ...history.slice(abs + 1)];
      const capped = trimmed.slice(-HISTORY_LIMIT);
      return { nav: nextNav, history: [...capped, prev.nav] };
    }
  }

  const capped = history.length >= HISTORY_LIMIT ? history.slice(1) : history;
  return { nav: nextNav, history: [...capped, prev.nav] };
}

/** Main reducer */
function reducer(state: StateWithHistory, intent: NavIntent): StateWithHistory {
  switch (intent.type) {
    case 'GO_VIEW': {
      const next: NavigationState = {
        ...state.nav,
        currentView: intent.view,
        currentChapterId: intent.view === 'writing' ? state.nav.currentChapterId : null,
        currentSceneId: intent.view === 'writing' ? state.nav.currentSceneId : null,
      };
      return pushHistory(state, next);
    }

    case 'GO_PROJECT': {
      const next: NavigationState = {
        ...state.nav,
        currentProjectId: intent.projectId,
        currentChapterId: null,
        currentSceneId: null,
      };
      return pushHistory(state, next);
    }

    case 'GO_CHAPTER': {
      // Basic parameter validation
      if (!intent.projectId || !intent.chapterId) return state;
      const next: NavigationState = {
        ...state.nav,
        currentView: 'writing',
        currentProjectId: intent.projectId,
        currentChapterId: intent.chapterId,
        currentSceneId: null,
      };
      return pushHistory(state, next);
    }

    case 'GO_SCENE': {
      if (!intent.projectId || !intent.chapterId || !intent.sceneId) return state;
      const next: NavigationState = {
        ...state.nav,
        currentView: 'writing',
        currentProjectId: intent.projectId,
        currentChapterId: intent.chapterId,
        currentSceneId: intent.sceneId,
      };
      return pushHistory(state, next);
    }

    case 'TOGGLE_FOCUS': {
      const next: NavigationState = { ...state.nav, focusMode: !state.nav.focusMode };
      return { ...state, nav: next }; // focus toggle doesn't push history
    }

    case 'BACK': {
      const idx = state.history.length - 1;
      if (idx < 0) return state;
      const prevNav = state.history[idx];
      if (!prevNav) return state;
      return { nav: prevNav, history: state.history.slice(0, idx) };
    }

    case 'HYDRATE_FROM_URL': {
      const snapshot = intent.snapshot;
      const next: NavigationState = {
        ...state.nav,
        ...snapshot,
      };
      // Do not push URL hydrate into history; make it authoritative
      return { ...state, nav: next };
    }

    case 'HYDRATE_FROM_STORAGE': {
      const snap = intent.snapshot;
      if (!snap || Object.keys(snap).length === 0) return state;
      const next: NavigationState = { ...state.nav, ...snap };
      return { ...state, nav: next };
    }

    default:
      return state;
  }
}

/** =========================
 *  Context
 *  ========================= */
const NavContext = createContext<NavContextValue | null>(null);

interface NavProviderProps {
  children: React.ReactNode;
  /** Optional starting overrides (kept for compatibility) */
  initialState?: Partial<NavigationState>;
}

/**
 * NavProvider – centralized, reducer-driven navigation with:
 * - Single source of truth
 * - History with recent-dedup
 * - URL <-> state sync (query params to avoid breaking existing deep links)
 * - Session persistence
 */
export function NavProvider({ children, initialState = {} }: NavProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    nav: { ...defaultNav, ...initialState },
    history: [],
  });

  const canGoBack = state.history.length > 0;

  /** Persist to localStorage (session restore) */
  useEffect(() => {
    if (!hasWindow) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.nav));
    } catch (err) {
      console.warn('NavContext: failed to save state', err);
    }
  }, [state.nav]);

  /** Hydrate from localStorage on mount (before URL, URL wins if present) */
  useEffect(() => {
    if (!hasWindow) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<NavigationState>;
        if (parsed && typeof parsed === 'object') {
          dispatch({ type: 'HYDRATE_FROM_STORAGE', snapshot: parsed });
        }
      }
    } catch (err) {
      console.warn('NavContext: failed to load saved state', err);
    }
  }, []);

  /** Hydrate from URL (authoritative over storage) */
  useEffect(() => {
    if (!hasWindow) return;
    const snapshot = parseSearchParams(window.location.search);
    if (Object.keys(snapshot).length > 0) {
      dispatch({ type: 'HYDRATE_FROM_URL', snapshot });
    }
  }, []);

  /** Write URL when nav changes (no reload) */
  useEffect(() => {
    if (!hasWindow) return;
    const nextSearch = buildSearchParams(state.nav);
    const current = window.location.search.startsWith('?')
      ? window.location.search.slice(1)
      : window.location.search;

    if (current !== nextSearch) {
      const newUrl = `${window.location.pathname}?${nextSearch}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [state.nav]);

  /** Browser back/forward -> hydrate from URL */
  useEffect(() => {
    if (!hasWindow) return;
    const onPop = () => {
      const snapshot = parseSearchParams(window.location.search);
      dispatch({ type: 'HYDRATE_FROM_URL', snapshot });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /** Public actions (API kept identical) */
  const navigateToView = useCallback(
    (view: NavigationState['currentView']) => dispatch({ type: 'GO_VIEW', view }),
    [],
  );
  const navigateToProject = useCallback(
    (projectId: string) => dispatch({ type: 'GO_PROJECT', projectId }),
    [],
  );
  const navigateToChapter = useCallback(
    (projectId: string, chapterId: string) =>
      dispatch({ type: 'GO_CHAPTER', projectId, chapterId }),
    [],
  );
  const navigateToScene = useCallback(
    (projectId: string, chapterId: string, sceneId: string) =>
      dispatch({ type: 'GO_SCENE', projectId, chapterId, sceneId }),
    [],
  );
  const toggleFocusMode = useCallback(() => dispatch({ type: 'TOGGLE_FOCUS' }), []);
  const goBack = useCallback(() => dispatch({ type: 'BACK' }), []);

  /** Context value (shape unchanged) */
  const contextValue: NavContextValue = useMemo(
    () => ({
      ...state.nav,
      navigateToView,
      navigateToProject,
      navigateToChapter,
      navigateToScene,
      toggleFocusMode,
      goBack,
      canGoBack,
    }),
    [
      state.nav,
      navigateToView,
      navigateToProject,
      navigateToChapter,
      navigateToScene,
      toggleFocusMode,
      goBack,
      canGoBack,
    ],
  );

  return <NavContext.Provider value={contextValue}>{children}</NavContext.Provider>;
}

/** Hook (name unchanged) */
export function useNavigation(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNavigation must be used within a NavProvider');
  return ctx;
}

/** =========================
 *  Safe Navigation Helpers (public API preserved)
 *  ========================= */
export const NavigationHelpers = {
  /**
   * Navigate to a scene with automatic fallback if the scene/chapter doesn't exist.
   * (Placeholders for validation hooks — wire to your services as you add them.)
   */
  navigateToSceneWithFallback: async (
    navigation: NavContextValue,
    projectId: string,
    chapterId: string,
    sceneId: string,
  ) => {
    try {
      // TODO: validate existence via storageService if desired
      navigation.navigateToScene(projectId, chapterId, sceneId);
    } catch (error) {
      console.warn('Failed to navigate to scene, falling back:', error);
      navigation.navigateToChapter(projectId, chapterId);
    }
  },

  /**
   * Navigate to a chapter with automatic fallback if the chapter doesn't exist.
   */
  navigateToChapterWithFallback: async (
    navigation: NavContextValue,
    projectId: string,
    chapterId: string,
  ) => {
    try {
      // TODO: validate via storageService if desired
      navigation.navigateToChapter(projectId, chapterId);
    } catch (error) {
      console.warn('Failed to navigate to chapter, falling back:', error);
      navigation.navigateToView('writing');
    }
  },

  /**
   * Parse URL parameters and navigate accordingly.
   */
  handleDeepLink: (navigation: NavContextValue, url: string) => {
    try {
      const urlObj = new URL(url, hasWindow ? window.location.origin : 'http://localhost');
      const params = new URLSearchParams(urlObj.search);

      const view = params.get('view') as NavigationState['currentView'];
      const projectId = params.get('project') || undefined;
      const chapterId = params.get('chapter') || undefined;
      const sceneId = params.get('scene') || undefined;

      if (!view) return;

      if (sceneId && chapterId && projectId) {
        NavigationHelpers.navigateToSceneWithFallback(navigation, projectId, chapterId, sceneId);
      } else if (chapterId && projectId) {
        NavigationHelpers.navigateToChapterWithFallback(navigation, projectId, chapterId);
      } else if (projectId) {
        navigation.navigateToProject(projectId);
        navigation.navigateToView(view);
      } else {
        navigation.navigateToView(view);
      }
    } catch (error) {
      console.warn('Failed to handle deep link:', error);
    }
  },
};
