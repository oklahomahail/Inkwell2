// File: src/components/Sidebar.test.tsx
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { View, initialState } from '@/context/AppContext';
import { TestWrapper } from '@/test-utils/component-mocks';

import { Sidebar } from './Sidebar';

vi.mock('@/context/ClaudeProvider', () => ({
  _useClaude: vi.fn(() => ({
    claude: null,
    sendMessage: vi.fn(),
    clearMessages: vi.fn(),
    toggleVisibility: vi.fn(),
    configureApiKey: vi.fn(),
    suggestContinuation: vi.fn(),
    improveText: vi.fn(),
    analyzeWritingStyle: vi.fn(),
    generatePlotIdeas: vi.fn(),
    analyzeCharacter: vi.fn(),
    brainstormIdeas: vi.fn(),
  })),
}));

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Keep icon replacement lightweight
vi.mock('@/components/icons', () => ({
  InkwellFeather: vi.fn(({ name, size, color, ...props }) => (
    <span data-testid={`icon-${name}`} data-size={size} data-color={color} {...props} />
  )),
}));

// Keep focusHelper inert
vi.mock('@/utils/focusUtils', () => ({
  focusWritingEditor: vi.fn(),
  _focusWritingEditor: vi.fn(),
}));

// Mock UI context - passthrough actual so TestWrapper can provide UIContext
vi.mock('@/hooks/useUI', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return { ...actual };
});

describe('Sidebar Component', () => {
  const renderWithProviders = (opts?: {
    appView?: View;
    uiCollapsed?: boolean;
    toggle?: () => void;
  }) => {
    const appState = {
      ...initialState,
      view: opts?.appView ?? View.Dashboard,
    };
    const ui = {
      sidebarCollapsed: Boolean(opts?.uiCollapsed),
      toggleSidebar: opts?.toggle ?? vi.fn(),
    };
    return render(
      <TestWrapper appState={appState} ui={ui}>
        <Sidebar />
      </TestWrapper>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation items', () => {
    renderWithProviders();

    // Label text should match actual button labels in Sidebar
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /writing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /planning/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /timeline/i })).toBeInTheDocument();
    // UI label is "Analytics"
    expect(screen.getByRole('button', { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('renders InkwellFeather icon with correct props for Planning view', () => {
    renderWithProviders();
    const planningIcon = screen.getByTestId('icon-planning');
    expect(planningIcon).toBeInTheDocument();
    expect(planningIcon).toHaveAttribute('data-size', 'sm');
  });

  it('highlights the active view', () => {
    renderWithProviders({ appView: View.Writing });
    const writingButton = screen.getByRole('button', { name: /writing/i });
    // Match the actual active classes used in Sidebar (updated to brand colors)
    expect(writingButton).toHaveClass('bg-ink-50');
    expect(writingButton).toHaveClass('text-ink-700');
    expect(writingButton).toHaveClass('font-medium');
  });

  it('toggles collapsed state', () => {
    const toggleSidebar = vi.fn();
    renderWithProviders({ uiCollapsed: false, toggle: toggleSidebar });

    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggleButton);
    expect(toggleSidebar).toHaveBeenCalled();
  });

  it('handles view change click without error', () => {
    renderWithProviders();
    const writingButton = screen.getByRole('button', { name: /writing/i });
    expect(() => fireEvent.click(writingButton)).not.toThrow();
  });

  describe('Collapsed State', () => {
    it('hides navigation labels when collapsed', () => {
      renderWithProviders({ uiCollapsed: true });
      const nav = screen.getByRole('navigation');
      // When collapsed, labels are hidden; ensure no visible "Dashboard" text inside nav
      expect(within(nav).queryByText(/dashboard/i)).not.toBeInTheDocument();
    });

    it('shows navigation labels when expanded', () => {
      renderWithProviders({ uiCollapsed: false });
      const nav = screen.getByRole('navigation');
      // Scope to nav to avoid matching the footer "Current: dashboard"
      const dashboardText = within(nav).getByText(/dashboard/i);
      expect(dashboardText).not.toHaveClass('hidden');
    });

    it('adds correct classes for collapsed state', () => {
      const { container } = renderWithProviders({ uiCollapsed: true });
      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveClass('w-14');
      expect(aside).not.toHaveClass('w-64');
    });
  });
});
