import { describe, it, expect } from 'vitest';

import { generateId, generateUUID, idUtils } from '../id';

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

describe('generateUUID', () => {
  it('returns a string matching UUID format', () => {
    const uuid = generateUUID();
    expect(typeof uuid).toBe('string');
    // Check for UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where y is 8, 9, a, or b
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('produces unique UUIDs', () => {
    const uuids = new Set(Array.from({ length: 100 }, () => generateUUID()));
    expect(uuids.size).toBe(100);
  });
});

describe('idUtils', () => {
  it('generates project IDs with proper prefix', () => {
    const id = idUtils.project();
    expect(id.startsWith('proj_')).toBe(true);
  });

  it('generates chapter IDs with proper prefix', () => {
    const id = idUtils.chapter();
    expect(id.startsWith('chap_')).toBe(true);
  });

  it('generates scene IDs with proper prefix', () => {
    const id = idUtils.scene();
    expect(id.startsWith('scene_')).toBe(true);
  });

  it('generates session IDs with proper prefix', () => {
    const id = idUtils.session();
    expect(id.startsWith('session_')).toBe(true);
  });

  it('generates backup IDs with proper prefix', () => {
    const id = idUtils.backup();
    expect(id.startsWith('backup_')).toBe(true);
  });
});
