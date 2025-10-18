import { describe, it, expect } from 'vitest';

import { validateProject, validateSnapshot, migrateProjectToLatest } from './projectSchema';

describe('ProjectSchema validation', () => {
  const validProject = {
    id: '1',
    title: 'Test Project',
    chapters: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    currentWordCount: 0,
  };

  const invalidCases = [
    [{ ...validProject, title: undefined }, /title.*required/i],
    [{ ...validProject, title: '' }, /title.*required/i],
    [{ ...validProject, createdAt: new Date() }, /createdAt.*expected string/i],
    [{ ...validProject, updatedAt: 'invalid-date' }, /updatedAt.*invalid/i],
    [{ ...validProject, currentWordCount: -1 }, /currentWordCount.*minimum/i],
    [{ ...validProject, settings: { theme: 'invalid' } }, /theme.*invalid_enum/i],
    [{ ...validProject, settings: { fontSize: 8 } }, /fontSize.*minimum/i],
    [{ ...validProject, settings: { lineHeight: 4 } }, /lineHeight.*maximum/i],
    [
      {
        ...validProject,
        chapters: [
          {
            id: '1',
            title: 'Chapter',
            scenes: [],
            wordCount: -1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: 0,
          },
        ],
      },
      /wordCount.*minimum/i,
    ],
    [
      {
        ...validProject,
        characters: [
          {
            id: '1',
            name: 'Character',
            role: 'invalid-role',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
      /role.*invalid_enum/i,
    ],
  ];

  it.each(invalidCases)('rejects invalid %o', (input, errorPattern) => {
    const result = validateProject(input);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(errorPattern);
  });

  it('accepts valid project data', () => {
    const result = validateProject(validProject);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject(validProject);
    }
  });

  it('handles validation errors gracefully', () => {
    const result = validateProject(null);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Validation failed');
  });

  it('migrates legacy project data', () => {
    const legacyProject = {
      id: '1',
      title: 'Legacy Project',
      chapters: [
        {
          id: '1',
          title: 'Chapter 1',
          scenes: [
            {
              id: '1',
              title: 'Scene 1',
              content: 'test content',
            },
          ],
        },
      ],
    };

    const migrated = migrateProjectToLatest(legacyProject);

    expect(migrated.version).toBe('1.0.0');
    expect(migrated.currentWordCount).toBe(0);
    expect(migrated.createdAt).toBeDefined();
    expect(migrated.updatedAt).toBeDefined();
    expect(migrated.chapters[0].scenes[0].wordCount).toBe(2); // "test content"
  });
});

describe('SnapshotMetadata validation', () => {
  const validSnapshot = {
    id: '1',
    projectId: '1',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    wordCount: 0,
    chaptersCount: 0,
    size: 0,
    isAutomatic: true,
  };

  const invalidCases = [
    [{ ...validSnapshot, projectId: undefined }, /projectId.*required/i],
    [{ ...validSnapshot, timestamp: 'invalid-date' }, /timestamp.*invalid/i],
    [{ ...validSnapshot, wordCount: -1 }, /wordCount.*minimum/i],
    [{ ...validSnapshot, size: -1 }, /size.*minimum/i],
    [{ ...validSnapshot, tags: ['valid', 123] }, /tags.*expected string/i],
  ];

  it.each(invalidCases)('rejects invalid snapshot %o', (input, errorPattern) => {
    const result = validateSnapshot(input);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(errorPattern);
  });

  it('accepts valid snapshot data', () => {
    const result = validateSnapshot(validSnapshot);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject(validSnapshot);
    }
  });

  it('handles snapshot validation errors gracefully', () => {
    const result = validateSnapshot(null);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Snapshot validation failed');
  });
});
