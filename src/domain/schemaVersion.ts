// Schema versioning and migration system
// This handles data model evolution and backward compatibility

export const CURRENT_SCHEMA_VERSION = 1;

// Migration function type
export type MigrationFn = (data: any) => Promise<any>;

// Migration registry - add new migrations here as the schema evolves
export const MIGRATIONS: Record<number, MigrationFn> = {
  // Example: Migration from version 1 to 2
  // 2: async (data) => {
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
export async function runMigrations(data: any, fromVersion: number): Promise<any> {
  let currentData = data;
  let currentVersion = fromVersion;

  console.log(`🔄 Running migrations from version ${fromVersion} to ${CURRENT_SCHEMA_VERSION}`);

  // Apply migrations sequentially
  while (currentVersion < CURRENT_SCHEMA_VERSION) {
    const nextVersion = currentVersion + 1;
    const migration = MIGRATIONS[nextVersion];

    if (!migration) {
      throw new Error(`Migration to version ${nextVersion} not found`);
    }

    console.log(`📦 Applying migration to version ${nextVersion}`);
    currentData = await migration(currentData);
    currentVersion = nextVersion;
  }

  // Update the schema version in the data
  currentData.schemaVersion = CURRENT_SCHEMA_VERSION;
  console.log(`✅ Migration completed to version ${CURRENT_SCHEMA_VERSION}`);

  return currentData;
}

/**
 * Check if data needs migration
 */
export function needsMigration(data: any): boolean {
  const dataVersion = data?.schemaVersion || 0;
  return dataVersion < CURRENT_SCHEMA_VERSION;
}

/**
 * Validate schema version compatibility
 */
export function validateSchemaVersion(version: number): void {
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
export function getSchemaVersion(data: any): number {
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
