// src/test-utils/component-mocks.tsx
import React from 'react';
import { vi } from 'vitest';

import { AppContext, AppState, initialState } from '@/context/AppContext';
import { UIContext } from '@/hooks/useUI';

// Mock AppContext Provider
export const createMockAppState = (overrides?: Partial<AppState>): AppState => ({
  ...initialState,
  ...overrides,
});

export const MockAppProvider: React.FC<{
  children: React.ReactNode;
  state?: Partial<AppState>;
}> = ({ children, state = {} }) => {
  const mockState = createMockAppState(state);
  const dispatch = vi.fn();

  return (
    <AppContext.Provider value={{ state: mockState, dispatch }}>{children}</AppContext.Provider>
  );
};

// Mock UI Context Provider
export interface MockUIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const defaultUIState: MockUIState = {
  sidebarCollapsed: false,
  toggleSidebar: vi.fn(),
};

export const MockUIProvider: React.FC<{
  children: React.ReactNode;
  state?: Partial<MockUIState>;
}> = ({ children, state = {} }) => {
  const mockState = { ...defaultUIState, ...state };

  return <UIContext.Provider value={mockState as any}>{children}</UIContext.Provider>;
};

// Composable test wrapper that includes common providers
export const TestWrapper: React.FC<{
  children: React.ReactNode;
  appState?: Partial<AppState>;
  uiState?: Partial<MockUIState>;
}> = ({ children, appState = {}, uiState = {} }) => {
  return (
    <MockAppProvider state={appState}>
      <MockUIProvider state={uiState}>{children}</MockUIProvider>
    </MockAppProvider>
  );
};

// Mock component props
export const createTestId = (name: string) => `test-${name}`;

// Jest mock for Lucide icons used in InkwellFeather
export const mockLucideIcon = (name: string) => {
  return vi
    .fn()
    .mockImplementation((props) => <span data-testid={createTestId(`icon-${name}`)} {...props} />);
};
