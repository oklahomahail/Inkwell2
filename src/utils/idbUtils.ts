/**
 * IndexedDB Utilities
 *
 * Common helpers for working with IndexedDB operations
 */

/**
 * Check if an error is a missing object store error
 *
 * @param error - The error to check
 * @param storeName - The expected store name
 * @returns true if the error is a NotFoundError for a missing object store
 */
export function isMissingStoreError(error: unknown, storeName: string): boolean {
  if (!(error instanceof DOMException)) return false;
  if (error.name !== 'NotFoundError') return false;

  // Optional: string check to be extra sure, since Firefox error messages are pretty specific
  return error.message.includes(`'${storeName}' is not a known object store name`);
}

/**
 * Check if IndexedDB is available in the current environment
 */
export function hasIndexedDB(): boolean {
  return typeof globalThis !== 'undefined' && !!(globalThis as any).indexedDB;
}
