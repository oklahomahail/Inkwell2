/**
 * Adapter Contract Tests
 *
 * Ensures data integrity during conversion between legacy and canonical formats.
 * Tests the following invariants:
 * 1. Round-trip conversion preserves shared fields
 * 2. No data loss for common attributes
 * 3. Proper defaults for missing fields
 * 4. Type safety after conversion
 */

import { describe, it, expect } from 'vitest';
import {
  sceneChapterToCanonical,
  convertLegacyChapters,
  isLegacyChapterFormat,
  canonicalToLegacyChapter,
  mergeScenesIntoChapter,
  characterFromPersisted,
  characterToPersisted,
  characterFromLegacy,
  createCharacter,
  isCanonicalCharacter,
  validateCharacter,
  type LegacyChapterWithScenes,
} from '@/adapters';
import type { Chapter } from '@/types/project';
import type { Character as PersistedCharacter } from '@/types/persistence';

describe('Chapter Adapters - Contract Tests', () => {
  describe('Legacy Scene Chapter → Canonical Chapter', () => {
    it('should convert scene-based chapter to chapter-only format', () => {
      const legacy: LegacyChapterWithScenes = {
        id: 'chapter-1',
        title: 'The Beginning',
        order: 0,
        status: 'draft',
        summary: 'The story begins',
        notes: 'Need to add more description',
        scenes: [
          {
            id: 'scene-1',
            title: 'Opening Scene',
            content: '<p>It was a dark and stormy night.</p>',
            order: 0,
            status: 'draft',
            wordCount: 7,
            characterIds: ['char-1'],
            createdAt: 1700000000000,
            updatedAt: 1700000001000,
          },
          {
            id: 'scene-2',
            title: 'The Plot Thickens',
            content: '<p>Thunder crashed overhead.</p>',
            order: 1,
            status: 'draft',
            wordCount: 4,
            characterIds: ['char-1', 'char-2'],
            createdAt: 1700000002000,
            updatedAt: 1700000003000,
          },
        ],
        createdAt: 1700000000000,
        updatedAt: 1700000003000,
        totalWordCount: 11,
      };

      const canonical = sceneChapterToCanonical(legacy);

      // Basic fields preserved
      expect(canonical.id).toBe('chapter-1');
      expect(canonical.title).toBe('The Beginning');
      expect(canonical.summary).toBe('The story begins');
      expect(canonical.notes).toBe('Need to add more description');
      expect(canonical.order).toBe(0);

      // Status mapped correctly
      expect(canonical.status).toBe('first-draft');

      // Content combined
      expect(canonical.content).toContain('Opening Scene');
      expect(canonical.content).toContain('It was a dark and stormy night');
      expect(canonical.content).toContain('The Plot Thickens');
      expect(canonical.content).toContain('Thunder crashed overhead');

      // Characters merged
      expect(canonical.charactersInChapter).toContain('char-1');
      expect(canonical.charactersInChapter).toContain('char-2');
      expect(canonical.charactersInChapter.length).toBe(2);

      // Word count calculated
      expect(canonical.wordCount).toBeGreaterThan(0);
    });

    it('should handle chapter with no scenes', () => {
      const legacy: LegacyChapterWithScenes = {
        id: 'chapter-empty',
        title: 'Empty Chapter',
        scenes: [],
        order: 0,
      };

      const canonical = sceneChapterToCanonical(legacy);

      expect(canonical.id).toBe('chapter-empty');
      expect(canonical.content).toBe('');
      expect(canonical.wordCount).toBe(0);
      expect(canonical.charactersInChapter).toEqual([]);
    });

    it('should preserve scene order when combining content', () => {
      const legacy: LegacyChapterWithScenes = {
        id: 'chapter-ordered',
        title: 'Ordered Chapter',
        scenes: [
          {
            id: 'scene-3',
            title: 'Third',
            content: '<p>Third scene</p>',
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'scene-1',
            title: 'First',
            content: '<p>First scene</p>',
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'scene-2',
            title: 'Second',
            content: '<p>Second scene</p>',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        order: 0,
      };

      const canonical = sceneChapterToCanonical(legacy);
      const contentLines = canonical.content.split('\n').filter(line => line.includes('scene'));

      expect(contentLines[0]).toContain('First');
      expect(contentLines[1]).toContain('Second');
      expect(contentLines[2]).toContain('Third');
    });
  });

  describe('Canonical Chapter → Legacy Scene Chapter', () => {
    it('should convert chapter-only to scene-based format', () => {
      const canonical: Chapter = {
        id: 'chapter-1',
        title: 'The Beginning',
        summary: 'The story begins',
        content: '<h2>Opening Scene</h2>\n<p>It was a dark and stormy night.</p>\n\n<h2>The Plot Thickens</h2>\n<p>Thunder crashed overhead.</p>',
        wordCount: 11,
        status: 'first-draft',
        order: 0,
        charactersInChapter: ['char-1', 'char-2'],
        plotPointsResolved: [],
        notes: 'Need to add more description',
        createdAt: 1700000000000,
        updatedAt: 1700000003000,
      };

      const legacy = canonicalToLegacyChapter(canonical);

      // Basic fields preserved
      expect(legacy.id).toBe('chapter-1');
      expect(legacy.title).toBe('The Beginning');
      expect(legacy.summary).toBe('The story begins');
      expect(legacy.notes).toBe('Need to add more description');
      expect(legacy.order).toBe(0);

      // Status mapped
      expect(legacy.status).toBe('draft');

      // Scenes created
      expect(legacy.scenes).toHaveLength(2);
      expect(legacy.scenes[0]?.title).toBe('Opening Scene');
      expect(legacy.scenes[1]?.title).toBe('The Plot Thickens');

      // Character IDs propagated to scenes
      expect(legacy.scenes[0]?.characterIds).toEqual(['char-1', 'char-2']);
    });

    it('should handle chapter with no h2 headings', () => {
      const canonical: Chapter = {
        id: 'chapter-simple',
        title: 'Simple Chapter',
        summary: '',
        content: '<p>Just some content without scene headings.</p>',
        wordCount: 6,
        status: 'in-progress',
        order: 0,
        charactersInChapter: [],
        plotPointsResolved: [],
        notes: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const legacy = canonicalToLegacyChapter(canonical);

      // Should create single scene
      expect(legacy.scenes).toHaveLength(1);
      expect(legacy.scenes[0]?.title).toBe('Scene 1');
      expect(legacy.scenes[0]?.content).toContain('Just some content');
    });
  });

  describe('Round-trip Conversion', () => {
    it('should preserve data through legacy → canonical → legacy conversion', () => {
      const original: LegacyChapterWithScenes = {
        id: 'chapter-roundtrip',
        title: 'Round Trip Test',
        order: 5,
        summary: 'Testing data integrity',
        notes: 'Important notes',
        scenes: [
          {
            id: 'scene-1',
            title: 'Scene One',
            content: '<p>First scene content</p>',
            order: 0,
            status: 'draft',
            characterIds: ['char-1'],
            createdAt: 1700000000000,
            updatedAt: 1700000001000,
          },
        ],
        createdAt: 1700000000000,
        updatedAt: 1700000001000,
      };

      // Convert to canonical and back
      const canonical = sceneChapterToCanonical(original);
      const converted = canonicalToLegacyChapter(canonical);

      // Shared fields should be preserved
      expect(converted.id).toBe(original.id);
      expect(converted.title).toBe(original.title);
      expect(converted.order).toBe(original.order);
      expect(converted.summary).toBe(original.summary);
      expect(converted.notes).toBe(original.notes);

      // Content should be intact (though structure may differ)
      expect(converted.scenes.length).toBeGreaterThan(0);
      const combinedContent = converted.scenes.map(s => s.content).join('');
      expect(combinedContent).toContain('First scene content');
    });
  });

  describe('Scene Merging', () => {
    it('should merge edited scenes back into chapter', () => {
      const chapter: Chapter = {
        id: 'chapter-1',
        title: 'Original',
        summary: '',
        content: '<h2>Scene 1</h2><p>Original content</p>',
        wordCount: 3,
        status: 'in-progress',
        order: 0,
        charactersInChapter: [],
        plotPointsResolved: [],
        notes: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const editedScenes = [
        {
          id: 'scene-1',
          title: 'Scene 1 - Edited',
          content: '<p>Edited content with more words</p>',
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const merged = mergeScenesIntoChapter(chapter, editedScenes);

      expect(merged.content).toContain('Scene 1 - Edited');
      expect(merged.content).toContain('Edited content with more words');
      expect(merged.wordCount).toBeGreaterThan(chapter.wordCount);
    });
  });
});

describe('Character Adapters - Contract Tests', () => {
  describe('Persisted → Canonical', () => {
    it('should convert persisted character to canonical format', () => {
      const persisted: PersistedCharacter = {
        id: 'char-1',
        name: 'Alice',
        bio: 'A curious adventurer',
        traits: {
          personality: ['brave', 'curious'],
          quirks: 'Always carries a notebook',
        },
        createdAt: 1700000000000,
        updatedAt: 1700000001000,
      };

      const canonical = characterFromPersisted(persisted);

      expect(canonical.id).toBe('char-1');
      expect(canonical.name).toBe('Alice');
      expect(canonical.description).toBe('A curious adventurer');
      expect(canonical.role).toBe('supporting'); // Default
      expect(canonical.createdAt).toBe(1700000000000);
      expect(canonical.updatedAt).toBe(1700000001000);

      // Required fields have defaults
      expect(canonical.personality).toEqual([]);
      expect(canonical.relationships).toEqual([]);
      expect(canonical.appearsInChapters).toEqual([]);
    });
  });

  describe('Canonical → Persisted', () => {
    it('should convert canonical character to persisted format', () => {
      const canonical = createCharacter('Bob', 'protagonist', {
        description: 'The hero of our story',
        personality: ['brave', 'kind'],
        goals: 'Save the kingdom',
        appearance: 'Tall with brown hair',
      });

      const persisted = characterToPersisted(canonical);

      expect(persisted.id).toBe(canonical.id);
      expect(persisted.name).toBe('Bob');
      expect(persisted.bio).toBe('The hero of our story');
      expect(persisted.traits).toMatchObject({
        role: 'protagonist',
        personality: ['brave', 'kind'],
        goals: 'Save the kingdom',
        appearance: 'Tall with brown hair',
      });
    });
  });

  describe('Round-trip Conversion', () => {
    it('should preserve shared fields through persisted → canonical → persisted', () => {
      const original: PersistedCharacter = {
        id: 'char-roundtrip',
        name: 'Charlie',
        bio: 'A mysterious figure',
        traits: { mood: 'brooding' },
        createdAt: 1700000000000,
        updatedAt: 1700000001000,
      };

      const canonical = characterFromPersisted(original);
      const converted = characterToPersisted(canonical);

      // Shared fields preserved
      expect(converted.id).toBe(original.id);
      expect(converted.name).toBe(original.name);
      expect(converted.bio).toBe(original.bio);
      expect(converted.createdAt).toBe(original.createdAt);
      expect(converted.updatedAt).toBe(original.updatedAt);
    });
  });

  describe('Type Guards and Validation', () => {
    it('should correctly identify canonical characters', () => {
      const canonical = createCharacter('Test', 'minor');
      expect(isCanonicalCharacter(canonical)).toBe(true);

      const invalid = { id: 'test', name: 'Test' };
      expect(isCanonicalCharacter(invalid)).toBe(false);
    });

    it('should validate characters with required fields', () => {
      const valid = {
        id: 'char-1',
        name: 'Valid Character',
        description: '',
        personality: [],
        backstory: '',
        goals: '',
        conflicts: '',
        appearance: '',
        relationships: [],
        appearsInChapters: [],
        notes: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(validateCharacter(valid)).toBe(true);

      const invalid = { name: 'Missing ID' };
      expect(validateCharacter(invalid)).toBe(false);
    });
  });

  describe('Legacy Character Conversion', () => {
    it('should handle legacy character with flexible fields', () => {
      const legacy = {
        id: 'char-legacy',
        name: 'Legacy Character',
        description: 'From old system',
        traits: ['smart', 'funny'],
        backstory: 'A long history',
        extra_field: 'Should be ignored',
      };

      const canonical = characterFromLegacy(legacy);

      expect(canonical.id).toBe('char-legacy');
      expect(canonical.name).toBe('Legacy Character');
      expect(canonical.description).toBe('From old system');
      expect(canonical.personality).toEqual(['smart', 'funny']);
      expect(canonical.backstory).toBe('A long history');
    });
  });
});

describe('Adapter Invariants', () => {
  it('should never lose IDs in conversion', () => {
    const legacy: LegacyChapterWithScenes = {
      id: 'preserve-id',
      title: 'Test',
      scenes: [],
      order: 0,
    };

    const canonical = sceneChapterToCanonical(legacy);
    expect(canonical.id).toBe('preserve-id');

    const converted = canonicalToLegacyChapter(canonical);
    expect(converted.id).toBe('preserve-id');
  });

  it('should never produce null/undefined required fields', () => {
    const legacy: LegacyChapterWithScenes = {
      id: 'minimal',
      title: 'Minimal Chapter',
      scenes: [],
      order: 0,
    };

    const canonical = sceneChapterToCanonical(legacy);

    // All required fields should exist
    expect(canonical.id).toBeDefined();
    expect(canonical.title).toBeDefined();
    expect(canonical.content).toBeDefined();
    expect(canonical.wordCount).toBeDefined();
    expect(canonical.status).toBeDefined();
    expect(canonical.order).toBeDefined();
    expect(canonical.charactersInChapter).toBeDefined();
    expect(canonical.plotPointsResolved).toBeDefined();
    expect(canonical.notes).toBeDefined();
    expect(canonical.createdAt).toBeDefined();
    expect(canonical.updatedAt).toBeDefined();
  });

  it('should handle edge cases gracefully', () => {
    // Empty content
    const emptyLegacy: LegacyChapterWithScenes = {
      id: 'empty',
      title: '',
      scenes: [],
      order: 0,
    };

    const emptyCanonical = sceneChapterToCanonical(emptyLegacy);
    expect(emptyCanonical.wordCount).toBe(0);
    expect(emptyCanonical.content).toBe('');

    // Missing timestamps
    const noTimestamp: PersistedCharacter = {
      id: 'no-time',
      name: 'No Time',
      bio: '',
      traits: {},
    };

    const charWithTime = characterFromPersisted(noTimestamp);
    expect(charWithTime.createdAt).toBeGreaterThan(0);
    expect(charWithTime.updatedAt).toBeGreaterThan(0);
  });
});
