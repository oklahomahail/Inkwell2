import { vi } from 'vitest';

/**
 * Profile data structure for testing
 */
export interface TestProfile {
  id: string;
  name: string;
}

/**
 * Creates a test profile with default values
 */
export function createTestProfile(id = 'test-profile', name = 'Test Profile'): TestProfile {
  return { id, name };
}

/**
 * Creates multiple test profiles for multi-profile testing
 */
export function createTestProfiles(): TestProfile[] {
  return [
    createTestProfile('profile-1', 'Profile One'),
    createTestProfile('profile-2', 'Profile Two'),
    createTestProfile('profile-3', 'Profile Three'),
  ];
}

/**
 * Creates a mock for useProfile hook with an active profile
 * @param profile - The active profile, or null for no active profile
 */
export function mockUseProfile(profile: TestProfile | null = createTestProfile()) {
  return vi.fn(() => ({
    activeProfile: profile,
    profiles: profile ? [profile] : [],
    switchToProfile: vi.fn(),
    createProfile: vi.fn(),
    deleteProfile: vi.fn(),
    updateProfile: vi.fn(),
    isLoading: false,
    error: null,
  }));
}

/**
 * Creates a mock for useProfile hook with no active profile
 */
export function mockUseProfileInactive() {
  return mockUseProfile(null);
}

/**
 * Creates a mock for useProfile hook with multiple profiles
 * @param activeIndex - Index of the active profile in the list, or -1 for none
 */
export function mockUseProfileMultiple(activeIndex = 0) {
  const profiles = createTestProfiles();
  const activeProfile =
    activeIndex >= 0 && activeIndex < profiles.length ? profiles[activeIndex] : null;

  return vi.fn(() => ({
    activeProfile,
    profiles,
    switchToProfile: vi.fn(),
    createProfile: vi.fn(),
    deleteProfile: vi.fn(),
    updateProfile: vi.fn(),
    isLoading: false,
    error: null,
  }));
}

/**
 * Creates a mock for useProfile hook in loading state
 */
export function mockUseProfileLoading() {
  return vi.fn(() => ({
    activeProfile: null,
    profiles: [],
    switchToProfile: vi.fn(),
    createProfile: vi.fn(),
    deleteProfile: vi.fn(),
    updateProfile: vi.fn(),
    isLoading: true,
    error: null,
  }));
}

/**
 * Creates a mock for useProfile hook with error state
 */
export function mockUseProfileError(errorMessage = 'Profile error') {
  return vi.fn(() => ({
    activeProfile: null,
    profiles: [],
    switchToProfile: vi.fn(),
    createProfile: vi.fn(),
    deleteProfile: vi.fn(),
    updateProfile: vi.fn(),
    isLoading: false,
    error: new Error(errorMessage),
  }));
}
