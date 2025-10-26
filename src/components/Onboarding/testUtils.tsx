import React from 'react';
import { vi } from 'vitest';

/**
 * Mock storage implementation for testing
 */
export function makeMockStorage() {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

/**
 * Test wrapper that provides tour context
 */
export function TestTourWrapper({ children }: { children: React.ReactNode }) {
  return <div data-testid="tour-wrapper">{children}</div>;
}
