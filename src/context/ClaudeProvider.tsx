// src/context/AppContext.tsx
import React, { createContext, useReducer, useContext, ReactNode, useState, useCallback } from "react";

// Define interfaces locally to avoid import issues
export interface ClaudeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ClaudeError {
  message: string;
  type: 'api_error' | 'network_error' | 'rate_limit' | 'auth_error' | 'invalid_request';
  retryable: boolean;
}

export enum View {
  Dashboard = "dashboard",
  Writing = "writing",
  Timeline = "timeline",
  Analysis = "analysis",
  Settings = "settings",
}

interface AppState {
  view: View;
  theme: "light" | "dark";
  notifications: string[];
  campaignData: any;
  currentProject: string;
}

type AppAction =
  | { type: "SET_VIEW"; payload: View }
  | { type: "SET_THEME"; payload: "light" | "dark" }
  | { type: "SET_CURRENT_PROJECT"; payload: string }
  | { type: "ADD_NOTIFICATION"; payload: string }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "SET_CAMPAIGN_DATA"; payload: any };

const initialState: AppState = {
  view: View.Dashboard,
  theme: "dark",
  notifications: [],
  campaignData: null,
  currentProject: "My First Project",
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_VIEW": return { ...state, view: action.payload };
    case "SET_THEME": return { ...state, theme: action.payload };
    case "SET_CURRENT_PROJECT": return { ...state, currentProject: action.payload };
    case "ADD_NOTIFICATION": return { ...state, notifications: [...state.notifications, action.payload] };
    case "REMOVE_NOTIFICATION": return { ...state, notifications: state.notifications.filter(n => n !== action.payload) };
    case "SET_CAMPAIGN_DATA": return { ...state, campaignData: action.payload };
    default: return state;
  }
}

interface ClaudeState {
  messages: ClaudeMessage[];
  isLoading: boolean;
  error: string | null;
  isVisible: boolean;
  isConfigured: boolean;
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  activeView: View;
  theme: "light" | "dark";
  currentProject: string;
  setCurrentProject: (project: string) => void;
  toggleTheme: () => void;

  claude: ClaudeState;
  claudeActions: {
    sendMessage: (content: string, selectedText?: string) => Promise<string>;
    clearMessages: () => void;
    toggleVisibility: () => void;
    configureApiKey: (apiKey: string) => void;
    suggestContinuation: (selectedText: string) => Promise<string>;
    improveText: (selectedText: string) => Promise<string>;
    analyzeWritingStyle: (selectedText: string) => Promise<string>;
    generatePlotIdeas: (context?: string) => Promise<string>;
    analyzeCharacter: (characterName: string) => Promise<string>;
    brainstormIdeas: (topic: string) => Promise<string>;
  };
}

