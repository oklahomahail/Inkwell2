import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { AppProvider, useAppContext, View } from './AppContext';

it('throws when used outside provider', () => {
  expect(() => renderHook(() => useAppContext())).toThrow(
    'useAppContext must be used within an AppProvider',
  );
});

it('provides default state', () => {
  const { result } = renderHook(() => useAppContext(), {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
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

it('handles basic actions', () => {
  const { result } = renderHook(() => useAppContext(), {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });

  act(() => {
    result.current.setView(View.Writing);
  });
  expect(result.current.state.view).toBe(View.Writing);

  act(() => {
    result.current.setTheme('dark');
  });
  expect(result.current.state.theme).toBe('dark');

  const mockProject = {
    id: '1',
    name: 'Test Project',
    description: 'Test Description',
    chapters: {},
    characters: [],
    beatSheet: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  act(() => {
    result.current.addProject(mockProject);
  });
  expect(result.current.state.projects).toHaveLength(1);
  expect(result.current.state.projects[0]).toEqual(mockProject);

  const updatedProject = { ...mockProject, name: 'Updated Name' };
  act(() => {
    result.current.updateProject(updatedProject);
  });
  expect(result.current.state.projects[0].name).toBe('Updated Name');

  act(() => {
    result.current.setCurrentProjectId('1');
  });
  expect(result.current.state.currentProjectId).toBe('1');
  expect(result.current.currentProject).toEqual(updatedProject);

  act(() => {
    result.current.deleteProject('1');
  });
  expect(result.current.state.projects).toHaveLength(0);
  expect(result.current.state.currentProjectId).toBeNull();
});

it('handles autosave state', () => {
  const { result } = renderHook(() => useAppContext(), {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });

  act(() => {
    result.current.setAutoSaveSaving(true);
  });
  expect(result.current.state.autoSave.isSaving).toBe(true);

  const savedDate = new Date();
  act(() => {
    result.current.setAutoSaveSuccess(savedDate);
  });
  expect(result.current.state.autoSave).toEqual({
    isSaving: false,
    lastSaved: savedDate,
    error: null,
  });

  act(() => {
    result.current.setAutoSaveError('Failed to save');
  });
  expect(result.current.state.autoSave.error).toBe('Failed to save');
  expect(result.current.state.autoSave.isSaving).toBe(false);
});
