// src/context/AppContext.tsx - Clean version with no export conflicts
import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { ClaudeProvider, useClaude } from './ClaudeProvider';

// ===== ENUMS & TYPES =====
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

// ===== ACTIONS =====
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

// ===== INITIAL STATE =====
const initialState: AppState = {
  view: View.Dashboard,
  theme: 'dark',
  projects: [],
  currentProjectId: null,
  isLoading: false,
  error: null,
};

// ===== REDUCER =====
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

// ===== CONTEXT VALUE INTERFACE =====
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

// ===== CONTEXT CREATION =====
const AppContext = createContext<AppContextValue | null>(null);

// ===== CUSTOM HOOK =====
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// ===== INNER PROVIDER COMPONENT =====
function AppProviderInner({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const claudeContext = useClaude();

  // Load from localStorage on mount
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

    try {
      const theme = (localStorage.getItem('inkwell_theme') as 'light' | 'dark') || 'dark';
      dispatch({ type: 'SET_THEME', payload: theme });
      document.documentElement.classList.toggle('dark', theme === 'dark');
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
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

  // Persist & apply theme
  useEffect(() => {
    try {
      localStorage.setItem('inkwell_theme', state.theme);
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [state.theme]);

  const currentProject = state.projects.find((p) => p.id === state.currentProjectId) || null;

  const contextValue: AppContextValue = {
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
          const prompt = `Please improve this text with the goal of ${goal}:\n\n${text}`;
          return claudeContext.sendMessage(prompt);
        }
        if (claudeContext.improveText) {
          return claudeContext.improveText(text);
        }
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

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// ===== MAIN PROVIDER COMPONENT =====
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ClaudeProvider>
      <AppProviderInner>{children}</AppProviderInner>
    </ClaudeProvider>
  );
}
