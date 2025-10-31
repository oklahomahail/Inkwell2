/**
 * Character Model Adapter
 *
 * Unifies three different Character type definitions into a single canonical model.
 * Provides adapters to convert between formats for backwards compatibility.
 *
 * Type Sources:
 * 1. types/project.ts - Detailed character with relationships (CANONICAL)
 * 2. types/persistence.ts - Minimal Supabase storage format
 * 3. Legacy writing.ts character (deprecated)
 */

import type { Character as PersistedCharacter } from '@/types/persistence';
import type { Character as CanonicalCharacter, CharacterRole } from '@/types/project';

// Re-export canonical Character as the primary type
export type { Character, CharacterRole, CharacterRelationship } from '@/types/project';

/**
 * Minimal character interface - common fields across all variants
 */
export interface MinimalCharacter {
  id: string;
  name: string;
  description?: string;
  createdAt?: number | string | Date;
  updatedAt?: number | string | Date;
}

/**
 * Convert persisted character (from Supabase) to canonical format
 */
export function fromPersisted(persisted: PersistedCharacter): CanonicalCharacter {
  const now = Date.now();

  return {
    id: persisted.id,
    name: persisted.name,
    role: 'supporting' as CharacterRole, // Default role
    description: persisted.bio || '',
    personality: [], // Extract from traits if possible
    backstory: '',
    goals: '',
    conflicts: '',
    appearance: '',
    relationships: [],
    appearsInChapters: [],
    notes: '',
    createdAt: persisted.created_at ? new Date(persisted.created_at).getTime() : now,
    updatedAt: persisted.updated_at ? new Date(persisted.updated_at).getTime() : now,
  };
}

/**
 * Convert canonical character to persisted format (for Supabase)
 */
export function toPersisted(canonical: CanonicalCharacter): PersistedCharacter {
  return {
    id: canonical.id,
    project_id: '', // Will be set by the storage layer
    client_rev: 1,
    name: canonical.name,
    bio: canonical.description || canonical.backstory || '',
    traits: {
      role: canonical.role,
      personality: canonical.personality,
      goals: canonical.goals,
      conflicts: canonical.conflicts,
      appearance: canonical.appearance,
    },
    created_at: new Date(canonical.createdAt).toISOString(),
    updated_at: new Date(canonical.updatedAt).toISOString(),
  };
}

/**
 * Convert legacy/minimal character to canonical format
 * Used for migration from old scene-based system
 */
export function fromLegacy(legacy: MinimalCharacter & Record<string, any>): CanonicalCharacter {
  const now = Date.now();

  return {
    id: legacy.id,
    name: legacy.name,
    role: (legacy.role as CharacterRole) || 'supporting',
    description: legacy.description || '',
    personality: Array.isArray(legacy.personality) ? legacy.personality :
                 Array.isArray(legacy.traits) ? legacy.traits : [],
    backstory: legacy.backstory || '',
    goals: legacy.goals || '',
    conflicts: legacy.conflicts || '',
    appearance: legacy.appearance || '',
    relationships: legacy.relationships || [],
    appearsInChapters: legacy.appearsInChapters || [],
    notes: legacy.notes || '',
    createdAt: typeof legacy.createdAt === 'number'
      ? legacy.createdAt
      : legacy.createdAt
        ? new Date(legacy.createdAt).getTime()
        : now,
    updatedAt: typeof legacy.updatedAt === 'number'
      ? legacy.updatedAt
      : legacy.updatedAt
        ? new Date(legacy.updatedAt).getTime()
        : now,
  };
}

/**
 * Create a new canonical character with defaults
 */
export function createCharacter(
  name: string,
  role: CharacterRole = 'supporting',
  overrides: Partial<CanonicalCharacter> = {}
): CanonicalCharacter {
  const now = Date.now();
  const id = overrides.id || `character-${now}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    name,
    role,
    description: '',
    personality: [],
    backstory: '',
    goals: '',
    conflicts: '',
    appearance: '',
    relationships: [],
    appearsInChapters: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Type guard to check if an object is a canonical character
 */
export function isCanonicalCharacter(obj: any): obj is CanonicalCharacter {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.role === 'string' &&
    Array.isArray(obj.relationships)
  );
}

/**
 * Validate character has minimum required fields
 */
export function validateCharacter(character: Partial<CanonicalCharacter>): character is CanonicalCharacter {
  if (!character.id || !character.name) {
    return false;
  }

  // Ensure required fields have default values
  if (!character.role) {
    (character as any).role = 'supporting';
  }

  return true;
}
