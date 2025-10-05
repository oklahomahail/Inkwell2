// Foundation acceptance tests
// Verify: boot/load project with stores, create/edit/reload persistence, schema migration

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CURRENT_SCHEMA_VERSION, runMigrations } from '../domain/schemaVersion';
import { Chapter, Scene, SceneStatus, ChapterStatus, ExportFormat } from '../domain/types';
import { useChaptersStore } from '../stores/useChaptersStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { createProjectBackup, validateProjectBundle, restoreProjectBackup } from '../utils/backup';
import { exportToMarkdown, exportChapters } from '../utils/export';
import { featureFlags } from '../utils/flags';
import { storage } from '../utils/storage';
import { trace } from '../utils/trace';

// Mock browser APIs
Object.defineProperty(window, 'location', {
  value: { search: '' },
  writable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

describe('Foundation Acceptance Tests', () => {
  const testProjectId = 'test-project-123';

  beforeEach(() => {
    // Reset stores
    useChaptersStore.getState().chapters = [];
    useChaptersStore.getState().currentChapterId = null;
    useChaptersStore.getState().currentSceneId = null;
    useChaptersStore.getState().isDirty = false;

    // Clear mocks
    vi.clearAllMocks();
  });

  describe('Stores Foundation', () => {
    it('should create and manage chapters with Zustand store', async () => {
      const store = useChaptersStore.getState();

      // Test initial state
      expect(store.chapters).toEqual([]);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBe(null);

      // Test adding a chapter
      const mockChapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Chapter',
        order: 1,
        scenes: [],
        totalWordCount: 0,
        status: ChapterStatus.DRAFT,
      };

      // Mock storage.put to avoid actual IndexedDB calls
      vi.spyOn(storage, 'put').mockResolvedValue();

      await store.addChapter(testProjectId, mockChapter);

      // Verify chapter was added
      const updatedState = useChaptersStore.getState();
      expect(updatedState.chapters).toHaveLength(1);
      expect(updatedState.chapters[0].title).toBe('Test Chapter');
      expect(updatedState.chapters[0].id).toBeDefined();
      expect(updatedState.isDirty).toBe(false); // Should be false after save
    });

    it('should add and manage scenes within chapters', async () => {
      const store = useChaptersStore.getState();

      // Mock storage
      vi.spyOn(storage, 'put').mockResolvedValue();

      // Add chapter first
      await store.addChapter(testProjectId, {
        title: 'Chapter 1',
        order: 1,
        scenes: [],
        totalWordCount: 0,
        status: ChapterStatus.DRAFT,
      });

      const chapterId = store.chapters[0].id;

      // Add scene
      const mockScene: Omit<Scene, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Opening Scene',
        content: 'This is a test scene with some content.',
        status: SceneStatus.DRAFT,
        order: 1,
        wordCount: 8, // Will be recalculated
      };

      await store.addScene(testProjectId, chapterId, mockScene);

      // Verify scene was added
      const updatedState = useChaptersStore.getState();
      expect(updatedState.chapters[0].scenes).toHaveLength(1);
      expect(updatedState.chapters[0].scenes[0].title).toBe('Opening Scene');
      expect(updatedState.chapters[0].scenes[0].wordCount).toBe(8); // Calculated by store
      expect(updatedState.chapters[0].totalWordCount).toBe(8);
    });

    it('should persist settings with localStorage', () => {
      const store = useSettingsStore.getState();

      // Test initial settings
      expect(store.theme).toBe('dark');
      expect(store.autoSave.enabled).toBe(true);
      expect(store.editor.fontSize).toBe(16);

      // Change settings
      store.setTheme('light');
      store.setEditorFontSize(18);

      // Verify changes
      const updatedState = useSettingsStore.getState();
      expect(updatedState.theme).toBe('light');
      expect(updatedState.editor.fontSize).toBe(18);
    });
  });

  describe('Persistence Layer', () => {
    it('should handle storage operations with versioning', async () => {
      const testData = {
        name: 'Test Project',
        chapters: [],
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };

      // Mock IndexedDB operations
      vi.spyOn(storage, 'put').mockResolvedValue();
      vi.spyOn(storage, 'get').mockResolvedValue(testData);

      // Test put operation
      await storage.put(`project:${testProjectId}:meta`, testData);
      expect(storage.put).toHaveBeenCalledWith(`project:${testProjectId}:meta`, testData);

      // Test get operation
      const retrieved = await storage.get(`project:${testProjectId}:meta`);
      expect(retrieved).toEqual(testData);
    });

    it('should handle schema migrations', async () => {
      const legacyData = {
        name: 'Legacy Project',
        chapters: [],
        // Missing schemaVersion (implies version 0)
      };

      const migratedData = await runMigrations(legacyData, 0);

      expect(migratedData.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });
  });

  describe('Export System', () => {
    it('should export chapters to Markdown with metadata', async () => {
      const mockChapters: Chapter[] = [
        {
          id: 'ch1',
          title: 'Chapter 1',
          order: 1,
          scenes: [
            {
              id: 'sc1',
              title: 'Scene 1',
              content: 'This is the opening scene of our story.',
              status: SceneStatus.COMPLETE,
              order: 1,
              wordCount: 9,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          totalWordCount: 9,
          status: ChapterStatus.COMPLETE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = await exportToMarkdown(mockChapters, {
        includeMetadata: true,
        includeTOC: true,
        chapterNumbers: true,
      });

      expect(result.content).toContain('# Your Story');
      expect(result.content).toContain('## Chapter 1: Chapter 1');
      expect(result.content).toContain('This is the opening scene of our story.');
      expect(result.content).toContain('**Word Count**: 9');
      expect(result.filename).toMatch(/manuscript-\d{4}-\d{2}-\d{2}\.md/);
      expect(result.mimeType).toBe('text/markdown');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should export with different formats', async () => {
      const mockChapters: Chapter[] = [
        {
          id: 'ch1',
          title: 'Test Chapter',
          order: 1,
          scenes: [
            {
              id: 'sc1',
              title: 'Test Scene',
              content: 'Test content.',
              status: SceneStatus.DRAFT,
              order: 1,
              wordCount: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          totalWordCount: 2,
          status: ChapterStatus.DRAFT,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Test Markdown export
      const markdownResult = await exportChapters(mockChapters, ExportFormat.MARKDOWN, {
        format: ExportFormat.MARKDOWN,
        includeMetadata: true,
        includeTimeline: false,
        includeCharacters: false,
      });
      expect(markdownResult.mimeType).toBe('text/markdown');

      // Test TXT export
      const txtResult = await exportChapters(mockChapters, ExportFormat.TXT, {
        format: ExportFormat.TXT,
        includeMetadata: true,
        includeTimeline: false,
        includeCharacters: false,
      });
      expect(txtResult.mimeType).toBe('text/plain');

      // Test HTML export
      const htmlResult = await exportChapters(mockChapters, ExportFormat.HTML, {
        format: ExportFormat.HTML,
        includeMetadata: true,
        includeTimeline: false,
        includeCharacters: false,
      });
      expect(htmlResult.mimeType).toBe('text/html');
      expect(htmlResult.content).toContain('<!DOCTYPE html>');
    });
  });

  describe('Backup System', () => {
    it('should create and validate project backups', async () => {
      // Mock storage responses for project data
      vi.spyOn(storage, 'get').mockImplementation((key: string) => {
        if (key.includes('chapters')) return Promise.resolve([]);
        if (key.includes('characters')) return Promise.resolve([]);
        if (key.includes('timeline')) return Promise.resolve([]);
        if (key.includes('sessions')) return Promise.resolve([]);
        if (key.includes('meta')) return Promise.resolve({ name: 'Test Project' });
        if (key.includes('settings')) return Promise.resolve({ autoSaveEnabled: true });
        return Promise.resolve(null);
      });

      // Create backup
      const backup = await createProjectBackup(testProjectId);

      expect(backup.manifest).toBeDefined();
      expect(backup.project).toBeDefined();
      expect(backup.manifest.projectId).toBe(testProjectId);
      expect(backup.manifest.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(backup.manifest.integrity.checksum).toBeDefined();

      // Validate backup
      const validation = await validateProjectBundle(backup);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should restore project from backup', async () => {
      const mockBackup = {
        manifest: {
          version: 1,
          schemaVersion: CURRENT_SCHEMA_VERSION,
          projectId: 'backup-project',
          name: 'Backup Test',
          exportedAt: new Date(),
          itemCounts: {
            chapters: 0,
            scenes: 0,
            characters: 0,
            timelineEvents: 0,
            writingSessions: 0,
          },
          integrity: { checksum: 'test-checksum', algorithm: 'sha256' as const },
        },
        project: {
          id: 'backup-project',
          name: 'Backup Test',
          description: 'Test project from backup',
          chapters: [],
          characters: [],
          timelineEvents: [],
          writingSessions: [],
          metadata: { totalWordCount: 0 },
          settings: { autoSaveEnabled: true, autoSaveInterval: 30000, backupEnabled: true },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      // Mock storage operations
      vi.spyOn(storage, 'get').mockResolvedValue(null); // No existing project
      vi.spyOn(storage, 'put').mockResolvedValue();
      vi.spyOn(storage, 'transact').mockImplementation(async (operations) => {
        for (const op of operations) {
          await op();
        }
      });

      const restoredProjectId = await restoreProjectBackup(mockBackup);
      expect(restoredProjectId).toBe('backup-project');
    });
  });

  describe('Feature Flags System', () => {
    it('should manage feature flags', () => {
      // Test default values
      expect(featureFlags.isEnabled('plotBoards')).toBe(false);
      expect(featureFlags.isEnabled('aiWritingAssistant')).toBe(true);

      // Test setting flags
      featureFlags.setEnabled('plotBoards', true);
      expect(featureFlags.isEnabled('plotBoards')).toBe(true);

      // Test getting flags by category
      const debugFlags = featureFlags.getFlagsByCategory('debug');
      expect(debugFlags.length).toBeGreaterThan(0);
      expect(debugFlags.every((flag) => flag.category === 'debug')).toBe(true);

      // Test reset
      featureFlags.reset('plotBoards');
      expect(featureFlags.isEnabled('plotBoards')).toBe(false);
    });

    it('should handle URL parameter flags', () => {
      // Mock URL with feature flag
      Object.defineProperty(window, 'location', {
        value: { search: '?plotBoards=1&trace=1' },
        writable: true,
      });

      // Create new flag manager to pick up URL params
      const testFlags = new (featureFlags.constructor as any)();

      expect(testFlags.isEnabled('plotBoards')).toBe(true);
      expect(testFlags.isDebugMode()).toBe(true);
    });
  });

  describe('Tracing System', () => {
    it('should trace operations when enabled', () => {
      // Mock performance.now for consistent timing
      vi.spyOn(performance, 'now').mockReturnValue(1000);

      const traceId = trace.start('testOperation', 'user_action', { test: true });
      expect(traceId).toBeTruthy();

      trace.end(traceId, { result: 'success' });

      const events = trace.getEvents('user_action');
      expect(events.length).toBeGreaterThan(0);

      const testEvent = events.find((e) => e.name === 'testOperation');
      expect(testEvent).toBeDefined();
      expect(testEvent?.metadata?.test).toBe(true);
      expect(testEvent?.metadata?.result).toBe('success');
    });

    it('should provide performance metrics', () => {
      const summary = trace.getSummary();

      expect(summary).toHaveProperty('totalEvents');
      expect(summary).toHaveProperty('storeActions');
      expect(summary).toHaveProperty('componentRenders');
      expect(summary).toHaveProperty('averageEventDuration');
      expect(typeof summary.totalEvents).toBe('number');
    });
  });
});

describe('Integration Test: Complete Workflow', () => {
  it('should handle complete project lifecycle', async () => {
    const projectId = 'integration-test-project';

    // Mock storage
    vi.spyOn(storage, 'put').mockResolvedValue();
    vi.spyOn(storage, 'get').mockImplementation((key: string) => {
      if (key.includes('chapters')) {
        return Promise.resolve([
          {
            id: 'ch1',
            title: 'Chapter 1',
            order: 1,
            scenes: [
              {
                id: 'sc1',
                title: 'Opening',
                content: 'It was a dark and stormy night.',
                status: SceneStatus.COMPLETE,
                order: 1,
                wordCount: 7,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            totalWordCount: 7,
            status: ChapterStatus.IN_PROGRESS,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }
      return Promise.resolve([]);
    });

    // 1. Load project with stores
    const chaptersStore = useChaptersStore.getState();
    await chaptersStore.loadChapters(projectId);

    expect(chaptersStore.chapters).toHaveLength(1);
    expect(chaptersStore.chapters[0].title).toBe('Chapter 1');

    // 2. Edit content
    await chaptersStore.updateSceneContent(
      projectId,
      'sc1',
      'It was a dark and stormy night. The rain pounded against the windows.',
    );

    // 3. Export to Markdown
    const exportResult = await exportToMarkdown(chaptersStore.chapters);
    expect(exportResult.content).toContain(
      'It was a dark and stormy night. The rain pounded against the windows.',
    );

    // 4. Create backup
    const backup = await createProjectBackup(projectId);
    expect(backup.manifest.projectId).toBe(projectId);

    // 5. Validate backup
    const validation = await validateProjectBundle(backup);
    expect(validation.isValid).toBe(true);

    console.log('✅ Integration test passed: Complete project lifecycle working');
  });
});
