// File: src/test-utils/component-mocks.tsx
import React from 'react';
import { vi } from 'vitest';

import {
  AppContext,
  type AppState,
  type AppContextValue,
  initialState,
  View,
} from '@/context/AppContext';
import { UIContext, type UIContextValue } from '@/hooks/useUI';

// ----- AppContext helpers -----
export const createMockAppState = (overrides?: Partial<AppState>): AppState => ({
  ...initialState,
  ...overrides,
});

export const createMockAppContextValue = (
  state: AppState,
  extra?: Partial<AppContextValue>,
): AppContextValue => {
  const dispatch = vi.fn();

  return {
    state,
    dispatch,
    currentProject: null,
    projects: state.projects,
    setView: vi.fn((view: View) => dispatch({ type: 'SET_VIEW', payload: view })),
    setTheme: vi.fn((theme) => dispatch({ type: 'SET_THEME', payload: theme })),
    addProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    setCurrentProjectId: vi.fn(),
    setAutoSaveSaving: vi.fn(),
    setAutoSaveSuccess: vi.fn(),
    setAutoSaveError: vi.fn(),
    claude: null as any,
    claudeActions: {
      sendMessage: vi.fn(async () => ''),
      clearMessages: vi.fn(),
      toggleVisibility: vi.fn(),
      configureApiKey: vi.fn(),
      suggestContinuation: vi.fn(async () => ''),
      improveText: vi.fn(async () => ''),
      analyzeWritingStyle: vi.fn(async () => ''),
      generatePlotIdeas: vi.fn(async () => ''),
      analyzeCharacter: vi.fn(async () => ''),
      brainstormIdeas: vi.fn(async () => ''),
    },
    chapters: {
      data: [],
      loading: false,
      error: null,
      count: 0,
      totalWords: 0,
      refresh: vi.fn(async () => {}),
      getById: vi.fn(async () => null),
      save: vi.fn(async () => {}),
      create: vi.fn(async () => ({}) as any),
      updateContent: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
      reorder: vi.fn(async () => {}),
    },
    ...(extra ?? {}),
  };
};

export const MockAppProvider: React.FC<{
  children: React.ReactNode;
  state?: Partial<AppState>;
  ctxOverrides?: Partial<AppContextValue>;
}> = ({ children, state = {}, ctxOverrides }) => {
  const mockState = createMockAppState(state);
  const mockCtx = createMockAppContextValue(mockState, ctxOverrides);
  return <AppContext.Provider value={mockCtx}>{children}</AppContext.Provider>;
};

// ----- UIContext helpers -----
const defaultUI: UIContextValue = {
  sidebarCollapsed: false,
  toggleSidebar: vi.fn(),
  newProjectDialogOpen: false,
  openNewProjectDialog: vi.fn(),
  closeNewProjectDialog: vi.fn(),
};

export const MockUIProvider: React.FC<{
  children: React.ReactNode;
  ui?: Partial<UIContextValue>;
}> = ({ children, ui = {} }) => {
  const value: UIContextValue = { ...defaultUI, ...ui };
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

// ----- Composable wrapper for tests -----
export const TestWrapper: React.FC<{
  children: React.ReactNode;
  appState?: Partial<AppState>;
  appCtxOverrides?: Partial<AppContextValue>;
  ui?: Partial<UIContextValue>;
}> = ({ children, appState = {}, appCtxOverrides, ui = {} }) => {
  return (
    <MockAppProvider state={appState} ctxOverrides={appCtxOverrides}>
      <MockUIProvider ui={ui}>{children}</MockUIProvider>
    </MockAppProvider>
  );
};

// Misc test helpers
export const createTestId = (name: string) => `test-${name}`;

export const mockLucideIcon = (name: string) =>
  vi
    .fn()
    .mockImplementation((props) => <span data-testid={createTestId(`icon-${name}`)} {...props} />);
