import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  getRememberedProfileId,
  rememberProfileId,
  syncLastProfileToUserMetadata,
} from '../profileMemory';

const KEY = 'inkwell:lastProfileId';

describe('profileMemory', () => {
  const store: Record<string, string> = {};
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((k: string) => store[k] ?? null),
      setItem: vi.fn((k: string, v: string) => {
        store[k] = v;
      }),
      removeItem: vi.fn((k: string) => {
        delete store[k];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage);
  });

  it('returns null when nothing saved', () => {
    expect(getRememberedProfileId()).toBeNull();
  });

  it('persists and retrieves profile ID', () => {
    const profileId = 'profile-123';
    rememberProfileId(profileId);
    expect(localStorage.setItem).toHaveBeenCalledWith(KEY, profileId);
    expect(getRememberedProfileId()).toEqual(profileId);
  });

  it('syncs to user metadata without removing from localStorage', async () => {
    const profileId = 'profile-456';
    rememberProfileId(profileId);

    // syncLastProfileToUserMetadata doesn't remove from localStorage
    // It only syncs to Supabase user metadata
    await syncLastProfileToUserMetadata(profileId);

    // Profile ID should still be in localStorage
    expect(getRememberedProfileId()).toEqual(profileId);
  });
});
