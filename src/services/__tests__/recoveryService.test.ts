/**
 * Recovery Service Tests
 *
 * Tests for 3-tier recovery sequence:
 * 1. Supabase pull recovery
 * 2. localStorage shadow copy recovery
 * 3. User upload JSON backup recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { recoveryService } from '../recoveryService';
import type { EnhancedProject } from '@/types/project';
import type { Chapter } from '@/types/persistence';

// Mock modules
vi.mock('../supabaseSync', () => ({
  supabaseSyncService: {
    isAuthenticated: vi.fn(),
    pullFromCloud: vi.fn(),
  },
}));

vi.mock('../enhancedStorageService', () => ({
  EnhancedStorageService: {
    saveProject: vi.fn(),
    loadAllProjects: vi.fn(() => []),
  },
}));

vi.mock('@/model/chapters', () => ({
  ChapterGateway: {
    saveChapter: vi.fn(),
  },
}));

describe('RecoveryService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    recoveryService.clearShadowCopy();
  });

  describe('Shadow Copy Management', () => {
    it('should save shadow copy to localStorage', () => {
      const mockProjects: EnhancedProject[] = [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test description',
          genre: 'Fiction',
          targetWordCount: 50000,
          currentWordCount: 10000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          chapters: [],
          characters: [],
          sessions: [],
          recentContent: '',
          plotNotes: [],
          worldBuilding: [],
        },
      ];

      const mockChapters: Chapter[] = [
        {
          id: 'chapter-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          summary: 'Test chapter',
          content: 'Chapter content',
          wordCount: 100,
          status: 'draft',
          order: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      recoveryService.saveShadowCopy(mockProjects, mockChapters);

      const shadowData = recoveryService.getShadowCopy();
      expect(shadowData).toBeTruthy();
      expect(shadowData?.projects).toHaveLength(1);
      expect(shadowData?.chapters).toHaveLength(1);
      expect(shadowData?.projects[0]?.id).toBe('project-1');
      expect(shadowData?.chapters[0]?.id).toBe('chapter-1');
    });

    it('should return null if no shadow copy exists', () => {
      const shadowData = recoveryService.getShadowCopy();
      expect(shadowData).toBeNull();
    });

    it('should clear shadow copy', () => {
      const mockProjects: EnhancedProject[] = [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test description',
          genre: 'Fiction',
          targetWordCount: 50000,
          currentWordCount: 10000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          chapters: [],
          characters: [],
          sessions: [],
          recentContent: '',
          plotNotes: [],
          worldBuilding: [],
        },
      ];

      recoveryService.saveShadowCopy(mockProjects, []);
      expect(recoveryService.getShadowCopy()).toBeTruthy();

      recoveryService.clearShadowCopy();
      expect(recoveryService.getShadowCopy()).toBeNull();
    });

    it('should reject shadow copy that is too old', () => {
      const mockProjects: EnhancedProject[] = [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test description',
          genre: 'Fiction',
          targetWordCount: 50000,
          currentWordCount: 10000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          chapters: [],
          characters: [],
          sessions: [],
          recentContent: '',
          plotNotes: [],
          worldBuilding: [],
        },
      ];

      // Manually create an old shadow copy (8 days old)
      const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const shadowData = {
        projects: mockProjects,
        chapters: [],
        timestamp: oldTimestamp,
        version: '1.0.0',
      };

      localStorage.setItem('inkwell_shadow_copy', JSON.stringify(shadowData));

      // Attempt recovery - should fail due to age
      return recoveryService.recoverFromShadowCopy().then((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toContain('too old');
      });
    });
  });

  describe('Tier 2: localStorage Shadow Copy Recovery', () => {
    it('should successfully recover from shadow copy', async () => {
      const mockProjects: EnhancedProject[] = [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test description',
          genre: 'Fiction',
          targetWordCount: 50000,
          currentWordCount: 10000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          chapters: [],
          characters: [],
          sessions: [],
          recentContent: '',
          plotNotes: [],
          worldBuilding: [],
        },
      ];

      const mockChapters: Chapter[] = [
        {
          id: 'chapter-1',
          projectId: 'project-1',
          title: 'Chapter 1',
          summary: 'Test chapter',
          content: 'Chapter content',
          wordCount: 100,
          status: 'draft',
          order: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Save shadow copy
      recoveryService.saveShadowCopy(mockProjects, mockChapters);

      // Attempt recovery
      const result = await recoveryService.recoverFromShadowCopy();

      expect(result.success).toBe(true);
      expect(result.tier).toBe('localStorage');
      expect(result.recoveredProjects).toBe(1);
      expect(result.recoveredChapters).toBe(1);
      expect(result.message).toBeDefined();
    });

    it('should fail if no shadow copy exists', async () => {
      const result = await recoveryService.recoverFromShadowCopy();

      expect(result.success).toBe(false);
      expect(result.tier).toBe('localStorage');
      expect(result.error).toContain('No shadow copy found');
    });
  });

  describe('Tier 3: User Upload Recovery', () => {
    it('should successfully recover from user-uploaded JSON backup', async () => {
      const mockBackup = {
        inkwellBackup: 1,
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        appVersion: 'v0.9.0',
        data: {
          projects: [
            {
              id: 'project-1',
              name: 'Test Project',
              description: 'Test description',
              genre: 'Fiction',
              targetWordCount: 50000,
              currentWordCount: 10000,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              chapters: [],
              characters: [],
              sessions: [],
              recentContent: '',
              plotNotes: [],
              worldBuilding: [],
            },
          ],
          chapters: [
            {
              id: 'chapter-1',
              projectId: 'project-1',
              title: 'Chapter 1',
              summary: 'Test chapter',
              content: 'Chapter content',
              wordCount: 100,
              status: 'draft',
              order: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          settings: {},
        },
      };

      const jsonData = JSON.stringify(mockBackup);
      const result = await recoveryService.recoverFromUserUpload(jsonData);

      expect(result.success).toBe(true);
      expect(result.tier).toBe('userUpload');
      expect(result.recoveredProjects).toBe(1);
      expect(result.recoveredChapters).toBe(1);
      expect(result.message).toBeDefined();
    });

    it('should reject invalid backup format', async () => {
      const invalidBackup = {
        someKey: 'someValue',
      };

      const jsonData = JSON.stringify(invalidBackup);
      const result = await recoveryService.recoverFromUserUpload(jsonData);

      expect(result.success).toBe(false);
      expect(result.tier).toBe('userUpload');
      expect(result.error).toContain('Invalid backup file format');
    });

    it('should handle malformed JSON', async () => {
      const invalidJson = 'this is not valid JSON {';
      const result = await recoveryService.recoverFromUserUpload(invalidJson);

      expect(result.success).toBe(false);
      expect(result.tier).toBe('userUpload');
      expect(result.error).toBeDefined();
    });
  });

  describe('IndexedDB Health Check', () => {
    it('should check IndexedDB health successfully', async () => {
      const health = await recoveryService.checkIndexedDBHealth();

      // In test environment, IndexedDB might not be available
      // So we just check that the method returns a valid response
      expect(health).toBeDefined();
      expect(typeof health.healthy).toBe('boolean');
    });
  });

  describe('Full 3-Tier Recovery Sequence', () => {
    it('should attempt Supabase recovery first', async () => {
      const { supabaseSyncService } = await import('../supabaseSync');

      // Mock Supabase as unavailable
      vi.mocked(supabaseSyncService.isAuthenticated).mockResolvedValue(false);

      // Create shadow copy for fallback
      const mockProjects: EnhancedProject[] = [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test description',
          genre: 'Fiction',
          targetWordCount: 50000,
          currentWordCount: 10000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          chapters: [],
          characters: [],
          sessions: [],
          recentContent: '',
          plotNotes: [],
          worldBuilding: [],
        },
      ];

      recoveryService.saveShadowCopy(mockProjects, []);

      // Attempt recovery
      const result = await recoveryService.attemptRecovery({
        attemptSupabase: true,
        attemptLocalStorage: true,
        requireUserUpload: false,
      });

      // Should fall back to localStorage
      expect(result.tier).toBe('localStorage');
      expect(result.success).toBe(true);
    });

    it('should require user upload if all tiers fail', async () => {
      const { supabaseSyncService } = await import('../supabaseSync');

      // Mock Supabase as unavailable
      vi.mocked(supabaseSyncService.isAuthenticated).mockResolvedValue(false);

      // No shadow copy available

      // Attempt recovery
      const result = await recoveryService.attemptRecovery({
        attemptSupabase: true,
        attemptLocalStorage: true,
        requireUserUpload: false,
      });

      expect(result.tier).toBe('none');
      expect(result.success).toBe(false);
      expect(result.error).toContain('All recovery tiers failed');
    });
  });
});
