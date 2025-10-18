import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';

import { AppContext, View } from '@/context/AppContext';
import { useFeatureFlag } from '@/utils/flags';

import MainLayout from './MainLayout';

// Mock the feature flag hook
vi.mock('@/utils/flags', () => ({
  useFeatureFlag: vi.fn(),
}));

// Mock components used in MainLayout
vi.mock('@/components/Logo', () => ({
  default: () => <div data-testid="mock-logo">Logo</div>,
}));

vi.mock('@/components/ProfileSwitcher', () => ({
  ProfileSwitcher: () => <div data-testid="mock-profile-switcher">ProfileSwitcher</div>,
}));

vi.mock('@/components/PWA', () => ({
  PWAOfflineIndicator: () => <div>PWAOfflineIndicator</div>,
}));

vi.mock('@/context/CommandPaletteContext', () => ({
  useCommandPalette: () => ({
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
    isOpen: false,
    query: '',
    selectedIndex: 0,
    setQuery: vi.fn(),
    executeCommand: vi.fn(),
    registerCommand: vi.fn(),
    unregisterCommand: vi.fn(),
    filteredCommands: [],
  }),
}));

const mockDispatch = vi.fn();
const mockAppState = {
  view: View.Dashboard,
  projects: [],
  currentProjectId: null,
  isLoading: false,
  error: null,
  theme: 'light',
  autoSave: {
    isSaving: false,
    lastSaved: null,
    error: null,
  },
};

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (useFeatureFlag as any).mockReturnValue(false);
  });

  it('renders basic layout elements', () => {
    render(
      <AppContext.Provider value={{ state: mockAppState, dispatch: mockDispatch } as any}>
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </AppContext.Provider>,
    );

    expect(screen.getAllByTestId('mock-logo')[0]).toBeInTheDocument();
    expect(screen.getByTestId('mock-profile-switcher')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('handles window resize and cleans up listeners', () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <AppContext.Provider value={{ state: mockAppState, dispatch: mockDispatch } as any}>
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      </AppContext.Provider>,
    );

    // Mock resize to mobile width
    act(() => {
      window.innerWidth = 600;
      fireEvent(window, new Event('resize'));
    });

    expect(screen.getByRole('button', { name: /toggle navigation menu/i })).toBeInTheDocument();

    // Unmount and ensure cleanup
    unmount();

    // Simulate resize after unmount
    act(() => {
      window.innerWidth = 1024;
      fireEvent(window, new Event('resize'));
    });

    // Component should be unmounted, no errors should occur
    expect(
      screen.queryByRole('button', { name: /toggle navigation menu/i }),
    ).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows plot boards when feature flag is enabled', () => {
    (useFeatureFlag as any).mockReturnValue(true);

    render(
      <AppContext.Provider value={{ state: mockAppState, dispatch: mockDispatch } as any}>
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      </AppContext.Provider>,
    );

    expect(screen.getByText('Plot Boards')).toBeInTheDocument();
  });

  it('handles dark mode toggle', () => {
    render(
      <AppContext.Provider value={{ state: mockAppState, dispatch: mockDispatch } as any}>
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      </AppContext.Provider>,
    );

    const darkModeButton = screen.getByRole('button', { name: /toggle dark mode/i });
    fireEvent.click(darkModeButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_THEME',
      payload: 'dark',
    });
  });

  it('shows extra UI elements when user has current project', () => {
    const stateWithProject = {
      ...mockAppState,
      projects: [
        {
          id: '1',
          name: 'Test Project',
        },
      ],
      currentProjectId: '1',
    };

    render(
      <AppContext.Provider value={{ state: stateWithProject, dispatch: mockDispatch } as any}>
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      </AppContext.Provider>,
    );

    // Use the header badge project name (more specific)
    expect(screen.getAllByText('Test Project').length).toBeGreaterThan(0);
    expect(screen.getByTitle('Export Project (⌘E)')).toBeInTheDocument();
  });
});
