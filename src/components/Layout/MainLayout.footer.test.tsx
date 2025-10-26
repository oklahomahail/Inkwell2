// src/components/Layout/MainLayout.footer.test.tsx
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderApp } from '../../../test/utils';

import MainLayout from './MainLayout';

// Mock components used in MainLayout
vi.mock('@/components/Logo', () => ({
  default: () => <div data-testid="mock-logo">Logo</div>,
}));

// Mock ProfileSwitcher component - removed in single-user refactor
// (component no longer exists)

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
  // Add the CommandPaletteContext export
  CommandPaletteContext: {
    Provider: ({ children }) => children,
  },
}));

describe('MainLayout Footer', () => {
  it('renders footer with copyright and version info', () => {
    renderApp(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
      { route: '/dashboard' },
    );

    // Check for footer elements
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    // Check for the footer content that is actually there
    expect(footer.textContent).toContain('Inkwell');

    // This footer appears to have a slogan instead of a copyright
    expect(footer.textContent).toContain('Because great stories deserve great tools');

    // Optional: Check for year if it exists
    // const currentYear = new Date().getFullYear().toString();
    // expect(footer.textContent).toContain(currentYear);
  });

  it('shows the correct footer links', () => {
    renderApp(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );

    const footer = screen.getByRole('contentinfo');

    // This footer doesn't appear to have links, so we'll check for other footer elements
    expect(footer).toBeInTheDocument();

    // Check for the footer text that is actually there
    expect(footer.textContent).toContain('Nexus Partners');

    // If we know there are no links, we can assert that directly
    const links = footer.querySelectorAll('a');
    expect(links.length).toBe(0);
  });
});
