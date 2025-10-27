import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before imports
vi.mock('@/utils/backup', () => ({
  createProjectBackup: vi.fn(async (projectId: string) => ({
    manifest: {
      version: '1.0.0',
      schemaVersion: 1,
      name: 'Test Project',
      exportedAt: new Date().toISOString(),
      itemCounts: {
        chapters: 2,
        scenes: 5,
        characters: 3,
      },
    },
    project: {
      id: projectId,
      name: 'Test Project',
      metadata: { totalWordCount: 1000 },
      chapters: [
        { id: 'ch1', scenes: [], totalWordCount: 500 },
        { id: 'ch2', scenes: [], totalWordCount: 500 },
      ],
    },
    assets: {},
  })),
  validateProjectBundle: vi.fn(async () => ({
    isValid: true,
    errors: [],
    warnings: [],
    canRecover: false,
  })),
  restoreProjectBackup: vi.fn(async (_bundle, _options) => 'restored-project-id'),
}));

vi.mock('@/utils/storage', () => ({
  storage: {
    get: vi.fn(),
    list: vi.fn(async () => ['project:test-id:meta', 'project:test-id:chapters']),
  },
}));

// Now import the functions to test
const { createInkwellArchive, extractInkwellArchive, validateInkwellBundle } = await import(
  '@/utils/projectBundle'
);

describe('projectBundle (.inkwell archive system)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInkwellArchive', () => {
    it('creates a valid archive blob', async () => {
      const archive = await createInkwellArchive('demo-project-id');

      expect(archive).toBeTruthy();
      expect(archive.blob).toBeInstanceOf(Blob);
      expect(archive.blob.size).toBeGreaterThan(100);
      expect(archive.filename).toMatch(/\.inkwell$/);
      expect(archive.manifest).toBeTruthy();
    });

    it('includes project name in filename', async () => {
      const archive = await createInkwellArchive('test-id', 'My Novel');

      expect(archive.filename).toMatch(/My-Novel/);
    });
  });

  describe('extractInkwellArchive', () => {
    it('validates and extracts a previously created archive', async () => {
      // Create an archive first
      const archive = await createInkwellArchive('demo-project-id');

      // Extract it
      const { bundle, validation } = await extractInkwellArchive(archive.blob);

      expect(validation).toBeTruthy();
      expect(bundle).toBeTruthy();
      expect(bundle.manifest).toBeTruthy();
      expect(bundle.project).toBeTruthy();
    });

    it('returns error validation for invalid blobs', async () => {
      const invalidBlob = new Blob(['not a zip file'], { type: 'text/plain' });

      const { validation } = await extractInkwellArchive(invalidBlob);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateInkwellBundle', () => {
    it('validates a complete bundle', async () => {
      const archive = await createInkwellArchive('demo-project-id');
      const { bundle } = await extractInkwellArchive(archive.blob);

      const validation = await validateInkwellBundle(bundle);

      expect(validation).toBeTruthy();
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Archive round-trip', () => {
    it('preserves data through export/import cycle', async () => {
      // Create archive
      const originalArchive = await createInkwellArchive('test-project');

      // Extract
      const { bundle } = await extractInkwellArchive(originalArchive.blob);

      // Verify structure is preserved
      expect(bundle.manifest.name).toBe('Test Project');
      expect(bundle.project.name).toBe('Test Project');
      expect(bundle.manifest.itemCounts.chapters).toBe(2);
    });
  });
});
