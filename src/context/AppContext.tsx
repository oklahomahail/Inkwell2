// src/context/AppContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storageService } from '@/services/storageService';

// Types
export type View = 'dashboard' | 'writing' | 'timeline' | 'analysis';
export type Theme = 'light' | 'dark';

export interface AppState {
  // UI State
  activeView: View;
  theme: Theme;
  currentProject: string;
  
  // Writing State
  writingContent: string;
  writingTitle: string;
  selectedText: string;
  isDirty: boolean;
  lastSaved: Date | null;
  
  // Claude State
  claudeVisible: boolean;
  claudeMessages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  claudeLoading: boolean;
  
  // Analytics State
  stats: {
    wordCount: number;
    charCount: number;
    scenes: number;
    chapters: number;
    readingTime: number;
    writingStreak: number;
  };
  
  // Toast State
  toasts: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'error';
    duration?: number;
  }>;
}

// Actions
export type AppAction =
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_PROJECT'; payload: string }
  | { type: 'UPDATE_WRITING_CONTENT'; payload: { content: string; title?: string } }
  | { type: 'SET_SELECTED_TEXT'; payload: string }
  | { type: 'TOGGLE_CLAUDE' }
  | { type: 'ADD_CLAUDE_MESSAGE'; payload: { role: 'user' | 'assistant'; content: string } }
  | { type: 'SET_CLAUDE_LOADING'; payload: boolean }
  | { type: 'UPDATE_STATS'; payload: Partial<AppState['stats']> }
  | { type: 'ADD_TOAST'; payload: { message: string; type: 'info' | 'success' | 'error'; duration?: number } }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'HYDRATE_FROM_STORAGE'; payload: Partial<AppState> };

