// src/lib/sectionHelpers.ts
/**
 * Section Helper Utilities
 *
 * Provides utility functions for section management
 */

import type { Section } from '@/types/section';

/**
 * Check if a title is duplicate (case-insensitive)
 *
 * @param title - Title to check
 * @param sections - Existing sections
 * @param excludeId - Optional section ID to exclude from check (for renames)
 * @returns True if title is duplicate
 */
export function isDuplicateTitle(title: string, sections: Section[], excludeId?: string): boolean {
  const normalized = title.trim().toLowerCase();
  return sections.some((s) => s.id !== excludeId && s.title.trim().toLowerCase() === normalized);
}

/**
 * Suggest a unique title by appending a number
 *
 * @param title - Desired title
 * @param sections - Existing sections
 * @returns Unique title (may be modified with " (2)", " (3)", etc.)
 */
export function suggestUniqueTitle(title: string, sections: Section[]): string {
  if (!isDuplicateTitle(title, sections)) {
    return title;
  }

  // Find next available number
  let counter = 2;
  let candidate = `${title} (${counter})`;

  while (isDuplicateTitle(candidate, sections)) {
    counter++;
    candidate = `${title} (${counter})`;
  }

  return candidate;
}

/**
 * Validate section title
 *
 * @param title - Title to validate
 * @returns Validation result with error message if invalid
 */
export function validateSectionTitle(title: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = title.trim();

  if (!trimmed) {
    return { valid: false, error: 'Title cannot be empty' };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'Title is too long (max 200 characters)' };
  }

  return { valid: true };
}
