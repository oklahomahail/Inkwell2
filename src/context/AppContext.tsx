// File: src/context/AppContext.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

import { SearchService } from '@/services/searchService';
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
  Formatting = 'formatting', // v0.10.0 - Document Formatting
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
  // Cloud sync state (v1.5.0 Phase 3)
  cloudSync: {
    status: 'online' | 'syncing' | 'offline' | 'error';
    isSyncing: boolean;
    pendingOperations: number;
    lastSyncAt: number | null;
    lastError: string | null;
    isOnline: boolean;
    isAuthenticated: boolean;
    realtimeStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  };
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
  | { type: 'SET_CREATION_MODE'; payload: 'blank' | 'import' | 'template' | null }
  | { type: 'UPDATE_CLOUD_SYNC'; payload: Partial<AppState['cloudSync']> };

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
  // Cloud sync state (Phase 3)
  cloudSync: {
    status: 'offline',
    isSyncing: false,
    pendingOperations: 0,
    lastSyncAt: null,
    lastError: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
    isAuthenticated: false,
    realtimeStatus: 'disconnected',
  },
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

    case 'UPDATE_CLOUD_SYNC':
      return {
        ...state,
        cloudSync: { ...state.cloudSync, ...action.payload },
      };

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
  // Cloud sync methods (v1.5.0 Phase 3)
  updateCloudSyncState: (_state: Partial<AppState['cloudSync']>) => void;
  triggerManualSync: () => Promise<void>;
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

  // Guard: ensure currentProjectId is a valid string
  if (typeof state.currentProjectId !== 'string' || !state.currentProjectId) {
    return { project: null };
  }

  const project = state.projects.find((p: any) => p.id === state.currentProjectId) || null;
  return { project };
}

// Storage keys
const THEME_KEY = 'inkwell-theme';
const PROJECTS_KEY = 'inkwell_projects';
const PROJECT_ID_KEY = 'inkwell_current_project_id';

/**
 * Helper: Index a project for full-text search
 */
async function indexProjectForSearch(project: Project): Promise<void> {
  try {
    // Combine all chapter content for search
    const chaptersContent = project.chapters
      ?.map((ch: any) => ch.content || ch.text || '')
      .filter(Boolean)
      .join('\n\n');

    await SearchService.updateProject({
      id: project.id,
      name: project.name || 'Untitled Project',
      description: project.description || '',
      genre: project.genre,
      content: chaptersContent || '',
    });

    devLog.debug(`[AppContext] Indexed project for search: ${project.id}`);
  } catch (error) {
    devLog.warn('[AppContext] Failed to index project for search:', error);
  }
}

// ===== PROVIDER (INNER) =====
function AppProviderInner({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const claudeContext = useClaude();
  const hasHydrated = React.useRef(false);

  // Load state on mount
  useEffect(() => {
    async function loadProjects() {
      try {
        const stored = localStorage.getItem(PROJECTS_KEY);
        if (stored) {
          let projects = JSON.parse(stored) as Project[];

          // Run story template migration (v1.4.0+)
          // This adds template fields to existing projects
          const { runStoryTemplateMigration } = await import(
            '@/utils/migrations/storyTemplateMigration'
          );
          projects = runStoryTemplateMigration(projects);

          dispatch({ type: 'SET_PROJECTS', payload: projects });

          // Index all projects for search
          devLog.debug('[AppContext] Indexing projects for search...');
          await Promise.all(projects.map((project) => indexProjectForSearch(project)));
          devLog.debug('[AppContext] Search indexing complete');
        }
      } catch (error) {
        devLog.warn('Failed to parse projects from localStorage:', error);
      }
    }

    loadProjects();

    // Load current project ID with validation
    try {
      const storedProjectId = localStorage.getItem(PROJECT_ID_KEY);
      if (storedProjectId) {
        // Validate the stored project ID format
        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            storedProjectId,
          );
        const isWelcomeProject = storedProjectId.startsWith('proj_welcome_');
        const isLegacyFormat =
          storedProjectId.startsWith('project-') && /^project-\d+$/.test(storedProjectId);

        const isValidFormat = isUUID || isWelcomeProject || isLegacyFormat;

        if (isValidFormat) {
          dispatch({ type: 'SET_CURRENT_PROJECT', payload: storedProjectId });
        } else {
          // Clear corrupted project ID
          devLog.error(
            `[AppContext] Invalid project ID format detected: "${storedProjectId}". Clearing corrupted data.`,
          );
          localStorage.removeItem(PROJECT_ID_KEY);

          // Also clean up any related corrupted data
          const keysToCheck = Object.keys(localStorage);
          keysToCheck.forEach((key) => {
            if (key.startsWith('lastSection-') && key.includes(storedProjectId)) {
              localStorage.removeItem(key);
              devLog.warn(`[AppContext] Removed corrupted key: ${key}`);
            }
          });
        }
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

  // Initialize cloud sync monitoring (Phase 3)
  useEffect(() => {
    let mounted = true;

    const initCloudSync = async () => {
      try {
        // Lazy import to avoid circular dependencies
        const { syncQueue } = await import('@/sync/syncQueue');
        const { realtimeService } = await import('@/sync/realtimeService');
        const { supabase } = await import('@/lib/supabaseClient');

        // Initialize sync queue
        await syncQueue.init();

        // Check auth status
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        dispatch({
          type: 'UPDATE_CLOUD_SYNC',
          payload: {
            isAuthenticated: !!user,
            isOnline: navigator.onLine,
          },
        });

        // Add sync queue listener
        const updateSyncState = () => {
          if (!mounted) return;
          const stats = syncQueue.getStats();
          const realtimeStatus = realtimeService.getStatus();

          dispatch({
            type: 'UPDATE_CLOUD_SYNC',
            payload: {
              pendingOperations: stats.pending + stats.syncing,
              isSyncing: stats.syncing > 0,
              status: stats.syncing > 0 ? 'syncing' : stats.pending > 0 ? 'online' : 'online',
              realtimeStatus,
            },
          });
        };

        syncQueue.addListener(updateSyncState);

        // Monitor online/offline
        const handleOnline = () => {
          if (!mounted) return;
          dispatch({
            type: 'UPDATE_CLOUD_SYNC',
            payload: { isOnline: true },
          });
        };

        const handleOffline = () => {
          if (!mounted) return;
          dispatch({
            type: 'UPDATE_CLOUD_SYNC',
            payload: { isOnline: false, status: 'offline' },
          });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup
        return () => {
          mounted = false;
          syncQueue.removeListener(updateSyncState);
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      } catch (error) {
        devLog.error('[AppContext] Failed to initialize cloud sync:', error);
        return undefined;
      }
    };

    const cleanup = initCloudSync();

    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, []);

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

    // Cloud sync (Phase 3)
    updateCloudSyncState: (_state) => dispatch({ type: 'UPDATE_CLOUD_SYNC', payload: _state }),
    triggerManualSync: async () => {
      // Lazy import to avoid circular dependencies
      const { syncQueue } = await import('@/sync/syncQueue');
      await syncQueue.processQueue();
    },

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
