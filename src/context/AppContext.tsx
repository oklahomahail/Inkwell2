// File: src/context/AppContext.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

import type { Project, Chapter } from '@/types/project';
import devLog from '@/utils/devLog';

import { useClaude } from './ClaudeProvider';

// ===== ENUMS & TYPES =====

export enum View {
  Dashboard = 'dashboard',
  Writing = 'writing',
  Timeline = 'timeline',
  Analysis = 'analysis',
  Planning = 'planning',
  PlotBoards = 'plotboards',
  Plot = 'plot',
  Settings = 'settings',
  Analytics = 'Analytics', // keeping as-is to avoid breaking callers
  Export = 'export', // v0.7.0 - Export Dashboard
  Onboarding = 'onboarding', // v1.3.0 - Onboarding Panel
}

// Re-export Project type for backward compatibility
export type { Project } from '@/types/project';

export type Theme = 'light' | 'dark';

export interface AppState {
  claude: any;
  view: View;
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  theme: Theme;
  autoSave: {
    isSaving: boolean;
    lastSaved: Date | null;
    error: string | null;
  };
  // UI-only state (v1.3.0+)
  activeSectionId: string | null;
  creationMode: 'blank' | 'import' | 'template' | null;
}

// ===== ACTIONS =====
type AppAction =
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_CURRENT_PROJECT'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_AUTO_SAVE_SAVING'; payload: boolean }
  | { type: 'SET_AUTO_SAVE_SUCCESS'; payload: Date }
  | { type: 'SET_AUTO_SAVE_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_SECTION'; payload: string | null }
  | { type: 'SET_CREATION_MODE'; payload: 'blank' | 'import' | 'template' | null };

// ===== INITIAL STATE =====
export const initialState: AppState = {
  view: View.Dashboard,
  projects: [],
  currentProjectId: null,
  isLoading: false,
  error: null,
  theme: 'light',
  autoSave: {
    isSaving: false,
    lastSaved: null,
    error: null,
  },
  claude: undefined,
  // UI-only state
  activeSectionId: null,
  creationMode: null,
};

// ===== REDUCER =====
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload };

    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };

    case 'DELETE_PROJECT': {
      const remaining = state.projects.filter((p) => p.id !== action.payload);
      return {
        ...state,
        projects: remaining,
        currentProjectId: state.currentProjectId === action.payload ? null : state.currentProjectId,
      };
    }

    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProjectId: action.payload };

    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'SET_AUTO_SAVE_SAVING':
      return {
        ...state,
        autoSave: { ...state.autoSave, isSaving: action.payload },
      };

    case 'SET_AUTO_SAVE_SUCCESS':
      return {
        ...state,
        autoSave: { isSaving: false, lastSaved: action.payload, error: null },
      };

    case 'SET_AUTO_SAVE_ERROR':
      return {
        ...state,
        autoSave: { ...state.autoSave, isSaving: false, error: action.payload },
      };

    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSectionId: action.payload };

    case 'SET_CREATION_MODE':
      return { ...state, creationMode: action.payload };

    default:
      return state;
  }
}

// ===== CONTEXT VALUE INTERFACE =====
export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  currentProject: Project | null;
  projects: Project[];
  setView: (_view: View) => void;
  setTheme: (_theme: Theme) => void;
  addProject: (_project: Project) => void;
  updateProject: (_project: Project) => void;
  deleteProject: (_id: string) => void;
  setCurrentProjectId: (_id: string | null) => void;
  // New methods for section system (v1.3.0+)
  createProject: (_options: {
    title: string;
    description?: string;
    creationMode?: 'writing' | 'planning';
    genre?: string;
  }) => Promise<Project>;
  setActiveProject: (_id: string) => void;
  setActiveSection: (_id: string | null) => void;
  setCreationMode: (_mode: 'blank' | 'import' | 'template' | null) => void;
  setAutoSaveSaving: (_saving: boolean) => void;
  setAutoSaveSuccess: (_date: Date) => void;
  setAutoSaveError: (_error: string | null) => void;
  claude: ReturnType<typeof useClaude>['claude'];
  claudeActions: {
    sendMessage: (_message: string) => Promise<string>;
    clearMessages: () => void;
    toggleVisibility: () => void;
    configureApiKey: (_apiKey: string) => void;
    suggestContinuation: (_text: string) => Promise<string>;
    improveText: (_text: string, _goal?: string) => Promise<string>;
    analyzeWritingStyle: (_text: string) => Promise<string>;
    generatePlotIdeas: (_prompt: string) => Promise<string>;
    analyzeCharacter: (_character: string) => Promise<string>;
    brainstormIdeas: (_topic: string) => Promise<string>;
  };

  // Chapter management (v0.6.0+)
  chapters: {
    data: Chapter[];
    loading: boolean;
    error: string | null;
    count: number;
    totalWords: number;
    refresh: () => Promise<void>;
    getById: (id: string) => Promise<Chapter | null>;
    save: (chapter: Chapter) => Promise<void>;
    create: (title: string, options?: Partial<Chapter>) => Promise<Chapter>;
    updateContent: (chapterId: string, content: string, wordCount?: number) => Promise<void>;
    delete: (chapterId: string) => Promise<void>;
    reorder: (chapterIds: string[]) => Promise<void>;
  };
}

