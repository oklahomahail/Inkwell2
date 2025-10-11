// File: src/context/AppContext.tsx
import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';

import { useClaude } from './ClaudeProvider';

// ===== ENUMS & TYPES =====

export enum View {
  Dashboard = 'dashboard',
  Writing = 'writing',
  Timeline = 'timeline',
  Analysis = 'analysis',
  Planning = 'planning',
  PlotBoards = 'plotboards',
  Settings = 'settings',
}

export interface Project {
  chapters: any;
  characters: never[];
  beatSheet: never[];
  id: string;
  name: string;
  description: string;
  content?: string;
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'light' | 'dark';

export interface AppState {
  claude: any;
  view: View;
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  theme: Theme;
  // Auto-save state
  autoSave: {
    isSaving: boolean;
    lastSaved: Date | null;
    error: string | null;
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
  | { type: 'SET_AUTO_SAVE_ERROR'; payload: string | null };

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
};

// ===== REDUCER =====
function _appReducer(state: AppState, action: AppAction): AppState {
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

    // Auto-save
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
  // Auto-save actions
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
}

// ===== CONTEXT CREATION =====
export const AppContext = createContext<AppContextValue | null>(null);

// ===== CUSTOM HOOKS =====
export function _useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
}

export function _useCurrentProject() {
  const { state } = useAppContext();
  const project = state.projects.find((p) => p.id === state.currentProjectId) || null;
  return { project };
}

// ===== INNER PROVIDER COMPONENT =====
function _AppProviderInner({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const claudeContext = useClaude();

  // Load projects
  useEffect(() => {
    try {
      const stored = localStorage.getItem('inkwell_projects');
      if (stored) {
        const projects = JSON.parse(stored) as Project[];
        dispatch({ type: 'SET_PROJECTS', payload: projects });
      }
    } catch (error) {
      console.warn('Failed to parse projects from localStorage:', error);
    }

    // Load current project ID
    try {
      const storedProjectId = localStorage.getItem('inkwell_current_project_id');
      if (storedProjectId) {
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: storedProjectId });
      }
    } catch (error) {
      console.warn('Failed to load current project ID from localStorage:', error);
    }
  }, []);

  // Persist projects
  useEffect(() => {
    try {
      localStorage.setItem('inkwell_projects', JSON.stringify(state.projects));
    } catch (error) {
      console.warn('Failed to save projects to localStorage:', error);
    }
  }, [state.projects]);

  // Persist current project ID
  useEffect(() => {
    try {
      if (state.currentProjectId) {
        localStorage.setItem('inkwell_current_project_id', state.currentProjectId);
      } else {
        localStorage.removeItem('inkwell_current_project_id');
      }
    } catch (error) {
      console.warn('Failed to save current project ID to localStorage:', error);
    }
  }, [state.currentProjectId]);

  const currentProject = state.projects.find((p) => p.id === state.currentProjectId) || null;

  const contextValue: AppContextValue = {
    state,
    dispatch,
    currentProject,
    projects: state.projects,
    setView: (_view) => dispatch({ type: 'SET_VIEW', payload: view }),
    setTheme: (_theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    addProject: (_project) => dispatch({ type: 'ADD_PROJECT', payload: project }),
    updateProject: (_project) => dispatch({ type: 'UPDATE_PROJECT', payload: project }),
    deleteProject: (_id) => dispatch({ type: 'DELETE_PROJECT', payload: id }),
    setCurrentProjectId: (_id) => dispatch({ type: 'SET_CURRENT_PROJECT', payload: id }),
    setAutoSaveSaving: (_saving) => dispatch({ type: 'SET_AUTO_SAVE_SAVING', payload: saving }),
    setAutoSaveSuccess: (_date) => dispatch({ type: 'SET_AUTO_SAVE_SUCCESS', payload: date }),
    setAutoSaveError: (_error) => dispatch({ type: 'SET_AUTO_SAVE_ERROR', payload: error }),
    claude: claudeContext.claude,
    claudeActions: {
      sendMessage: claudeContext.sendMessage,
      clearMessages: claudeContext.clearMessages,
      toggleVisibility: claudeContext.toggleVisibility,
      configureApiKey: claudeContext.configureApiKey,
      suggestContinuation: claudeContext.suggestContinuation,
      improveText: async (_text: string, _goal?: string) => {
        if (goal) {
          const prompt = `Please improve this text with the goal of ${goal}: ${text}`;
          return claudeContext.sendMessage(prompt);
        }
        if (claudeContext.improveText) {
          return claudeContext.improveText(text);
        }
        const prompt = `Please improve this text: ${text}`;
        return claudeContext.sendMessage(prompt);
      },
      analyzeWritingStyle: claudeContext.analyzeWritingStyle,
      generatePlotIdeas: claudeContext.generatePlotIdeas,
      analyzeCharacter:
        claudeContext.analyzeCharacter ??
        (async (character: string) => {
          const prompt = `Please analyze this character: ${character}`;
          return claudeContext.sendMessage(prompt);
        }),
      brainstormIdeas: claudeContext.brainstormIdeas,
    },
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// ===== MAIN PROVIDER COMPONENT =====
export function _AppProvider({ children }: { children: ReactNode }) {
  return <AppProviderInner>{children}</AppProviderInner>;
}
