// src/components/Sidebar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Sidebar from './Sidebar';

const mockFocusWritingEditor = vi.fn();
const defaultMockUI = { sidebarCollapsed: false, toggleSidebar: vi.fn() };
const defaultMockState = { view: 'Dashboard' };
let mockUI = { ...defaultMockUI };
let mockState = { ...defaultMockState };
const mockDispatch = vi.fn();

vi.mock('@/utils/focusUtils', () => ({
  focusWritingEditor: mockFocusWritingEditor,
}));

vi.mock('@/hooks/useUI', () => ({
  useUI: () => mockUI,
}));

vi.mock('@/context/AppContext', () => ({
  View: {
    Dashboard: 'Dashboard',
    Writing: 'Writing',
    Planning: 'Planning',
    Timeline: 'Timeline',
    Analysis: 'Analysis',
    Settings: 'Settings',
  },
  useAppContext: () => ({ state: mockState, dispatch: mockDispatch }),
}));

vi.mock('@/components/Brand/Brand', () => ({
  Brand: ({ collapsed }: { collapsed?: boolean }) => (
    <div data-testid="brand" data-collapsed={collapsed ? 'true' : 'false'} />
  ),
}));

vi.mock('@/components/icons', () => ({
  InkwellFeather: vi.fn(({ name, size, color, ...props }) => (
    <span data-testid={`icon-${name}`} data-size={size} data-color={color} {...props} />
  )),
}));

describe('Sidebar Component', () => {
  const renderSidebar = (mocks = {}) => {
    mockUI = mocks.ui ? { ...defaultMockUI, ...mocks.ui } : { ...defaultMockUI };
    mockState = mocks.state ? { ...defaultMockState, ...mocks.state } : { ...defaultMockState };
    return render(<Sidebar />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('renders all navigation items', () => {
    renderSidebar();

    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /writing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /planning/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /timeline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('renders InkwellFeather icon with correct props for Planning view', () => {
    renderSidebar();
    const planningIcon = screen.getByTestId('icon-planning');
    expect(planningIcon).toBeInTheDocument();
    expect(planningIcon).toHaveAttribute('data-size', 'sm');
  });

  it('highlights the active view', () => {
    renderSidebar({ state: { view: 'Writing' } });
    const writingButton = screen.getByRole('button', { name: /writing/i });
    expect(writingButton).toHaveClass('bg-indigo-50', 'text-indigo-600');
  });

  it('toggles collapsed state', () => {
    const toggleSidebar = vi.fn();
    renderSidebar({ ui: { ...defaultMockUI, toggleSidebar } });

    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggleButton);

    expect(toggleSidebar).toHaveBeenCalled();
  });

  it('handles view change click without error', () => {
    renderSidebar();
    const writingButton = screen.getByRole('button', { name: /writing/i });

    expect(() => fireEvent.click(writingButton)).not.toThrow();
  });

  describe('Collapsed State', () => {
    it('hides navigation labels when collapsed', () => {
      renderSidebar({ ui: { sidebarCollapsed: true, toggleSidebar: vi.fn() } });

      const dashboardText = screen.queryByText('Dashboard');
      expect(dashboardText).not.toBeInTheDocument();
    });

    it('shows navigation labels when expanded', () => {
      renderSidebar({ ui: { sidebarCollapsed: false, toggleSidebar: vi.fn() } });

      const dashboardText = screen.getByText('Dashboard');
      expect(dashboardText).toBeInTheDocument();
    });

    it('adds correct classes for collapsed state', () => {
      const { container } = renderSidebar({
        uiState: { sidebarCollapsed: true, toggleSidebar: vi.fn() },
      });

      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('w-14');
    });
  });
});
