/**
 * Character Model Gateway
 *
 * Unified API for character operations that uses canonical Character type.
 * Routes to appropriate storage based on feature flag and converts formats.
 */

import {
  characterFromPersisted,
  characterToPersisted,
  characterFromLegacy,
  createCharacter as createCanonicalCharacter,
  validateCharacter,
} from '@/adapters';
import type { Character } from '@/types';

// Lazy imports
let storageService: any = null;
let supabaseClient: any = null;

async function getStorageService() {
  if (!storageService) {
    const module = await import('@/services/storageService');
    storageService = module.default || module.storageService;
  }
  return storageService;
}

async function getSupabase() {
  if (!supabaseClient) {
    try {
      const module = await import('@/lib/supabase');
      supabaseClient = module.supabase;
    } catch (error) {
      console.warn('Supabase not available:', error);
      return null;
    }
  }
  return supabaseClient;
}

/**
 * Get all characters for a project
 */
export async function getCharacters(projectId: string): Promise<Character[]> {
  // Try Supabase first if available
  const supabase = await getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('projectId', projectId);

      if (!error && data) {
        return data.map(characterFromPersisted);
      }
    } catch (error) {
      console.warn('Failed to load from Supabase, falling back to localStorage:', error);
    }
  }

  // Fall back to localStorage
  const storage = await getStorageService();
  const project = await storage.getProject?.(projectId);

  if (!project || !project.characters) {
    return [];
  }

  // Convert legacy characters to canonical format
  return project.characters.map((char: any) => {
    if (validateCharacter(char)) {
      return char;
    }
    return characterFromLegacy(char);
  });
}

/**
 * Get a single character by ID
 */
export async function getCharacter(
  projectId: string,
  characterId: string
): Promise<Character | null> {
  const characters = await getCharacters(projectId);
  return characters.find(c => c.id === characterId) || null;
}

/**
 * Save a character (create or update)
 */
export async function saveCharacter(
  projectId: string,
  character: Character
): Promise<Character> {
  // Validate character
  if (!validateCharacter(character)) {
    throw new Error('Invalid character: missing required fields');
  }

  // Try Supabase first
  const supabase = await getSupabase();
  if (supabase) {
    try {
      const persisted = characterToPersisted(character);
      const { data, error } = await supabase
        .from('characters')
        .upsert({ ...persisted, projectId })
        .select()
        .single();

      if (!error && data) {
        return characterFromPersisted(data);
      }
    } catch (error) {
      console.warn('Failed to save to Supabase, falling back to localStorage:', error);
    }
  }

  // Fall back to localStorage
  const storage = await getStorageService();
  const project = await storage.getProject?.(projectId);

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  // Update or add character
  const characters = project.characters || [];
  const existingIndex = characters.findIndex((c: any) => c.id === character.id);

  if (existingIndex >= 0) {
    characters[existingIndex] = character;
  } else {
    characters.push(character);
  }

  project.characters = characters;
  project.updatedAt = Date.now();

  await storage.saveProject?.(project);

  return character;
}

/**
 * Create a new character
 */
export async function createCharacter(
  projectId: string,
  name: string,
  role: Character['role'] = 'supporting',
  overrides: Partial<Character> = {}
): Promise<Character> {
  const character = createCanonicalCharacter(name, role, overrides);
  return saveCharacter(projectId, character);
}

/**
 * Delete a character
 */
export async function deleteCharacter(
  projectId: string,
  characterId: string
): Promise<void> {
  // Try Supabase first
  const supabase = await getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId)
        .eq('projectId', projectId);

      if (!error) return;
    } catch (error) {
      console.warn('Failed to delete from Supabase, falling back to localStorage:', error);
    }
  }

  // Fall back to localStorage
  const storage = await getStorageService();
  const project = await storage.getProject?.(projectId);

  if (!project) return;

  project.characters = (project.characters || []).filter((c: any) => c.id !== characterId);
  project.updatedAt = Date.now();

  await storage.saveProject?.(project);
}

/**
 * Update character relationships
 */
export async function updateCharacterRelationships(
  projectId: string,
  characterId: string,
  relationships: Character['relationships']
): Promise<void> {
  const character = await getCharacter(projectId, characterId);
  if (!character) {
    throw new Error(`Character ${characterId} not found`);
  }

  character.relationships = relationships;
  character.updatedAt = Date.now();

  await saveCharacter(projectId, character);
}

/**
 * Add character to chapter
 */
export async function addCharacterToChapter(
  projectId: string,
  characterId: string,
  chapterId: string
): Promise<void> {
  const character = await getCharacter(projectId, characterId);
  if (!character) return;

  if (!character.appearsInChapters.includes(chapterId)) {
    character.appearsInChapters.push(chapterId);
    character.updatedAt = Date.now();
    await saveCharacter(projectId, character);
  }
}

/**
 * Remove character from chapter
 */
export async function removeCharacterFromChapter(
  projectId: string,
  characterId: string,
  chapterId: string
): Promise<void> {
  const character = await getCharacter(projectId, characterId);
  if (!character) return;

  character.appearsInChapters = character.appearsInChapters.filter(id => id !== chapterId);
  character.updatedAt = Date.now();

  await saveCharacter(projectId, character);
}

/**
 * Get characters appearing in a specific chapter
 */
export async function getCharactersInChapter(
  projectId: string,
  chapterId: string
): Promise<Character[]> {
  const characters = await getCharacters(projectId);
  return characters.filter(c => c.appearsInChapters.includes(chapterId));
}

/**
 * Search characters by name or role
 */
export async function searchCharacters(
  projectId: string,
  query: string
): Promise<Character[]> {
  const characters = await getCharacters(projectId);
  const lowerQuery = query.toLowerCase();

  return characters.filter(c =>
    c.name.toLowerCase().includes(lowerQuery) ||
    c.role.toLowerCase().includes(lowerQuery) ||
    c.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Export for testing
 */
export const CharacterGateway = {
  getCharacters,
  getCharacter,
  saveCharacter,
  createCharacter,
  deleteCharacter,
  updateCharacterRelationships,
  addCharacterToChapter,
  removeCharacterFromChapter,
  getCharactersInChapter,
  searchCharacters,
};
