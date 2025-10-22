import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  getRememberedProfileId,
  rememberProfileId,
  syncLastProfileToUserMetadata,
} from '../profileMemory';

const KEY = 'inkwell:profile-memory';

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

  it('persists and retrieves structured data', () => {
    const data = { lastProfileId: 'p1', recent: ['p1'] };
    rememberProfileId(data);
    expect(JSON.parse((localStorage.setItem as any).mock.calls[0][1])).toEqual(data);
    expect(getRememberedProfileId()).toEqual(data);
  });

  it('clears memory', () => {
    rememberProfileId({ lastProfileId: 'x', recent: [] });
    syncLastProfileToUserMetadata('profile-123');
    expect(localStorage.removeItem).toHaveBeenCalledWith(KEY);
    expect(getRememberedProfileId()).toBeNull();
  });
});
