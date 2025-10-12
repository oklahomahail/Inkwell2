import React from 'react';
import { vi } from 'vitest';

import { ProfileProvider } from '@/context/ProfileContext';

import { ProfileTourProvider } from './ProfileTourProvider';
import { TourProvider } from './TourProvider';

/**
 * Mock storage implementation for tests
 */
export const makeMockStorage = () => {
  const store: Record<string, string> = {};
  return {
    store,
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};

/**
 * Test component wrapper
 */
export const TestTourWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProfileProvider>
    <ProfileTourProvider>
      <TourProvider>{children}</TourProvider>
    </ProfileTourProvider>
  </ProfileProvider>
);
