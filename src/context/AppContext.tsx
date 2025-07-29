// src/context/AppContext.tsx
import React, { createContext, useReducer, useContext, ReactNode, useState, useCallback } from "react";
import { claudeService, ClaudeMessage, ClaudeError } from "@/services/claudeService";

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
    case "SET_VIEW":
      return { ...state, view: action.payload };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "SET_CURRENT_PROJECT":
      return { ...state, currentProject: action.payload };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [...state.notifications, action.payload] };
    case "REMOVE_NOTIFICATION":
      return { ...state, notifications: state.notifications.filter((n) => n !== action.payload) };
    case "SET_CAMPAIGN_DATA":
      return { ...state, campaignData: action.payload };
    default:
      return state;
  }
}

// Claude-specific state interface
interface ClaudeState {
  messages: ClaudeMessage[];
  isLoading: boolean;
  error: string | null;
  isVisible: boolean;
  isConfigured: boolean;
}

interface AppContextValue {
  // App state
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Convenience getters/setters
  activeView: View;
  theme: "light" | "dark";
  currentProject: string;
  setCurrentProject: (project: string) => void;
  toggleTheme: () => void;
  
  // Claude integration
  claude: ClaudeState;
  claudeActions: {
    sendMessage: (content: string, selectedText?: string) => Promise<void>;
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

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Claude state management
  const [claudeState, setClaudeState] = useState<ClaudeState>({
    messages: claudeService.getMessages(),
    isLoading: false,
    error: null,
    isVisible: false,
    isConfigured: claudeService.isConfigured(),
  });

  // App convenience methods
  const setCurrentProject = useCallback((project: string) => {
    dispatch({ type: "SET_CURRENT_PROJECT", payload: project });
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = state.theme === "light" ? "dark" : "light";
    dispatch({ type: "SET_THEME", payload: newTheme });
  }, [state.theme]);

  // Claude action methods
  const sendMessage = useCallback(async (content: string, selectedText?: string) => {
    if (!claudeService.isConfigured()) {
      setClaudeState(prev => ({ 
        ...prev, 
        error: "Claude API key not configured. Please set your API key in settings." 
      }));
      return;
    }

    setClaudeState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Add user message immediately
      const userMessage: ClaudeMessage = {
        id: claudeService.generateMessageId(),
        role: 'user',
        content: content,
        timestamp: new Date(),
      };

      // Get current project context
      const projectContext = `Current project: ${state.currentProject}`;

      // Send to Claude with context
      const response = await claudeService.sendMessage(content, {
        selectedText,
        projectContext,
        conversationHistory: claudeState.messages,
      });

      // Create assistant message
      const assistantMessage: ClaudeMessage = {
        id: claudeService.generateMessageId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };

      // Save both messages
      claudeService.saveMessage(userMessage);
      claudeService.saveMessage(assistantMessage);

      // Update state
      setClaudeState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage, assistantMessage],
        isLoading: false,
      }));

    } catch (error) {
      const claudeError = error as ClaudeError;
      setClaudeState(prev => ({
        ...prev,
        isLoading: false,
        error: claudeError.message || "Failed to send message to Claude",
      }));
    }
  }, [state.currentProject, claudeState.messages]);

  const clearMessages = useCallback(() => {
    claudeService.clearMessages();
    setClaudeState(prev => ({ ...prev, messages: [] }));
  }, []);

  const toggleVisibility = useCallback(() => {
    setClaudeState(prev => ({ ...prev, isVisible: !prev.isVisible }));
  }, []);

  const configureApiKey = useCallback((apiKey: string) => {
    claudeService.initialize(apiKey);
    setClaudeState(prev => ({ 
      ...prev, 
      isConfigured: true,
      error: null 
    }));
  }, []);

  // Quick action methods
  const suggestContinuation = useCallback(async (selectedText: string): Promise<string> => {
    const projectContext = `Current project: ${state.currentProject}`;
    return await claudeService.continueText(selectedText, projectContext);
  }, [state.currentProject]);

  const improveText = useCallback(async (selectedText: string): Promise<string> => {
    return await claudeService.improveText(selectedText);
  }, []);

  const analyzeWritingStyle = useCallback(async (selectedText: string): Promise<string> => {
    return await claudeService.analyzeWritingStyle(selectedText);
  }, []);

  const generatePlotIdeas = useCallback(async (context?: string): Promise<string> => {
    return await claudeService.generatePlotIdeas(context);
  }, []);

  const analyzeCharacter = useCallback(async (characterName: string): Promise<string> => {
    const projectContext = `Current project: ${state.currentProject}`;
    return await claudeService.analyzeCharacter(characterName, projectContext);
  }, [state.currentProject]);

  const brainstormIdeas = useCallback(async (topic: string): Promise<string> => {
    return await claudeService.brainstormIdeas(topic);
  }, []);

  const contextValue: AppContextValue = {
    // App state
    state,
    dispatch,
    
    // Convenience getters/setters
    activeView: state.view,
    theme: state.theme,
    currentProject: state.currentProject,
    setCurrentProject,
    toggleTheme,
    
    // Claude integration
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

// Legacy exports for compatibility with existing components
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