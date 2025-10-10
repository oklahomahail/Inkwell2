// src/utils/id.ts - ID generation utilities
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

// Alternative UUID-like generator for compatibility
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Project-specific ID generators
export const idUtils = {
  project: () => generateId('proj'),
  chapter: () => generateId('chap'),
  scene: () => generateId('scene'),
  session: () => generateId('session'),
  backup: () => generateId('backup'),
};