// Initial state
const initialState: AppState = {
  activeView: 'dashboard',
  theme: 'dark',
  currentProject: 'My First Project',
  writingContent: '',
  writingTitle: 'Untitled Chapter',
  selectedText: '',
  isDirty: false,
  lastSaved: null,
  claudeVisible: false,
  claudeMessages: [],
  claudeLoading: false,
  stats: {
    wordCount: 0,
    charCount: 0,
    scenes: 0,
    chapters: 0,
    readingTime: 0,
    writingStreak: 0,
  },
  toasts: [],
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.payload };
      
    case 'SET_THEME':
      storageService.saveProjectSettings({ 
        ...storageService.getProjectSettings(), 
        theme: action.payload 
      });
      return { ...state, theme: action.payload };
      
    case 'SET_PROJECT':
      return { ...state, currentProject: action.payload };
      
    case 'UPDATE_WRITING_CONTENT':
      const newContent = action.payload.content;
      const newTitle = action.payload.title || state.writingTitle;
      const wordCount = newContent.trim() ? newContent.trim().split(/\s+/).length : 0;
      
      return {
        ...state,
        writingContent: newContent,
        writingTitle: newTitle,
        isDirty: newContent !== state.writingContent,
        stats: {
          ...state.stats,
          wordCount,
          charCount: newContent.length,
          chapters: Math.ceil(wordCount / 2500),
          readingTime: Math.ceil(wordCount / 250),
        },
      };
      
    case 'SET_SELECTED_TEXT':
      return { ...state, selectedText: action.payload };
      
    case 'TOGGLE_CLAUDE':
      return { ...state, claudeVisible: !state.claudeVisible };
      
    case 'ADD_CLAUDE_MESSAGE':
      const newMessage = {
        id: Date.now().toString(),
        role: action.payload.role,
        content: action.payload.content,
        timestamp: new Date(),
      };
      return {
        ...state,
        claudeMessages: [...state.claudeMessages, newMessage],
      };
      
    case 'SET_CLAUDE_LOADING':
      return { ...state, claudeLoading: action.payload };
      
    case 'UPDATE_STATS':
      return {
        ...state,
        stats: { ...state.stats, ...action.payload },
      };
      
    case 'ADD_TOAST':
      const toast = {
        id: Date.now().toString(),
        message: action.payload.message,
        type: action.payload.type,
        duration: action.payload.duration || 3000,
      };
      return {
        ...state,
        toasts: [...state.toasts, toast],
      };
      
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      };
      
    case 'SAVE_SUCCESS':
      return {
        ...state,
        isDirty: false,
        lastSaved: new Date(),
      };
      
    case 'HYDRATE_FROM_STORAGE':
      return { ...state, ...action.payload };
      
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hydrate from storage on mount
  useEffect(() => {
    const settings = storageService.getProjectSettings();
    const writingData = storageService.getWritingContent();
    const sessions = storageService.getWritingSessions();
    
    // Calculate writing streak
    const streak = calculateWritingStreak(sessions);
    
    dispatch({
      type: 'HYDRATE_FROM_STORAGE',
      payload: {
        theme: settings.theme,
        writingContent: writingData?.content || '',
        writingTitle: writingData?.title || 'Untitled Chapter',
        lastSaved: writingData?.lastUpdated || null,
        stats: {
          ...state.stats,
          wordCount: writingData?.wordCount || 0,
          writingStreak: streak,
        },
      },
    });
  }, []);

  // Auto-save writing content when it changes
  useEffect(() => {
    if (state.isDirty && state.writingContent) {
      const timer = setTimeout(() => {
        const success = storageService.saveWritingContent({
          content: state.writingContent,
          title: state.writingTitle,
          lastUpdated: new Date(),
          wordCount: state.stats.wordCount,
        });
        
        if (success) {
          dispatch({ type: 'SAVE_SUCCESS' });
          dispatch({
            type: 'ADD_TOAST',
            payload: { message: 'Auto-saved', type: 'info', duration: 2000 },
          });
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [state.isDirty, state.writingContent, state.writingTitle, state.stats.wordCount]);

  // Auto-remove toasts
  useEffect(() => {
    state.toasts.forEach(toast => {
      const timer = setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
      }, toast.duration);
      
      return () => clearTimeout(timer);
    });
  }, [state.toasts]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Helper function for writing streak calculation
function calculateWritingStreak(sessions: Array<{ date: string; wordCount: number }>): number {
  if (sessions.length === 0) return 0;
  
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  for (const session of sortedSessions) {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);
    
    if (sessionDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (sessionDate.getTime() < currentDate.getTime()) {
      break;
    }
  }
  
  return streak;
}

// Convenience hooks for specific features
export const useWriting = () => {
  const { state, dispatch } = useApp();
  
  const updateContent = (content: string, title?: string) => {
    dispatch({ type: 'UPDATE_WRITING_CONTENT', payload: { content, title } });
  };
  
  const setSelectedText = (text: string) => {
    dispatch({ type: 'SET_SELECTED_TEXT', payload: text });
  };
  
  return {
    content: state.writingContent,
    title: state.writingTitle,
    selectedText: state.selectedText,
    isDirty: state.isDirty,
    lastSaved: state.lastSaved,
    stats: state.stats,
    updateContent,
    setSelectedText,
  };
};

export const useClaude = () => {
  const { state, dispatch } = useApp();
  
  const toggleVisibility = () => {
    dispatch({ type: 'TOGGLE_CLAUDE' });
  };
  
  const sendMessage = async (message: string) => {
    dispatch({ type: 'ADD_CLAUDE_MESSAGE', payload: { role: 'user', content: message } });
    dispatch({ type: 'SET_CLAUDE_LOADING', payload: true });
    
    // Simulate Claude API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = `Claude's response to: ${message}`;
      dispatch({ type: 'ADD_CLAUDE_MESSAGE', payload: { role: 'assistant', content: response } });
    } finally {
      dispatch({ type: 'SET_CLAUDE_LOADING', payload: false });
    }
  };
  
  return {
    isVisible: state.claudeVisible,
    messages: state.claudeMessages,
    isLoading: state.claudeLoading,
    toggleVisibility,
    sendMessage,
  };
};

export const useToast = () => {
  const { state, dispatch } = useApp();
  
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info', duration?: number) => {
    dispatch({ type: 'ADD_TOAST', payload: { message, type, duration } });
  };
  
  const removeToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  };
  
  return {
    toasts: state.toasts,
    showToast,
    removeToast,
  };
};