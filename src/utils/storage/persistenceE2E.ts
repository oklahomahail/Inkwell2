import devLog from "@/utils/devLog";
// src/utils/storage/persistenceE2E.ts - E2E persistence verification helpers

/**
 * E2E Persistence Testing Guide
 *
 * This module provides utilities to verify that IndexedDB data survives:
 * - Browser refresh
 * - Re-authentication
 * - Browser restart
 * - Private mode (with expected limitations)
 *
 * Usage in DevTools Console:
 * ```
 * import { persistenceE2E } from '@/utils/storage/persistenceE2E';
 *
 * // Step 1: Create test data
 * await persistenceE2E.createTestData();
 *
 * // Step 2: Simulate re-auth
 * persistenceE2E.simulateReauth();
 * // (refresh page, sign back in)
 *
 * // Step 3: Verify data survived
 * await persistenceE2E.verifyTestData();
 * ```
 */

export const TEST_PROJECT_NAME = 'PERSIST-E2E-TEST';
export const TEST_CHAPTER_NAME = 'PERSIST-TEST-12345';
export const TEST_TIMESTAMP = Date.now();

export interface TestDataResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Create test project and chapter in IndexedDB
 */
export async function createTestData(): Promise<TestDataResult> {
  try {
    // Try to access the database
    const dbName = 'inkwell_v1';
    const db = await openDatabase(dbName);

    if (!db) {
      return {
        success: false,
        message: 'Failed to open database',
      };
    }

    // Create test project
    const projectData = {
      id: `persist-test-${TEST_TIMESTAMP}`,
      name: TEST_PROJECT_NAME,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      content: 'This is a persistence test project',
      metadata: {
        testTimestamp: TEST_TIMESTAMP,
        purpose: 'E2E persistence verification',
      },
    };

    // Create test chapter
    const chapterData = {
      id: `chapter-test-${TEST_TIMESTAMP}`,
      projectId: projectData.id,
      name: TEST_CHAPTER_NAME,
      content: 'This chapter tests data persistence across re-auth',
      order: 1,
      created: new Date().toISOString(),
    };

    // Store in IndexedDB
    const tx = db.transaction(['projects', 'chapters'], 'readwrite');
    const projectStore = tx.objectStore('projects');
    const chapterStore = tx.objectStore('chapters');

    await new Promise((resolve, reject) => {
      const projectReq = projectStore.add(projectData);
      const chapterReq = chapterStore.add(chapterData);

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) resolve(true);
      };

      projectReq.onsuccess = checkComplete;
      chapterReq.onsuccess = checkComplete;
      projectReq.onerror = reject;
      chapterReq.onerror = reject;
    });

    db.close();

    devLog.debug('✅ [E2E] Test data created:', {
      project: projectData.name,
      chapter: chapterData.name,
      timestamp: TEST_TIMESTAMP,
    });

    devLog.debug('📋 [E2E] Next steps:');
    devLog.debug('  1. Refresh the page (Cmd/Ctrl + Shift + R)');
    devLog.debug('  2. Run: await persistenceE2E.verifyTestData()');
    devLog.debug('  OR');
    devLog.debug('  1. Run: persistenceE2E.simulateReauth()');
    devLog.debug('  2. Refresh and sign back in');
    devLog.debug('  3. Run: await persistenceE2E.verifyTestData()');

    return {
      success: true,
      message: 'Test data created successfully',
      details: { projectData, chapterData },
    };
  } catch (error) {
    devLog.error('❌ [E2E] Failed to create test data:', error);
    return {
      success: false,
      message: 'Error creating test data',
      details: error,
    };
  }
}

/**
 * Verify that test data still exists
 */
