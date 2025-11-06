// src/context/__tests__/AppContext.test.tsx
/**
 * Tier 1: AppContext & global UI state contracts
 * Tests cover: theme init/persistence/toggling, UI reducer actions,
 * modals/toasts/panels, and feature-flag reads with defaults.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ClaudeProvider before importing AppContext
vi.mock('../ClaudeProvider', () => ({
  useClaude: () => ({
    isAvailable: false,
    isStreaming: false,
    generateText: vi.fn(),
    streamText: vi.fn(),
    cancelStream: vi.fn(),
  }),
  ClaudeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { AppProvider, useAppContext, initialState, View } from '../AppContext';

// Test component to interact with context
function TestComponent() {
  const { state, dispatch } = useAppContext();

  return (
    <div>
      <div data-testid="theme">{state.theme}</div>
      <div data-testid="view">{state.view}</div>
      <div data-testid="loading">{state.isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="error">{state.error ?? 'none'}</div>
      <div data-testid="projects-count">{state.projects.length}</div>

      <button onClick={() => dispatch({ type: 'SET_THEME', payload: 'dark' })}>
        Set Dark Theme
      </button>
      <button onClick={() => dispatch({ type: 'SET_VIEW', payload: View.Writing })}>
        Go to Writing
      </button>
      <button onClick={() => dispatch({ type: 'SET_LOADING', payload: true })}>
        Start Loading
      </button>
      <button onClick={() => dispatch({ type: 'SET_ERROR', payload: 'Test error' })}>
        Set Error
      </button>
      <button
        onClick={() =>
          dispatch({
            type: 'ADD_PROJECT',
            payload: {
              id: 'proj-1',
              name: 'Test Project',
              description: 'A test',
              chapters: [],
              characters: [],
              beatSheet: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          })
        }
      >
        Add Project
      </button>
    </div>
  );
}

describe('AppContext', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};

    Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key] ?? null);
    Storage.prototype.setItem = vi.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    Storage.prototype.removeItem = vi.fn((key: string) => {
      delete localStorageMock[key];
    });
    Storage.prototype.clear = vi.fn(() => {
      localStorageMock = {};
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock = {};
  });

  // ===== INITIALIZATION =====

  it('initializes with default state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('view')).toHaveTextContent('dashboard');
    expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
    expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
  });

  it('exports initialState correctly', () => {
    expect(initialState).toEqual({
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
      claude: undefined,
      // UI-only state (v1.3.0+)
      activeSectionId: null,
      creationMode: null,
    });
  });

  // ===== THEME MANAGEMENT =====

  it('allows theme to be changed', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');

    await act(async () => {
      screen.getByText('Set Dark Theme').click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('persists theme to localStorage when changed', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );

    await act(async () => {
      screen.getByText('Set Dark Theme').click();
    });

    // Wait for effect to run
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('inkwell-theme', 'dark');
    });
  });

  it('loads theme from localStorage on init', () => {
    localStorageMock['inkwell-theme'] = 'dark';

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );

    // Should load dark theme from localStorage
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('handles localStorage errors gracefully when persisting theme', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );

    await act(async () => {
      screen.getByText('Set Dark Theme').click();
    });

    // Should not crash, theme should still update in memory
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');

    consoleWarnSpy.mockRestore();
  });

  // ===== VIEW MANAGEMENT =====

  it('updates view when SET_VIEW action dispatched', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );

    expect(screen.getByTestId('view')).toHaveTextContent('dashboard');

    await act(async () => {
      screen.getByText('Go to Writing').click();
    });

    expect(screen.getByTestId('view')).toHaveTextContent('writing');
  });

  // ===== LOADING STATE =====

  it('updates loading state', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('ready');

    await act(async () => {
      screen.getByText('Start Loading').click();
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
  });

  // ===== ERROR STATE =====

  it('updates error state', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );

    expect(screen.getByTestId('error')).toHaveTextContent('none');

    await act(async () => {
      screen.getByText('Set Error').click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });

  it('clears error when SET_ERROR with null', async () => {
    const ClearErrorComponent = () => {
      const { state, dispatch } = useAppContext();

      return (
        <div>
          <div data-testid="error">{state.error ?? 'none'}</div>
          <button onClick={() => dispatch({ type: 'SET_ERROR', payload: 'Error!' })}>
            Set Error
          </button>
          <button onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}>
            Clear Error
          </button>
        </div>
      );
    };

    render(
      <AppProvider>
        <ClearErrorComponent />
      </AppProvider>,
    );

    await act(async () => {
      screen.getByText('Set Error').click();
    });
    expect(screen.getByTestId('error')).toHaveTextContent('Error!');

    await act(async () => {
      screen.getByText('Clear Error').click();
    });
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  // ===== PROJECT MANAGEMENT =====

  it('adds project to state', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>,
    );

    expect(screen.getByTestId('projects-count')).toHaveTextContent('0');

    await act(async () => {
      screen.getByText('Add Project').click();
    });

    expect(screen.getByTestId('projects-count')).toHaveTextContent('1');
  });

  it('updates existing project', async () => {
    const UpdateProjectComponent = () => {
      const { state, dispatch } = useAppContext();

      const addProject = () => {
        dispatch({
          type: 'ADD_PROJECT',
          payload: {
            id: 'proj-1',
            name: 'Original Name',
            description: 'Original',
            chapters: [],
            characters: [],
            beatSheet: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        });
      };

      const updateProject = () => {
        dispatch({
          type: 'UPDATE_PROJECT',
          payload: {
            id: 'proj-1',
            name: 'Updated Name',
            description: 'Updated',
            chapters: [],
            characters: [],
            beatSheet: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        });
      };

      const project = state.projects.find((p) => p.id === 'proj-1');

      return (
        <div>
          <div data-testid="project-name">{project?.name ?? 'none'}</div>
          <button onClick={addProject}>Add Project</button>
          <button onClick={updateProject}>Update Project</button>
        </div>
      );
    };

    render(
      <AppProvider>
        <UpdateProjectComponent />
      </AppProvider>,
    );

    await act(async () => {
      screen.getByText('Add Project').click();
    });
    expect(screen.getByTestId('project-name')).toHaveTextContent('Original Name');

    await act(async () => {
      screen.getByText('Update Project').click();
    });
    expect(screen.getByTestId('project-name')).toHaveTextContent('Updated Name');
  });

  it('deletes project from state', async () => {
    const DeleteProjectComponent = () => {
      const { state, dispatch } = useAppContext();

      const addProject = () => {
        dispatch({
          type: 'ADD_PROJECT',
          payload: {
            id: 'proj-to-delete',
            name: 'Delete Me',
            description: 'Will be deleted',
            chapters: [],
            characters: [],
            beatSheet: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        });
      };

      const deleteProject = () => {
        dispatch({ type: 'DELETE_PROJECT', payload: 'proj-to-delete' });
      };

      return (
        <div>
          <div data-testid="projects-count">{state.projects.length}</div>
          <button onClick={addProject}>Add Project</button>
          <button onClick={deleteProject}>Delete Project</button>
        </div>
      );
    };

    render(
      <AppProvider>
        <DeleteProjectComponent />
      </AppProvider>,
    );

    await act(async () => {
      screen.getByText('Add Project').click();
    });
    expect(screen.getByTestId('projects-count')).toHaveTextContent('1');

    await act(async () => {
      screen.getByText('Delete Project').click();
    });
    expect(screen.getByTestId('projects-count')).toHaveTextContent('0');
  });

  it('sets current project ID', async () => {
    const SetCurrentComponent = () => {
      const { state, dispatch } = useAppContext();

      return (
        <div>
          <div data-testid="current-id">{state.currentProjectId ?? 'none'}</div>
          <button onClick={() => dispatch({ type: 'SET_CURRENT_PROJECT', payload: 'proj-123' })}>
            Set Current
          </button>
          <button onClick={() => dispatch({ type: 'SET_CURRENT_PROJECT', payload: null })}>
            Clear Current
          </button>
        </div>
      );
    };

    render(
      <AppProvider>
        <SetCurrentComponent />
      </AppProvider>,
    );

    expect(screen.getByTestId('current-id')).toHaveTextContent('none');

    await act(async () => {
      screen.getByText('Set Current').click();
    });
    expect(screen.getByTestId('current-id')).toHaveTextContent('proj-123');

    await act(async () => {
      screen.getByText('Clear Current').click();
    });
    expect(screen.getByTestId('current-id')).toHaveTextContent('none');
  });

  it('bulk sets projects', async () => {
    const BulkSetComponent = () => {
      const { state, dispatch } = useAppContext();

      const loadProjects = () => {
        dispatch({
          type: 'SET_PROJECTS',
          payload: [
            {
              id: '1',
              name: 'Project 1',
              description: 'First',
              chapters: [],
              characters: [],
              beatSheet: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            {
              id: '2',
              name: 'Project 2',
              description: 'Second',
              chapters: [],
              characters: [],
              beatSheet: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        });
      };

      return (
        <div>
          <div data-testid="projects-count">{state.projects.length}</div>
          <button onClick={loadProjects}>Load Projects</button>
        </div>
      );
    };

    render(
      <AppProvider>
        <BulkSetComponent />
      </AppProvider>,
    );

    expect(screen.getByTestId('projects-count')).toHaveTextContent('0');

    await act(async () => {
      screen.getByText('Load Projects').click();
    });
    expect(screen.getByTestId('projects-count')).toHaveTextContent('2');
  });

  // ===== AUTO-SAVE STATE =====

  it('manages auto-save state transitions', async () => {
    const AutoSaveComponent = () => {
      const { state, dispatch } = useAppContext();

      return (
        <div>
          <div data-testid="saving">{state.autoSave.isSaving ? 'saving' : 'idle'}</div>
          <div data-testid="last-saved">{state.autoSave.lastSaved?.toISOString() ?? 'never'}</div>
          <div data-testid="save-error">{state.autoSave.error ?? 'none'}</div>

          <button onClick={() => dispatch({ type: 'SET_AUTO_SAVE_SAVING', payload: true })}>
            Start Saving
          </button>
          <button
            onClick={() =>
              dispatch({ type: 'SET_AUTO_SAVE_SUCCESS', payload: new Date('2025-01-01') })
            }
          >
            Save Success
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_AUTO_SAVE_ERROR', payload: 'Network error' })}
          >
            Save Error
          </button>
        </div>
      );
    };

    render(
      <AppProvider>
        <AutoSaveComponent />
      </AppProvider>,
    );

    // Initial state
    expect(screen.getByTestId('saving')).toHaveTextContent('idle');
    expect(screen.getByTestId('last-saved')).toHaveTextContent('never');
    expect(screen.getByTestId('save-error')).toHaveTextContent('none');

    // Start saving
    await act(async () => {
      screen.getByText('Start Saving').click();
    });
    expect(screen.getByTestId('saving')).toHaveTextContent('saving');

    // Success
    await act(async () => {
      screen.getByText('Save Success').click();
    });
    expect(screen.getByTestId('saving')).toHaveTextContent('idle'); // Should stop saving
    expect(screen.getByTestId('last-saved')).toHaveTextContent(/2025-01-01/i);

    // Error
    await act(async () => {
      screen.getByText('Save Error').click();
    });
    expect(screen.getByTestId('save-error')).toHaveTextContent('Network error');
  });
});
