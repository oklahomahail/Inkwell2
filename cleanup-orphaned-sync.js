/**
 * Standalone script to clean up orphaned sync operations
 * Run this in the browser console on any environment
 */

(async function cleanupOrphanedSync() {
  console.log('🧹 Starting orphaned sync cleanup...');

  try {
    // Open the sync queue database
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('inkwell-sync-queue', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    // Get all operations
    const operations = await new Promise((resolve, reject) => {
      const tx = db.transaction('operations', 'readonly');
      const store = tx.objectStore('operations');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });

    console.log(`📋 Found ${operations.length} pending sync operations`);

    if (operations.length === 0) {
      console.log('✅ No operations to clean up');
      db.close();
      return;
    }

    // Open projects database to check if projects exist
    const projectsDb = await new Promise((resolve, reject) => {
      const request = indexedDB.open('inkwell-db', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    const projectsToRemove = [];
    const chaptersToRemove = [];

    // Check each operation
    for (const operation of operations) {
      // First check if operation is already marked as failed with non-retryable error
      if (operation.status === 'failed' && operation.error?.includes('[Non-retryable]')) {
        console.warn(`🗑️  Found failed non-retryable operation: ${operation.id} (${operation.table})`);
        projectsToRemove.push(operation.id);
        continue;
      }

      // Check for orphaned project operations
      if (operation.table === 'projects' && operation.recordId) {
        // Check if project exists in IndexedDB
        const project = await new Promise((resolve, reject) => {
          const tx = projectsDb.transaction('projects', 'readonly');
          const store = tx.objectStore('projects');
          const getRequest = store.get(operation.recordId);

          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => reject(getRequest.error);
        });

        if (!project) {
          console.warn(`🗑️  Found orphaned project operation: ${operation.recordId}`);
          projectsToRemove.push(operation.id);
        }
      }

      // Check for orphaned chapter operations
      if (operation.table === 'chapters' && operation.projectId) {
        // Check if parent project exists
        const project = await new Promise((resolve, reject) => {
          const tx = projectsDb.transaction('projects', 'readonly');
          const store = tx.objectStore('projects');
          const getRequest = store.get(operation.projectId);

          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => reject(getRequest.error);
        });

        if (!project) {
          console.warn(`🗑️  Found orphaned chapter operation: ${operation.recordId} (parent project ${operation.projectId} not found)`);
          projectsToRemove.push(operation.id);
        }
      }
    }

    projectsDb.close();

    // Remove orphaned operations
    if (projectsToRemove.length > 0) {
      for (const key of projectsToRemove) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction('operations', 'readwrite');
          const store = tx.objectStore('operations');
          const deleteRequest = store.delete(key);

          deleteRequest.onsuccess = () => {
            console.log(`✅ Removed orphaned operation: ${key}`);
            resolve();
          };
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      }

      console.log(`\n✅ Cleanup complete! Removed ${projectsToRemove.length} orphaned operations`);
    } else {
      console.log('✅ No orphaned operations found');
    }

    db.close();

    // Suggest a page reload
    console.log('\n💡 Reload the page to see if errors are resolved');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
})();
