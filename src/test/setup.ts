import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import 'cross-fetch/polyfill';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock console methods while preserving their functionality
const originalConsole = { ...console };
beforeEach(() => {
  console.log = vi.fn((...args) => {
    originalConsole.log(...args);
  });
  console.error = vi.fn((...args) => {
    originalConsole.error(...args);
  });
  console.warn = vi.fn((...args) => {
    originalConsole.warn(...args);
  });
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;

  // Clean up React Testing Library
  cleanup();

  // Clear all mocks
  vi.clearAllMocks();

  // Reset timers
  vi.useRealTimers();

  // Clear local/session storage
  if (typeof window !== 'undefined') {
    Object.keys(window.localStorage).forEach((key) => window.localStorage.removeItem(key));
    Object.keys(window.sessionStorage).forEach((key) => window.sessionStorage.removeItem(key));
  }
});

// Set up common test data
vi.stubGlobal('APP_VERSION', '1.0.0');
vi.stubGlobal('BUILD_TIME', '2025-01-01T00:00:00Z');
vi.stubGlobal('COMMIT_HASH', 'test-commit-hash');

// Set up common test utilities
declare global {
  var sleep: (ms: number) => Promise<void>;
  var mockDate: (isoDate: string) => Date;
  var mockNow: () => number;
}

global.sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
global.mockDate = (isoDate: string) => {
  const date = new Date(isoDate);
  vi.setSystemTime(date);
  return date;
};
global.mockNow = () => new Date('2025-01-01T00:00:00Z').getTime();