// Mock Claude service fallback
const createMockClaudeService = () => ({
  isConfigured: () => false,
  getMessages: () => [],
  generateMessageId: () => `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  initialize: (apiKey: string) => {
    console.warn("Claude service not available - API key stored locally");
    localStorage.setItem('claude_api_key_pending', apiKey);
  },
  clearMessages: () => {
    localStorage.removeItem('claude_messages');
  },
  saveMessage: (message: ClaudeMessage) => {
    const messages = JSON.parse(localStorage.getItem('claude_messages') || '[]');
    messages.push(message);
    localStorage.setItem('claude_messages', JSON.stringify(messages));
  },
  sendMessage: async () => { throw new Error("Claude service not available."); },
  continueText: async () => { throw new Error("Claude service not available."); },
  improveText: async () => { throw new Error("Claude service not available."); },
  analyzeWritingStyle: async () => { throw new Error("Claude service not available."); },
  generatePlotIdeas: async () => { throw new Error("Claude service not available."); },
  analyzeCharacter: async () => { throw new Error("Claude service not available."); },
  brainstormIdeas: async () => { throw new Error("Claude service not available."); },
});

// Import real Claude service or fallback to mock
let claudeService: any;
try {
  claudeService = require("@/services/claudeService").claudeService;
} catch (error) {
  console.warn("Claude service not found, using mock service:", error);
  claudeService = createMockClaudeService();
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const [claudeState, setClaudeState] = useState<ClaudeState>(() => {
    try {
      return {
        messages: claudeService.getMessages(),
        isLoading: false,
        error: null,
        isVisible: false,
        isConfigured: claudeService.isConfigured(),
      };
    } catch {
      return {
        messages: [],
        isLoading: false,
        error: null,
        isVisible: false,
        isConfigured: false,
      };
    }
  });

  const setCurrentProject = useCallback((project: string) => {
    dispatch({ type: "SET_CURRENT_PROJECT", payload: project });
  }, []);

  const toggleTheme = useCallback(() => {
    dispatch({ type: "SET_THEME", payload: state.theme === "light" ? "dark" : "light" });
  }, [state.theme]);

  // UPDATED sendMessage returns Promise<string>
  const sendMessage = useCallback(async (content: string, selectedText?: string): Promise<string> => {
    if (!claudeService.isConfigured()) {
      setClaudeState(prev => ({ ...prev, error: "Claude API key not configured. Please set your API key in settings." }));
      return "";
    }
    setClaudeState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const userMessage: ClaudeMessage = {
        id: claudeService.generateMessageId(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      const projectContext = `Current project: ${state.currentProject}`;
      const response = await claudeService.sendMessage(content, {
        selectedText,
        projectContext,
        conversationHistory: claudeState.messages,
      });
      const assistantMessage: ClaudeMessage = {
        id: claudeService.generateMessageId(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
      };
      claudeService.saveMessage(userMessage);
      claudeService.saveMessage(assistantMessage);
      setClaudeState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage, assistantMessage],
        isLoading: false,
      }));
      return response.content;
    } catch (error) {
      setClaudeState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to send message to Claude",
      }));
      return "";
    }
  }, [state.currentProject, claudeState.messages]);

  const clearMessages = useCallback(() => {
    try {
      claudeService.clearMessages();
      setClaudeState(prev => ({ ...prev, messages: [] }));
    } catch {
      setClaudeState(prev => ({ ...prev, messages: [] }));
    }
  }, []);

  const toggleVisibility = useCallback(() => {
    setClaudeState(prev => ({ ...prev, isVisible: !prev.isVisible }));
  }, []);

  const configureApiKey = useCallback((apiKey: string) => {
    try {
      claudeService.initialize(apiKey);
      setClaudeState(prev => ({ ...prev, isConfigured: true, error: null }));
    } catch {
      setClaudeState(prev => ({ ...prev, error: "Failed to configure API key" }));
    }
  }, []);

  const suggestContinuation = useCallback(async (selectedText: string): Promise<string> => {
    const projectContext = `Current project: ${state.currentProject}`;
    return claudeService.continueText(selectedText, projectContext);
  }, [state.currentProject]);

  const improveText = useCallback(async (selectedText: string): Promise<string> => claudeService.improveText(selectedText), []);

  const analyzeWritingStyle = useCallback(async (selectedText: string): Promise<string> => claudeService.analyzeWritingStyle(selectedText), []);

  const generatePlotIdeas = useCallback(async (context?: string): Promise<string> => claudeService.generatePlotIdeas(context), []);

  const analyzeCharacter = useCallback(async (characterName: string): Promise<string> => {
    const projectContext = `Current project: ${state.currentProject}`;
    return claudeService.analyzeCharacter(characterName, projectContext);
  }, [state.currentProject]);

  const brainstormIdeas = useCallback(async (topic: string): Promise<string> => claudeService.brainstormIdeas(topic), []);

  const contextValue: AppContextValue = {
    state,
    dispatch,
    activeView: state.view,
    theme: state.theme,
    currentProject: state.currentProject,
    setCurrentProject,
    toggleTheme,
    claude: claudeState,
    claudeActions: {
      sendMessage,
      clearMessages,
      toggleVisibility,
      configureApiKey,
      suggestContinuation,
      improveText,
      analyzeWritingStyle,
      generatePlotIdeas,
      analyzeCharacter,
      brainstormIdeas,
    },
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}

// Legacy hook for convenience
export function useClaude() {
  const { claude, claudeActions } = useAppContext();
  return {
    messages: claude.messages,
    isLoading: claude.isLoading,
    error: claude.error,
    isVisible: claude.isVisible,
    isConfigured: claude.isConfigured,
    ...claudeActions,
  };
}
