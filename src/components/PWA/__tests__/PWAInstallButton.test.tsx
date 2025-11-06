import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { pwaService } from '../../../services/pwaService';
import { PWAInstallButton } from '../PWAInstallButton';

// Define mock values and functions outside the mock for easy manipulation in tests
const mockInstallApp = vi.fn().mockResolvedValue(true);
let mockCanInstall = false; // Start with false to test appearing behavior
const mockListeners: (() => void)[] = [];

// Function to manipulate the mock canInstall state
const setCanInstall = (value: boolean) => {
  mockCanInstall = value;
};

// Function to trigger install prompt event
const simulateInstallPrompt = () => {
  mockCanInstall = true;
  mockListeners.forEach((listener) => listener());
};

// Mock the pwaService and usePWA hook
vi.mock('../../../services/pwaService', () => {
  return {
    pwaService: {
      onInstallPromptReady: vi.fn((callback) => {
        mockListeners.push(callback);
        // Call with initial state if can install
        if (mockCanInstall) {
          callback();
        }
        return () => {
          const index = mockListeners.indexOf(callback);
          if (index !== -1) {
            mockListeners.splice(index, 1);
          }
        };
      }),
      // Function to trigger install prompt for testing
      simulateInstallPrompt: () => simulateInstallPrompt(),
    },
    usePWA: () => ({
      installApp: mockInstallApp,
      canInstall: mockCanInstall,
      updateApp: vi.fn(),
      isOffline: false,
      isOfflineReady: false,
      needsRefresh: false,
    }),
  };
});

