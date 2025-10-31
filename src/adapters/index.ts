/**
 * Data Model Adapters
 *
 * Provides conversion functions between legacy and canonical data formats.
 * Used during v0.6.0 migration period when VITE_ENABLE_CHAPTER_MODEL flag is transitioning.
 *
 * Usage:
 * - Import from @/adapters (this file) for all adapter functions
 * - Use feature flag to determine which format to use
 * - Adapters ensure round-trip data integrity for migration
 */

// Character adapters
export {
  fromPersisted as characterFromPersisted,
  toPersisted as characterToPersisted,
  fromLegacy as characterFromLegacy,
  createCharacter,
  isCanonicalCharacter,
  validateCharacter,
  type MinimalCharacter,
} from './characterModel';

// Scene → Chapter adapters
export {
  sceneChapterToCanonical,
  convertLegacyChapters,
  extractSceneBoundaries,
  isLegacyChapterFormat,
  type LegacyChapterWithScenes,
  type SceneBoundary,
} from './sceneToChapter';

// Chapter → Scene adapters (backwards compatibility)
export {
  canonicalToLegacyChapter,
  convertToLegacyChapters,
  chapterToSingleScene,
  mergeScenesIntoChapter,
} from './chapterToLegacyScene';

// Re-export canonical types for convenience
export type { Chapter, Character } from '@/types/project';
