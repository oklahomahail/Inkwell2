/**
 * UI Types for Inkwell
 */

export interface AppTheme {
  name: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    error: string;
    warning: string;
    success: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      base: string;
      sm: string;
      lg: string;
      xl: string;
    };
    lineHeight: {
      normal: number;
      relaxed: number;
      loose: number;
    };
  };
  spacing: {
    [key: string]: string;
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface UIStateConfig {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  zoomLevel: number;
  lastActiveTab?: string;
  dismissedAlerts?: string[];
}

export interface UIContextState extends UIStateConfig {
  toggleSidebar: () => void;
  setTheme: (_theme: 'light' | 'dark') => void;
  setZoomLevel: (_level: number) => void;
  dismissAlert: (_id: string) => void;
}
