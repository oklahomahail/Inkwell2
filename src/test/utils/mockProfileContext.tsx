// src/test/utils/mockProfileContext.tsx
// This file sets up mocks for the ProfileContext

import { vi } from 'vitest';

// Default mock value for the profile context
export const mockProfileContext = {
  profiles: [],
  activeProfile: null,
  isLoading: false,
  error: null,
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  deleteProfile: vi.fn(),
  setActiveProfile: vi.fn(),
  getProfileById: vi.fn(),
  loadProfiles: vi.fn(),
  isPersisted: false,
};

// Set up the mock for the ProfileContext module
vi.mock('../../context/ProfileContext', () => ({
  useProfileContext: () => mockProfileContext,
  useProfile: () => ({ profile: mockProfileContext.activeProfile }),
}));
