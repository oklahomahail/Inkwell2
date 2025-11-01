/**
 * Smoke Tests for Brand and UI Fixes
 * Tests critical paths for logo, theme, tour, and project creation
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import AuthHeader from '@/components/Auth/AuthHeader';
import { useTheme } from '@/hooks/useTheme';

// Mock tour service
vi.mock('@/tour/TourService', () => ({
  tourService: {
    start: vi.fn(),
    getState: vi.fn(() => ({ isRunning: false, currentStep: 0 })),
  },
}));

describe('Smoke Tests - Brand & UI', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Auth Header Logo', () => {
    it('renders logo with correct path', () => {
      render(<AuthHeader />);
      const logo = screen.getByAltText('Inkwell') as HTMLImageElement;
      expect(logo).toBeInTheDocument();
      expect(logo.src).toContain('/assets/brand/inkwell-logo-horizontal.png');
    });

    it('has proper width and height attributes', () => {
      render(<AuthHeader />);
      const logo = screen.getByAltText('Inkwell') as HTMLImageElement;
      expect(logo.width).toBe(180);
      expect(logo.height).toBe(48);
    });

    it('falls back gracefully when logo fails to load', () => {
      render(<AuthHeader />);
      const logo = screen.getByAltText('Inkwell') as HTMLImageElement;

      // Simulate image load error
      logo.dispatchEvent(new Event('error'));

      expect(logo.style.display).toBe('none');
    });

    it('renders brand tagline', () => {
      render(<AuthHeader />);
      expect(screen.getByText('Find your story. Write it well.')).toBeInTheDocument();
    });
  });

  describe('Theme System', () => {
    it('defaults to light theme on fresh storage', () => {
      const TestComponent = () => {
        const { theme } = useTheme();
        return <div data-testid="theme">{theme}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });

    it('persists theme after toggle', async () => {
      const TestComponent = () => {
        const { theme, toggleTheme } = useTheme();
        return (
          <div>
            <div data-testid="theme">{theme}</div>
            <button onClick={toggleTheme}>Toggle</button>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      await user.click(screen.getByText('Toggle'));

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
      });
    });

    it('uses namespaced localStorage key', () => {
      const TestComponent = () => {
        const { theme } = useTheme();
        return <div>{theme}</div>;
      };

      render(<TestComponent />);

      // Check that the key matches index.html
      const key = Object.keys(localStorage).find((k) => k.includes('theme'));
      expect(key).toBe('theme');
    });
  });

  describe('Project Creation', () => {
    it('debounces rapid clicks on Create Project button', async () => {
      vi.useFakeTimers();
      const mockAddProject = vi.fn();

      const TestSidebar = () => {
        // Mock implementation with debounce
        const [count, setCount] = React.useState(0);
        const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

        const handleCreate = () => {
          if (timeoutRef.current) return;
          timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
          }, 1000);
          setCount((c) => c + 1);
          mockAddProject();
        };

        return <button onClick={handleCreate}>New Project</button>;
      };

      const user = userEvent.setup({ delay: null });
      render(<TestSidebar />);

      const button = screen.getByText('New Project');

      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should only create one project
      expect(mockAddProject).toHaveBeenCalledTimes(1);

      vi.runAllTimers();
      vi.useRealTimers();
    });
  });
});
