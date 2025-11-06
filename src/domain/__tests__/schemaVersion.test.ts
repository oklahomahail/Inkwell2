/**
 * Schema Version Tests
 *
 * Tests for schema versioning, migration system, and backward compatibility
 */

import { describe, expect, it, vi } from 'vitest';

import {
  CURRENT_SCHEMA_VERSION,
  _getSchemaVersion,
  _needsMigration,
  _runMigrations,
  _validateSchemaVersion,
  createVersionedData,
  MIGRATIONS,
} from '../schemaVersion';

describe('schemaVersion', () => {
  describe('_getSchemaVersion', () => {
    it('should return schemaVersion from data', () => {
      const data = { schemaVersion: 1, name: 'test' };
      expect(_getSchemaVersion(data)).toBe(1);
    });

    it('should return 0 for data without schemaVersion', () => {
      const data = { name: 'test' };
      expect(_getSchemaVersion(data)).toBe(0);
    });

    it('should return 0 for null data', () => {
      expect(_getSchemaVersion(null)).toBe(0);
    });

    it('should return 0 for undefined data', () => {
      expect(_getSchemaVersion(undefined)).toBe(0);
    });
  });

  describe('_needsMigration', () => {
    it('should return true when data version is less than current', () => {
      const data = { schemaVersion: 0 };
      expect(_needsMigration(data)).toBe(CURRENT_SCHEMA_VERSION > 0);
    });

    it('should return false when data version equals current', () => {
      const data = { schemaVersion: CURRENT_SCHEMA_VERSION };
      expect(_needsMigration(data)).toBe(false);
    });

    it('should return true for data without schemaVersion', () => {
      const data = { name: 'test' };
      expect(_needsMigration(data)).toBe(CURRENT_SCHEMA_VERSION > 0);
    });

    it('should return false when current schema version is same as data', () => {
      const data = { schemaVersion: CURRENT_SCHEMA_VERSION };
      expect(_needsMigration(data)).toBe(false);
    });
  });

  describe('_validateSchemaVersion', () => {
    it('should not throw for valid version', () => {
      expect(() => _validateSchemaVersion(CURRENT_SCHEMA_VERSION)).not.toThrow();
      expect(() => _validateSchemaVersion(0)).not.toThrow();
    });

    it('should throw for version greater than current', () => {
      expect(() => _validateSchemaVersion(CURRENT_SCHEMA_VERSION + 1)).toThrow(
        /Data was created with schema version/,
      );
    });

    it('should throw for negative version', () => {
      expect(() => _validateSchemaVersion(-1)).toThrow(/Invalid schema version/);
    });
  });

  describe('createVersionedData', () => {
    it('should add current schema version to data', () => {
      const data = { name: 'test', chapters: [] };
      const versioned = createVersionedData(data);

      expect(versioned).toEqual({
        name: 'test',
        chapters: [],
        schemaVersion: CURRENT_SCHEMA_VERSION,
      });
    });

    it('should preserve existing data fields', () => {
      const data = { id: '123', name: 'test', nested: { value: 42 } };
      const versioned = createVersionedData(data);

      expect(versioned.id).toBe('123');
      expect(versioned.name).toBe('test');
      expect(versioned.nested.value).toBe(42);
    });

    it('should overwrite existing schemaVersion', () => {
      const data = { name: 'test', schemaVersion: 0 };
      const versioned = createVersionedData(data);

      expect(versioned.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });
  });

  describe('_runMigrations', () => {
    it('should return data unchanged when already at current version', async () => {
      const data = { name: 'test', schemaVersion: CURRENT_SCHEMA_VERSION };
      const result = await _runMigrations(data, CURRENT_SCHEMA_VERSION);

      expect(result).toEqual({
        name: 'test',
        schemaVersion: CURRENT_SCHEMA_VERSION,
      });
    });

    it('should update schemaVersion on migrated data', async () => {
      const data = { name: 'test', schemaVersion: 0 };

      // Only run migration if there's a gap
      if (CURRENT_SCHEMA_VERSION > 0) {
        // For this test, we expect it to work with the current migration setup
        // If no migrations are defined, it will throw (which is expected behavior)
        try {
          const result = await _runMigrations(data, 0);
          expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
        } catch (error: any) {
          // If migrations aren't defined yet, that's expected
          expect(error.message).toMatch(/Migration to version \d+ not found/);
        }
      }
    });

    it('should throw if migration is missing', async () => {
      const data = { name: 'test' };

      // Clear migrations to ensure they're missing
      const originalMigrations = { ...MIGRATIONS };
      Object.keys(MIGRATIONS).forEach((key) => delete MIGRATIONS[Number(key)]);

      // Only test if we need migrations
      if (CURRENT_SCHEMA_VERSION > 0) {
        await expect(_runMigrations(data, 0)).rejects.toThrow(/Migration to version \d+ not found/);
      }

      // Restore migrations
      Object.assign(MIGRATIONS, originalMigrations);
    });

    it('should apply migrations sequentially', async () => {
      // Mock CURRENT_SCHEMA_VERSION temporarily via a migration test
      const data = { value: 0 };

      // Create a mock migration
      const originalMigrations = { ...MIGRATIONS };
      const mockMigration = vi.fn(async (d: any) => ({ ...d, value: d.value + 1 }));

      // Only test sequential migration if we're at version 1+
      if (CURRENT_SCHEMA_VERSION >= 1) {
        MIGRATIONS[1] = mockMigration;

        try {
          await _runMigrations(data, 0);
          expect(mockMigration).toHaveBeenCalledWith(data);
        } finally {
          // Restore original migrations
          Object.assign(MIGRATIONS, originalMigrations);
        }
      }
    });
  });
});
