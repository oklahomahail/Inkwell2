/**
 * Character Model Gateway Tests
 *
 * Comprehensive test suite for the characters model gateway,
 * covering Supabase and localStorage fallback modes.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Character } from '@/types/project';
import {
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
} from '../characters';

// Mock dependencies
const mockSupabase = {
  from: vi.fn(),
};

const mockStorageService = {
  getProject: vi.fn(),
  saveProject: vi.fn(),
};

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/services/storageService', () => ({
  EnhancedStorageService: mockStorageService,
}));

vi.mock('@/adapters', async () => {
  const actual = await vi.importActual('@/adapters');
  return {
    ...actual,
    characterFromPersisted: vi.fn((char) => char),
    characterToPersisted: vi.fn((char) => char),
    characterFromLegacy: vi.fn((char) => ({
      ...char,
      _fromLegacy: true,
    })),
    createCharacter: vi.fn((name, role, overrides = {}) => ({
      id: `char-${Date.now()}`,
      name,
      role,
      description: '',
      appearance: '',
      background: '',
      traits: [],
      relationships: [],
      appearsInChapters: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    })),
    validateCharacter: vi.fn((char) => {
      return char && char.id && char.name && char.role;
    }),
  };
});

describe('Character Model Gateway', () => {
  const projectId = 'project-123';
  const characterId = 'char-456';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default Supabase mock setup
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn(),
    });
  });

  describe('getCharacters', () => {
    it('should fetch characters from Supabase when available', async () => {
      const mockCharacters = [
        {
          id: 'char-1',
          projectId,
          name: 'Alice',
          role: 'protagonist',
        },
        {
          id: 'char-2',
          projectId,
          name: 'Bob',
          role: 'antagonist',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockCharacters, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getCharacters(projectId);

      expect(mockSupabase.from).toHaveBeenCalledWith('characters');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('projectId', projectId);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name', 'Alice');
    });

    it('should fall back to localStorage when Supabase fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const mockProject = {
        id: projectId,
        characters: [
          {
            id: 'char-1',
            name: 'Charlie',
            role: 'supporting',
          },
        ],
      };

      mockStorageService.getProject.mockResolvedValue(mockProject);

      const result = await getCharacters(projectId);

      expect(mockStorageService.getProject).toHaveBeenCalledWith(projectId);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when project has no characters', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockStorageService.getProject.mockResolvedValue({ id: projectId, characters: null });

      const result = await getCharacters(projectId);

      expect(result).toEqual([]);
    });

    it('should return empty array when project not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockStorageService.getProject.mockResolvedValue(null);

      const result = await getCharacters(projectId);

      expect(result).toEqual([]);
    });

    it('should convert legacy characters to canonical format', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: new Error('Offline') }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const mockProject = {
        id: projectId,
        characters: [
          {
            // Legacy character missing required fields
            name: 'Legacy Character',
          },
        ],
      };

      mockStorageService.getProject.mockResolvedValue(mockProject);

      const result = await getCharacters(projectId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('_fromLegacy', true);
    });
  });

  describe('getCharacter', () => {
    it('should return specific character by ID', async () => {
      const mockCharacters: Character[] = [
        {
          id: characterId,
          name: 'Alice',
          role: 'protagonist',
          description: 'Main character',
          appearance: 'Tall',
          background: 'Orphan',
          traits: ['brave'],
          relationships: [],
          appearsInChapters: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'char-other',
          name: 'Bob',
          role: 'antagonist',
          description: 'Villain',
          appearance: 'Short',
          background: 'Rich',
          traits: ['evil'],
          relationships: [],
          appearsInChapters: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockCharacters, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getCharacter(projectId, characterId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(characterId);
      expect(result?.name).toBe('Alice');
    });

    it('should return null when character not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getCharacter(projectId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('saveCharacter', () => {
    const mockCharacter: Character = {
      id: characterId,
      name: 'Test Character',
      role: 'supporting',
      description: 'Test description',
      appearance: 'Test appearance',
      background: 'Test background',
      traits: ['trait1', 'trait2'],
      relationships: [],
      appearsInChapters: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should save character to Supabase when available', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCharacter, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await saveCharacter(projectId, mockCharacter);

      expect(mockSupabase.from).toHaveBeenCalledWith('characters');
      expect(mockQuery.upsert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should fall back to localStorage when Supabase fails', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const mockProject = {
        id: projectId,
        characters: [],
      };

      mockStorageService.getProject.mockResolvedValue(mockProject);

      await saveCharacter(projectId, mockCharacter);

      expect(mockStorageService.saveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          characters: [mockCharacter],
        }),
      );
    });

    it('should update existing character in localStorage', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Offline') }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const existingCharacter = { ...mockCharacter, name: 'Old Name' };
      const mockProject = {
        id: projectId,
        characters: [existingCharacter],
      };

      mockStorageService.getProject.mockResolvedValue(mockProject);

      await saveCharacter(projectId, mockCharacter);

      expect(mockStorageService.saveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          characters: [expect.objectContaining({ name: 'Test Character' })],
        }),
      );
    });

    it('should throw error when character is invalid', async () => {
      const invalidCharacter = {
        id: 'char-1',
        // Missing required fields
      } as Character;

      await expect(saveCharacter(projectId, invalidCharacter)).rejects.toThrow('Invalid character');
    });

    it('should throw error when project not found in localStorage fallback', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Offline') }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockStorageService.getProject.mockResolvedValue(null);

      await expect(saveCharacter(projectId, mockCharacter)).rejects.toThrow('not found');
    });
  });

  describe('createCharacter', () => {
    it('should create character with default role', async () => {
      const createdChar = {
        id: 'char-new',
        name: 'New Character',
        role: 'supporting' as const,
        description: '',
        appearance: '',
        background: '',
        traits: [],
        relationships: [],
        appearsInChapters: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdChar, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await createCharacter(projectId, 'New Character');

      expect(result).toMatchObject({
        name: 'New Character',
        role: 'supporting',
      });
      expect(result.id).toBeDefined();
    });

    it('should create character with custom role', async () => {
      const createdChar = {
        id: 'char-hero',
        name: 'Hero',
        role: 'protagonist' as const,
        description: '',
        appearance: '',
        background: '',
        traits: [],
        relationships: [],
        appearsInChapters: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdChar, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await createCharacter(projectId, 'Hero', 'protagonist');

      expect(result).toMatchObject({
        name: 'Hero',
        role: 'protagonist',
      });
    });

    it('should create character with custom overrides', async () => {
      const createdChar = {
        id: 'char-custom',
        name: 'Custom',
        role: 'antagonist' as const,
        description: 'Custom description',
        appearance: '',
        background: '',
        traits: ['sneaky', 'intelligent'],
        relationships: [],
        appearsInChapters: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdChar, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await createCharacter(projectId, 'Custom', 'antagonist', {
        description: 'Custom description',
        traits: ['sneaky', 'intelligent'],
      });

      expect(result).toMatchObject({
        name: 'Custom',
        role: 'antagonist',
        description: 'Custom description',
        traits: ['sneaky', 'intelligent'],
      });
    });
  });

  describe('deleteCharacter', () => {
    it('should delete character from Supabase', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      // First eq call
      mockQuery.eq.mockReturnValueOnce(mockQuery);
      // Second eq call returns resolved value
      mockQuery.eq.mockResolvedValueOnce({ error: null });

      mockSupabase.from.mockReturnValue(mockQuery);

      await deleteCharacter(projectId, characterId);

      expect(mockSupabase.from).toHaveBeenCalledWith('characters');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', characterId);
      expect(mockQuery.eq).toHaveBeenCalledWith('projectId', projectId);
    });

    it('should delete character from localStorage when Supabase fails', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      mockQuery.eq.mockReturnValueOnce(mockQuery);
      mockQuery.eq.mockResolvedValueOnce({ error: new Error('Network error') });

      mockSupabase.from.mockReturnValue(mockQuery);

      const mockProject = {
        id: projectId,
        characters: [
          { id: characterId, name: 'To Delete' },
          { id: 'char-keep', name: 'Keep This' },
        ],
      };

      mockStorageService.getProject.mockResolvedValue(mockProject);

      await deleteCharacter(projectId, characterId);

      expect(mockStorageService.saveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          characters: [expect.objectContaining({ id: 'char-keep' })],
        }),
      );
    });

    it('should handle deletion when project not found', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      mockQuery.eq.mockReturnValueOnce(mockQuery);
      mockQuery.eq.mockResolvedValueOnce({ error: new Error('Offline') });

      mockSupabase.from.mockReturnValue(mockQuery);
      mockStorageService.getProject.mockResolvedValue(null);

      // Should not throw
      await expect(deleteCharacter(projectId, characterId)).resolves.toBeUndefined();
    });
  });

  describe('updateCharacterRelationships', () => {
    it('should update character relationships', async () => {
      const mockCharacter: Character = {
        id: characterId,
        name: 'Alice',
        role: 'protagonist',
        description: '',
        appearance: '',
        background: '',
        traits: [],
        relationships: [],
        appearsInChapters: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [mockCharacter], error: null }),
      };

      const mockUpsertQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCharacter, error: null }),
      };

      mockSupabase.from.mockReturnValueOnce(mockQuery).mockReturnValueOnce(mockUpsertQuery);

      const newRelationships = [
        { characterId: 'char-2', relationship: 'friend', description: 'Best friends' },
      ];

      await updateCharacterRelationships(projectId, characterId, newRelationships);

      expect(mockUpsertQuery.upsert).toHaveBeenCalled();
    });

    it('should throw error when character not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(updateCharacterRelationships(projectId, 'non-existent', [])).rejects.toThrow(
        'not found',
      );
    });
  });

  describe('addCharacterToChapter', () => {
    it('should add chapter ID to character appearance list', async () => {
      const mockCharacter: Character = {
        id: characterId,
        name: 'Alice',
        role: 'protagonist',
        description: '',
        appearance: '',
        background: '',
        traits: [],
        relationships: [],
        appearsInChapters: ['chapter-1'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [mockCharacter], error: null }),
      };

      const mockUpsertQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCharacter, error: null }),
      };

      mockSupabase.from.mockReturnValueOnce(mockQuery).mockReturnValueOnce(mockUpsertQuery);

      await addCharacterToChapter(projectId, characterId, 'chapter-2');

      expect(mockUpsertQuery.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          appearsInChapters: ['chapter-1', 'chapter-2'],
        }),
      );
    });

    it('should not add duplicate chapter ID', async () => {
      const mockCharacter: Character = {
        id: characterId,
        name: 'Alice',
        role: 'protagonist',
        description: '',
        appearance: '',
        background: '',
        traits: [],
        relationships: [],
        appearsInChapters: ['chapter-1'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [mockCharacter], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await addCharacterToChapter(projectId, characterId, 'chapter-1');

      // Should not call upsert since chapter already in list
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it('should handle character not found gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      // Should not throw
      await expect(
        addCharacterToChapter(projectId, 'non-existent', 'chapter-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('removeCharacterFromChapter', () => {
    it('should remove chapter ID from character appearance list', async () => {
      const mockCharacter: Character = {
        id: characterId,
        name: 'Alice',
        role: 'protagonist',
        description: '',
        appearance: '',
        background: '',
        traits: [],
        relationships: [],
        appearsInChapters: ['chapter-1', 'chapter-2', 'chapter-3'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [mockCharacter], error: null }),
      };

      const mockUpsertQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCharacter, error: null }),
      };

      mockSupabase.from.mockReturnValueOnce(mockQuery).mockReturnValueOnce(mockUpsertQuery);

      await removeCharacterFromChapter(projectId, characterId, 'chapter-2');

      expect(mockUpsertQuery.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          appearsInChapters: ['chapter-1', 'chapter-3'],
        }),
      );
    });
  });

  describe('getCharactersInChapter', () => {
    it('should return characters appearing in specific chapter', async () => {
      const mockCharacters: Character[] = [
        {
          id: 'char-1',
          name: 'Alice',
          role: 'protagonist',
          description: '',
          appearance: '',
          background: '',
          traits: [],
          relationships: [],
          appearsInChapters: ['chapter-1', 'chapter-2'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'char-2',
          name: 'Bob',
          role: 'antagonist',
          description: '',
          appearance: '',
          background: '',
          traits: [],
          relationships: [],
          appearsInChapters: ['chapter-2'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'char-3',
          name: 'Charlie',
          role: 'supporting',
          description: '',
          appearance: '',
          background: '',
          traits: [],
          relationships: [],
          appearsInChapters: ['chapter-3'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockCharacters, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getCharactersInChapter(projectId, 'chapter-2');

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.name)).toEqual(['Alice', 'Bob']);
    });

    it('should return empty array when no characters in chapter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await getCharactersInChapter(projectId, 'chapter-empty');

      expect(result).toEqual([]);
    });
  });

  describe('searchCharacters', () => {
    const mockCharacters: Character[] = [
      {
        id: 'char-1',
        name: 'Alice Anderson',
        role: 'protagonist',
        description: 'A brave warrior',
        appearance: '',
        background: '',
        traits: [],
        relationships: [],
        appearsInChapters: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'char-2',
        name: 'Bob Builder',
        role: 'antagonist',
        description: 'An evil architect',
        appearance: '',
        background: '',
        traits: [],
        relationships: [],
        appearsInChapters: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'char-3',
        name: 'Charlie Chase',
        role: 'supporting',
        description: 'A helpful sidekick',
        appearance: '',
        background: '',
        traits: [],
        relationships: [],
        appearsInChapters: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    beforeEach(() => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockCharacters, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
    });

    it('should search characters by name', async () => {
      const result = await searchCharacters(projectId, 'alice');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice Anderson');
    });

    it('should search characters by role', async () => {
      const result = await searchCharacters(projectId, 'antagonist');

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('antagonist');
    });

    it('should search characters by description', async () => {
      const result = await searchCharacters(projectId, 'architect');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob Builder');
    });

    it('should be case-insensitive', async () => {
      const result = await searchCharacters(projectId, 'CHARLIE');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Charlie Chase');
    });

    it('should return empty array when no matches', async () => {
      const result = await searchCharacters(projectId, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should return multiple matches', async () => {
      const result = await searchCharacters(projectId, 'a'); // Matches Alice and antagonist

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('CharacterGateway Export', () => {
    it('should export all gateway functions', () => {
      expect(CharacterGateway).toHaveProperty('getCharacters');
      expect(CharacterGateway).toHaveProperty('getCharacter');
      expect(CharacterGateway).toHaveProperty('saveCharacter');
      expect(CharacterGateway).toHaveProperty('createCharacter');
      expect(CharacterGateway).toHaveProperty('deleteCharacter');
      expect(CharacterGateway).toHaveProperty('updateCharacterRelationships');
      expect(CharacterGateway).toHaveProperty('addCharacterToChapter');
      expect(CharacterGateway).toHaveProperty('removeCharacterFromChapter');
      expect(CharacterGateway).toHaveProperty('getCharactersInChapter');
      expect(CharacterGateway).toHaveProperty('searchCharacters');
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase network errors gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockRejectedValue(new Error('Network timeout')),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockStorageService.getProject.mockResolvedValue({ id: projectId, characters: [] });

      // Should fall back to localStorage without throwing
      const result = await getCharacters(projectId);

      expect(result).toEqual([]);
    });

    it('should handle localStorage errors when saving', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Offline')),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockStorageService.getProject.mockRejectedValue(new Error('Storage error'));

      const character: Character = {
        id: characterId,
        name: 'Test',
        role: 'supporting',
        description: '',
        appearance: '',
        background: '',
        traits: [],
        relationships: [],
        appearsInChapters: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await expect(saveCharacter(projectId, character)).rejects.toThrow('Storage error');
    });
  });
});
