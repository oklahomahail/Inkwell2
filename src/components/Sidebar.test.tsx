// File: src/components/Sidebar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { View } from '@/context/AppContext';
import { TestWrapper } from '@/test-utils/component-mocks';

import Sidebar from './Sidebar';

// Keep icon replacement lightweight
vi.mock('@/components/icons', () => ({
  InkwellFeather: vi.fn(({ name, size, color, ...props }) => (
    <span data-testid={`icon-${name}`} data-size={size} data-color={color} {...props} />
  )),
}));

// Optional: if Sidebar uses focus helpers, keep them inert
vi.mock('@/utils/focusUtils', () => ({
  focusWritingEditor: vi.fn(),
}));

// If your component calls useUI directly, we don't need to mock the module;
// TestWrapper supplies a real UIContext. If you prefer to lock props, you can add:
// vi.mock('@/hooks/useUI', async (orig) => {
//   const mod = await orig();
//   return { ...mod, useUI: () => ({ sidebarCollapsed: false, toggleSidebar: vi.fn() }) };
// });

describe('Sidebar Component', () => {
  const renderWithProviders = (opts?: {
    appView?: View;
    uiCollapsed?: boolean;
    toggle?: () => void;
  }) => {
    const appState = { view: opts?.appView ?? View.Dashboard };
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

    // Label text should match your actual button labels in Sidebar
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /writing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /planning/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /timeline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analysis/i })).toBeInTheDocument(); // "Analysis", not "Analytics"
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

    // Match the actual active classes used in your Sidebar component
    expect(writingButton).toHaveClass('bg-indigo-50');
    expect(writingButton).toHaveClass('text-indigo-600');
  });

  it('toggles collapsed state', () => {
    const toggleSidebar = vi.fn();
    renderWithProviders({ uiCollapsed: false, toggle: toggleSidebar });

    // Match the aria-label/title you use on the collapse trigger
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
      expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    });

    it('shows navigation labels when expanded', () => {
      renderWithProviders({ uiCollapsed: false });
      const dashboardText = screen.getByText(/dashboard/i);
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
