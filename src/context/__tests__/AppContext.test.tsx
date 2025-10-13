import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import {
  AppProvider,
  useAppContext,
  useCurrentProject,
  useUIReady,
  View,
  type Project,
} from '../AppContext';

// Mock localStorage
const mockStorage: { [key: string]: string } = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock ClaudeProvider
vi.mock('../ClaudeProvider', () => ({
  useClaude: () => ({
    claude: { initialized: true },
    sendMessage: vi.fn(async (msg: string) => `Response to: ${msg}`),
    clearMessages: vi.fn(),
    toggleVisibility: vi.fn(),
    configureApiKey: vi.fn(),
    // Leave these helpers undefined to trigger fallback to sendMessage
    suggestContinuation: undefined,
    improveText: undefined,
    analyzeWritingStyle: undefined,
    generatePlotIdeas: undefined,
    analyzeCharacter: undefined,
    brainstormIdeas: undefined,
  }),
}));

// Test Wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

describe('AppContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      expect(result.current.state).toMatchObject({
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
      });
    });

    it('should load initial state from localStorage if available', () => {
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Test Project',
          description: 'Test Description',
          chapters: {},
          characters: [],
          beatSheet: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      localStorageMock.setItem('inkwell_projects', JSON.stringify(mockProjects));
      localStorageMock.setItem('inkwell_current_project_id', '1');

      const { result } = renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      expect(result.current.state.projects).toEqual(mockProjects);
      expect(result.current.state.currentProjectId).toBe('1');
    });
  });

  describe('Project Management', () => {
    const testProject: Project = {
      id: '1',
      name: 'Test Project',
      description: 'Test Description',
      chapters: {},
      characters: [],
      beatSheet: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should add a project', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.addProject(testProject);
      });

      expect(result.current.state.projects).toContainEqual(testProject);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'inkwell_projects',
        JSON.stringify([testProject]),
      );
    });

    it('should update a project', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.addProject(testProject);
      });

      const updatedProject = { ...testProject, name: 'Updated Project' };
      act(() => {
        result.current.updateProject(updatedProject);
      });

      expect(result.current.state.projects[0].name).toBe('Updated Project');
    });

    it('should delete a project', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.addProject(testProject);
      });

      act(() => {
        result.current.deleteProject(testProject.id);
      });

      expect(result.current.state.projects).toHaveLength(0);
    });

    it('should clear currentProjectId when deleting current project', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.addProject(testProject);
        result.current.setCurrentProjectId(testProject.id);
      });

      act(() => {
        result.current.deleteProject(testProject.id);
      });

      expect(result.current.state.currentProjectId).toBeNull();
    });
  });

  describe('View Management', () => {
    it('should update view', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setView(View.Writing);
      });

      expect(result.current.state.view).toBe(View.Writing);
    });
  });

  describe('Theme Management', () => {
    it('should update theme', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.state.theme).toBe('dark');
    });
  });

  describe('Auto Save Management', () => {
    it('should handle auto save states', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setAutoSaveSaving(true);
      });
      expect(result.current.state.autoSave.isSaving).toBe(true);

      const now = new Date();
      act(() => {
        result.current.setAutoSaveSuccess(now);
      });
      expect(result.current.state.autoSave.lastSaved).toBe(now);
      expect(result.current.state.autoSave.isSaving).toBe(false);
      expect(result.current.state.autoSave.error).toBeNull();

      act(() => {
        result.current.setAutoSaveError('Failed to save');
      });
      expect(result.current.state.autoSave.error).toBe('Failed to save');
      expect(result.current.state.autoSave.isSaving).toBe(false);
    });
  });

  describe('Claude Integration', () => {
    it('should provide claude actions', async () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      const response = await result.current.claudeActions.sendMessage('test');
      expect(response).toBe('Response to: test');

      // Test fallback behavior for specialized methods
      const continuation = await result.current.claudeActions.suggestContinuation('text');
      expect(continuation).toBe('Response to: Suggest a continuation for: text');

      const improvement = await result.current.claudeActions.improveText('text', 'clarity');
      expect(improvement).toBe(
        'Response to: Please improve this text with the goal of clarity: text',
      );

      const analysis = await result.current.claudeActions.analyzeWritingStyle('text');
      expect(analysis).toBe('Response to: Analyze the writing style of: text');

      const plotIdeas = await result.current.claudeActions.generatePlotIdeas('prompt');
      expect(plotIdeas).toBe('Response to: Generate plot ideas for: prompt');

      const characterAnalysis = await result.current.claudeActions.analyzeCharacter('character');
      expect(characterAnalysis).toBe('Response to: Please analyze this character: character');

      const ideas = await result.current.claudeActions.brainstormIdeas('topic');
      expect(ideas).toBe('Response to: Brainstorm ideas about: topic');
    });

    it('should handle all claude action methods', () => {
      const { result } = renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      result.current.claudeActions.clearMessages();
      result.current.claudeActions.toggleVisibility();
      result.current.claudeActions.configureApiKey('test-key');

      // Verify the methods exist and can be called
      expect(result.current.claudeActions.clearMessages).toBeDefined();
      expect(result.current.claudeActions.toggleVisibility).toBeDefined();
      expect(result.current.claudeActions.configureApiKey).toBeDefined();
    });
  });

  describe('Hook Error Cases', () => {
    it('should throw when useAppContext is used outside provider', () => {
      // Suppress error logging for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        const { result } = renderHook(() => useAppContext());
      }).toThrow('useAppContext must be used within an AppProvider');

      consoleSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      renderHook(() => useAppContext(), {
        wrapper: TestWrapper,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse projects from localStorage:',
        expect.any(Error),
      );
    });
  });

  describe('useCurrentProject Hook', () => {
    it('should return current project when set', () => {
      const testProject: Project = {
        id: '1',
        name: 'Test Project',
        description: 'Test Description',
        chapters: {},
        characters: [],
        beatSheet: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const { result } = renderHook(
        () => {
          const app = useAppContext();
          const cp = useCurrentProject();
          return { app, cp };
        },
        {
          wrapper: TestWrapper,
        },
      );

      act(() => {
        result.current.app.addProject(testProject);
        result.current.app.setCurrentProjectId(testProject.id);
      });

      expect(result.current.cp.project).toBeDefined();
      expect(result.current.cp.project?.id).toBe(testProject.id);
    });

    it('should return null when no current project', () => {
      const { result } = renderHook(() => useCurrentProject(), {
        wrapper: TestWrapper,
      });

      expect(result.current.project).toBeNull();
    });
  });

  describe('useUIReady Hook', () => {
    it('should return ready state based on loading and error', () => {
      const { result } = renderHook(
        () => {
          const app = useAppContext();
          const ui = useUIReady();
          return { app, ui };
        },
        {
          wrapper: TestWrapper,
        },
      );

      expect(result.current.ui.isReady).toBe(true);

      act(() => {
        result.current.app.dispatch({ type: 'SET_LOADING', payload: true });
      });

      expect(result.current.ui.isReady).toBe(false);
    });
  });
});
