// src/context/AppContext.tsx
import React, { createContext, useReducer, useContext, ReactNode } from "react";

export enum View {
  Dashboard = "dashboard",
  Writing = "writing",
  Timeline = "timeline",
  Settings = "settings",
}

interface AppState {
  view: View;
  theme: "light" | "dark";
  notifications: string[];
  campaignData: any;
  isClaudeVisible: boolean;
}

type AppAction =
  | { type: "SET_VIEW"; payload: View }
  | { type: "SET_THEME"; payload: "light" | "dark" }
  | { type: "ADD_NOTIFICATION"; payload: string }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "SET_CAMPAIGN_DATA"; payload: any }
  | { type: "TOGGLE_CLAUDE" };

const initialState: AppState = {
  view: View.Dashboard,
  theme: "light",
  notifications: [],
  campaignData: null,
  isClaudeVisible: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.payload };
    case "SET_THEME":
      return { ...state, theme: action.payload };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [...state.notifications, action.payload] };
    case "REMOVE_NOTIFICATION":
      return { ...state, notifications: state.notifications.filter((n) => n !== action.payload) };
    case "SET_CAMPAIGN_DATA":
      return { ...state, campaignData: action.payload };
    case "TOGGLE_CLAUDE":
      return { ...state, isClaudeVisible: !state.isClaudeVisible };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}
