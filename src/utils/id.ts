// src/utils/id.ts
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Alternative with prefix for different entity types
export function generateSceneId(): string {
  return `scene-${generateId()}`;
}

export function generateChapterId(): string {
  return `chapter-${generateId()}`;
}

export function generateProjectId(): string {
  return `project-${generateId()}`;
}

// UUID v4 alternative (more standard)
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}