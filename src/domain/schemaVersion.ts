import devLog from "src/utils/devLogger";
// Schema versioning and migration system
// This handles data model evolution and backward compatibility

export const CURRENT_SCHEMA_VERSION = 1;

// Migration function type
export type MigrationFn = (_data: any) => Promise<any>;

// Migration registry - add new migrations here as the schema evolves
export const MIGRATIONS: Record<number, MigrationFn> = {
  // Example: Migration from version 1 to 2
  // 2: async (_data) => {
  //   // Add new field to all chapters
  //   if (data.chapters) {
  //     data.chapters = data.chapters.map(chapter => ({
  //       ...chapter,
  //       newField: 'defaultValue'
  //     }));
  //   }
  //   return data;
  // },
};

/**
 * Run migrations to upgrade data from oldVersion to CURRENT_SCHEMA_VERSION
 */
export const runMigrations = _runMigrations;

export async function _runMigrations(data: any, fromVersion: number): Promise<any> {
  let currentData = data;
  let currentVersion = fromVersion;

  devLog.debug(`🔄 Running migrations from version ${fromVersion} to ${CURRENT_SCHEMA_VERSION}`);

  // Apply migrations sequentially
  while (currentVersion < CURRENT_SCHEMA_VERSION) {
    const nextVersion = currentVersion + 1;
    const migration = MIGRATIONS[nextVersion];

    if (!migration) {
      throw new Error(`Migration to version ${nextVersion} not found`);
    }

    devLog.debug(`📦 Applying migration to version ${nextVersion}`);
    currentData = await migration(currentData);
    currentVersion = nextVersion;
  }

  // Update the schema version in the data
  currentData.schemaVersion = CURRENT_SCHEMA_VERSION;
  devLog.debug(`✅ Migration completed to version ${CURRENT_SCHEMA_VERSION}`);

  return currentData;
}

/**
 * Check if data needs migration
 */
export const needsMigration = _needsMigration;

export function _needsMigration(data: any): boolean {
  const dataVersion = data?.schemaVersion || 0;
  return dataVersion < CURRENT_SCHEMA_VERSION;
}

/**
 * Validate schema version compatibility
 */
export const validateSchemaVersion = _validateSchemaVersion;

export function _validateSchemaVersion(version: number): void {
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Data was created with schema version ${version}, but this app only supports up to version ${CURRENT_SCHEMA_VERSION}. Please update the app.`,
    );
  }

  if (version < 0) {
    throw new Error(`Invalid schema version: ${version}`);
  }
}

/**
 * Get schema version from data, with fallback to 0 for legacy data
 */
export const getSchemaVersion = _getSchemaVersion;

export function _getSchemaVersion(data: any): number {
  return data?.schemaVersion || 0;
}

/**
 * Create versioned data wrapper
 */
export function createVersionedData<T>(data: T): T & { schemaVersion: number } {
  return {
    ...data,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}
