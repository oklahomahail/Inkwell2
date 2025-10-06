// Schema versioning system for Plot Boards data structures
// Ensures backward compatibility and smooth data migrations

import { trace } from '../../../utils/trace';

/* ========= Schema Version Management ========= */

export const CURRENT_SCHEMA_VERSION = '1.2.0';

export interface SchemaVersion {
  version: string;
  releaseDate: string;
  changes: string[];
  breaking: boolean;
}

export const SCHEMA_VERSIONS: SchemaVersion[] = [
  {
    version: '1.0.0',
    releaseDate: '2024-01-01',
    changes: ['Initial Plot Boards implementation'],
    breaking: false,
  },
  {
    version: '1.1.0',
    releaseDate: '2024-06-15',
    changes: [
      'Added keyboard navigation support',
      'Added undo/redo system',
      'Enhanced accessibility features',
    ],
    breaking: false,
  },
  {
    version: '1.2.0',
    releaseDate: '2024-12-01',
    changes: [
      'Added column virtualization',
      'Added saved views and filters',
      'Enhanced schema versioning',
      'Added performance optimizations',
    ],
    breaking: false,
  },
];

/* ========= Versioned Data Types ========= */

export interface VersionedData<T = any> {
  schemaVersion: string;
  data: T;
  createdAt: string;
  updatedAt: string;
  migrationHistory?: MigrationRecord[];
}

export interface MigrationRecord {
  fromVersion: string;
  toVersion: string;
  migratedAt: string;
  warnings?: string[];
  errors?: string[];
}

/* ========= Migration Functions ========= */

export type MigrationFunction<TFrom = any, TTo = any> = (
  data: TFrom,
  context: MigrationContext,
) => MigrationResult<TTo>;

export interface MigrationContext {
  fromVersion: string;
  toVersion: string;
  timestamp: string;
  options?: MigrationOptions;
}

export interface MigrationOptions {
  strict?: boolean;
  preserveUnknownFields?: boolean;
  logWarnings?: boolean;
}

export interface MigrationResult<T> {
  data: T;
  warnings: string[];
  errors: string[];
  success: boolean;
}

/* ========= Version Utilities ========= */

export class SchemaVersionManager {
  private migrations: Map<string, MigrationFunction> = new Map();

  constructor() {
    this.registerMigrations();
  }

  private registerMigrations() {
    // Register migration functions for each version transition
    this.migrations.set('1.0.0->1.1.0', this.migrate_1_0_to_1_1.bind(this));
    this.migrations.set('1.1.0->1.2.0', this.migrate_1_1_to_1_2.bind(this));
  }

  /**
   * Check if data needs migration
   */
  needsMigration(data: VersionedData | any): boolean {
    const dataVersion = this.getDataVersion(data);
    return this.compareVersions(dataVersion, CURRENT_SCHEMA_VERSION) < 0;
  }

  /**
   * Get version from data
   */
  getDataVersion(data: VersionedData | any): string {
    if (data && typeof data === 'object' && 'schemaVersion' in data) {
      return data.schemaVersion;
    }
    // Default to earliest version for unversioned data
    return '1.0.0';
  }

  /**
   * Get current schema version
   */
  getCurrentVersion(): string {
    return CURRENT_SCHEMA_VERSION;
  }

  /**
   * Migrate data to current version (alias for migrateToCurrentVersion)
   */
  async migrate<T>(
    data: VersionedData<T> | T,
    options?: MigrationOptions,
  ): Promise<MigrationResult<VersionedData<T>>> {
    return this.migrateToCurrentVersion(data, options);
  }