export async function verifyTestData(): Promise<TestDataResult> {
  try {
    const dbName = 'inkwell_v1';
    const db = await openDatabase(dbName);

    if (!db) {
      return {
        success: false,
        message: 'Database not found - data was lost',
      };
    }

    const tx = db.transaction(['projects', 'chapters'], 'readonly');
    const projectStore = tx.objectStore('projects');
    const chapterStore = tx.objectStore('chapters');

    // Look for test project
    const projects = await getAllFromStore(projectStore);
    const testProject = projects.find((p: any) => p.name === TEST_PROJECT_NAME);

    // Look for test chapter
    const chapters = await getAllFromStore(chapterStore);
    const testChapter = chapters.find((c: any) => c.name === TEST_CHAPTER_NAME);

    db.close();

    if (testProject && testChapter) {
      devLog.debug('✅ [E2E] PERSISTENCE VERIFIED - Test data survived!');
      devLog.debug('  Project:', testProject);
      devLog.debug('  Chapter:', testChapter);

      const ageMs = Date.now() - testProject.metadata.testTimestamp;
      const ageSec = Math.floor(ageMs / 1000);
      const ageMin = Math.floor(ageSec / 60);

      devLog.debug(`  Age: ${ageMin > 0 ? `${ageMin} minutes` : `${ageSec} seconds`}`);

      return {
        success: true,
        message: 'Test data found - persistence working correctly',
        details: {
          project: testProject,
          chapter: testChapter,
          ageMs,
        },
      };
    } else {
      devLog.debug('❌ [E2E] PERSISTENCE FAILED - Test data not found');
      devLog.debug('  Projects found:', projects.length);
      devLog.debug('  Chapters found:', chapters.length);

      return {
        success: false,
        message: 'Test data not found - data was lost',
        details: {
          projectsFound: projects.length,
          chaptersFound: chapters.length,
          testProject,
          testChapter,
        },
      };
    }
  } catch (error) {
    devLog.error('❌ [E2E] Error verifying test data:', error);
    return {
      success: false,
      message: 'Error checking for test data',
      details: error,
    };
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestData(): Promise<TestDataResult> {
  try {
    const dbName = 'inkwell_v1';
    const db = await openDatabase(dbName);

    if (!db) {
      return {
        success: false,
        message: 'Database not found',
      };
    }

    const tx = db.transaction(['projects', 'chapters'], 'readwrite');
    const projectStore = tx.objectStore('projects');
    const chapterStore = tx.objectStore('chapters');

    // Find and delete test data
    const projects = await getAllFromStore(projectStore);
    const chapters = await getAllFromStore(chapterStore);

    const testProject = projects.find((p: any) => p.name === TEST_PROJECT_NAME);
    const testChapter = chapters.find((c: any) => c.name === TEST_CHAPTER_NAME);

    let deleted = 0;

    if (testProject) {
      await new Promise((resolve, reject) => {
        const req = projectStore.delete(testProject.id);
        req.onsuccess = () => {
          deleted++;
          resolve(true);
        };
        req.onerror = reject;
      });
    }

    if (testChapter) {
      await new Promise((resolve, reject) => {
        const req = chapterStore.delete(testChapter.id);
        req.onsuccess = () => {
          deleted++;
          resolve(true);
        };
        req.onerror = reject;
      });
    }

    db.close();

    devLog.debug(`✅ [E2E] Cleaned up ${deleted} test items`);

    return {
      success: true,
      message: `Deleted ${deleted} test items`,
    };
  } catch (error) {
    devLog.error('❌ [E2E] Error cleaning up test data:', error);
    return {
      success: false,
      message: 'Error cleaning up test data',
      details: error,
    };
  }
}

/**
 * Simulate re-authentication by clearing Supabase auth token
 * (without touching IndexedDB)
 */
export function simulateReauth(): void {
  const authKeys = Object.keys(localStorage).filter(
    (key) => key.includes('sb-') && key.includes('-auth-token'),
  );

  if (authKeys.length === 0) {
    devLog.debug('⚠️ [E2E] No Supabase auth tokens found');
    return;
  }

  authKeys.forEach((key) => {
    localStorage.removeItem(key);
    devLog.debug(`🔑 [E2E] Removed auth token: ${key}`);
  });

  devLog.debug('✅ [E2E] Auth tokens cleared');
  devLog.debug('📋 [E2E] Next steps:');
  devLog.debug('  1. Refresh the page');
  devLog.debug('  2. Sign back in');
  devLog.debug('  3. Run: await persistenceE2E.verifyTestData()');
  devLog.debug('');
  devLog.debug('💡 Your IndexedDB data should still be intact!');
}

/**
 * Run full E2E test sequence
 */
export async function runFullTest(): Promise<void> {
  console.group('🧪 [E2E] Running Full Persistence Test');

  // Step 1: Check current state
  devLog.debug('Step 1: Checking initial storage health...');
  const health = await getStorageHealth();
  devLog.debug('  Persisted:', health.persisted ? '✅' : '❌');
  devLog.debug('  Private Mode:', health.privateMode ? '⚠️ YES' : '✅ NO');
  devLog.debug('  Usage:', health.usageFormatted, '/', health.quotaFormatted);

  // Step 2: Create test data
  devLog.debug('\nStep 2: Creating test data...');
  const createResult = await createTestData();
  if (!createResult.success) {
    devLog.error('❌ Test failed at creation step');
    console.groupEnd();
    return;
  }

  // Step 3: Immediate verification
  devLog.debug('\nStep 3: Immediate verification...');
  const verifyResult = await verifyTestData();
  if (!verifyResult.success) {
    devLog.error('❌ Test failed - data not found immediately after creation');
    console.groupEnd();
    return;
  }

  devLog.debug('\n✅ Test setup complete!');
  devLog.debug('\n📋 Manual steps required:');
  devLog.debug('  1. Refresh this page (Cmd/Ctrl + Shift + R)');
  devLog.debug('  2. Run: await persistenceE2E.verifyTestData()');
  devLog.debug('  3. Run: persistenceE2E.simulateReauth()');
  devLog.debug('  4. Refresh and sign back in');
  devLog.debug('  5. Run: await persistenceE2E.verifyTestData()');
  devLog.debug('  6. Run: await persistenceE2E.cleanupTestData()');

  console.groupEnd();
}

// Helper functions

async function openDatabase(dbName: string): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      devLog.error('[E2E] Failed to open database:', request.error);
      resolve(null);
    };
  });
}

async function getAllFromStore(store: IDBObjectStore): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const items: any[] = [];
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        resolve(items);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

async function getStorageHealth() {
  const persisted = await navigator.storage?.persisted();
  const estimate = await navigator.storage?.estimate();
  const quota = estimate?.quota || 0;
  const usage = estimate?.usage || 0;

  // Detect private mode (simple heuristic)
  const privateMode = quota < 200 * 1024 * 1024; // < 200MB likely private

  return {
    persisted: persisted || false,
    privateMode,
    usage,
    quota,
    usageFormatted: formatBytes(usage),
    quotaFormatted: formatBytes(quota),
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// Export for console access
export const persistenceE2E = {
  createTestData,
  verifyTestData,
  cleanupTestData,
  simulateReauth,
  runFullTest,
};

// Global window access
if (typeof window !== 'undefined') {
  (window as any).persistenceE2E = persistenceE2E;
  devLog.debug(
    '[E2E] Persistence testing utilities available at window.persistenceE2E',
    '\nQuick start:',
    '\n  await persistenceE2E.runFullTest()',
    '\n',
    '\nManual steps:',
    '\n  await persistenceE2E.createTestData()',
    '\n  await persistenceE2E.verifyTestData()',
    '\n  persistenceE2E.simulateReauth()',
    '\n  await persistenceE2E.cleanupTestData()',
  );
}