describe('PWAInstallButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanInstall = false; // Reset for each test
    mockListeners.length = 0; // Clear listeners
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering variants', () => {
    it('renders nothing when prompt is not available', () => {
      const { container } = render(<PWAInstallButton />);

      // The component should render nothing initially
      expect(container).toBeEmptyDOMElement();
    });

    it('renders button variant when install prompt is available', async () => {
      // Set canInstall to true before rendering
      setCanInstall(true);

      const { rerender } = render(<PWAInstallButton />);

      // Trigger install prompt
      await act(async () => {
        simulateInstallPrompt();
      });

      // Force re-render to reflect state change
      rerender(<PWAInstallButton />);

      // Look for the install text which should be in the button
      expect(screen.getByText('Install App')).toBeInTheDocument();
      const buttonElement = screen.getByText('Install App').closest('button');
      expect(buttonElement).toHaveClass('bg-blue-600');
    });

    it('renders fab variant when install prompt is available', async () => {
      // Set canInstall to true before rendering
      setCanInstall(true);

      await act(async () => {
        render(<PWAInstallButton variant="fab" />);
      });

      // Look for the install text which should be in the FAB
      expect(screen.getByText('Install App')).toBeInTheDocument();
      const buttonElement = screen.getByText('Install App').closest('button');
      expect(buttonElement).toHaveClass('rounded-full');
    });

    it('renders banner variant when install prompt is available', async () => {
      // Set canInstall to true before rendering
      setCanInstall(true);

      await act(async () => {
        render(<PWAInstallButton variant="banner" />);
      });

      // Banner should show multiple elements
      expect(screen.getByText('Install Inkwell App')).toBeInTheDocument();
      expect(screen.getByText('Maybe Later')).toBeInTheDocument();
      expect(screen.getByText('Install Now')).toBeInTheDocument();
    });
  });

  describe('Installation process', () => {
    it('calls installApp when button is clicked', async () => {
      // Reset the mock function before test
      mockInstallApp.mockClear().mockResolvedValue(true);

      // Set canInstall to true to make the button appear
      setCanInstall(true);

      await act(async () => {
        render(<PWAInstallButton />);
      });

      // Find button by text
      const installButton = screen.getByText('Install App').closest('button');
      expect(installButton).toBeInTheDocument();

      // Click the install button
      await act(async () => {
        fireEvent.click(installButton!);
      });

      // Check that the install function was called
      expect(mockInstallApp).toHaveBeenCalledTimes(1);
    });

    it('shows loading state during installation', async () => {
      // Create a promise that we can resolve manually
      let resolveInstall: (value: boolean) => void;
      const installPromise = new Promise<boolean>((resolve) => {
        resolveInstall = resolve;
      });

      // Setup the mock to return our controlled promise
      mockInstallApp.mockClear().mockReturnValue(installPromise);
      setCanInstall(true);

      await act(async () => {
        render(<PWAInstallButton />);
      });

      const installButton = screen.getByText('Install App').closest('button');

      // Click the install button to start the installation process
      await act(async () => {
        fireEvent.click(installButton!);
      });

      // Check for Installing text as indicator of loading state
      expect(screen.getByText('Installing...')).toBeInTheDocument();

      // Resolve the install promise
      await act(async () => {
        resolveInstall!(true);
      });
    });

    it('shows loading state in fab variant during installation', async () => {
      let resolveInstall: (value: boolean) => void;
      const installPromise = new Promise<boolean>((resolve) => {
        resolveInstall = resolve;
      });

      mockInstallApp.mockClear().mockReturnValue(installPromise);
      setCanInstall(true);

      await act(async () => {
        render(<PWAInstallButton variant="fab" />);
      });

      const installButton = screen.getByLabelText('Install Inkwell app');

      await act(async () => {
        fireEvent.click(installButton);
      });

      // Check for loading spinner in fab variant
      expect(screen.getByText('Installing...')).toBeInTheDocument();

      await act(async () => {
        resolveInstall!(true);
      });
    });

    it('shows loading state in banner variant during installation', async () => {
      let resolveInstall: (value: boolean) => void;
      const installPromise = new Promise<boolean>((resolve) => {
        resolveInstall = resolve;
      });

      mockInstallApp.mockClear().mockReturnValue(installPromise);
      setCanInstall(true);

      await act(async () => {
        render(<PWAInstallButton variant="banner" />);
      });

      const installButton = screen.getByText('Install Now').closest('button');

      await act(async () => {
        fireEvent.click(installButton!);
      });

      // Check for loading text in banner variant
      expect(screen.getByText('Installing...')).toBeInTheDocument();

      await act(async () => {
        resolveInstall!(true);
      });
    });

    it('calls onInstall callback when installation completes', async () => {
      // Setup callback and mock
      const onInstall = vi.fn();
      mockInstallApp.mockClear().mockResolvedValue(true);
      setCanInstall(true);

      await act(async () => {
        render(<PWAInstallButton onInstall={onInstall} />);
      });

      const installButton = screen.getByText('Install App').closest('button');

      // Click the install button
      await act(async () => {
        fireEvent.click(installButton!);
        // Wait for the mock install promise to resolve
        await Promise.resolve();
      });

      // Check callback was called with success=true
      expect(onInstall).toHaveBeenCalledWith(true);
    });

    it('calls onDismiss callback when dismissed', async () => {
      // Setup dismiss callback
      const onDismiss = vi.fn();
      setCanInstall(true);

      await act(async () => {
        render(<PWAInstallButton variant="banner" onDismiss={onDismiss} />);
      });

      // Find the "Maybe Later" button
      const dismissButton = screen.getByText('Maybe Later');

      // Click the dismiss button
      await act(async () => {
        fireEvent.click(dismissButton);
      });

      // Check dismiss callback was called
      expect(onDismiss).toHaveBeenCalled();
    });

    it('handles installation errors', async () => {
      // Setup callback and error mock
      const onInstall = vi.fn();
      const testError = new Error('Installation failed');
      mockInstallApp.mockClear().mockRejectedValue(testError);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      setCanInstall(true);

      await act(async () => {
        render(<PWAInstallButton onInstall={onInstall} />);
      });

      const installButton = screen.getByText('Install App').closest('button');

      // Click the install button
      await act(async () => {
        fireEvent.click(installButton!);
        // Wait for the mock install promise to reject
        await Promise.resolve().catch(() => {});
      });

      // Check error was logged and callback was called with failure
      expect(consoleSpy).toHaveBeenCalledWith('Install failed:', testError);
      expect(onInstall).toHaveBeenCalledWith(false);

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup and event handling', () => {
    it('unsubscribes from install prompt ready on unmount', () => {
      // Setup spy for the unsubscribe function
      const unsubscribeSpy = vi.fn();
      vi.spyOn(pwaService, 'onInstallPromptReady').mockReturnValue(unsubscribeSpy);

      const { unmount } = render(<PWAInstallButton />);

      // Unmount the component
      unmount();

      // Check that the unsubscribe function was called
      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
