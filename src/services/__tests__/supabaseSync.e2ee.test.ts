/**
 * Supabase Sync Service - E2EE Tests
 *
 * Tests E2EE encryption/decryption during push/pull operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexedDBHarness } from '@/test/serviceHarness';

// Setup IndexedDB harness
const indexedDB = new IndexedDBHarness();

// Mock utilities
vi.mock('@/utils/devLog', () => ({
  default: {
    log: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

let idCounter = 0;
vi.mock('@/utils/id', () => ({
  generateId: vi.fn(() => `key-${++idCounter}`),
}));

// Mock Supabase client (hoisted)
const mockSupabaseClient = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabaseClient,
}));

// Import services AFTER mocks
import { supabaseSyncService } from '../supabaseSync';
import { e2eeKeyManager } from '../e2eeKeyManager';
import type { Chapter } from '@/types/persistence';

describe('SupabaseSync - E2EE Integration', () => {
  const projectId = 'test-project-123';
  const passphrase = 'correct horse battery staple';
  const userId = 'user-123';

  beforeEach(async () => {
    await indexedDB.clearAll();
    indexedDB.setup();
    await e2eeKeyManager._reset();
    idCounter = 0;
    vi.clearAllMocks();

    // Setup authenticated user
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: userId } } },
      error: null,
    });

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });
  });

  afterEach(async () => {
    await e2eeKeyManager._reset();
    indexedDB.teardown();
  });

  describe('Push with E2EE', () => {
    it('should encrypt chapter content when E2EE is enabled', async () => {
      // Initialize E2EE for project
      await e2eeKeyManager.initializeProject({ projectId, passphrase });

      const chapter: Chapter = {
        id: 'chapter-1',
        title: 'Secret Chapter',
        body: 'This is secret content that should be encrypted',
        project_id: projectId,
        index_in_project: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock Supabase upsert
      let capturedData: any = null;
      const mockUpsert = vi.fn((data) => {
        capturedData = data;
        return { error: null };
      });

      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert,
      });

      // Push chapter
      const result = await supabaseSyncService.pushToCloud({
        chapters: [chapter],
      });

      expect(result.success).toBe(true);
      expect(result.itemsProcessed).toBe(1);

      // Verify chapter was encrypted
      expect(capturedData).toBeDefined();
      expect(capturedData.encrypted_content).toBeDefined();
      expect(capturedData.encrypted_content.ciphertext).toBeTruthy();
      expect(capturedData.encrypted_content.nonce).toBeTruthy();

      // Verify plaintext was cleared
      expect(capturedData.body).toBe('');
      expect(capturedData.title).toBe('[Encrypted]');
    }, 10000); // Increase timeout to 10 seconds for crypto operations

    it('should NOT encrypt chapter content when E2EE is disabled', async () => {
      // Do NOT initialize E2EE for project

      const chapter: Chapter = {
        id: 'chapter-1',
        title: 'Public Chapter',
        body: 'This is public content',
        project_id: projectId,
        index_in_project: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock Supabase upsert
      let capturedData: any = null;
      const mockUpsert = vi.fn((data) => {
        capturedData = data;
        return { error: null };
      });

      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert,
      });

      // Push chapter
      const result = await supabaseSyncService.pushToCloud({
        chapters: [chapter],
      });

      expect(result.success).toBe(true);
      expect(result.itemsProcessed).toBe(1);

      // Verify chapter was NOT encrypted
      expect(capturedData).toBeDefined();
      expect(capturedData.encrypted_content).toBeUndefined();
      expect(capturedData.body).toBe('This is public content');
      expect(capturedData.title).toBe('Public Chapter');
    });

    it('should handle chapters with missing project_id', async () => {
      const chapter: Chapter = {
        id: 'chapter-1',
        title: 'Orphan Chapter',
        body: 'This chapter has no project',
        index_in_project: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;

      // Push chapter
      const result = await supabaseSyncService.pushToCloud({
        chapters: [chapter],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Chapter chapter-1 missing project_id');
    });

    it('should skip encryption when project is locked', async () => {
      // Initialize E2EE but then lock it
      await e2eeKeyManager.initializeProject({ projectId, passphrase });
      e2eeKeyManager.lockProject(projectId);

      const chapter: Chapter = {
        id: 'chapter-1',
        title: 'Locked Chapter',
        body: 'This should not be encrypted because project is locked',
        project_id: projectId,
        index_in_project: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock Supabase upsert
      let capturedData: any = null;
      const mockUpsert = vi.fn((data) => {
        capturedData = data;
        return { error: null };
      });

      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert,
      });

      // Push chapter
      const result = await supabaseSyncService.pushToCloud({
        chapters: [chapter],
      });

      expect(result.success).toBe(true);

      // Verify chapter was NOT encrypted (project locked)
      expect(capturedData.encrypted_content).toBeUndefined();
      expect(capturedData.body).toBe('This should not be encrypted because project is locked');
    });
  });

  describe('Pull with E2EE', () => {
    it('should decrypt encrypted chapter content when project is unlocked', async () => {
      // Initialize E2EE for project
      await e2eeKeyManager.initializeProject({ projectId, passphrase });

      // Create encrypted chapter content
      const dek = e2eeKeyManager.getDEK(projectId);
      const { encryptJSON } = await import('../cryptoService');
      const encrypted = await encryptJSON(
        {
          title: 'Secret Chapter',
          body: 'This is secret content',
        },
        dek,
      );

      const encryptedChapter = {
        id: 'chapter-1',
        title: '[Encrypted]',
        body: '',
        encrypted_content: encrypted,
        project_id: projectId,
        index_in_project: 0,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock Supabase select
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          data: [encryptedChapter],
          error: null,
        }),
      });

      // Pull from cloud
      const result = await supabaseSyncService.pullFromCloud();

      expect(result.chapters).toHaveLength(1);

      const decryptedChapter = result.chapters[0];
      expect(decryptedChapter).toBeDefined();
      expect(decryptedChapter.title).toBe('Secret Chapter');
      expect(decryptedChapter.body).toBe('This is secret content');
    });

    it('should handle unencrypted chapters during pull', async () => {
      const unencryptedChapter = {
        id: 'chapter-1',
        title: 'Public Chapter',
        body: 'This is public content',
        project_id: projectId,
        index_in_project: 0,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock Supabase select
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          data: [unencryptedChapter],
          error: null,
        }),
      });

      // Pull from cloud
      const result = await supabaseSyncService.pullFromCloud();

      expect(result.chapters).toHaveLength(1);

      const chapter = result.chapters[0];
      expect(chapter).toBeDefined();
      expect(chapter.title).toBe('Public Chapter');
      expect(chapter.body).toBe('This is public content');
    });

    it('should show locked indicator when encrypted chapter pulled but project locked', async () => {
      // Initialize E2EE but then lock it
      await e2eeKeyManager.initializeProject({ projectId, passphrase });

      // Create encrypted chapter
      const dek = e2eeKeyManager.getDEK(projectId);
      const { encryptJSON } = await import('../cryptoService');
      const encrypted = await encryptJSON(
        {
          title: 'Secret Chapter',
          body: 'This is secret content',
        },
        dek,
      );

      // Lock project
      e2eeKeyManager.lockProject(projectId);

      const encryptedChapter = {
        id: 'chapter-1',
        title: '[Encrypted]',
        body: '',
        encrypted_content: encrypted,
        project_id: projectId,
        index_in_project: 0,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock Supabase select
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          data: [encryptedChapter],
          error: null,
        }),
      });

      // Pull from cloud
      const result = await supabaseSyncService.pullFromCloud();

      expect(result.chapters).toHaveLength(1);

      const chapter = result.chapters[0];
      expect(chapter).toBeDefined();
      expect(chapter.title).toBe('[Locked - Please unlock project]');
      expect(chapter.body).toBe('');
    });

    it('should handle chapters with missing project_id during pull', async () => {
      const orphanChapter = {
        id: 'chapter-1',
        title: 'Orphan Chapter',
        body: 'This chapter has no project',
        index_in_project: 0,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock Supabase select
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          data: [orphanChapter],
          error: null,
        }),
      });

      // Pull from cloud
      const result = await supabaseSyncService.pullFromCloud();

      expect(result.chapters).toHaveLength(1);

      const chapter = result.chapters[0];
      expect(chapter).toBeDefined();
      expect(chapter.title).toBe('Orphan Chapter');
    });

    it('should handle decryption failures gracefully', async () => {
      // Initialize E2EE
      await e2eeKeyManager.initializeProject({ projectId, passphrase });

      // Create chapter with corrupted encrypted content
      const corruptedChapter = {
        id: 'chapter-1',
        title: '[Encrypted]',
        body: '',
        encrypted_content: {
          ciphertext: 'corrupted-base64-data',
          nonce: 'corrupted-nonce',
          ver: 1,
        },
        project_id: projectId,
        index_in_project: 0,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock Supabase select
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          data: [corruptedChapter],
          error: null,
        }),
      });

      // Pull from cloud
      const result = await supabaseSyncService.pullFromCloud();

      expect(result.chapters).toHaveLength(1);

      const chapter = result.chapters[0];
      expect(chapter).toBeDefined();
      expect(chapter.title).toBe('[Decryption Failed]');
      expect(chapter.body).toBe('');
    });
  });

  describe('Round-trip Encryption', () => {
    it('should successfully encrypt and decrypt chapter in round-trip', async () => {
      // Initialize E2EE
      await e2eeKeyManager.initializeProject({ projectId, passphrase });

      const originalChapter: Chapter = {
        id: 'chapter-1',
        title: 'Test Chapter',
        body: 'This is test content that should survive encryption and decryption',
        project_id: projectId,
        index_in_project: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Capture encrypted data during push
      let encryptedData: any = null;
      const mockUpsert = vi.fn((data) => {
        encryptedData = data;
        return { error: null };
      });

      mockSupabaseClient.from.mockReturnValue({
        upsert: mockUpsert,
      });

      // Push chapter (encrypt)
      await supabaseSyncService.pushToCloud({
        chapters: [originalChapter],
      });

      expect(encryptedData).toBeDefined();
      expect(encryptedData.encrypted_content).toBeDefined();

      // Mock pull to return encrypted data
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          data: [encryptedData],
          error: null,
        }),
      });

      // Pull chapter (decrypt)
      const result = await supabaseSyncService.pullFromCloud();

      expect(result.chapters).toHaveLength(1);

      const decryptedChapter = result.chapters[0];
      expect(decryptedChapter).toBeDefined();
      expect(decryptedChapter.title).toBe(originalChapter.title);
      expect(decryptedChapter.body).toBe(originalChapter.body);
      expect(decryptedChapter.id).toBe(originalChapter.id);
    });
  });
});
