// test/utils.tsx
import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { CommandPaletteProvider } from '../src/components/CommandPalette/CommandPaletteProvider';
import { AppProvider } from '../src/context/AppContext';
import { AuthProvider } from '../src/context/AuthContext';
import { ClaudeProvider } from '../src/context/ClaudeProvider';
import { ToastProvider } from '../src/context/ToastContext';
// Import the flags directly with relative path to avoid path resolution issues
import { UIProvider } from '../src/hooks/useUI';
import { useFeatureFlag } from '../src/utils/flags';

type Options = {
  route?: string;
  flags?: Record<string, boolean>;
  initialState?: any;
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
};

// Mock the feature flag hook
vi.mock('../src/utils/flags', () => ({
  useFeatureFlag: vi.fn().mockImplementation((key) => {
    return key === 'plotBoards'; // Default to true for plotBoards flag
  }),
}));

export function renderApp(
  ui: React.ReactElement,
  { route = '/', flags = {}, initialState: _initialState, wrapper }: Options = {},
) {
  // Set feature flag mock implementations based on provided flags
  if (Object.keys(flags).length > 0) {
    vi.mocked(useFeatureFlag).mockImplementation((key) => {
      return flags[key] ?? false;
    });
  }

  const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter initialEntries={[route]}>
      <ClaudeProvider>
        <AppProvider>
          <AuthProvider>
            <ToastProvider>
              <UIProvider>
                <CommandPaletteProvider>{children}</CommandPaletteProvider>
              </UIProvider>
            </ToastProvider>
          </AuthProvider>
        </AppProvider>
      </ClaudeProvider>
    </MemoryRouter>
  );
  return render(ui, { wrapper: wrapper ?? AllProviders });
}
