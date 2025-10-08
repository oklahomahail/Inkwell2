// src/data/migrateToProfiles.ts - Migration utility for profile-specific data

import { Profile } from '../types/profile';
import { storage } from '../utils/storage';

import { getDbForProfile } from './dbFactory';

interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  skippedKeys: string[];
  errors: Array<{ key: string; error: string }>;
}

// Keys that should NOT be migrated (they're global)
const GLOBAL_KEYS = [
  'inkwell_profiles',
  'inkwell_active_profile',
  // Add other global keys here
];

// Legacy keys that we want to migrate to the first profile
const LEGACY_KEYS_TO_MIGRATE = [
  'inkwell_enhanced_projects',
  'timeline_scenes',
  'writing_content',
  'user_preferences',
  'export_data',
  'analytics_data',
  // Add patterns for writing chapters
  /^inkwell_writing_chapters_/,
  // Add other legacy keys/patterns here
];

function shouldMigrateKey(key: string): boolean {
  // Skip global keys
  if (GLOBAL_KEYS.includes(key)) {
    return false;
  }

  // Skip keys that are already profile-specific
  if (key.startsWith('profile_')) {
    return false;
  }

  // Check if key matches our migration list
  return LEGACY_KEYS_TO_MIGRATE.some((pattern) => {
    if (typeof pattern === 'string') {
      return key === pattern;
    } else if (pattern instanceof RegExp) {
      return pattern.test(key);
    }
    return false;
  });
}

/**
 * Migrate legacy data from single database to profile-specific storage
 */
export async function migrateLegacyToProfile(
  targetProfile: Profile,
  options: {
    dryRun?: boolean;
    preserveLegacyData?: boolean;
  } = {},
): Promise<MigrationResult> {
  const { dryRun = false, preserveLegacyData = true } = options;
  const profileDb = getDbForProfile(targetProfile.id);

  const result: MigrationResult = {
    success: true,
    migratedKeys: [],
    skippedKeys: [],
    errors: [],
  };

  try {
    // Get all keys from the legacy storage
    const allKeys = await storage.list();
    console.log(`Found ${allKeys.length} keys in legacy storage`);

    for (const key of allKeys) {
      try {
        if (!shouldMigrateKey(key)) {
          result.skippedKeys.push(key);
          continue;
        }

        // Check if data already exists in profile storage
        const existsInProfile = await profileDb.get(key);
        if (existsInProfile) {
          console.log(`Key ${key} already exists in profile, skipping`);
          result.skippedKeys.push(key);
          continue;
        }

        // Get the legacy data
        const legacyData = await storage.get(key);
        if (legacyData === null) {
          console.log(`Key ${key} has no data, skipping`);
          result.skippedKeys.push(key);
          continue;
        }

        if (!dryRun) {
          // Migrate the data to profile storage
          await profileDb.put(key, legacyData);

          // Optionally remove from legacy storage
          if (!preserveLegacyData) {
            await storage.delete(key);
          }
        }

        result.migratedKeys.push(key);
        console.log(`${dryRun ? '[DRY RUN] ' : ''}Migrated key: ${key}`);
      } catch (error) {
        console.error(`Failed to migrate key ${key}:`, error);
        result.errors.push({
          key,
          error: error instanceof Error ? error.message : String(error),
        });
        result.success = false;
      }
    }

    console.log(`Migration ${dryRun ? 'simulation ' : ''}complete:`, {
      migrated: result.migratedKeys.length,
      skipped: result.skippedKeys.length,
      errors: result.errors.length,
    });
  } catch (error) {
    console.error('Migration failed:', error);
    result.success = false;
    result.errors.push({
      key: 'MIGRATION_ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return result;
}

/**
 * Check if migration is needed
 */
export async function needsMigration(): Promise<boolean> {
  try {
    const allKeys = await storage.list();
    return allKeys.some((key) => shouldMigrateKey(key));
  } catch (error) {
    console.error('Failed to check migration status:', error);
    return false;
  }
}

/**
 * Get summary of what would be migrated (dry run)
 */
export async function getMigrationSummary(): Promise<{
  keysToMigrate: string[];
  keysToSkip: string[];
  totalSize: number;
}> {
  const allKeys = await storage.list();
  const keysToMigrate: string[] = [];
  const keysToSkip: string[] = [];
  let totalSize = 0;

  for (const key of allKeys) {
    if (shouldMigrateKey(key)) {
      keysToMigrate.push(key);
      try {
        const data = await storage.get(key);
        if (data) {
          totalSize += JSON.stringify(data).length;
        }
      } catch (error) {
        console.warn(`Failed to get size for key ${key}:`, error);
      }
    } else {
      keysToSkip.push(key);
    }
  }

  return {
    keysToMigrate,
    keysToSkip,
    totalSize,
  };
}

/**
 * Clean up legacy data after successful migration
 * Use with caution!
 */
export async function cleanupLegacyData(): Promise<{
  deletedKeys: string[];
  errors: Array<{ key: string; error: string }>;
}> {
  const allKeys = await storage.list();
  const deletedKeys: string[] = [];
  const errors: Array<{ key: string; error: string }> = [];

  for (const key of allKeys) {
    if (shouldMigrateKey(key)) {
      try {
        await storage.delete(key);
        deletedKeys.push(key);
      } catch (error) {
        errors.push({
          key,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return { deletedKeys, errors };
}
