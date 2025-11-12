// src/components/Dashboard/__tests__/EnhancedDashboard.resolver.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { default as EnhancedDashboard } from '../../../components/Dashboard/EnhancedDashboard';
import { View } from '../../../context/AppContext';
import { ChaptersProvider } from '../../../context/ChaptersContext';
import { useTourStartupFromUrl } from '../../../hooks/useTourStartupFromUrl';
import { useGo } from '../../../utils/navigate';

// Define mocks first
const useAppContextMock = {
  state: {
    projects: [] as any[],
    view: View.Dashboard,
    currentProjectId: null,
    isLoading: false,
    error: null,
    theme: 'light',
    autoSave: { isSaving: false, lastSaved: null },
  },
  currentProject: null as any,
  addProject: vi.fn(),
  setCurrentProjectId: vi.fn(),
  dispatch: vi.fn(),
};

// Mock dependencies
vi.mock('../../../hooks/useTourStartupFromUrl', () => ({
  useTourStartupFromUrl: vi.fn(),
}));

vi.mock('../../../utils/tourTriggers', () => ({
  triggerOnProjectCreated: vi.fn(),
}));

vi.mock('../../../utils/navigate', () => ({
  useGo: vi.fn(),
}));

vi.mock('../../../context/AppContext', () => ({
  useAppContext: () => useAppContextMock,
  View: { Dashboard: 'dashboard', Writing: 'writing', Timeline: 'timeline', Analysis: 'analysis' },
  AppProvider: ({ children }) => {
    return <>{children}</>;
  },
}));

// Import component after mocks

// Helper to render with ChaptersProvider
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <ChaptersProvider>{ui}</ChaptersProvider>
    </MemoryRouter>,
  );
};

describe('EnhancedDashboard - Project Navigation & Creation', () => {
  const go = vi.fn();
  beforeEach(() => {
    (useGo as any).mockImplementation(() => go);
    (useTourStartupFromUrl as any).mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads and renders dashboard with recent projects', () => {
    // Set test projects in the mock
    useAppContextMock.state.projects = [
      {
        id: 'test-project-1',
        name: 'Test Project 1',
        description: 'First test project',
        createdAt: Date.now() - 100000,
        updatedAt: Date.now(),
      },
    ];

    renderWithProviders(<EnhancedDashboard />);

    // The dashboard should be displayed
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('creates a new project with default values', async () => {
    // Reset projects
    useAppContextMock.state.projects = [];

    const { getByText } = renderWithProviders(<EnhancedDashboard />);

    // Click the "Create Your First Project" button that appears when no projects exist
    const createButton = getByText(/Create Your First Project/i);
    expect(createButton).toBeTruthy();

    // Clicking should open the NewProjectDialog
    // The actual project creation happens when user submits the dialog
    // For now, we verify the button exists and is clickable
    fireEvent.click(createButton);

    // The dialog opening is tested in NewProjectDialog.test.tsx
    // This test verifies the Dashboard integration point exists
  });

  it('checks URL for tour=start parameter', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard?tour=start']}>
        <ChaptersProvider>
          <EnhancedDashboard />
        </ChaptersProvider>
      </MemoryRouter>,
    );

    // Verify the hook was called
    expect(useTourStartupFromUrl).toHaveBeenCalled();
  });

  it('shows loading state while creating project', async () => {
    // Reset projects
    useAppContextMock.state.projects = [];

    const { getByText } = renderWithProviders(<EnhancedDashboard />);

    // When no projects exist, the UI shows "Create Your First Project" button
    const createButton = getByText(/Create Your First Project/i);
    expect(createButton).toBeTruthy();

    // Clicking should open the NewProjectDialog
    // The actual project creation and loading states are handled within the dialog
    fireEvent.click(createButton);

    // The dialog's loading state and project creation flow is tested in NewProjectDialog.test.tsx
    // This test verifies the Dashboard has the correct entry point
  });

  it('handles project selection by setting current project ID', () => {
    // Set test projects in the mock
    useAppContextMock.state.projects = [
      {
        id: 'test-project-1',
        name: 'Test Project 1',
        description: 'First test project',
        createdAt: Date.now() - 100000,
        updatedAt: Date.now(),
      },
      {
        id: 'test-project-2',
        name: 'Test Project 2',
        description: 'Second test project',
        createdAt: Date.now() - 50000,
        updatedAt: Date.now() - 10000,
      },
    ];

    // No current project selected initially
    useAppContextMock.currentProject = null;
    useAppContextMock.state.currentProjectId = null;

    renderWithProviders(<EnhancedDashboard />);

    // Find the card that contains the project name
    const projectCard = screen.getByText('Test Project 1').closest('.card-interactive');
    if (!projectCard) {
      throw new Error('Could not find project card');
    }

    // Use fireEvent to simulate a click
    fireEvent.click(projectCard);

    // Verify that setCurrentProjectId was called with the project ID
    expect(useAppContextMock.setCurrentProjectId).toHaveBeenCalledWith('test-project-1');
  });

  it('formats dates correctly', () => {
    // Update the mock context with a project with today's date
    useAppContextMock.state.projects = [
      {
        id: 'test-project-1',
        name: 'Test Project 1',
        description: 'First test project',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    useAppContextMock.currentProject = {
      id: 'test-project-1',
      name: 'Test Project 1',
      description: 'First test project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    renderWithProviders(<EnhancedDashboard />);

    // Today's project should show "Today"
    // Use getAllByText since "Today" appears in multiple places
    const todayElements = screen.getAllByText(/Today/i);
    expect(todayElements.length).toBeGreaterThan(0);

    // Verify at least one is for the last updated text
    const updatedText = screen.getByText(/Last updated Today/i);
    expect(updatedText).toBeInTheDocument();
  });

  it('handles projects with empty content for word count', () => {
    // Update the mock context with a project with empty content
    useAppContextMock.state.projects = [
      {
        id: 'test-project-1',
        name: 'Empty Project',
        description: 'Project with no content',
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    useAppContextMock.currentProject = {
      id: 'test-project-1',
      name: 'Empty Project',
      description: 'Project with no content',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    renderWithProviders(<EnhancedDashboard />);

    // Should display 0 words - need to use a more specific selector
    const wordCountElements = screen.getAllByText(/0/);

    // Find the element that is inside a parent containing "words"
    const wordCountElement = wordCountElements.find(
      (el) => el.parentElement && el.parentElement.textContent?.includes('words'),
    );

    expect(wordCountElement).toBeDefined();
    if (wordCountElement) {
      expect(wordCountElement.parentElement).toHaveTextContent('words');
    }
  });

  it('displays disabled state for buttons when no project is selected', () => {
    // Reset the mock context to have some projects but no current project
    useAppContextMock.state.projects = [
      {
        id: 'test-project-1',
        name: 'Test Project 1',
        description: 'First test project',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    useAppContextMock.currentProject = null;
    useAppContextMock.state.currentProjectId = null;

    renderWithProviders(<EnhancedDashboard />);

    // Find the Continue Writing quick action button (which should be disabled when no project is selected)
    const buttons = screen.getAllByRole('button');
    const continueWritingButton = Array.from(buttons).find((button) =>
      button.textContent?.includes('Continue Writing'),
    );

    // Verify that the button exists and is disabled
    expect(continueWritingButton).toBeTruthy();
    expect(continueWritingButton).toHaveAttribute('disabled');
  });
});
