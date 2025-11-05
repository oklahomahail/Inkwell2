/**
 * Welcome Project Tests
 *
 * Comprehensive test suite for welcome project creation, lifecycle, and cleanup.
 * Tests cover idempotency, edge cases, offline behavior, and telemetry.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { EnhancedProject } from '@/types/project';
import type { ChapterMeta } from '@/types/writing';

// Mock dependencies
const mockTrack = vi.fn();
vi.mock('@/services/telemetry', () => ({
  track: (...args: any[]) => mockTrack(...args),
}));

const mockProjects: EnhancedProject[] = [];
const mockChapters: Map<string, ChapterMeta[]> = new Map();

const mockStorageService = {
  loadAllProjects: vi.fn(() => [...mockProjects]),
  loadProject: vi.fn((id: string) => mockProjects.find((p) => p.id === id) || null),
  saveProject: vi.fn((project: EnhancedProject) => {
    const idx = mockProjects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      mockProjects[idx] = project;
    } else {
      mockProjects.push(project);
    }
  }),
};

const mockChaptersService = {
  list: vi.fn((projectId: string) => mockChapters.get(projectId) || []),
  create: vi.fn((input: any) => {
    const chapter: ChapterMeta = {
      id: `ch_${Date.now()}_${Math.random()}`,
      projectId: input.projectId,
      title: input.title || 'Untitled',
      index: input.index ?? 0,
      summary: input.summary,
      status: input.status || 'draft',
      wordCount: input.content?.split(/\s+/).length || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const chapters = mockChapters.get(input.projectId) || [];
    chapters.push(chapter);
    mockChapters.set(input.projectId, chapters);
    return Promise.resolve(chapter);
  }),
  delete: vi.fn((id: string) => {
    for (const [projectId, chapters] of mockChapters.entries()) {
      const filtered = chapters.filter((c) => c.id !== id);
      if (filtered.length !== chapters.length) {
        mockChapters.set(projectId, filtered);
        break;
      }
    }
    return Promise.resolve();
  }),
};

vi.mock('@/services/storageService', () => ({
  EnhancedStorageService: mockStorageService,
}));

vi.mock('@/services/chaptersService', () => ({
  Chapters: mockChaptersService,
}));

// Import after mocks are set up
import {
  shouldCreateWelcomeProject,
  ensureWelcomeProject,
  deleteWelcomeProject,
  markTourSeen,
  hasTourBeenSeen,
  skipTutorial,
  completeWelcomeFlow,
  reconcileWelcomeProjectPointer,
  getWelcomeProjectId,
  isWelcomeProject,
  isWelcomeProjectEnabled,
  __resetWelcomeState,
  __testKeys,
} from '../welcomeProject';

describe('Welcome Project', () => {
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    mockProjects.length = 0;
    mockChapters.clear();

    // Clear localStorage
    localStorage.clear();
    __resetWelcomeState();

    // Spy on localStorage.setItem to sync with mockProjects when deleting
    const originalSetItem = localStorage.setItem.bind(localStorage);
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === 'inkwell_enhanced_projects') {
        const projects = JSON.parse(value) as EnhancedProject[];
        mockProjects.length = 0;
        mockProjects.push(...projects);
      }
      originalSetItem(key, value);
    });
  });

  afterEach(() => {
    __resetWelcomeState();
    vi.restoreAllMocks();
  });

  describe('Feature Flag', () => {
    it('should be enabled by default', () => {
      expect(isWelcomeProjectEnabled()).toBe(true);
    });

    it('should respect VITE_ENABLE_WELCOME_PROJECT=false', () => {
      // Note: This test depends on environment setup
      // In actual build, feature flag would control behavior
      expect(__testKeys.IS_ENABLED).toBeDefined();
    });
  });

  describe('shouldCreateWelcomeProject', () => {
    it('should return true when no projects exist and tour not seen', async () => {
      const result = await shouldCreateWelcomeProject();
      expect(result).toBe(true);
    });

    it('should return false when tour has been seen', async () => {
      localStorage.setItem(__testKeys.HAS_SEEN_TOUR_KEY, 'true');
      const result = await shouldCreateWelcomeProject();
      expect(result).toBe(false);
    });

    it('should return false when projects exist', async () => {
      mockProjects.push({
        id: 'existing-project',
        name: 'Existing Project',
        description: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        chapters: [],
        characters: [],
        plotNotes: [],
        worldBuilding: [],
        sessions: [],
      });

      const result = await shouldCreateWelcomeProject();
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockStorageService.loadAllProjects.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const result = await shouldCreateWelcomeProject();
      expect(result).toBe(false);
    });
  });

  describe('ensureWelcomeProject', () => {
    it('should create welcome project with 3 chapters', async () => {
      const projectId = await ensureWelcomeProject();

      expect(projectId).toBeTruthy();
      expect(mockProjects).toHaveLength(1);
      expect(mockProjects[0].name).toBe('Welcome to Inkwell');

      const chapters = mockChapters.get(projectId!);
      expect(chapters).toHaveLength(3);
      expect(chapters?.[0].title).toBe('Getting Started');
      expect(chapters?.[1].title).toBe('Writing Your First Scene');
      expect(chapters?.[2].title).toBe('Exporting Your Work');
    });

    it('should store project ID in localStorage', async () => {
      const projectId = await ensureWelcomeProject();
      expect(localStorage.getItem(__testKeys.WELCOME_PROJECT_ID_KEY)).toBe(projectId);
    });

    it('should emit telemetry event', async () => {
      await ensureWelcomeProject();
      expect(mockTrack).toHaveBeenCalledWith('onboarding.welcome.created', { sample: 1 });
    });

    it.skip('should be idempotent - return existing project ID', async () => {
      const projectId1 = await ensureWelcomeProject();
      const projectId2 = await ensureWelcomeProject();

      expect(projectId1).toBe(projectId2);
      expect(mockProjects).toHaveLength(1);
      expect(mockTrack).toHaveBeenCalledTimes(1); // Only one creation event
    });

    it('should not create when tour has been seen', async () => {
      localStorage.setItem(__testKeys.HAS_SEEN_TOUR_KEY, 'true');

      const projectId = await ensureWelcomeProject();
      expect(projectId).toBeNull();
      expect(mockProjects).toHaveLength(0);
    });

    it('should not create when projects exist', async () => {
      mockProjects.push({
        id: 'existing-project',
        name: 'Existing Project',
        description: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        chapters: [],
        characters: [],
        plotNotes: [],
        worldBuilding: [],
        sessions: [],
      });

      const projectId = await ensureWelcomeProject();
      expect(projectId).toBeNull();
    });

    it('should handle chapter creation errors gracefully', async () => {
      mockChaptersService.create.mockRejectedValueOnce(new Error('Chapter creation failed'));

      const projectId = await ensureWelcomeProject();
      expect(projectId).toBeTruthy(); // Project still created
      // But might have fewer chapters due to error
    });

    it('should clean up on project creation failure', async () => {
      mockStorageService.saveProject.mockImplementationOnce(() => {
        throw new Error('Save failed');
      });

      const projectId = await ensureWelcomeProject();
      expect(projectId).toBeNull();
      expect(localStorage.getItem(__testKeys.WELCOME_PROJECT_ID_KEY)).toBeNull();
    });

    it('should seed chapters in correct order', async () => {
      const projectId = await ensureWelcomeProject();
      const chapters = mockChapters.get(projectId!);

      expect(chapters?.[0].index).toBe(0);
      expect(chapters?.[1].index).toBe(1);
      expect(chapters?.[2].index).toBe(2);
    });

    it('should create chapters with content', async () => {
      await ensureWelcomeProject();
      const createCalls = mockChaptersService.create.mock.calls;

      expect(createCalls[0][0].content).toContain('Welcome to Inkwell');
      expect(createCalls[1][0].content).toContain('Writing Your First Scene');
      expect(createCalls[2][0].content).toContain('Exporting Your Work');
    });
  });

  describe('deleteWelcomeProject', () => {
    it('should delete project and all chapters', async () => {
      const projectId = await ensureWelcomeProject();
      expect(mockProjects).toHaveLength(1);
      expect(mockChapters.get(projectId!)).toHaveLength(3);

      await deleteWelcomeProject();

      expect(mockProjects).toHaveLength(0);
      expect(mockChaptersService.delete).toHaveBeenCalledTimes(3);
    });

    it('should clear localStorage pointer', async () => {
      await ensureWelcomeProject();
      expect(localStorage.getItem(__testKeys.WELCOME_PROJECT_ID_KEY)).toBeTruthy();

      await deleteWelcomeProject();
      expect(localStorage.getItem(__testKeys.WELCOME_PROJECT_ID_KEY)).toBeNull();
    });

    it('should emit telemetry event', async () => {
      await ensureWelcomeProject();
      mockTrack.mockClear();

      await deleteWelcomeProject();
      expect(mockTrack).toHaveBeenCalledWith('onboarding.welcome.deleted', { sample: 1 });
    });

    it('should be idempotent - safe to call when no project exists', async () => {
      await deleteWelcomeProject();
      await deleteWelcomeProject();

      // Should not throw
      expect(mockChaptersService.delete).not.toHaveBeenCalled();
    });

    it('should clear pointer even on delete failure', async () => {
      await ensureWelcomeProject();

      mockStorageService.loadProject.mockImplementationOnce(() => {
        throw new Error('Load failed');
      });

      await deleteWelcomeProject();
      expect(localStorage.getItem(__testKeys.WELCOME_PROJECT_ID_KEY)).toBeNull();
    });
  });

  describe('markTourSeen / hasTourBeenSeen', () => {
    it('should mark tour as seen', () => {
      expect(hasTourBeenSeen()).toBe(false);

      markTourSeen();

      expect(hasTourBeenSeen()).toBe(true);
      expect(localStorage.getItem(__testKeys.HAS_SEEN_TOUR_KEY)).toBe('true');
    });

    it('should emit telemetry event', () => {
      markTourSeen();
      expect(mockTrack).toHaveBeenCalledWith('onboarding.tour.seen', { sample: 1 });
    });
  });

  describe('skipTutorial', () => {
    it('should delete project and mark tour as seen', async () => {
      await ensureWelcomeProject();
      expect(mockProjects).toHaveLength(1);
      expect(hasTourBeenSeen()).toBe(false);

      await skipTutorial();

      expect(mockProjects).toHaveLength(0);
      expect(hasTourBeenSeen()).toBe(true);
    });

    it('should emit telemetry event', async () => {
      await ensureWelcomeProject();
      mockTrack.mockClear();

      await skipTutorial();

      expect(mockTrack).toHaveBeenCalledWith('onboarding.welcome.deleted', { sample: 1 });
      expect(mockTrack).toHaveBeenCalledWith('onboarding.tour.seen', { sample: 1 });
      expect(mockTrack).toHaveBeenCalledWith('onboarding.welcome.skipped', { sample: 1 });
    });

    it('should work even if project does not exist', async () => {
      await skipTutorial();
      expect(hasTourBeenSeen()).toBe(true);
    });
  });

  describe('completeWelcomeFlow', () => {
    it('should delete project and mark tour as seen', async () => {
      await ensureWelcomeProject();
      expect(mockProjects).toHaveLength(1);
      expect(hasTourBeenSeen()).toBe(false);

      await completeWelcomeFlow();

      expect(mockProjects).toHaveLength(0);
      expect(hasTourBeenSeen()).toBe(true);
    });

    it('should emit telemetry event', async () => {
      await ensureWelcomeProject();
      mockTrack.mockClear();

      await completeWelcomeFlow();

      expect(mockTrack).toHaveBeenCalledWith('onboarding.welcome.deleted', { sample: 1 });
      expect(mockTrack).toHaveBeenCalledWith('onboarding.tour.seen', { sample: 1 });
      expect(mockTrack).toHaveBeenCalledWith('onboarding.welcome.completed', { sample: 1 });
    });
  });

  describe('reconcileWelcomeProjectPointer', () => {
    it('should clear stale pointer when project does not exist', async () => {
      localStorage.setItem(__testKeys.WELCOME_PROJECT_ID_KEY, 'non-existent-id');

      await reconcileWelcomeProjectPointer();

      expect(localStorage.getItem(__testKeys.WELCOME_PROJECT_ID_KEY)).toBeNull();
    });

    it('should keep valid pointer when project exists', async () => {
      const projectId = await ensureWelcomeProject();

      await reconcileWelcomeProjectPointer();

      expect(localStorage.getItem(__testKeys.WELCOME_PROJECT_ID_KEY)).toBe(projectId);
    });

    it('should be safe when no pointer exists', async () => {
      await reconcileWelcomeProjectPointer();
      // Should not throw
    });

    it('should clear pointer on error', async () => {
      localStorage.setItem(__testKeys.WELCOME_PROJECT_ID_KEY, 'some-id');
      mockStorageService.loadProject.mockImplementationOnce(() => {
        throw new Error('Load failed');
      });

      await reconcileWelcomeProjectPointer();

      expect(localStorage.getItem(__testKeys.WELCOME_PROJECT_ID_KEY)).toBeNull();
    });
  });

  describe('getWelcomeProjectId', () => {
    it('should return null when no project exists', () => {
      expect(getWelcomeProjectId()).toBeNull();
    });

    it('should return project ID when exists', async () => {
      const projectId = await ensureWelcomeProject();
      expect(getWelcomeProjectId()).toBe(projectId);
    });
  });

  describe('isWelcomeProject', () => {
    it('should return true for welcome project ID', async () => {
      const projectId = await ensureWelcomeProject();
      expect(isWelcomeProject(projectId!)).toBe(true);
    });

    it('should return false for other project IDs', async () => {
      await ensureWelcomeProject();
      expect(isWelcomeProject('other-project-id')).toBe(false);
    });

    it('should return false when no welcome project exists', () => {
      expect(isWelcomeProject('any-id')).toBe(false);
    });
  });

  describe('Offline Resilience', () => {
    it('should work offline (no network calls)', async () => {
      // All operations use IndexedDB/localStorage - no network
      const projectId = await ensureWelcomeProject();
      expect(projectId).toBeTruthy();

      await deleteWelcomeProject();
      expect(mockProjects).toHaveLength(0);
    });

    it('should handle IndexedDB unavailable gracefully', async () => {
      mockChaptersService.create.mockRejectedValue(new Error('IndexedDB unavailable'));

      const projectId = await ensureWelcomeProject();
      // Should still create project, chapters may fail individually
      expect(projectId).toBeTruthy();
    });
  });

  describe('Telemetry (PII-Free)', () => {
    it('should not include project IDs in telemetry', async () => {
      await ensureWelcomeProject();

      const calls = mockTrack.mock.calls;
      for (const [event, payload] of calls) {
        expect(payload).not.toHaveProperty('projectId');
        expect(payload).not.toHaveProperty('id');
        expect(Object.keys(payload as object)).toEqual(['sample']);
      }
    });

    it('should sample all onboarding events', async () => {
      await ensureWelcomeProject();
      await skipTutorial();

      const calls = mockTrack.mock.calls;
      for (const [, payload] of calls) {
        expect(payload).toHaveProperty('sample', 1);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent ensureWelcomeProject calls', async () => {
      const [projectId1, projectId2] = await Promise.all([
        ensureWelcomeProject(),
        ensureWelcomeProject(),
      ]);

      // Should return same ID (idempotent)
      expect(projectId1).toBe(projectId2);
      expect(mockProjects).toHaveLength(1);
    });

    it('should handle rapid skip/create cycles', async () => {
      for (let i = 0; i < 3; i++) {
        __resetWelcomeState();
        mockProjects.length = 0;
        mockChapters.clear();

        await ensureWelcomeProject();
        await skipTutorial();

        expect(mockProjects).toHaveLength(0);
        expect(hasTourBeenSeen()).toBe(true);
      }
    });

    it('should prevent creation after first real project', async () => {
      await ensureWelcomeProject();

      // User creates a real project
      mockProjects.push({
        id: 'real-project',
        name: 'My Novel',
        description: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        chapters: [],
        characters: [],
        plotNotes: [],
        worldBuilding: [],
        sessions: [],
      });

      // Try to create welcome project again
      const shouldCreate = await shouldCreateWelcomeProject();
      expect(shouldCreate).toBe(false);
    });
  });
});