  /**
   * Compare semantic versions
   */
  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }

  /**
   * Migrate data to current version
   */
  async migrateToCurrentVersion<T>(
    data: VersionedData<T> | T,
    options?: MigrationOptions,
  ): Promise<MigrationResult<VersionedData<T>>> {
    const startTime = Date.now();
    trace.log('Starting migration', 'user_action', 'info', {
      currentVersion: CURRENT_SCHEMA_VERSION,
      dataVersion: this.getDataVersion(data),
    });

    try {
      // If already current version, return as-is
      if (!this.needsMigration(data)) {
        return {
          data: this.wrapInVersionedData(data as T),
          warnings: [],
          errors: [],
          success: true,
        };
      }

      const currentVersion = this.getDataVersion(data);
      const migrationPath = this.calculateMigrationPath(currentVersion, CURRENT_SCHEMA_VERSION);

      if (migrationPath.length === 0) {
        return {
          data: this.wrapInVersionedData(data as T),
          warnings: [`No migration path found from ${currentVersion} to ${CURRENT_SCHEMA_VERSION}`],
          errors: [],
          success: true,
        };
      }

      let currentData = data;
      const allWarnings: string[] = [];
      const allErrors: string[] = [];
      const migrationHistory: MigrationRecord[] = [];

      // Apply migrations in sequence
      for (const step of migrationPath) {
        const migrationKey = `${step.from}->${step.to}`;
        const migrationFn = this.migrations.get(migrationKey);

        if (!migrationFn) {
          const error = `No migration function found for ${migrationKey}`;
          allErrors.push(error);
          break;
        }

        const context: MigrationContext = {
          fromVersion: step.from,
          toVersion: step.to,
          timestamp: new Date().toISOString(),
          options,
        };

        try {
          const result = migrationFn(currentData, context);
          currentData = result.data;
          allWarnings.push(...result.warnings);
          allErrors.push(...result.errors);

          migrationHistory.push({
            fromVersion: step.from,
            toVersion: step.to,
            migratedAt: context.timestamp,
            warnings: result.warnings.length > 0 ? result.warnings : undefined,
            errors: result.errors.length > 0 ? result.errors : undefined,
          });

          if (!result.success) {
            break;
          }
        } catch (error) {
          const errorMsg = `Migration failed for ${migrationKey}: ${error}`;
          allErrors.push(errorMsg);
          break;
        }
      }

      const finalData = this.wrapInVersionedData(currentData as T, migrationHistory);
      const duration = Date.now() - startTime;

      trace.log('Migration completed', 'user_action', 'info', {
        duration: `${duration}ms`,
        warnings: allWarnings.length,
        errors: allErrors.length,
        success: allErrors.length === 0,
      });

      return {
        data: finalData,
        warnings: allWarnings,
        errors: allErrors,
        success: allErrors.length === 0,
      };
    } catch (error) {
      trace.log('Migration failed', 'user_action', 'error', { error });
      return {
        data: this.wrapInVersionedData(data as T),
        warnings: [],
        errors: [`Migration failed: ${error}`],
        success: false,
      };
    }
  }

  /**
   * Calculate migration path between versions
   */
  private calculateMigrationPath(
    fromVersion: string,
    toVersion: string,
  ): Array<{ from: string; to: string }> {
    const path: Array<{ from: string; to: string }> = [];
    let currentVersion = fromVersion;

    // For now, we only support sequential migrations
    // In future, we could implement graph-based migration paths
    const versions = SCHEMA_VERSIONS.map((v) => v.version).sort((a, b) =>
      this.compareVersions(a, b),
    );

    const fromIndex = versions.indexOf(fromVersion);
    const toIndex = versions.indexOf(toVersion);

    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
      return [];
    }

    for (let i = fromIndex; i < toIndex; i++) {
      path.push({
        from: versions[i] || fromVersion,
        to: versions[i + 1] || toVersion,
      });
    }

    return path;
  }

  /**
   * Wrap data in versioned structure
   */
  private wrapInVersionedData<T>(data: T, migrationHistory?: MigrationRecord[]): VersionedData<T> {
    const now = new Date().toISOString();

    if (data && typeof data === 'object' && 'schemaVersion' in data) {
      // Already versioned, update version
      return {
        ...(data as VersionedData<T>),
        schemaVersion: CURRENT_SCHEMA_VERSION,
        updatedAt: now,
        migrationHistory: migrationHistory || (data as VersionedData<T>).migrationHistory,
      } as VersionedData<T>;
    }

    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      data,
      createdAt: now,
      updatedAt: now,
      migrationHistory,
    };
  }

  /* ========= Specific Migration Functions ========= */

  private migrate_1_0_to_1_1(data: any, context: MigrationContext): MigrationResult<any> {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Migration for keyboard navigation and undo/redo additions
      // These features were additive, so existing data is compatible

      if (data.data && Array.isArray(data.data.columns)) {
        // Ensure columns have settings property
        data.data.columns.forEach((column: any, index: number) => {
          if (!column.settings) {
            column.settings = {
              autoColor: true,
              showCardCount: true,
              collapsible: false,
              sortBy: 'order',
              showProgress: true,
            };
            warnings.push(`Added default settings to column ${index + 1}`);
          }
        });
      }

      return {
        data,
        warnings,
        errors,
        success: true,
      };
    } catch (error) {
      errors.push(`Migration 1.0->1.1 failed: ${error}`);
      return {
        data,
        warnings,
        errors,
        success: false,
      };
    }
  }

  private migrate_1_1_to_1_2(data: any, context: MigrationContext): MigrationResult<any> {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Migration for saved views, filters, and virtualization
      // Add default view if none exists

      if (data.data && !data.data.views) {
        data.data.views = [];
        warnings.push('Added empty views array');
      }

      // Ensure board has filters property
      if (data.data && !data.data.activeFilters) {
        data.data.activeFilters = {
          statuses: [],
          priorities: [],
          tags: [],
          characters: [],
          chapters: [],
        };
        warnings.push('Added default filters');
      }

      // Ensure cards have all required fields for filtering
      if (data.data && Array.isArray(data.data.columns)) {
        data.data.columns.forEach((column: any, colIndex: number) => {
          if (Array.isArray(column.cards)) {
            column.cards.forEach((card: any, cardIndex: number) => {
              if (!Array.isArray(card.tags)) {
                card.tags = [];
                warnings.push(
                  `Added tags array to card ${cardIndex + 1} in column ${colIndex + 1}`,
                );
              }
              if (!card.priority) {
                card.priority = 'medium';
                warnings.push(
                  `Added default priority to card ${cardIndex + 1} in column ${colIndex + 1}`,
                );
              }
            });
          }
        });
      }

      return {
        data,
        warnings,
        errors,
        success: true,
      };
    } catch (error) {
      errors.push(`Migration 1.1->1.2 failed: ${error}`);
      return {
        data,
        warnings,
        errors,
        success: false,
      };
    }
  }

  /**
   * Validate data against schema version
   */
  validateData<T>(data: VersionedData<T>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.schemaVersion) {
      errors.push('Missing schema version');
    }

    if (!data.data) {
      errors.push('Missing data field');
    }

    if (!data.createdAt) {
      errors.push('Missing createdAt timestamp');
    }

    if (!data.updatedAt) {
      errors.push('Missing updatedAt timestamp');
    }

    // Version-specific validation
    const version = data.schemaVersion;
    if (version && this.compareVersions(version, CURRENT_SCHEMA_VERSION) > 0) {
      errors.push(
        `Data version ${version} is newer than supported version ${CURRENT_SCHEMA_VERSION}`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get schema information
   */
  getSchemaInfo(): {
    currentVersion: string;
    supportedVersions: string[];
    latestChanges: string[];
  } {
    const latestVersion = SCHEMA_VERSIONS[SCHEMA_VERSIONS.length - 1];

    return {
      currentVersion: CURRENT_SCHEMA_VERSION,
      supportedVersions: SCHEMA_VERSIONS.map((v) => v.version),
      latestChanges: latestVersion?.changes || [],
    };
  }
}

// Export singleton instance
export const schemaVersionManager = new SchemaVersionManager();
