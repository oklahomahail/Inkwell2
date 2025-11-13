// src/services/__tests__/autosaveWorkerService.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { autosaveWorker } from '../autosaveWorkerService';

// Access the Worker mock class to control its behavior
const WorkerMock = (globalThis as any).Worker;

describe('AutosaveWorkerService', () => {
  beforeEach(() => {
    // Reset any pending state
    vi.clearAllMocks();
    // Reset worker mock to default behavior (auto-error)
    WorkerMock.shouldAutoError = true;
    WorkerMock.mockResponse = null;
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

  it('should handle worker timeout and fallback to main thread', async () => {
    // Prevent auto-error to test timeout path
    WorkerMock.shouldAutoError = false;
    WorkerMock.mockResponse = null; // Worker doesn't respond

    // Import fresh instance that will use the non-erroring worker
    const { AutosaveWorkerService } = await import('../autosaveWorkerService');
    const testService = new (AutosaveWorkerService as any)();

    // This should timeout and fallback to main thread
    const prepared = await testService.prepareDocument('timeout-test', 'content', 1, []);

    expect(prepared).toMatchObject({
      id: 'timeout-test',
      content: 'content',
      version: 1,
    });

    // Cleanup
    testService.destroy();
  }, 10000); // Increase timeout for this test

  it('should process worker response when worker is available', async () => {
    // Prevent auto-error and configure mock response
    WorkerMock.shouldAutoError = false;
    WorkerMock.mockResponse = (request: any) => ({
      type: 'prepare-complete',
      id: request.id,
      preparedDoc: {
        id: request.id,
        content: request.content,
        version: request.version,
        scenes: request.currentScenes || [],
        checksum: 'worker-checksum',
        contentSize: 100,
      },
    });

    // Import fresh instance that will use the working worker
    const { AutosaveWorkerService } = await import('../autosaveWorkerService');
    const testService = new (AutosaveWorkerService as any)();

    // Wait a tick for worker to initialize without error
    await new Promise((resolve) => setTimeout(resolve, 10));

    const prepared = await testService.prepareDocument('worker-test', 'content', 1, []);

    expect(prepared).toMatchObject({
      id: 'worker-test',
      content: 'content',
      version: 1,
      checksum: 'worker-checksum',
      contentSize: 100,
    });

    // Cleanup
    testService.destroy();
  });

  it('should handle worker error response', async () => {
    // Prevent auto-error and configure error response
    WorkerMock.shouldAutoError = false;
    WorkerMock.mockResponse = (request: any) => ({
      type: 'error',
      id: request.id,
      error: 'Worker processing failed',
    });

    // Import fresh instance
    const { AutosaveWorkerService } = await import('../autosaveWorkerService');
    const testService = new (AutosaveWorkerService as any)();

    // Wait for worker to initialize
    await new Promise((resolve) => setTimeout(resolve, 10));

    // This should receive error from worker
    await expect(testService.prepareDocument('error-test', 'content', 1, [])).rejects.toThrow(
      'Worker processing failed',
    );

    // Cleanup
    testService.destroy();
  });

  it('should reject pending requests on destroy', async () => {
    // Prevent auto-error
    WorkerMock.shouldAutoError = false;
    WorkerMock.mockResponse = null; // No response

    // Import fresh instance
    const { AutosaveWorkerService } = await import('../autosaveWorkerService');
    const testService = new (AutosaveWorkerService as any)();

    // Wait for worker to initialize
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Start a request but don't await it
    const promise = testService.prepareDocument('pending-test', 'content', 1, []);

    // Destroy before it completes
    testService.destroy();

    // Should reject with error
    await expect(promise).rejects.toThrow('Worker destroyed');
  });
});
