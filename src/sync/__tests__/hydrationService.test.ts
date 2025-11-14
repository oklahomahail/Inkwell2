/**
 * HydrationService Tests
 *
 * Coverage targets:
 * - Full project hydration (happy path)
 * - Empty data handling
 * - Incremental hydration with "since" timestamp
 * - E2EE decryption path
 * - Error handling (Supabase errors)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      is: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
  },
}));

// Mock E2EE services
vi.mock('@/services/e2eeKeyManager', () => ({
  e2eeKeyManager: {
    isE2EEEnabled: vi.fn().mockResolvedValue(false),
    isUnlocked: vi.fn().mockReturnValue(false),
    getDEK: vi.fn().mockReturnValue(null),
  },
}));

vi.mock('@/services/cryptoService', () => ({
  decryptJSON: vi.fn().mockResolvedValue('Decrypted content'),
}));

// Mock local database services
vi.mock('@/services/chaptersService', () => ({
  Chapters: {
    saveDoc: vi.fn().mockResolvedValue(undefined),
    getMeta: vi.fn().mockResolvedValue(null),
  },
}));

// Mock ProjectsDB
vi.mock('@/services/projectsDB', () => ({
  ProjectsDB: {
    loadProject: vi.fn().mockResolvedValue(null),
  },
}));

import { supabase } from '@/lib/supabaseClient';
import { e2eeKeyManager } from '@/services/e2eeKeyManager';
import { decryptJSON } from '@/services/cryptoService';
import { Chapters } from '@/services/chaptersService';
import { hydrationService } from '@/sync/hydrationService';

describe('hydrationService', () => {
  const projectId = 'project-123';

  beforeEach(() => {
    vi.clearAllMocks();
    (e2eeKeyManager.isE2EEEnabled as any).mockResolvedValue(false);
    (e2eeKeyManager.isUnlocked as any).mockReturnValue(false);
    (e2eeKeyManager.getDEK as any).mockReturnValue(null);
  });

  describe('Full project hydration', () => {
    it('hydrates project from cloud (happy path)', async () => {
      const cloudChapters = [
        {
          id: '1',
          project_id: projectId,
          title: 'Chapter 1',
          body: 'Content 1',
          index_in_project: 0,
          word_count: 2,
          status: 'draft',
          updated_at: '2025-11-14T12:00:00Z',
        },
      ];

      const mockIs = vi.fn().mockResolvedValue({
        data: cloudChapters,
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        is: mockIs,
      });

      const result = await hydrationService.hydrateProject({
        projectId,
        tables: ['chapters'],
      });

      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBe(1);
      expect(result.conflicts).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('handles when user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await hydrationService.hydrateProject({
        projectId,
        tables: ['chapters'],
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Empty data handling', () => {
    it('handles empty cloud data as success', async () => {
      const mockIs = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        is: mockIs,
      });

      const result = await hydrationService.hydrateProject({
        projectId,
        tables: ['chapters'],
      });

      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBe(0);
    });
  });

  describe('E2EE decryption', () => {
    it('decrypts encrypted chapters when E2EE is enabled', async () => {
      (e2eeKeyManager.isE2EEEnabled as any).mockResolvedValue(true);
      (e2eeKeyManager.isUnlocked as any).mockReturnValue(true);
      (e2eeKeyManager.getDEK as any).mockReturnValue(new Uint8Array(32));

      const encryptedChapter = {
        id: '1',
        project_id: projectId,
        encrypted_content: {
          ciphertext: 'base64-ciphertext',
          nonce: 'base64-nonce',
          ver: 1,
        },
        index_in_project: 0,
        word_count: 5,
        status: 'draft',
        updated_at: '2025-11-14T12:00:00Z',
      };

      const mockIs = vi.fn().mockResolvedValue({
        data: [encryptedChapter],
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        is: mockIs,
      });

      const result = await hydrationService.hydrateProject({
        projectId,
        tables: ['chapters'],
      });

      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBe(1);

      // Should have called decrypt
      expect(decryptJSON).toHaveBeenCalledWith(
        {
          ciphertext: 'base64-ciphertext',
          nonce: 'base64-nonce',
          ver: 1,
        },
        expect.any(Uint8Array),
      );
    });

    it('skips encrypted chapter when project is locked (no DEK)', async () => {
      (e2eeKeyManager.isE2EEEnabled as any).mockResolvedValue(true);
      (e2eeKeyManager.isUnlocked as any).mockReturnValue(false);
      (e2eeKeyManager.getDEK as any).mockReturnValue(null); // Locked

      const encryptedChapter = {
        id: '1',
        project_id: projectId,
        encrypted_content: {
          ciphertext: 'base64-ciphertext',
          nonce: 'base64-nonce',
          ver: 1,
        },
        index_in_project: 0,
        word_count: 0,
        status: 'draft',
        updated_at: '2025-11-14T12:00:00Z',
      };

      const mockIs = vi.fn().mockResolvedValue({
        data: [encryptedChapter],
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        is: mockIs,
      });

      const result = await hydrationService.hydrateProject({
        projectId,
        tables: ['chapters'],
      });

      // Should fail because encrypted chapter was skipped
      expect(result.success).toBe(false);
      expect(result.recordsSynced).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('encrypted but project locked');

      // Should NOT have called decrypt
      expect(decryptJSON).not.toHaveBeenCalled();
    });
  });

  describe('Incremental hydration', () => {
    it('uses "since" parameter to fetch only recent changes', async () => {
      const since = Date.now() - 1000; // 1 second ago
      const mockIs = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockGt = vi.fn().mockReturnThis();
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: mockGt,
        is: mockIs,
      });

      await hydrationService.hydrateProject({
        projectId,
        tables: ['chapters'],
        since,
      });

      // Should have called gt() with the since timestamp
      expect(mockGt).toHaveBeenCalledWith('updated_at', expect.any(String));
    });
  });

  describe('Other table types', () => {
    it('hydrates sections successfully', async () => {
      const sections = [
        {
          id: 'section-1',
          project_id: projectId,
          title: 'Section 1',
          body: 'Section content',
          updated_at: '2025-11-14T12:00:00Z',
        },
      ];

      const mockIs = vi.fn().mockResolvedValue({
        data: sections,
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        is: mockIs,
      });

      const result = await hydrationService.hydrateProject({
        projectId,
        tables: ['sections'],
      });

      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBe(1);
    });

    it('hydrates characters successfully', async () => {
      const characters = [
        {
          id: 'char-1',
          project_id: projectId,
          name: 'John Doe',
          updated_at: '2025-11-14T12:00:00Z',
        },
      ];

      const mockIs = vi.fn().mockResolvedValue({
        data: characters,
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        is: mockIs,
      });

      const result = await hydrationService.hydrateProject({
        projectId,
        tables: ['characters'],
      });

      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBe(1);
    });

    it('hydrates notes successfully', async () => {
      const notes = [
        {
          id: 'note-1',
          project_id: projectId,
          title: 'Note',
          body: 'Note content',
          updated_at: '2025-11-14T12:00:00Z',
        },
      ];

      const mockIs = vi.fn().mockResolvedValue({
        data: notes,
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        is: mockIs,
      });

      const result = await hydrationService.hydrateProject({
        projectId,
        tables: ['notes'],
      });

      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('marks hydration as failed when Supabase returns error', async () => {
      const mockIs = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Database connection failed',
          code: 'PGRST301',
        },
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        is: mockIs,
      });

      const result = await hydrationService.hydrateProject({
        projectId,
        tables: ['chapters'],
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
