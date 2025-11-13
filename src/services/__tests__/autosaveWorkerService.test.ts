// src/services/__tests__/autosaveWorkerService.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { autosaveWorker } from '../autosaveWorkerService';

describe('AutosaveWorkerService', () => {
  beforeEach(() => {
    // Reset any pending state
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    if (autosaveWorker.getPendingCount() > 0) {
      autosaveWorker.destroy();
    }
  });

  it('should be a singleton', () => {
    const instance1 = autosaveWorker;
    const instance2 = autosaveWorker;
    expect(instance1).toBe(instance2);
  });

  it('should prepare document with main thread fallback', async () => {
    const prepared = await autosaveWorker.prepareDocument(
      'test-id',
      'Test content with some words',
      1,
      [],
    );

    expect(prepared).toMatchObject({
      id: 'test-id',
      content: 'Test content with some words',
      version: 1,
      scenes: [],
    });

    expect(prepared.checksum).toBeDefined();
    expect(prepared.contentSize).toBeGreaterThan(0);
  });

  it('should sanitize content', async () => {
    const prepared = await autosaveWorker.prepareDocument(
      'test-id',
      'Content with\0null bytes and trailing spaces   ',
      1,
      [],
    );

    // Main thread fallback removes null bytes and trims
    expect(prepared.content).not.toContain('\0');
    expect(prepared.content).toBe('Content withnull bytes and trailing spaces');
  });

  it('should calculate checksum consistently', async () => {
    const content = 'Same content for checksum test';

    const prepared1 = await autosaveWorker.prepareDocument('test-1', content, 1, []);
    const prepared2 = await autosaveWorker.prepareDocument('test-2', content, 1, []);

    expect(prepared1.checksum).toBe(prepared2.checksum);
  });

  it('should produce different checksums for different content', async () => {
    const prepared1 = await autosaveWorker.prepareDocument('test-1', 'Content A', 1, []);
    const prepared2 = await autosaveWorker.prepareDocument('test-2', 'Content B', 1, []);

    expect(prepared1.checksum).not.toBe(prepared2.checksum);
  });

  it('should calculate content size correctly', async () => {
    const content = 'Test content';
    const prepared = await autosaveWorker.prepareDocument('test-id', content, 1, []);

    const expectedSize = new Blob([content]).size;
    expect(prepared.contentSize).toBe(expectedSize);
  });

  it('should preserve existing scenes if no new scenes found', async () => {
    const existingScenes = [{ title: 'Existing Scene', startLine: 1, endLine: 10 }];

    const prepared = await autosaveWorker.prepareDocument(
      'test-id',
      'Content without scene markers',
      1,
      existingScenes,
    );

    expect(prepared.scenes).toEqual(existingScenes);
  });

  it('should handle empty content', async () => {
    const prepared = await autosaveWorker.prepareDocument('test-id', '', 1, []);

    expect(prepared.content).toBe('');
    expect(prepared.checksum).toBeDefined();
    expect(prepared.contentSize).toBe(0);
  });

  it('should handle large content efficiently', async () => {
    // Generate 50KB of content
    const largeContent = 'Lorem ipsum dolor sit amet, '.repeat(2000);
    const startTime = performance.now();

    const prepared = await autosaveWorker.prepareDocument('test-id', largeContent, 1, []);
    const duration = performance.now() - startTime;

    expect(prepared.content).toBe(largeContent.trimEnd());
    expect(duration).toBeLessThan(100); // Should complete in < 100ms even on main thread
  });

  it('should report worker availability', () => {
    const isAvailable = autosaveWorker.isWorkerAvailable();
    // Should be boolean (true if worker initialized, false if not)
    expect(typeof isAvailable).toBe('boolean');
  });

  it('should track pending requests count', async () => {
    expect(autosaveWorker.getPendingCount()).toBe(0);

    // Note: In test environment, worker might fall back to main thread
    // so pending count might remain 0 if synchronous
    const prepared = await autosaveWorker.prepareDocument('test-id', 'content', 1, []);

    expect(prepared).toBeDefined();
    expect(autosaveWorker.getPendingCount()).toBe(0); // Should be 0 after completion
  });
});
