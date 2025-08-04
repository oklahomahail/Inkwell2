// src/context/AppContext.tsx - Updated with Claude integration

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { ClaudeProvider, useClaude } from './ClaudeProvider';

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
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
        currentProjectId: state.currentProjectId === action.payload ? null : state.currentProjectId,
      };
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

interface AppContextValue {
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
  claudeActions: Omit<ReturnType<typeof useClaude>, 'claude'>;
}

const AppContext = createContext<AppContextValue | null>(null);

// Main App Provider that includes Claude
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ClaudeProvider>
      <AppProviderInner>{children}</AppProviderInner>
    </ClaudeProvider>
  );
};

// Inner provider that can access Claude context
const AppProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const claudeContext = useClaude();

  // Load projects from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('inkwell_projects');
    if (stored) {
      try {
        const projects = JSON.parse(stored);
        dispatch({ type: 'SET_PROJECTS', payload: projects });
      } catch (e) {
        console.warn('Failed to load projects:', e);
      }
    }

    // Load theme preference
    const theme = (localStorage.getItem('inkwell_theme') as 'light' | 'dark') || 'dark';
    dispatch({ type: 'SET_THEME', payload: theme });

    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  // Save projects to localStorage when they change
  useEffect(() => {
    localStorage.setItem('inkwell_projects', JSON.stringify(state.projects));
  }, [state.projects]);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('inkwell_theme', state.theme);
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  const currentProject = state.projects.find((p) => p.id === state.currentProjectId) || null;

  const contextValue: AppContextValue = {
    state,
    dispatch,
    currentProject,
    projects: state.projects,
    setView: (view: View) => dispatch({ type: 'SET_VIEW', payload: view }),
    setTheme: (theme: 'light' | 'dark') => dispatch({ type: 'SET_THEME', payload: theme }),
    addProject: (project: Project) => dispatch({ type: 'ADD_PROJECT', payload: project }),
    updateProject: (project: Project) => dispatch({ type: 'UPDATE_PROJECT', payload: project }),
    deleteProject: (id: string) => dispatch({ type: 'DELETE_PROJECT', payload: id }),
    setCurrentProjectId: (id: string | null) =>
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: id }),
    claude: claudeContext.claude,
    claudeActions: {
      sendMessage: claudeContext.sendMessage,
      clearMessages: claudeContext.clearMessages,
      toggleVisibility: claudeContext.toggleVisibility,
      configureApiKey: claudeContext.configureApiKey,
      suggestContinuation: claudeContext.suggestContinuation,
      improveText: claudeContext.improveText,
      analyzeWritingStyle: claudeContext.analyzeWritingStyle,
      generatePlotIdeas: claudeContext.generatePlotIdeas,
      analyzeCharacter: claudeContext.analyzeCharacter,
      brainstormIdeas: claudeContext.brainstormIdeas,
    },
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
