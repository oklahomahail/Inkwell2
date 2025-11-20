/**
 * Boot Integrity Checker
 *
 * Comprehensive QA utility that validates IndexedDB schema health at app boot.
 * Useful for development, debugging, and automated testing.
 *
 * Features:
 * - Validates IndexedDB availability
 * - Checks all databases and stores exist
 * - Performs round-trip data tests
 * - Provides human-readable reports
 */

import {
  DATABASE_SCHEMAS,
  ensureDatabaseSchema,
  type DatabaseDefinition,
} from '@/services/dbSchema';
import devLog from '@/utils/devLog';
import { hasIndexedDB } from '@/utils/idbUtils';

// ============================================================================
// Types
// ============================================================================

export type BootCheckResult = {
  name: string;
  ok: boolean;
  error?: string;
  duration?: number;
};

export type BootIntegrityResult = {
  ok: boolean;
  checks: BootCheckResult[];
  totalDuration: number;
};

// ============================================================================
// Individual Check Functions
// ============================================================================

/**
 * Check if IndexedDB is available in the environment
 */
async function checkIndexedDBAvailable(): Promise<BootCheckResult> {
  const startTime = performance.now();

  try {
    const available = hasIndexedDB();
    if (!available) {
      return {
        name: 'IndexedDB availability',
        ok: false,
        error: 'IndexedDB is not available in this environment',
        duration: performance.now() - startTime,
      };
    }
    return {
      name: 'IndexedDB availability',
      ok: true,
      duration: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      name: 'IndexedDB availability',
      ok: false,
      error: err?.message ?? String(err),
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Check if schema self-healing initialization works
 */
async function checkSchemaSelfHealing(): Promise<BootCheckResult> {
  const startTime = performance.now();

  try {
    await ensureDatabaseSchema();
    return {
      name: 'Schema self-healing',
      ok: true,
      duration: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      name: 'Schema self-healing',
      ok: false,
      error: err?.message ?? String(err),
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Check if a specific database exists
 */
async function checkDatabaseExists(dbDef: DatabaseDefinition): Promise<BootCheckResult> {
  const startTime = performance.now();
  const resultName = `Database exists: ${dbDef.name}`;

  try {
    const openReq = indexedDB.open(dbDef.name, dbDef.version);

    const db: IDBDatabase = await new Promise((resolve, reject) => {
      openReq.onsuccess = () => resolve(openReq.result);
      openReq.onerror = () => reject(openReq.error ?? new Error('Open failed'));
    });

    db.close();

    return {
      name: resultName,
      ok: true,
      duration: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      name: resultName,
      ok: false,
      error: err?.message ?? String(err),
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Check if all stores exist in a database
 */
async function checkStoresExist(dbDef: DatabaseDefinition): Promise<BootCheckResult> {
  const startTime = performance.now();
  const resultName = `Stores exist: ${dbDef.name}`;

  try {
    const openReq = indexedDB.open(dbDef.name, dbDef.version);

    const db: IDBDatabase = await new Promise((resolve, reject) => {
      openReq.onsuccess = () => resolve(openReq.result);
      openReq.onerror = () => reject(openReq.error ?? new Error('Open failed'));
    });

    const missingStores: string[] = [];
    for (const storeDef of dbDef.stores) {
      if (!db.objectStoreNames.contains(storeDef.name)) {
        missingStores.push(storeDef.name);
      }
    }

    db.close();

    if (missingStores.length > 0) {
      return {
        name: resultName,
        ok: false,
        error: `Missing stores: ${missingStores.join(', ')}`,
        duration: performance.now() - startTime,
      };
    }

    return {
      name: resultName,
      ok: true,
      duration: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      name: resultName,
      ok: false,
      error: err?.message ?? String(err),
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Perform a round-trip data test on a store
 * Writes test data, reads it back, and verifies integrity
 */
async function checkStoreRoundTrip(
  dbDef: DatabaseDefinition,
  storeName: string,
): Promise<BootCheckResult> {
  const startTime = performance.now();
  const resultName = `Round-trip: ${dbDef.name}.${storeName}`;

  try {
    const openReq = indexedDB.open(dbDef.name, dbDef.version);

    const db: IDBDatabase = await new Promise((resolve, reject) => {
      openReq.onsuccess = () => resolve(openReq.result);
      openReq.onerror = () => reject(openReq.error ?? new Error('Open failed'));
    });

    // Create test record
    const testKey = `boot-check-${storeName}-${Date.now()}`;
    const testValue = {
      id: testKey,
      _type: 'boot_integrity_check',
      createdAt: Date.now(),
      testData: 'Test data for integrity check',
    };

    // Write test data
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    await new Promise<void>((resolve, reject) => {
      const putReq = store.put(testValue);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error ?? new Error('Put failed'));
    });

    // Read test data
    const tx2 = db.transaction(storeName, 'readonly');
    const store2 = tx2.objectStore(storeName);

    const retrieved = await new Promise<any>((resolve, reject) => {
      const getReq = store2.get(testKey);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error ?? new Error('Get failed'));
    });

    // Clean up test data
    const tx3 = db.transaction(storeName, 'readwrite');
    const store3 = tx3.objectStore(storeName);
    store3.delete(testKey);

    db.close();

    // Verify data integrity
    if (!retrieved || retrieved.id !== testKey) {
      return {
        name: resultName,
        ok: false,
        error: 'Data mismatch when reading back test record',
        duration: performance.now() - startTime,
      };
    }

    return {
      name: resultName,
      ok: true,
      duration: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      name: resultName,
      ok: false,
      error: err?.message ?? String(err),
      duration: performance.now() - startTime,
    };
  }
}

// ============================================================================
// Main Boot Integrity Check
// ============================================================================

/**
 * Run a comprehensive boot integrity check
 * Tests IndexedDB availability, schema initialization, and data operations
 */
export async function runBootIntegrityCheck(): Promise<BootIntegrityResult> {
  const startTime = performance.now();
  const checks: BootCheckResult[] = [];

  // Check 1: IndexedDB availability
  checks.push(await checkIndexedDBAvailable());

  // If IndexedDB is not available, skip remaining checks
  if (!checks[0]?.ok) {
    return {
      ok: false,
      checks,
      totalDuration: performance.now() - startTime,
    };
  }

  // Check 2: Schema self-healing
  checks.push(await checkSchemaSelfHealing());

  // Check 3: Database existence
  for (const dbDef of DATABASE_SCHEMAS) {
    checks.push(await checkDatabaseExists(dbDef));
  }

  // Check 4: Store existence
  for (const dbDef of DATABASE_SCHEMAS) {
    checks.push(await checkStoresExist(dbDef));
  }

  // Check 5: Round-trip data tests
  for (const dbDef of DATABASE_SCHEMAS) {
    for (const storeDef of dbDef.stores) {
      checks.push(await checkStoreRoundTrip(dbDef, storeDef.name));
    }
  }

  const ok = checks.every((c) => c.ok);
  const totalDuration = performance.now() - startTime;

  return { ok, checks, totalDuration };
}

// ============================================================================
// Reporting Utilities
// ============================================================================

/**
 * Log a human-readable boot integrity report to console
 * Useful for development and debugging
 */
export async function logBootIntegrityReport(): Promise<void> {
  devLog.log('🔍 [BootIntegrity] Running integrity checks...');

  const result = await runBootIntegrityCheck();

  if (result.ok) {
    devLog.log(`✓ All checks passed (${result.totalDuration.toFixed(1)}ms)`);

    // Show summary of checks
    const checksByCategory = groupChecksByCategory(result.checks);
    for (const [category, categoryChecks] of Object.entries(checksByCategory)) {
      devLog.log(`  ${category}: ${categoryChecks.length} checks passed`);
    }
  } else {
    devLog.error(`✗ Some checks failed (${result.totalDuration.toFixed(1)}ms)`);

    // Show detailed results
    for (const check of result.checks) {
      if (check.ok) {
        devLog.log(`  ✓ ${check.name} (${check.duration?.toFixed(1)}ms)`);
      } else {
        devLog.error(`  ✗ ${check.name}: ${check.error || 'Unknown error'}`);
      }
    }
  }

  devLog.log('[BootIntegrity] Checks complete');
}

/**
 * Get a structured report suitable for display in UI
 */
export function formatIntegrityReport(result: BootIntegrityResult): {
  summary: string;
  details: Array<{ category: string; checks: BootCheckResult[] }>;
} {
  const summary = result.ok
    ? `All integrity checks passed (${result.checks.length} checks, ${result.totalDuration.toFixed(1)}ms)`
    : `Some integrity checks failed (${result.checks.filter((c) => !c.ok).length}/${result.checks.length} failures, ${result.totalDuration.toFixed(1)}ms)`;

  const checksByCategory = groupChecksByCategory(result.checks);
  const details = Object.entries(checksByCategory).map(([category, checks]) => ({
    category,
    checks,
  }));

  return { summary, details };
}

/**
 * Group checks by category for easier reporting
 */
function groupChecksByCategory(checks: BootCheckResult[]): Record<string, BootCheckResult[]> {
  const categories: Record<string, BootCheckResult[]> = {
    System: [],
    Databases: [],
    Stores: [],
    'Data Operations': [],
  };

  for (const check of checks) {
    if (check.name.includes('availability') || check.name.includes('self-healing')) {
      categories['System']?.push(check);
    } else if (check.name.includes('Database exists')) {
      categories['Databases']?.push(check);
    } else if (check.name.includes('Stores exist')) {
      categories['Stores']?.push(check);
    } else if (check.name.includes('Round-trip')) {
      categories['Data Operations']?.push(check);
    }
  }

  return categories;
}

/**
 * Export a detailed report as JSON for debugging
 */
export function exportIntegrityReportJSON(result: BootIntegrityResult): string {
  return JSON.stringify(result, null, 2);
}