// ===== CONTEXT CREATION =====
export const AppContext = createContext<AppContextValue | null>(null);

// ===== INTERNAL HOOKS =====
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export function useCurrentProject() {
  const { state } = useAppContext();
  const project = state.projects.find((p: any) => p.id === state.currentProjectId) || null;
  return { project };
}

// Storage keys
const THEME_KEY = 'inkwell-theme';
const PROJECTS_KEY = 'inkwell_projects';
const PROJECT_ID_KEY = 'inkwell_current_project_id';

// ===== PROVIDER (INNER) =====
function AppProviderInner({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const claudeContext = useClaude();
  const hasHydrated = React.useRef(false);

  // Load state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROJECTS_KEY);
      if (stored) {
        const projects = JSON.parse(stored) as Project[];
        dispatch({ type: 'SET_PROJECTS', payload: projects });
      }
    } catch (error) {
      devLog.warn('Failed to parse projects from localStorage:', error);
    }

    // Load current project ID
    try {
      const storedProjectId = localStorage.getItem(PROJECT_ID_KEY);
      if (storedProjectId) {
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: storedProjectId });
      }
    } catch (error) {
      devLog.warn('Failed to load current project ID from localStorage:', error);
    }

    // Load theme
    try {
      const storedTheme = localStorage.getItem(THEME_KEY);
      if (storedTheme === 'light' || storedTheme === 'dark') {
        dispatch({ type: 'SET_THEME', payload: storedTheme });
      }
    } catch (error) {
      devLog.warn('Failed to load theme from localStorage:', error);
    }

    hasHydrated.current = true;

    // Initialize welcome project for first-time users
    (async () => {
      try {
        // Import welcome project utilities dynamically
        const { reconcileWelcomeProjectPointer, ensureWelcomeProject } = await import(
          '@/onboarding/welcomeProject'
        );

        // Reconcile any stale pointers first
        await reconcileWelcomeProjectPointer();

        // Create welcome project if eligible
        const welcomeProjectId = await ensureWelcomeProject();

        if (welcomeProjectId) {
          // Load from enhanced storage (where welcome project is saved)
          const { EnhancedStorageService } = await import('@/services/storageService');
          const enhancedProjects = EnhancedStorageService.loadAllProjects();

          // Convert EnhancedProject[] to Project[] for AppContext
          const updatedProjects: Project[] = enhancedProjects.map((ep) => ({
            id: ep.id,
            name: ep.name,
            description: ep.description || '',
            createdAt: ep.createdAt,
            updatedAt: ep.updatedAt,
            genre: ep.genre,
            currentWordCount: ep.currentWordCount,
            targetWordCount: ep.targetWordCount,
          }));

          dispatch({ type: 'SET_PROJECTS', payload: updatedProjects });

          // Optionally set as current project if no other project is selected
          const storedProjectId = localStorage.getItem(PROJECT_ID_KEY);
          if (!storedProjectId) {
            dispatch({ type: 'SET_CURRENT_PROJECT', payload: welcomeProjectId });
          }
        }
      } catch (error) {
        devLog.error('[AppContext] Error initializing welcome project:', error);
        // Don't throw - app should continue even if welcome project fails
      }
    })();
  }, []);

  // Persist projects (only after hydration)
  useEffect(() => {
    if (!hasHydrated.current) return;
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(state.projects));
    } catch (error) {
      devLog.warn('Failed to save projects to localStorage:', error);
    }
  }, [state.projects]);

  // Persist current project ID
  useEffect(() => {
    if (!hasHydrated.current) return;
    try {
      if (state.currentProjectId) {
        localStorage.setItem(PROJECT_ID_KEY, state.currentProjectId);
      } else {
        localStorage.removeItem(PROJECT_ID_KEY);
      }
    } catch (error) {
      devLog.warn('Failed to save current project ID to localStorage:', error);
    }
  }, [state.currentProjectId]);

  // Persist theme (exactly as the test expects)
  useEffect(() => {
    if (!hasHydrated.current) return;
    try {
      localStorage.setItem(THEME_KEY, state.theme);
    } catch (error) {
      devLog.warn('Failed to save theme to localStorage:', error);
    }
  }, [state.theme]);

  const currentProject = useMemo(
    () => state.projects.find((p) => p.id === state.currentProjectId) || null,
    [state.projects, state.currentProjectId],
  );

  const contextValue: AppContextValue = {
    state,
    dispatch,
    currentProject,
    projects: state.projects,

    // Actions
    setView: (_view) => dispatch({ type: 'SET_VIEW', payload: _view }),
    setTheme: (_theme) => dispatch({ type: 'SET_THEME', payload: _theme }),
    addProject: (_project) => dispatch({ type: 'ADD_PROJECT', payload: _project }),
    updateProject: (_project) => dispatch({ type: 'UPDATE_PROJECT', payload: _project }),
    deleteProject: (_id) => dispatch({ type: 'DELETE_PROJECT', payload: _id }),
    setCurrentProjectId: (_id) => dispatch({ type: 'SET_CURRENT_PROJECT', payload: _id }),

    // New methods for section system (v1.3.0+)
    createProject: async (_options) => {
      const now = Date.now();
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: _options.title || 'Untitled Project',
        description: _options.description || '',
        createdAt: now,
        updatedAt: now,
        genre: _options.genre,
        creationMode: _options.creationMode || 'writing',
        currentWordCount: 0,
      };

      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      return newProject;
    },

    setActiveProject: (_id) => {
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: _id });
    },

    setActiveSection: (_id) => {
      dispatch({ type: 'SET_ACTIVE_SECTION', payload: _id });
    },

    setCreationMode: (_mode) => {
      dispatch({ type: 'SET_CREATION_MODE', payload: _mode });
    },

    setAutoSaveSaving: (_saving) => dispatch({ type: 'SET_AUTO_SAVE_SAVING', payload: _saving }),
    setAutoSaveSuccess: (_date) => dispatch({ type: 'SET_AUTO_SAVE_SUCCESS', payload: _date }),
    setAutoSaveError: (_error) => dispatch({ type: 'SET_AUTO_SAVE_ERROR', payload: _error }),

    // Claude
    claude: claudeContext.claude,
    claudeActions: {
      sendMessage: async (_message: string) => {
        if (claudeContext.sendMessage) return claudeContext.sendMessage(_message);
        return Promise.resolve('[claude] sendMessage not configured');
      },
      clearMessages: () => {
        if (claudeContext.clearMessages) claudeContext.clearMessages();
      },
      toggleVisibility: () => {
        if (claudeContext.toggleVisibility) claudeContext.toggleVisibility();
      },
      configureApiKey: (_apiKey: string) => {
        if (claudeContext.configureApiKey) claudeContext.configureApiKey(_apiKey);
      },
      suggestContinuation: async (_text: string) => {
        if (claudeContext.suggestContinuation) return claudeContext.suggestContinuation(_text);
        const fallback = `Suggest a continuation for: ${_text}`;
        return claudeContext.sendMessage
          ? claudeContext.sendMessage(fallback)
          : Promise.resolve('');
      },
      improveText: async (_text: string, _goal?: string) => {
        if (claudeContext.improveText) {
          // Normalize to a single-arg payload for helpers that only accept (text)
          const payload = _goal ? `[Goal: ${_goal}]\n${_text}` : _text;
          return claudeContext.improveText(payload);
        }
        // Fallback to sendMessage if improveText isn't provided
        const prompt = _goal
          ? `Please improve this text with the goal of ${_goal}: ${_text}`
          : `Please improve this text: ${_text}`;
        return claudeContext.sendMessage ? claudeContext.sendMessage(prompt) : Promise.resolve('');
      },
      analyzeWritingStyle: async (_text: string) => {
        if (claudeContext.analyzeWritingStyle) return claudeContext.analyzeWritingStyle(_text);
        const prompt = `Analyze the writing style of: ${_text}`;
        return claudeContext.sendMessage ? claudeContext.sendMessage(prompt) : Promise.resolve('');
      },
      generatePlotIdeas: async (_prompt: string) => {
        if (claudeContext.generatePlotIdeas) return claudeContext.generatePlotIdeas(_prompt);
        const prompt = `Generate plot ideas for: ${_prompt}`;
        return claudeContext.sendMessage ? claudeContext.sendMessage(prompt) : Promise.resolve('');
      },
      analyzeCharacter: async (_character: string) => {
        if (claudeContext.analyzeCharacter) return claudeContext.analyzeCharacter(_character);
        const prompt = `Please analyze this character: ${_character}`;
        return claudeContext.sendMessage ? claudeContext.sendMessage(prompt) : Promise.resolve('');
      },
      brainstormIdeas: async (_topic: string) => {
        if (claudeContext.brainstormIdeas) return claudeContext.brainstormIdeas(_topic);
        const prompt = `Brainstorm ideas about: ${_topic}`;
        return claudeContext.sendMessage ? claudeContext.sendMessage(prompt) : Promise.resolve('');
      },
    },

    // Chapter management (v0.6.0+)
    // Note: Chapters are managed via useChapters() hook in components
    // Context only provides project selection; hooks handle chapter data
    chapters: {
      // Placeholder - use useChapters(currentProjectId) in components instead
      // This keeps context lightweight and avoids circular dependencies
      data: [],
      loading: false,
      error: null,
      count: 0,
      totalWords: 0,
      refresh: async () => {},
      getById: async () => null,
      save: async () => {},
      create: async () => ({}) as Chapter,
      updateContent: async () => {},
      delete: async () => {},
      reorder: async () => {},
    },
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// ===== PUBLIC PROVIDER (and alias) =====
export function AppProvider({ children }: { children: ReactNode }) {
  return <AppProviderInner>{children}</AppProviderInner>;
}

// UI ready hook for onboarding
export function useUIReady() {
  const { state } = useAppContext();
  return {
    isReady: !state.isLoading && state.error === null,
  };
}

// ✅ Public aliases expected by consumers/tests

export default AppProvider;
