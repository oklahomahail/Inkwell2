export const generateId = _generateId;

export function _generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 5);
  return `${prefix}_${timestamp}_${randomPart}`;
}
export const generateUUID = _generateUUID;

export function _generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validates if a string is a valid UUID (v4 format)
 * @param id - String to validate
 * @returns true if valid UUID, false otherwise
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validates if a project ID is in a valid format
 * Valid formats: UUID or proj_welcome_* pattern
 * @param projectId - Project ID to validate
 * @returns true if valid format, false otherwise
 */
export function isValidProjectId(projectId: string): boolean {
  if (!projectId || typeof projectId !== 'string') return false;

  // Check for UUID format (standard for new projects)
  if (isValidUUID(projectId)) return true;

  // Check for welcome project format
  if (projectId.startsWith('proj_welcome_')) {
    // Ensure the format is proj_welcome_{timestamp}
    const parts = projectId.split('_');
    if (parts.length === 3 && !isNaN(Number(parts[2]))) {
      return true;
    }
  }

  // Legacy format support: project-{timestamp}
  // This format is deprecated but supported for migration
  if (projectId.startsWith('project-')) {
    const timestamp = projectId.replace('project-', '');
    if (/^\d+$/.test(timestamp)) {
      console.warn(
        `[idUtils] Legacy project ID format detected: ${projectId}. New projects should use UUIDs.`,
      );
      return true;
    }
  }

  return false;
}

/**
 * Clears corrupted project ID data from localStorage
 * This includes invalid current project IDs and related section data
 * @param invalidProjectId - Optional specific project ID to clear
 * @returns Array of cleared localStorage keys
 */
export function clearCorruptedProjectData(invalidProjectId?: string): string[] {
  const clearedKeys: string[] = [];

  try {
    // If specific invalid ID provided, clear it
    if (invalidProjectId && !isValidProjectId(invalidProjectId)) {
      // Clear current project ID if it matches
      const currentProjectId = localStorage.getItem('inkwell_current_project_id');
      if (currentProjectId === invalidProjectId) {
        localStorage.removeItem('inkwell_current_project_id');
        clearedKeys.push('inkwell_current_project_id');
      }

      // Clear related section data
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (
          (key.startsWith('lastSection-') && key.includes(invalidProjectId)) ||
          (key.startsWith('inkwell_') && key.includes(invalidProjectId))
        ) {
          localStorage.removeItem(key);
          clearedKeys.push(key);
        }
      });
    } else {
      // Validate current project ID
      const currentProjectId = localStorage.getItem('inkwell_current_project_id');
      if (currentProjectId && !isValidProjectId(currentProjectId)) {
        localStorage.removeItem('inkwell_current_project_id');
        clearedKeys.push('inkwell_current_project_id');
        console.error(`[idUtils] Cleared corrupted current project ID: ${currentProjectId}`);

        // Clear related data
        const allKeys = Object.keys(localStorage);
        allKeys.forEach((key) => {
          if (
            (key.startsWith('lastSection-') && key.includes(currentProjectId)) ||
            (key.startsWith('inkwell_') && key.includes(currentProjectId))
          ) {
            localStorage.removeItem(key);
            clearedKeys.push(key);
          }
        });
      }
    }

    if (clearedKeys.length > 0) {
      console.warn(
        `[idUtils] Cleared ${clearedKeys.length} corrupted localStorage keys:`,
        clearedKeys,
      );
    }

    return clearedKeys;
  } catch (error) {
    console.error('[idUtils] Failed to clear corrupted project data:', error);
    return clearedKeys;
  }
}
