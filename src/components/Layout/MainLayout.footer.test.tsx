// @type unit
// @domain layout
// MainLayout Footer - Behavioral Tests
// Tests user-visible footer behavior, not implementation details

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import MainLayout from './MainLayout';

// Mock the entire AppContext to avoid provider dependencies
vi.mock('@/context/AppContext', () => ({
  View: {
    Dashboard: 'dashboard',
    Writing: 'writing',
    Planning: 'planning',
    Timeline: 'timeline',
    Analysis: 'analysis',
    Settings: 'settings',
    PlotBoards: 'plotboards',
  },
  useAppContext: () => ({
    state: {
      view: 'dashboard',
      projects: [],
      currentProjectId: null,
    },
    dispatch: vi.fn(),
  }),
}));

// Mock the PWA component that's causing issues
vi.mock('../PWA', () => ({
  PWAOfflineIndicator: () => <div data-testid="pwa-indicator">PWA Indicator</div>,
}));

// Mock the ProfileSwitcher component
vi.mock('../ProfileSwitcher', () => ({
  ProfileSwitcher: () => <div data-testid="profile-switcher">Profile</div>,
}));

// Mock the Logo component
vi.mock('@/components/Logo', () => ({
  default: ({ variant, size }: { variant: string; size: number }) => (
    <div data-testid={`logo-${variant}`} style={{ width: size, height: size }}>
      Logo {variant}
    </div>
  ),
}));

// Mock feature flags
vi.mock('@/utils/flags', () => ({
  useFeatureFlag: () => false,
}));

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

const mockSessionStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock window.matchMedia for dark mode detection
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn(() => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })),
});

describe('MainLayout Footer', () => {
  it('should render footer with complete Inkwell branding', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );

    // Check for footer landmark - this is what screen readers and users expect
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    // Check for complete branding within the footer - the user-visible behavior that matters
    const footerInkwellText = screen.getAllByText('Inkwell').find((el) => footer.contains(el));
    expect(footerInkwellText).toBeInTheDocument();
    expect(screen.getByText('by')).toBeInTheDocument();
    expect(screen.getByText('Nexus Partners')).toBeInTheDocument();

    // Logo should be visible as part of branding
    const logos = screen.getAllByTestId('logo-svg-feather-gold');
    expect(logos.length).toBeGreaterThanOrEqual(1);
  });

  it('should position footer at the bottom of the layout', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );

    const footer = screen.getByRole('contentinfo');
    const main = footer.closest('main');

    // Test the essential layout behavior - footer should be at bottom
    // We test this through the flex container structure that achieves it
    expect(main).toHaveClass('flex', 'flex-col');
    expect(footer).toHaveClass('mt-auto');
  });
});
