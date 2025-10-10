// src/components/Layout/MainLayout.footer.test.tsx
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
  it('should render the footer with Inkwell branding', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );

    // Check for footer element
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();

    // Check for branding text within footer
    const inkwellTexts = screen.getAllByText('Inkwell');
    const footerInkwell = inkwellTexts.find((el) => footer.contains(el));
    expect(footerInkwell).toBeInTheDocument();

    expect(screen.getByText('by')).toBeInTheDocument();
    expect(screen.getByText('Nexus Partners')).toBeInTheDocument();

    // Check for logo (should have multiple with same test ID)
    const logos = screen.getAllByTestId('logo-svg-feather-gold');
    expect(logos.length).toBeGreaterThanOrEqual(1);
  });

  it('should position footer at bottom of main content', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );

    const footer = screen.getByRole('contentinfo');
    const main = footer.closest('main');

    // Check that main has flex classes
    expect(main).toHaveClass('flex', 'flex-col');

    // Check that footer has mt-auto class for bottom positioning
    expect(footer).toHaveClass('mt-auto');
  });

  it('should have proper styling for both light and dark modes', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );

    const footer = screen.getByRole('contentinfo');

    // Check for theme-aware classes
    expect(footer).toHaveClass(
      'border-t',
      'border-slate-200',
      'dark:border-slate-700',
      'bg-white/50',
      'dark:bg-slate-800/50',
      'backdrop-blur-sm',
    );
  });

  it('should center the branding content', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );

    // Find the footer and then the branding container within it
    const footer = screen.getByRole('contentinfo');
    const brandingContainer = footer.querySelector('.flex.items-center.justify-center');
    expect(brandingContainer).toBeInTheDocument();
    expect(brandingContainer).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('should have appropriate text sizing and spacing', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>,
    );

    // Find the footer and then the branding container within it
    const footer = screen.getByRole('contentinfo');
    const brandingContainer = footer.querySelector('.flex.items-center.justify-center');

    // Check text sizing
    expect(brandingContainer).toHaveClass('text-sm');

    // Check gap between elements
    expect(brandingContainer).toHaveClass('gap-3');
  });
});
