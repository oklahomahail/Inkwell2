import { describe, it, expect } from 'vitest';

import { generateId, _generateId, generateUUID, _generateUUID } from '../idUtils';

describe('idUtils', () => {
  describe('generateId', () => {
    it('should generate a string with default prefix', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.startsWith('id_')).toBe(true);
    });

    it('should generate a string with custom prefix', () => {
      const id = generateId('test');
      expect(typeof id).toBe('string');
      expect(id.startsWith('test_')).toBe(true);
    });

    it('should produce unique ids', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });

    it('should have timestamp and random components', () => {
      const id = generateId();
      const parts = id.split('_');
      expect(parts.length).toBe(3);
      // First part is prefix ('id'), second part is timestamp, third part is random
    });
  });

  describe('_generateId', () => {
    it('should directly generate a string with default prefix', () => {
      const id = _generateId();
      expect(typeof id).toBe('string');
      expect(id.startsWith('id_')).toBe(true);
    });

    it('should directly generate a string with custom prefix', () => {
      const id = _generateId('custom');
      expect(id.startsWith('custom_')).toBe(true);
    });
  });

  describe('generateUUID', () => {
    it('should generate a valid UUID string', () => {
      const uuid = generateUUID();
      expect(typeof uuid).toBe('string');
      // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y is 8, 9, a, or b
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set(Array.from({ length: 100 }, () => generateUUID()));
      expect(uuids.size).toBe(100);
    });
  });

  describe('_generateUUID', () => {
    it('should directly generate a valid UUID string', () => {
      const uuid = _generateUUID();
      // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y is 8, 9, a, or b
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });
});
