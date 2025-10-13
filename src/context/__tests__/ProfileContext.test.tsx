import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { ProfileProvider, useProfile, useProfileContext } from '../ProfileContext';

const mockDate = new Date('2025-01-01T00:00:00.000Z');
vi.setSystemTime(mockDate);

// Mock localStorage

// Mock localStorage
const mockStorage: { [key: string]: string } = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock uuid with controllable mock
const mockV4 = vi.fn(() => 'test-uuid');
vi.mock('uuid', () => ({
  v4: () => mockV4(),
}));

// Test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ProfileProvider>{children}</ProfileProvider>;
}

describe('ProfileContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockV4.mockClear();
    vi.clearAllMocks();
    // Reset date for each test
    vi.setSystemTime(mockDate);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      expect(result.current.profiles).toEqual([]);
      expect(result.current.activeProfile).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should load profiles from localStorage on mount', async () => {
      const mockProfiles: Profile[] = [
        {
          id: '1',
          name: 'Test Profile',
          displayName: 'Test Profile',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          color: 'hsl(180, 70%, 50%)',
        },
      ];

      localStorageMock.setItem('inkwell_profiles', JSON.stringify(mockProfiles));
      localStorageMock.setItem('inkwell_active_profile', '1');

      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      // Wait for useEffect to run
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.profiles).toHaveLength(1);
      expect(result.current.profiles[0].id).toBe('1');
      expect(result.current.activeProfile?.id).toBe('1');
    });
  });

  describe('Profile Management', () => {
    it('should create a new profile', async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      const name = 'Test Profile';
      await act(async () => {
        await result.current.createProfile(name);
      });

      expect(result.current.profiles).toHaveLength(1);
      expect(result.current.profiles[0].name).toBe(name);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('inkwell_profiles', expect.any(String));
    });

    it('should not create duplicate profiles', async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      const name = 'Test Profile';
      await act(async () => {
        // Create first profile
        const profile1 = await result.current.createProfile(name);
        expect(profile1).toMatchObject({ id: 'test-uuid', name, displayName: name });

        // Try creating duplicate profile
        const profile2 = await result.current.createProfile(name);
        expect(profile2).toEqual(profile1);
      });

      expect(result.current.profiles).toHaveLength(1);
    });

    it('should update a profile', async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        // First create a profile
        const profile = await result.current.createProfile('Test Profile');
        expect(profile.id).toBe('test-uuid');

        // Then update it
        const updatedProfile = await result.current.updateProfile(profile.id, {
          displayName: 'Updated Profile',
        });

        // Verify the update immediately after update
        expect(updatedProfile.displayName).toBe('Updated Profile');
      });

      expect(result.current.profiles).toHaveLength(1);
      expect(result.current.profiles[0].displayName).toBe('Updated Profile');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('inkwell_profiles', expect.any(String));
    });

    it('should throw when updating non-existent profile', async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await expect(
          result.current.updateProfile('non-existent', { displayName: 'Test' }),
        ).rejects.toThrow('Profile not found');
      });
    });

    it('should delete a profile', async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      let profile1: Profile;
      let profile2: Profile;

      await act(async () => {
        // Return distinct ids for the two profiles
        mockV4.mockImplementationOnce(() => 'profile-1').mockImplementationOnce(() => 'profile-2');

        // Create two profiles
        profile1 = await result.current.createProfile('Profile 1');
        profile2 = await result.current.createProfile('Profile 2');

        // Set first profile as active
        await result.current.setActiveProfile(profile1.id);

        // Delete first profile
        await result.current.deleteProfile(profile1.id);
      });

      // Verify only second profile remains
      expect(result.current.profiles).toHaveLength(1);
      expect(result.current.profiles[0].id).toBe(profile2.id);
      expect(result.current.activeProfile).toBeNull();

      expect(result.current.profiles).toHaveLength(1);
      expect(result.current.profiles[0].name).toBe('Profile 2');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('inkwell_profiles', expect.any(String));
    });

    it('should not delete last profile', async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        const profile = await result.current.createProfile('Test Profile');
        await expect(result.current.deleteProfile(profile.id)).rejects.toThrow(
          'Cannot delete the last profile',
        );
      });
    });
  });

  describe('Active Profile Management', () => {
    it('should set active profile', async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        const profile = await result.current.createProfile('Test Profile');
        await result.current.setActiveProfile(profile.id);
      });

      expect(result.current.activeProfile?.name).toBe('Test Profile');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'inkwell_active_profile',
        expect.any(String),
      );
    });

    it('should clear active profile', async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        const profile = await result.current.createProfile('Test Profile');
        await result.current.setActiveProfile(profile.id);
        result.current.clearActiveProfile();
      });

      expect(result.current.activeProfile).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('inkwell_active_profile');
    });

    it('should handle missing active profile gracefully', async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      // Silence the intermediate warn emitted during retry logic
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        await result.current.setActiveProfile('non-existent');
      });

      expect(errorSpy).toHaveBeenCalledWith(
        'Profile not found after reload attempts:',
        'non-existent',
      );
      expect(result.current.activeProfile).toBeNull();

      // Restore spies
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load profiles from storage:',
        expect.any(Error),
      );
      expect(result.current.error).toBe(null);
      expect(result.current.profiles).toEqual([]);
    });

    it('should handle storage save errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.createProfile('Test Profile');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save profiles to storage:',
        expect.any(Error),
      );
    });

    it('should throw when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useProfileContext());
      }).toThrow('useProfileContext must be used within a ProfileProvider');
      consoleSpy.mockRestore();
    });
  });

  describe('useProfile Hook', () => {
    it('should provide active profile information', async () => {
      const { result } = renderHook(() => useProfile(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        const profile = await result.current.createProfile('Test Profile');
        await result.current.setActiveProfile(profile.id);
      });

      expect(result.current.active?.name).toBe('Test Profile');
      expect(result.current.activeProfileId).toBe('test-uuid');
    });

    it('should handle no active profile', () => {
      const { result } = renderHook(() => useProfile(), {
        wrapper: TestWrapper,
      });

      expect(result.current.active).toBeNull();
      expect(result.current.activeProfileId).toBeNull();
    });
  });

  describe('Profile Loading', () => {
    it('should handle loading state', async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.loadProfiles();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should recover active profile on reload', async () => {
      const { result } = renderHook(() => useProfileContext(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        const profile = await result.current.createProfile('Test Profile');
        await result.current.setActiveProfile(profile.id);
        await result.current.loadProfiles();
      });

      expect(result.current.activeProfile?.name).toBe('Test Profile');
    });
  });
});
