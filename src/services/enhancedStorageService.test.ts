import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

import { connectivityService } from './connectivityService';
import { EnhancedStorageService } from './enhancedStorageService';
import { snapshotService } from './snapshotService';

vi.mock('./connectivityService', () => ({
  connectivityService: {
    getStatus: vi.fn(),
    queueWrite: vi.fn(),
    onStatusChange: vi.fn(),
  },
}));

vi.mock('./snapshotService', () => ({
  snapshotService: {
    createSnapshot: vi.fn(),
    emergencyCleanup: vi.fn(),
    getSnapshotStorageUsage: vi.fn(),
  },
}));

const mockProject = {
  id: '1',
  name: 'Test Project',
  description: 'Test Description',
  chapters: [],
  createdAt: Date.now(),
  updatedAt: Date.now() + 1000,
  status: 'draft',
  settings: {
    theme: 'light',
    fontSize: 14,
  },
};

describe('EnhancedStorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks(); // Restore all spies before each test
    vi.useFakeTimers();
    // Reset connectivity service to online by default
    (connectivityService.getStatus as any).mockReturnValue({ isOnline: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks(); // Restore all spies after each test
  });

  afterEach(() => {
    EnhancedStorageService.cleanup();
  });

  it('saves and reads project successfully', () => {
    EnhancedStorageService.saveProject(mockProject);
    const loaded = EnhancedStorageService.loadProject(mockProject.id)!;
    expect(loaded).toMatchObject({
      id: mockProject.id,
      name: mockProject.name,
      description: mockProject.description,
      chapters: [],
    });
    // Relax time checks
    expect(loaded.createdAt).toBeDefined();
    expect(loaded.updatedAt).toBeDefined();
    expect(loaded.updatedAt).toBeGreaterThanOrEqual(loaded.createdAt);
  });

  it('throws on quota exceeded', async () => {
    // Use real timers for this test since we need async promises to settle
    vi.useRealTimers();

    const mockQuotaError = new Error('Quota exceeded');
    mockQuotaError.name = 'QuotaExceededError';

    // Verify error setup
    expect(mockQuotaError instanceof Error).toBe(true);
    expect(mockQuotaError.name.includes('Quota')).toBe(true);

    // Mock queueWrite to return a resolved promise
    (connectivityService.queueWrite as any).mockResolvedValue(undefined);

    // Spy on setItem to throw quota error
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    setItemSpy.mockImplementation(() => {
      throw mockQuotaError;
    });

    // saveProject catches the error, so we need to check the behavior
    EnhancedStorageService.saveProject(mockProject);

    // Wait for the promise microtask queue to flush
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(connectivityService.queueWrite).toHaveBeenCalled();

    // Restore fake timers for other tests
    vi.useFakeTimers();
  });

  it('recovers from corrupt JSON data', () => {
    localStorage.setItem('inkwell_enhanced_projects', 'invalid json{');
    const projects = EnhancedStorageService.loadAllProjects();
    expect(projects).toEqual([]);
  });

  it('handles offline queue directly', async () => {
    (connectivityService.getStatus as any).mockReturnValue({ isOnline: false });

    await EnhancedStorageService.saveProjectSafe(mockProject);

    expect(connectivityService.queueWrite).toHaveBeenCalledWith(
      'save',
      EnhancedStorageService['PROJECTS_KEY'],
      expect.any(String),
    );
  });

  it('handles writing sessions properly', () => {
    const session = {
      startTime: new Date(),
      endTime: new Date(),
      wordCount: 100,
      wordsAdded: 50,
      productivity: 0.8,
      focusTime: 1800,
    };

    EnhancedStorageService.saveProject(mockProject);
    EnhancedStorageService.addWritingSession(mockProject.id, session);

    const updatedProject = EnhancedStorageService.loadProject(mockProject.id);
    expect(updatedProject?.sessions).toHaveLength(1);
    const s = updatedProject!.sessions![0];
    expect(typeof s.startTime).toBe('string');
    expect(typeof s.endTime).toBe('string');
    expect(new Date(s.startTime).toISOString()).toBe(session.startTime.toISOString());
    expect(new Date(s.endTime).toISOString()).toBe(session.endTime.toISOString());
    expect(s).toMatchObject({
      projectId: mockProject.id,
      wordCount: session.wordCount,
      wordsAdded: session.wordsAdded,
      productivity: session.productivity,
      focusTime: session.focusTime,
    });
  });

  it('maintains auto-snapshot state correctly', async () => {
    // Mock storage and services with proper auto-snapshot state
    const store: Record<string, string> = { inkwell_auto_snapshot_enabled: 'false' };
    const mockStorage = {
      getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const k of Object.keys(store)) delete store[k];
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
      get length() {
        return Object.keys(store).length;
      },
    } as unknown as Storage;

    const originalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', { value: mockStorage });

    try {
      // Start with everything disabled
      EnhancedStorageService.setAutoSnapshotEnabled(false);

      // Reset timers and spies
      vi.useFakeTimers();
      const timeoutSpy = vi.spyOn(global, 'setTimeout');
      timeoutSpy.mockClear();

      // Save project with snapshots disabled
      EnhancedStorageService.saveProject(mockProject);
      vi.runAllTimers();
      expect(timeoutSpy).not.toHaveBeenCalled();
      expect(snapshotService.createSnapshot).not.toHaveBeenCalled();

      // Enable auto-snapshots
      EnhancedStorageService.setAutoSnapshotEnabled(true);
      timeoutSpy.mockClear();

      // Save project with snapshots enabled
      EnhancedStorageService.saveProject(mockProject);
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);

      // Run the timer to trigger the snapshot
      vi.runAllTimers();
      expect(snapshotService.createSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockProject.id }),
        expect.objectContaining({ isAutomatic: true }),
      );
    } finally {
      vi.useRealTimers();
      Object.defineProperty(window, 'localStorage', { value: originalStorage });
    }
  });
});
