/**
 * Model Gateway Index
 *
 * Unified data access layer for Inkwell.
 * Import from @/model for all data operations.
 *
 * Benefits:
 * - Single source of truth for data access
 * - Automatic routing based on feature flags
 * - Type-safe canonical interfaces
 * - Easy to test and mock
 *
 * Usage:
 * ```typescript
 * import { getChapters, saveCharacter } from '@/model';
 *
 * const chapters = await getChapters(projectId);
 * await saveCharacter(projectId, character);
 * ```
 */

// Chapter operations
export {
  getChapters,
  getChapter,
  saveChapter,
  createChapter,
  updateChapterContent,
  deleteChapter,
  reorderChapters,
  getChapterCount,
  getTotalWordCount,
  ChapterGateway,
} from './chapters';

// Character operations
export {
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
  CharacterGateway,
} from './characters';

// Re-export canonical types for convenience
export type { Project, EnhancedProject, Chapter, Character } from '@/types/project';

export type { ChapterMeta, ChapterDoc } from '@/types/writing';
