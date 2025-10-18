import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

import { ProfileProvider, useProfileContext } from './ProfileContext';

describe('ProfileContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useProfileContext())).toThrow(
      'useProfileContext must be used within a ProfileProvider',
    );
  });

  it('handles active profile switching with proper cleanup', async () => {
    const { result, unmount } = renderHook(() => useProfileContext(), {
      wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
    });

    const saveProfileSpy = vi.spyOn(localStorage, 'setItem');
    const loadProfileSpy = vi.spyOn(localStorage, 'getItem');

    // Create initial profiles
    await act(async () => {
      await result.current.createProfile('Profile 1');
      await result.current.createProfile('Profile 2');
    });

    expect(result.current.profiles).toHaveLength(2);

    const profile1 = result.current.profiles[0];
    const profile2 = result.current.profiles[1];

    // Switch active profile
    await act(async () => {
      await result.current.setActiveProfile(profile1.id);
    });
    expect(result.current.activeProfile?.id).toBe(profile1.id);

    // Switch to another profile
    await act(async () => {
      await result.current.setActiveProfile(profile2.id);
    });
    expect(result.current.activeProfile?.id).toBe(profile2.id);

    // Storage should be called appropriate times
    expect(saveProfileSpy).toHaveBeenCalledTimes(3); // 2 creates + 2 active profile changes
    expect(loadProfileSpy).toHaveBeenCalled();

    // Unmount and ensure no more storage calls
    unmount();
    vi.runAllTimers();

    const finalSaveCount = saveProfileSpy.mock.calls.length;
    const finalLoadCount = loadProfileSpy.mock.calls.length;

    vi.advanceTimersByTime(1000);

    // No additional calls after unmount
    expect(saveProfileSpy).toHaveBeenCalledTimes(finalSaveCount);
    expect(loadProfileSpy).toHaveBeenCalledTimes(finalLoadCount);
  });

  it('handles no profiles with fallback', async () => {
    const { result } = renderHook(() => useProfileContext(), {
      wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
    });

    // Initially should have no profiles
    expect(result.current.profiles).toHaveLength(0);
    expect(result.current.activeProfile).toBeNull();

    // Try to set active profile when none exist
    await act(async () => {
      await result.current.setActiveProfile('non-existent-id');
    });

    // Should fallback gracefully
    expect(result.current.activeProfile).toBeNull();
    expect(result.current.error).toBeNull();

    // Create a profile and it should work
    await act(async () => {
      const profile = await result.current.createProfile('Test Profile');
      await result.current.setActiveProfile(profile.id);
    });

    expect(result.current.activeProfile).not.toBeNull();
    expect(result.current.profiles).toHaveLength(1);
  });
});
