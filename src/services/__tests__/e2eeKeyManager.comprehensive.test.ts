/**
 * E2EE Key Manager - Comprehensive Tests
 *
 * Tests the complete key lifecycle:
 * - Initialization and DEK generation
 * - Passphrase-based unlock/lock
 * - Recovery Kit import/export
 * - Passphrase changes
 * - Multi-project support
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexedDBHarness } from '@/test/serviceHarness';
import type { RecoveryKit } from '@/types/crypto';

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

// Import service AFTER mocks
import { e2eeKeyManager } from '../e2eeKeyManager';

describe('E2EEKeyManager - Comprehensive', () => {
  const projectId = 'test-project-123';
  const passphrase = 'correct horse battery staple';

  beforeEach(async () => {
    await indexedDB.clearAll();
    indexedDB.setup();
    await e2eeKeyManager._reset();
    idCounter = 0;
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await e2eeKeyManager._reset();
    indexedDB.teardown();
  });

  describe('Initialization', () => {
    it('should initialize E2EE for a project', { timeout: 15000 }, async () => {
      const recoveryKit = await e2eeKeyManager.initializeProject({
        projectId,
        passphrase,
      });

      expect(recoveryKit).toMatchObject({
        inkwell_recovery_kit: 1,
        project_id: projectId,
        wrapped_dek: expect.any(String),
        kdf: expect.objectContaining({
          type: 'argon2id',
          salt: expect.any(String),
          v: 1,
        }),
        aead: expect.stringMatching(/xchacha20poly1305_ietf|aes-256-gcm/),
        created_at: expect.any(String),
        version: '1',
      });
    });

    it('should use interactive KDF params when requested', async () => {
      const recoveryKit = await e2eeKeyManager.initializeProject({
        projectId,
        passphrase,
        useInteractiveParams: true,
      });

      expect(recoveryKit.kdf.type).toBe('argon2id');
      expect(recoveryKit.kdf.opslimit).toBeDefined();
      expect(recoveryKit.kdf.memlimit).toBeDefined();
    });

    it('should mark project as E2EE enabled', async () => {
      await e2eeKeyManager.initializeProject({ projectId, passphrase });

      const isEnabled = await e2eeKeyManager.isE2EEEnabled(projectId);
      expect(isEnabled).toBe(true);
    });

    it('should automatically unlock project after initialization', { timeout: 15000 }, async () => {
      await e2eeKeyManager.initializeProject({ projectId, passphrase });

      const isUnlocked = e2eeKeyManager.isUnlocked(projectId);
      expect(isUnlocked).toBe(true);
    });

    it('should provide access to DEK after initialization', async () => {
      await e2eeKeyManager.initializeProject({ projectId, passphrase });

      const dek = e2eeKeyManager.getDEK(projectId);
      expect(dek).toBeInstanceOf(Uint8Array);
      expect(dek.length).toBe(32);
    });

    it('should throw error if already initialized', async () => {
      await e2eeKeyManager.initializeProject({ projectId, passphrase });

      await expect(e2eeKeyManager.initializeProject({ projectId, passphrase })).rejects.toThrow(
        'already has E2EE enabled',
      );
    });

    it('should handle multiple projects', async () => {
      const project1 = 'project-1';
      const project2 = 'project-2';

      await e2eeKeyManager.initializeProject({ projectId: project1, passphrase: 'pass1' });
      await e2eeKeyManager.initializeProject({ projectId: project2, passphrase: 'pass2' });

      expect(e2eeKeyManager.isUnlocked(project1)).toBe(true);
      expect(e2eeKeyManager.isUnlocked(project2)).toBe(true);

      const dek1 = e2eeKeyManager.getDEK(project1);
      const dek2 = e2eeKeyManager.getDEK(project2);

      // DEKs should be different
      expect(Buffer.from(dek1).toString('hex')).not.toBe(Buffer.from(dek2).toString('hex'));
    });
  });

  describe('Unlock/Lock', () => {
    beforeEach(async () => {
      await e2eeKeyManager.initializeProject({ projectId, passphrase });
      e2eeKeyManager.lockProject(projectId);
    });

    it('should unlock project with correct passphrase', async () => {
      await e2eeKeyManager.unlockProject(projectId, passphrase);

      expect(e2eeKeyManager.isUnlocked(projectId)).toBe(true);
    });

    it('should throw error with incorrect passphrase', async () => {
      await expect(e2eeKeyManager.unlockProject(projectId, 'wrong')).rejects.toThrow(
        'Incorrect passphrase',
      );
    });

    it('should provide same DEK after unlock', { timeout: 15000 }, async () => {
      // Unlock first to get original DEK
      await e2eeKeyManager.unlockProject(projectId, passphrase);
      const originalDEK = e2eeKeyManager.getDEK(projectId);
      const originalHex = Buffer.from(originalDEK).toString('hex');

      // Lock and unlock again
      e2eeKeyManager.lockProject(projectId);
      await e2eeKeyManager.unlockProject(projectId, passphrase);

      const unlockedDEK = e2eeKeyManager.getDEK(projectId);
      const unlockedHex = Buffer.from(unlockedDEK).toString('hex');

      expect(unlockedHex).toBe(originalHex);
    });

    it('should allow unlock when already unlocked (no-op)', async () => {
      await e2eeKeyManager.unlockProject(projectId, passphrase);
      await e2eeKeyManager.unlockProject(projectId, passphrase); // Second call

      expect(e2eeKeyManager.isUnlocked(projectId)).toBe(true);
    });

    it('should lock project (remove DEK from memory)', async () => {
      await e2eeKeyManager.unlockProject(projectId, passphrase);

      e2eeKeyManager.lockProject(projectId);

      expect(e2eeKeyManager.isUnlocked(projectId)).toBe(false);
      expect(() => e2eeKeyManager.getDEK(projectId)).toThrow('locked');
    });

    it('should lock all projects', { timeout: 15000 }, async () => {
      const project1 = 'project-1';
      const project2 = 'project-2';

      await e2eeKeyManager.initializeProject({ projectId: project1, passphrase: 'pass1' });
      await e2eeKeyManager.initializeProject({ projectId: project2, passphrase: 'pass2' });

      e2eeKeyManager.lockAll();

      expect(e2eeKeyManager.isUnlocked(project1)).toBe(false);
      expect(e2eeKeyManager.isUnlocked(project2)).toBe(false);
    });

    it('should throw error when unlocking non-existent project', async () => {
      await expect(e2eeKeyManager.unlockProject('non-existent', passphrase)).rejects.toThrow(
        'No encryption key found',
      );
    });
  });

  describe('Recovery Kit', () => {
    let recoveryKit: RecoveryKit;

    beforeEach(async () => {
      recoveryKit = await e2eeKeyManager.initializeProject({ projectId, passphrase });
    });

    it('should export Recovery Kit', async () => {
      const exported = await e2eeKeyManager.exportRecoveryKit(projectId);

      // Compare all fields except created_at which may differ by milliseconds
      expect(exported.inkwell_recovery_kit).toBe(recoveryKit.inkwell_recovery_kit);
      expect(exported.project_id).toBe(recoveryKit.project_id);
      expect(exported.wrapped_dek).toBe(recoveryKit.wrapped_dek);
      expect(exported.kdf).toEqual(recoveryKit.kdf);
      expect(exported.aead).toBe(recoveryKit.aead);
      expect(exported.version).toBe(recoveryKit.version);
      // created_at should be close but may differ by a few milliseconds
      const exportedTime = new Date(exported.created_at).getTime();
      const originalTime = new Date(recoveryKit.created_at).getTime();
      expect(Math.abs(exportedTime - originalTime)).toBeLessThan(1000); // within 1 second
    });

    it('should import Recovery Kit and restore access', async () => {
      // Reset manager to simulate fresh state
      await e2eeKeyManager._reset();

      await e2eeKeyManager.importRecoveryKit(recoveryKit, passphrase);

      expect(await e2eeKeyManager.isE2EEEnabled(projectId)).toBe(true);
      expect(e2eeKeyManager.isUnlocked(projectId)).toBe(true);
    });

    it('should fail to import with wrong passphrase', async () => {
      await e2eeKeyManager._reset();

      await expect(e2eeKeyManager.importRecoveryKit(recoveryKit, 'wrong')).rejects.toThrow(
        'Incorrect passphrase',
      );
    });

    it('should reject invalid Recovery Kit format', async () => {
      const invalid = { ...recoveryKit, inkwell_recovery_kit: 99 } as any;

      await expect(e2eeKeyManager.importRecoveryKit(invalid, passphrase)).rejects.toThrow(
        'Invalid Recovery Kit',
      );
    });

    it('should restore same DEK from Recovery Kit', async () => {
      const originalDEK = e2eeKeyManager.getDEK(projectId);
      const originalHex = Buffer.from(originalDEK).toString('hex');

      // Reset and import
      await e2eeKeyManager._reset();
      await e2eeKeyManager.importRecoveryKit(recoveryKit, passphrase);

      const restoredDEK = e2eeKeyManager.getDEK(projectId);
      const restoredHex = Buffer.from(restoredDEK).toString('hex');

      expect(restoredHex).toBe(originalHex);
    });
  });

  describe('Passphrase Change', () => {
    beforeEach(async () => {
      await e2eeKeyManager.initializeProject({ projectId, passphrase });
    });

    it('should change passphrase successfully', { timeout: 15000 }, async () => {
      const newPassphrase = 'new secure passphrase';

      // Get old salt before changing
      const oldKit = await e2eeKeyManager.exportRecoveryKit(projectId);
      const oldSalt = oldKit.kdf.salt;

      const newRecoveryKit = await e2eeKeyManager.changePassphrase(
        projectId,
        passphrase,
        newPassphrase,
      );

      // New salt should be different from old salt
      expect(newRecoveryKit.kdf.salt).not.toBe(oldSalt);
    });

    it('should maintain same DEK after passphrase change', async () => {
      const originalDEK = e2eeKeyManager.getDEK(projectId);
      const originalHex = Buffer.from(originalDEK).toString('hex');

      const newPassphrase = 'new passphrase';
      await e2eeKeyManager.changePassphrase(projectId, passphrase, newPassphrase);

      const newDEK = e2eeKeyManager.getDEK(projectId);
      const newHex = Buffer.from(newDEK).toString('hex');

      expect(newHex).toBe(originalHex);
    }, 10000); // Increase timeout to 10 seconds for crypto operations

    it('should allow unlock with new passphrase', async () => {
      const newPassphrase = 'new passphrase';
      await e2eeKeyManager.changePassphrase(projectId, passphrase, newPassphrase);

      e2eeKeyManager.lockProject(projectId);
      await e2eeKeyManager.unlockProject(projectId, newPassphrase);

      expect(e2eeKeyManager.isUnlocked(projectId)).toBe(true);
    }, 10000); // Increase timeout to 10 seconds for crypto operations

    it('should fail unlock with old passphrase after change', async () => {
      const newPassphrase = 'new passphrase';
      await e2eeKeyManager.changePassphrase(projectId, passphrase, newPassphrase);

      e2eeKeyManager.lockProject(projectId);

      await expect(e2eeKeyManager.unlockProject(projectId, passphrase)).rejects.toThrow(
        'Incorrect passphrase',
      );
    }, 10000); // Increase timeout to 10 seconds for crypto operations

    it('should fail with wrong old passphrase', async () => {
      await expect(e2eeKeyManager.changePassphrase(projectId, 'wrong', 'new')).rejects.toThrow();
    });
  });

  describe('Project Management', () => {
    it('should list all E2EE-enabled projects', async () => {
      await e2eeKeyManager.initializeProject({ projectId: 'project-1', passphrase: 'pass1' });
      await e2eeKeyManager.initializeProject({ projectId: 'project-2', passphrase: 'pass2' });
      await e2eeKeyManager.initializeProject({ projectId: 'project-3', passphrase: 'pass3' });

      const projects = await e2eeKeyManager.listE2EEProjects();

      expect(projects).toHaveLength(3);
      expect(projects).toContain('project-1');
      expect(projects).toContain('project-2');
      expect(projects).toContain('project-3');
    });

    it('should return empty list when no projects', async () => {
      const projects = await e2eeKeyManager.listE2EEProjects();
      expect(projects).toHaveLength(0);
    });

    it('should disable E2EE for a project', async () => {
      await e2eeKeyManager.initializeProject({ projectId, passphrase });

      await e2eeKeyManager.disableE2EE(projectId);

      expect(await e2eeKeyManager.isE2EEEnabled(projectId)).toBe(false);
      expect(e2eeKeyManager.isUnlocked(projectId)).toBe(false);
    });

    it('should remove project from list after disabling', async () => {
      await e2eeKeyManager.initializeProject({ projectId: 'project-1', passphrase: 'pass1' });
      await e2eeKeyManager.initializeProject({ projectId: 'project-2', passphrase: 'pass2' });

      await e2eeKeyManager.disableE2EE('project-1');

      const projects = await e2eeKeyManager.listE2EEProjects();
      expect(projects).toHaveLength(1);
      expect(projects).toContain('project-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent initialization attempts', async () => {
      const promise1 = e2eeKeyManager.initializeProject({ projectId, passphrase });
      const promise2 = e2eeKeyManager.initializeProject({ projectId, passphrase });

      // Both should succeed with the same recovery kit (second one waits for first)
      const [kit1, kit2] = await Promise.all([promise1, promise2]);

      expect(kit1).toBeDefined();
      expect(kit2).toBeDefined();
      expect(kit1.wrapped_dek).toBe(kit2.wrapped_dek); // Same initialization
    });

    it('should handle empty passphrase', async () => {
      await expect(
        e2eeKeyManager.initializeProject({ projectId, passphrase: '' }),
      ).resolves.toBeDefined();
    });

    it('should handle very long passphrase', async () => {
      const longPassphrase = 'a'.repeat(1000);
      await expect(
        e2eeKeyManager.initializeProject({ projectId, passphrase: longPassphrase }),
      ).resolves.toBeDefined();
    });

    it('should handle unicode passphrase', async () => {
      const unicodePassphrase = '密码🔐 password';
      await expect(
        e2eeKeyManager.initializeProject({ projectId, passphrase: unicodePassphrase }),
      ).resolves.toBeDefined();
    });

    it('should throw helpful error when accessing locked DEK', async () => {
      await e2eeKeyManager.initializeProject({ projectId, passphrase });
      e2eeKeyManager.lockProject(projectId);

      expect(() => e2eeKeyManager.getDEK(projectId)).toThrow('locked');
      expect(() => e2eeKeyManager.getDEK(projectId)).toThrow('unlockProject()');
    });

    it('should handle database reinit after close', async () => {
      await e2eeKeyManager.initializeProject({ projectId, passphrase });

      // Simulate connection close
      (e2eeKeyManager as any).db?.close();
      (e2eeKeyManager as any).db = null;

      // Should reinitialize automatically
      await e2eeKeyManager.unlockProject(projectId, passphrase);
      expect(e2eeKeyManager.isUnlocked(projectId)).toBe(true);
    });
  });

  describe('Integration: Full E2EE Lifecycle', () => {
    it('should complete full E2EE workflow', async () => {
      // Step 1: Initialize E2EE with fast KDF params for testing
      const recoveryKit = await e2eeKeyManager.initializeProject({
        projectId,
        passphrase,
        useInteractiveParams: false, // Use fast KDF in CI/tests
      });
      expect(e2eeKeyManager.isUnlocked(projectId)).toBe(true);

      const dek1 = e2eeKeyManager.getDEK(projectId);

      // Step 2: Lock project
      e2eeKeyManager.lockProject(projectId);
      expect(e2eeKeyManager.isUnlocked(projectId)).toBe(false);

      // Step 3: Unlock with passphrase
      await e2eeKeyManager.unlockProject(projectId, passphrase);
      const dek2 = e2eeKeyManager.getDEK(projectId);

      // DEKs should be identical
      expect(Buffer.from(dek2).toString('hex')).toBe(Buffer.from(dek1).toString('hex'));

      // Step 4: Change passphrase
      const newPassphrase = 'new secure passphrase';
      await e2eeKeyManager.changePassphrase(projectId, passphrase, newPassphrase);

      // Step 5: Simulate device loss - import Recovery Kit
      await e2eeKeyManager._reset();
      await e2eeKeyManager.importRecoveryKit(recoveryKit, passphrase);

      const dek3 = e2eeKeyManager.getDEK(projectId);

      // DEK should still match original
      expect(Buffer.from(dek3).toString('hex')).toBe(Buffer.from(dek1).toString('hex'));
    }, 30000); // 30 second timeout for crypto-heavy operations
  });
});
