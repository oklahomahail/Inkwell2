// src/context/AppContext.tsx - Clean, Claude-integrated context with named exports
import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { ClaudeProvider, useClaude } from './ClaudeProvider';

// ===== Views & State Types =====
export enum View {
  Dashboard = 'dashboard',
  Writing = 'writing',
  Timeline = 'timeline',
  Analysis = 'analysis',
  Settings = 'settings',
}

export interface Project {
  id: string;
  name: string;
  description: string;
  content?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  view: View;
  theme: 'light' | 'dark';
  projects: Project[];
  currentProjectId: string | null;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_CURRENT_PROJECT'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  view: View.Dashboard,
  theme: 'dark',
  projects: [],
  currentProjectId: null,
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
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
    default:
      return state;
  }
}

// ===== Context Shape =====
export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  currentProject: Project | null;
  projects: Project[];
  setView: (view: View) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  setCurrentProjectId: (id: string | null) => void;
  // Claude integration
  claude: ReturnType<typeof useClaude>['claude'];
  claudeActions: {
    sendMessage: (message: string) => Promise<string>;
    clearMessages: () => void;
    toggleVisibility: () => void;
    configureApiKey: (apiKey: string) => void;
    suggestContinuation: (text: string) => Promise<string>;
    improveText: (text: string, goal?: string) => Promise<string>;
    analyzeWritingStyle: (text: string) => Promise<string>;
    generatePlotIdeas: (prompt: string) => Promise<string>;
    analyzeCharacter: (character: string) => Promise<string>;
    brainstormIdeas: (topic: string) => Promise<string>;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

// ===== Public Hook =====
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// ===== Providers =====
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ClaudeProvider>
      <AppProviderInner>{children}</AppProviderInner>
    </ClaudeProvider>
  );
}

function AppProviderInner({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const claudeContext = useClaude();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('inkwell_projects');
      if (stored) {
        dispatch({ type: 'SET_PROJECTS', payload: JSON.parse(stored) as Project[] });
      }
    } catch (e) {
      console.warn('Failed to parse inkwell_projects from localStorage', e);
    }

    const theme = (localStorage.getItem('inkwell_theme') as 'light' | 'dark') || 'dark';
    dispatch({ type: 'SET_THEME', payload: theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  // Persist projects
  useEffect(() => {
    try {
      localStorage.setItem('inkwell_projects', JSON.stringify(state.projects));
    } catch (e) {
      console.warn('Failed to save inkwell_projects', e);
    }
  }, [state.projects]);

  // Persist & apply theme
  useEffect(() => {
    try {
      localStorage.setItem('inkwell_theme', state.theme);
    } catch (e) {
      console.warn('Failed to save theme', e);
    }
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  const currentProject = state.projects.find((p) => p.id === state.currentProjectId) || null;

  const value: AppContextValue = {
    state,
    dispatch,
    currentProject,
    projects: state.projects,
    setView: (view) => dispatch({ type: 'SET_VIEW', payload: view }),
    setTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    addProject: (project) => dispatch({ type: 'ADD_PROJECT', payload: project }),
    updateProject: (project) => dispatch({ type: 'UPDATE_PROJECT', payload: project }),
    deleteProject: (id) => dispatch({ type: 'DELETE_PROJECT', payload: id }),
    setCurrentProjectId: (id) => dispatch({ type: 'SET_CURRENT_PROJECT', payload: id }),
    claude: claudeContext.claude,
    claudeActions: {
      sendMessage: claudeContext.sendMessage,
      clearMessages: claudeContext.clearMessages,
      toggleVisibility: claudeContext.toggleVisibility,
      configureApiKey: claudeContext.configureApiKey,
      suggestContinuation: claudeContext.suggestContinuation,
      improveText: async (text: string, goal?: string) => {
        if (goal) {
          // If a goal is provided, create a custom prompt that includes the goal
          const prompt = `Please improve this text with the goal of ${goal}:\n\n${text}`;
          return claudeContext.sendMessage(prompt);
        }
        // If no goal, use the original improveText method (if it exists)
        if (claudeContext.improveText) {
          return claudeContext.improveText(text);
        }
        // Fallback: use sendMessage with a general improvement prompt
        const prompt = `Please improve this text:\n\n${text}`;
        return claudeContext.sendMessage(prompt);
      },
      analyzeWritingStyle: claudeContext.analyzeWritingStyle,
      generatePlotIdeas: claudeContext.generatePlotIdeas,
      analyzeCharacter:
        claudeContext.analyzeCharacter ||
        (async (character: string) => {
          const prompt = `Please analyze this character:\n\n${character}`;
          return claudeContext.sendMessage(prompt);
        }),
      brainstormIdeas: claudeContext.brainstormIdeas,
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ===== Named Exports (what your app imports elsewhere) =====
export { AppContext };
// Consumers elsewhere import:
// import { AppProvider } from '@/context/AppContext';
// import { useAppContext, View, type Project } from '@/context/AppContext';
