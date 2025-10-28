import devLog from "src/utils/devLogger";
/**
 * Migration utility to convert old profile-based localStorage keys to user-based keys
 * Run once at application boot to ensure smooth transition from multi-profile to single-user
 */

const MIGRATION_KEY = 'inkwell:storage-migration-v1';

export function migrateStorageKeys(): void {
  // Check if migration already ran
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  devLog.debug('[Storage Migration] Starting profile → user key migration...');

  let migratedCount = 0;
  let removedCount = 0;

  // Iterate through all localStorage keys
  for (const key of Object.keys(localStorage)) {
    // Match old profile-namespaced keys: inkwell:profile:{profileId}:{rest}
    const profileKeyMatch = key.match(/^inkwell:profile:([^:]+):(.+)$/);

    if (profileKeyMatch) {
      const [, , rest] = profileKeyMatch;
      const newKey = `inkwell:user:${rest}`;
      const value = localStorage.getItem(key);

      if (value) {
        // Copy to new user-based key
        localStorage.setItem(newKey, value);
        migratedCount++;
        devLog.debug(`[Storage Migration] ${key} → ${newKey}`);
      }

      // Remove old key
      localStorage.removeItem(key);
      removedCount++;
    }

    // Also handle workspace keys if they exist
    const workspaceKeyMatch = key.match(/^inkwell:workspace:([^:]+):(.+)$/);

    if (workspaceKeyMatch) {
      const [, , rest] = workspaceKeyMatch;
      const newKey = `inkwell:user:${rest}`;
      const value = localStorage.getItem(key);

      if (value) {
        localStorage.setItem(newKey, value);
        migratedCount++;
        devLog.debug(`[Storage Migration] ${key} → ${newKey}`);
      }

      localStorage.removeItem(key);
      removedCount++;
    }
  }

  // Mark migration as complete
  localStorage.setItem(MIGRATION_KEY, new Date().toISOString());

  devLog.debug(
    `[Storage Migration] Complete: ${migratedCount} keys migrated, ${removedCount} old keys removed`,
  );
}

/**
 * Reset migration flag (for testing purposes)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_KEY);
}
