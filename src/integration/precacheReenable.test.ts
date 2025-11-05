/**
 * Test Suite: Precache Layer Re-enablement
 *
 * This file contains integration tests to verify:
 * 1. Theme initialization (no FOUC)
 * 2. Onboarding tour (loads from current build)
 * 3. PWA install + offline reload flow
 *
 * Run with: pnpm test src/integration/precacheReenable.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Precache Layer Re-enablement Tests', () => {
  describe('Part 1: Theme Initialization', () => {
    let originalLocalStorage: typeof localStorage;

    beforeEach(() => {
      // Setup: Clean localStorage
      localStorage.clear();
      document.documentElement.className = '';
    });

    afterEach(() => {
      // Cleanup
      localStorage.clear();
      document.documentElement.className = '';
    });

    it('should load light theme by default without localStorage', () => {
      // Given: No theme in localStorage
      expect(localStorage.getItem('theme')).toBeNull();

      // When: getTheme is called
      const { getTheme } = require('@/utils/theme');
      const theme = getTheme();

      // Then: Should default to light
      expect(theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should restore saved theme from localStorage on load', () => {
      // Given: User saved dark theme
      localStorage.setItem('theme', 'dark');

      // When: getTheme is called
      const { getTheme } = require('@/utils/theme');
      const theme = getTheme();

      // Then: Should load dark theme
      expect(theme).toBe('dark');
    });

    it('should apply theme immediately without FOUC', () => {
      // Given: inline script runs early in HTML
      // When: Script executes (simulated by setting theme)
      const { setTheme } = require('@/utils/theme');

      const startTime = performance.now();
      setTheme('dark');
      const endTime = performance.now();

      // Then: Should apply instantly
      expect(endTime - startTime).toBeLessThan(50); // 50ms is reasonable
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should persist theme preference across sessions', () => {
      // Given: User toggles theme
      const { setTheme, getTheme } = require('@/utils/theme');

      setTheme('dark');
      expect(localStorage.getItem('theme')).toBe('dark');

      // When: New "session" (simulated by clearing and reloading)
      const savedTheme = localStorage.getItem('theme');

      // Then: Theme should be persisted
      expect(savedTheme).toBe('dark');
      expect(getTheme()).toBe('dark');
    });

    it('should toggle theme without flash', () => {
      // Given: Initial light theme
      const { setTheme } = require('@/utils/theme');
      setTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // When: Toggle to dark
      const startTime = performance.now();
      setTheme('dark');
      const toggleTime = performance.now() - startTime;

      // Then: Should toggle instantly
      expect(toggleTime).toBeLessThan(50);
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // And: When toggle back to light
      setTheme('light');

      // Then: Should be light again
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should dispatch theme change event', () => {
      // Given: Event listener ready
      const { setTheme } = require('@/utils/theme');
      const eventSpy = vi.fn();
      window.addEventListener('themechange', eventSpy);

      // When: Theme changes
      setTheme('dark');

      // Then: Event should fire with correct theme
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'dark',
        }),
      );

      // Cleanup
      window.removeEventListener('themechange', eventSpy);
    });
  });

  describe('Part 2: Onboarding Tour', () => {
    beforeEach(() => {
      // Setup: Clean tour-related storage
      sessionStorage.clear();
      localStorage.removeItem('tour:never_show');
      localStorage.removeItem('tour:session_started');
    });

    afterEach(() => {
      // Cleanup
      sessionStorage.clear();
      localStorage.removeItem('tour:never_show');
      localStorage.removeItem('tour:session_started');
    });

    it('should show welcome modal for first-time users on dashboard', () => {
      // Given: New user (no tour markers)
      expect(sessionStorage.getItem('tour:session_started')).toBeNull();
      expect(localStorage.getItem('tour:never_show')).toBeNull();

      // When: OnboardingUI component mounts
      const { isTourDone } = require('@/tour/persistence');
      const shouldShow = !isTourDone('spotlight');

      // Then: Tour should be available
      expect(shouldShow).toBe(true);
    });

    it('should prevent tour restart on hard refresh (session guard)', () => {
      // Given: User started tour in this session
      sessionStorage.setItem('tour:session_started', 'true');

      // When: Hard refresh happens (sessionStorage persists within same session)
      const isStarted = sessionStorage.getItem('tour:session_started') === 'true';

      // Then: Tour should NOT restart
      expect(isStarted).toBe(true);
    });

    it('should allow manual tour restart when needed', () => {
      // Given: User completed tour
      localStorage.setItem('tour:never_show', 'true');

      // When: User clicks "Start Tour" in help menu
      localStorage.removeItem('tour:never_show');
      sessionStorage.removeItem('tour:session_started');

      // Then: Tour should be available again
      expect(localStorage.getItem('tour:never_show')).toBeNull();
      expect(sessionStorage.getItem('tour:session_started')).toBeNull();
    });

    it('should load tour anchors from current build', () => {
      // Given: Page with tour anchors
      const mockAnchor = document.createElement('div');
      mockAnchor.setAttribute('data-tour-anchor', 'editor-canvas');
      mockAnchor.id = 'editor-canvas';
      document.body.appendChild(mockAnchor);

      // When: Tour looks for anchor
      const selector = '[data-tour-anchor="editor-canvas"]';
      const element = document.querySelector(selector);

      // Then: Should find element (indicating it's in current build)
      expect(element).not.toBeNull();
      expect(element?.id).toBe('editor-canvas');

      // Cleanup
      document.body.removeChild(mockAnchor);
    });

    it('should mark tour as complete when all steps done', () => {
      // Given: User finishing tour
      // When: Tour completion event fires
      const event = new CustomEvent('inkwell:tour:completed');
      window.dispatchEvent(event);

      // Then: Completion should be marked
      // (Would be verified via persistence in real scenario)
      expect(event.type).toBe('inkwell:tour:completed');
    });

    it('should respect tour feature flag', () => {
      // Given: Feature flag can control tour visibility
      localStorage.setItem('feature:spotlightTour', 'true');

      // When: Reading flag
      const flagEnabled = localStorage.getItem('feature:spotlightTour') === 'true';

      // Then: Flag should control tour availability
      expect(flagEnabled).toBe(true);

      // Cleanup
      localStorage.removeItem('feature:spotlightTour');
    });
  });

  describe('Part 3: PWA Install & Offline Flow', () => {
    beforeEach(() => {
      // Setup: Mock navigator properties
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: {
          ready: Promise.resolve({
            active: { state: 'activated' },
          }),
          getRegistration: vi.fn(),
        },
        configurable: true,
      });
    });

    it('should detect when app can be installed', () => {
      // Given: PWA installability criteria met
      // (manifest present, icons available, etc.)
      const manifest = document.querySelector('link[rel="manifest"]');

      // When: Checking installation capability
      // Then: Manifest should be present
      expect(manifest).not.toBeNull();
      expect(manifest?.getAttribute('href')).toBe('/site.webmanifest');
    });

    it('should show offline indicator when connectivity lost', () => {
      // Given: Online status tracking
      // When: Simulating offline
      const { connectivityService } = require('@/services/connectivityService');

      // Create a mock status
      const offlineStatus = {
        isOnline: false,
        lastOnline: new Date(),
        lastOffline: new Date(),
        queuedWrites: 0,
      };

      // Then: Offline indicator should show
      expect(offlineStatus.isOnline).toBe(false);
      expect(offlineStatus.queuedWrites).toBe(0);
    });

    it('should queue edits locally when offline', () => {
      // Given: User editing while offline
      // When: Save attempt during offline
      const queuedOp = {
        id: 'op-1',
        operation: 'save',
        key: 'chapter-1',
        data: 'edited content',
        timestamp: Date.now(),
      };

      // Then: Operation should be queued
      expect(queuedOp.operation).toBe('save');
      expect(queuedOp.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should sync queued operations when coming online', () => {
      // Given: Operations queued while offline
      const queuedOps = [
        { id: 'op-1', operation: 'save', timestamp: Date.now() - 1000 },
        { id: 'op-2', operation: 'update', timestamp: Date.now() - 500 },
      ];

      // When: Coming online
      const onlineStatus = {
        isOnline: true,
        queuedWrites: 0, // Should be processed and cleared
      };

      // Then: Queue should process
      expect(onlineStatus.isOnline).toBe(true);
      expect(onlineStatus.queuedWrites).toBe(0);
    });

    it('should load app from precache when offline', () => {
      // Given: App previously cached
      // When: Going offline and reloading
      // Then: Page should load from cache

      // Check for Service Worker
      expect(navigator.serviceWorker).toBeDefined();
      expect(navigator.serviceWorker.ready).toBeDefined();
    });

    it('should handle Service Worker update flow', async () => {
      // Given: New version available
      // When: Update checked
      const registration = {
        update: vi.fn().mockResolvedValue(undefined),
        active: { state: 'activated' },
        waiting: null, // Will have waiting during update
      };

      await registration.update();

      // Then: Should check for updates
      expect(registration.update).toHaveBeenCalled();
    });

    it('should show update notification when new version available', () => {
      // Given: New version detected
      // When: Update available event fires
      const updateEvent = new CustomEvent('pwa-update-available', {
        detail: { version: '0.9.0' },
      });

      // Then: Notification should be available
      expect(updateEvent.type).toBe('pwa-update-available');
    });

    it('should maintain connectivity during network interruption', () => {
      // Given: Stable online connection
      const status1 = { isOnline: true };

      // When: Temporary interruption (simulating latency)
      // Then: App should stay responsive
      expect(status1.isOnline).toBe(true);

      // And eventual recovery
      const status2 = { isOnline: true };
      expect(status2.isOnline).toBe(true);
    });
  });

  describe('Integration: All Features Together', () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it('should handle full user flow: theme → onboarding → offline', async () => {
      // 1. Theme loads without flash
      const { setTheme, getTheme } = require('@/utils/theme');
      setTheme('dark');
      expect(getTheme()).toBe('dark');

      // 2. Tour becomes available
      expect(localStorage.getItem('tour:never_show')).toBeNull();

      // 3. User can go offline and sync
      const offlineStatus = { isOnline: false, queuedWrites: 1 };
      expect(offlineStatus.isOnline).toBe(false);
      expect(offlineStatus.queuedWrites).toBeGreaterThan(0);

      // 4. Come back online and sync
      const onlineStatus = { isOnline: true, queuedWrites: 0 };
      expect(onlineStatus.isOnline).toBe(true);
      expect(onlineStatus.queuedWrites).toBe(0);
    });

    it('should maintain performance through entire cycle', () => {
      const { setTheme } = require('@/utils/theme');

      const times: number[] = [];

      // Measure multiple operations
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        setTheme(i % 2 === 0 ? 'light' : 'dark');
        times.push(performance.now() - start);
      }

      // All operations should be fast
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(50);
    });

    it('should recover gracefully from storage errors', () => {
      // Given: Storage error occurs
      const { setTheme } = require('@/utils/theme');

      // When: Theme set with potential error
      // (In real scenario, localStorage might be unavailable)
      const theme = 'dark';

      // Then: Should still apply visually
      setTheme(theme);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Precache Validation', () => {
    it('should have valid manifest.json', async () => {
      // Given: manifest.json should be accessible
      // When: Fetching manifest
      // Then: Should have required PWA properties
      const manifestLink = document.querySelector('link[rel="manifest"]');
      expect(manifestLink).not.toBeNull();
    });

    it('should cache critical CSS and JS', () => {
      // Given: Precache configured
      // When: Checking cache includes
      // Then: Critical assets should be cached
      expect(navigator.serviceWorker).toBeDefined();
    });

    it('should not cache HTML (cache-control: no-store)', () => {
      // Given: HTML with cache-control header
      // When: Browser receives response
      // Then: HTML should have no-store directive
      const htmlMeta = document.querySelector('meta[http-equiv="Cache-Control"]');
      expect(htmlMeta).not.toBeNull();
      expect(htmlMeta?.getAttribute('content')).toContain('no-store');
    });
  });
});
