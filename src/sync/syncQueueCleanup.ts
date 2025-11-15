/**
 * Sync Queue Cleanup Utility
 *
 * Detects and removes orphaned sync operations where the referenced
 * project/chapter no longer exists in local storage.
 *
 * This prevents infinite retry loops and 500 errors.
 */

import { Chapters } from '@/services/chaptersService';
import { ProjectsDB } from '@/services/projectsDB';
import devLog from '@/utils/devLog';

import { syncQueue } from './syncQueue';

export interface CleanupResult {
  orphanedOperations: number;
  projectsChecked: Set<string>;
  chaptersChecked: Set<string>;
  operationsRemoved: string[];
}

/**
 * Clean up orphaned sync operations
 *
 * This checks all pending sync operations and removes any that reference
 * projects or chapters that no longer exist in local storage.
 */
export async function cleanupOrphanedSyncOperations(): Promise<CleanupResult> {
  devLog.log('[SyncQueueCleanup] Starting cleanup of orphaned sync operations');

  const result: CleanupResult = {
    orphanedOperations: 0,
    projectsChecked: new Set(),
    chaptersChecked: new Set(),
    operationsRemoved: [],
  };

  try {
    // Initialize sync queue to load operations
    await syncQueue.init();

    // Get all pending operations
    const stats = syncQueue.getStats();
    devLog.log(`[SyncQueueCleanup] Found ${stats.total} pending operations`);

    // Get all operations from the queue
    const operations = await getAllSyncOperations();

    for (const operation of operations) {
      let shouldRemove = false;

      // Check if the operation references a project
      if (operation.table === 'projects' && operation.recordId) {
        result.projectsChecked.add(operation.recordId);

        const project = await ProjectsDB.loadProject(operation.recordId);
        if (!project) {
          devLog.warn(`[SyncQueueCleanup] Found orphaned project operation: ${operation.recordId}`);
          shouldRemove = true;
        }
      }

      // Check if the operation references a chapter
      if (operation.table === 'chapters' && operation.recordId) {
        result.chaptersChecked.add(operation.recordId);

        try {
          const chapter = await Chapters.get(operation.recordId);
          if (!chapter) {
            devLog.warn(
              `[SyncQueueCleanup] Found orphaned chapter operation: ${operation.recordId}`,
            );
            shouldRemove = true;
          } else if (chapter.projectId) {
            // Also check if the chapter's parent project exists
            const project = await ProjectsDB.loadProject(chapter.projectId);
            if (!project) {
              devLog.warn(
                `[SyncQueueCleanup] Found chapter with missing parent project: ${operation.recordId} (project: ${chapter.projectId})`,
              );
              shouldRemove = true;
            }
          }
        } catch (error) {
          devLog.warn(`[SyncQueueCleanup] Error checking chapter ${operation.recordId}:`, error);
          shouldRemove = true;
        }
      }

      if (shouldRemove) {
        result.orphanedOperations++;
        result.operationsRemoved.push(operation.key);

        // Remove the operation from the queue
        await removeOperation(operation.key);
      }
    }

    devLog.log('[SyncQueueCleanup] Cleanup complete:', {
      orphanedOperations: result.orphanedOperations,
      projectsChecked: result.projectsChecked.size,
      chaptersChecked: result.chaptersChecked.size,
    });

    return result;
  } catch (error) {
    devLog.error('[SyncQueueCleanup] Cleanup failed:', error);
    throw error;
  }
}

/**
 * Get all sync operations from IndexedDB
 */
async function getAllSyncOperations(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('inkwell-sync-queue', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('operations', 'readonly');
      const store = tx.objectStore('operations');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        db.close();
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = () => {
        db.close();
        reject(getAllRequest.error);
      };
    };
  });
}

/**
 * Remove a specific operation from the sync queue
 */
async function removeOperation(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('inkwell-sync-queue', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('operations', 'readwrite');
      const store = tx.objectStore('operations');
      const deleteRequest = store.delete(key);

      deleteRequest.onsuccess = () => {
        db.close();
        devLog.log(`[SyncQueueCleanup] Removed operation: ${key}`);
        resolve();
      };

      deleteRequest.onerror = () => {
        db.close();
        reject(deleteRequest.error);
      };
    };
  });
}

/**
 * Clear all sync operations (nuclear option)
 * Use this if you want to start fresh
 */
export async function clearAllSyncOperations(): Promise<void> {
  devLog.warn('[SyncQueueCleanup] Clearing ALL sync operations');

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('inkwell-sync-queue', 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('operations', 'readwrite');
      const store = tx.objectStore('operations');
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        db.close();
        devLog.log('[SyncQueueCleanup] All sync operations cleared');
        resolve();
      };

      clearRequest.onerror = () => {
        db.close();
        reject(clearRequest.error);
      };
    };
  });
}
