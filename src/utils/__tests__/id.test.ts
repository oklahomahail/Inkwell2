import { describe, it, expect } from 'vitest';

import { generateId } from '../id';

describe('generateId', () => {
  it('returns a string of the expected length', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThanOrEqual(8);
  });

  it('can apply a prefix when provided', () => {
    const id = generateId('ink');
    expect(id.startsWith('ink_')).toBe(true);
  });

  it('produces reasonably unique values', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId()));
    expect(ids.size).toBe(200);
  });
});
