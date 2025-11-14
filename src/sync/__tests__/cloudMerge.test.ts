/**
 * Cloud Merge Engine Tests
 *
 * Validates LWW merge logic with all edge cases from POC.
 * All tests must pass before production deployment.
 */

import { describe, it, expect } from 'vitest';
import { lwwMerge, batchMerge, getMergeStats, simpleHash, hashRecord } from '../cloudMerge';
import type { LocalRecord, CloudRecord } from '../types';

describe('lwwMerge', () => {
  it('should choose cloud when cloud is newer', () => {
    const local: LocalRecord = {
      id: 'chapter-1',
      updated_at: 1000,
      last_synced_at: 1000,
      client_hash: simpleHash('Old content'),
      content: 'Old content',
    };

    const cloud: CloudRecord = {
      id: 'chapter-1',
      updated_at: 2000,
      client_hash: simpleHash('New content from cloud'),
      content: 'New content from cloud',
    };

    const result = lwwMerge(local, cloud);

    expect(result.decision).toBe('take-cloud');
    expect(result.winner).toBe('cloud');
    expect(result.shouldPushToCloud).toBe(false);
    expect(result.shouldUpdateLocal).toBe(true);
    expect(result.mergedRecord).toHaveProperty('last_synced_at');
  });

  it('should choose local when local is newer', () => {
    const local: LocalRecord = {
      id: 'chapter-1',
      updated_at: 3000,
      last_synced_at: 2000,
      client_hash: simpleHash('Fresh local edits'),
      content: 'Fresh local edits',
    };

    const cloud: CloudRecord = {
      id: 'chapter-1',
      updated_at: 2000,
      client_hash: simpleHash('Stale cloud content'),
      content: 'Stale cloud content',
    };

    const result = lwwMerge(local, cloud);

    expect(result.decision).toBe('keep-local');
    expect(result.winner).toBe('local');
    expect(result.shouldPushToCloud).toBe(true);
    expect(result.shouldUpdateLocal).toBe(false);
  });

  it('should push local when never synced', () => {
    const local: LocalRecord = {
      id: 'chapter-2',
      updated_at: 5000,
      last_synced_at: 0, // Never synced
      client_hash: simpleHash('Brand new chapter'),
      content: 'Brand new chapter',
    };

    const cloud: CloudRecord = {
      id: 'chapter-2',
      updated_at: 0,
      client_hash: '',
      content: '',
    };

    const result = lwwMerge(local, cloud);

    expect(result.decision).toBe('keep-local');
    expect(result.winner).toBe('local');
    expect(result.shouldPushToCloud).toBe(true);
    expect(result.shouldUpdateLocal).toBe(false);
  });

  it('should detect no change when timestamps and hashes match', () => {
    const hash = simpleHash('Synced content');

    const local: LocalRecord = {
      id: 'chapter-3',
      updated_at: 10000,
      last_synced_at: 10000,
      client_hash: hash,
      content: 'Synced content',
    };

    const cloud: CloudRecord = {
      id: 'chapter-3',
      updated_at: 10000,
      client_hash: hash,
      content: 'Synced content',
    };

    const result = lwwMerge(local, cloud);

    expect(result.decision).toBe('keep-local');
    expect(result.winner).toBeNull();
    expect(result.shouldPushToCloud).toBe(false);
    expect(result.shouldUpdateLocal).toBe(false);
  });

  it('should detect conflict when timestamps equal but content differs', () => {
    const local: LocalRecord = {
      id: 'chapter-4',
      updated_at: 15000,
      last_synced_at: 14000,
      client_hash: simpleHash('Local version'),
      content: 'Local version',
    };

    const cloud: CloudRecord = {
      id: 'chapter-4',
      updated_at: 15000,
      client_hash: simpleHash('Cloud version'),
      content: 'Cloud version',
    };

    const result = lwwMerge(local, cloud);

    expect(result.decision).toBe('conflict-detected');
    expect(result.winner).toBeNull();
    expect(result.shouldPushToCloud).toBe(false);
    expect(result.shouldUpdateLocal).toBe(false);
  });

  it('should handle local newer than cloud (push scenario)', () => {
    const local: LocalRecord = {
      id: 'chapter-5',
      updated_at: 20000,
      last_synced_at: 18000,
      client_hash: simpleHash('User is actively writing'),
      content: 'User is actively writing',
    };

    const cloud: CloudRecord = {
      id: 'chapter-5',
      updated_at: 18000,
      client_hash: simpleHash(''),
      content: '',
    };

    const result = lwwMerge(local, cloud);

    expect(result.decision).toBe('keep-local');
    expect(result.winner).toBe('local');
    expect(result.shouldPushToCloud).toBe(true);
  });
});

describe('batchMerge', () => {
  it('should merge multiple records correctly', () => {
    const localRecords: LocalRecord[] = [
      {
        id: 'rec-1',
        updated_at: 1000,
        last_synced_at: 1000,
        content: 'Local 1',
      },
      {
        id: 'rec-2',
        updated_at: 3000,
        last_synced_at: 2000,
        content: 'Local 2 (newer)',
      },
      {
        id: 'rec-3',
        updated_at: 5000,
        last_synced_at: 0, // Never synced
        content: 'Local 3 (new)',
      },
    ];

    const cloudRecords: CloudRecord[] = [
      {
        id: 'rec-1',
        updated_at: 2000, // Newer than local
        content: 'Cloud 1 (updated)',
      },
      {
        id: 'rec-2',
        updated_at: 2000, // Older than local
        content: 'Cloud 2 (stale)',
      },
      {
        id: 'rec-4', // Not in local
        updated_at: 6000,
        content: 'Cloud 4 (only in cloud)',
      },
    ];

    const results = batchMerge(localRecords, cloudRecords);

    // rec-1: cloud wins (newer)
    const rec1Result = results.find((r) => r.mergedRecord?.id === 'rec-1');
    expect(rec1Result?.winner).toBe('cloud');

    // rec-2: local wins (newer)
    const rec2Result = results.find((r) => r.mergedRecord?.id === 'rec-2');
    expect(rec2Result?.winner).toBe('local');

    // rec-3: local wins (never synced)
    const rec3Result = results.find((r) => r.mergedRecord?.id === 'rec-3');
    expect(rec3Result?.winner).toBe('local');
    expect(rec3Result?.shouldPushToCloud).toBe(true);

    // rec-4: cloud wins (not in local)
    const rec4Result = results.find((r) => r.mergedRecord?.id === 'rec-4');
    expect(rec4Result?.winner).toBe('cloud');
    expect(rec4Result?.shouldUpdateLocal).toBe(true);
  });
});

describe('getMergeStats', () => {
  it('should calculate correct statistics', () => {
    const results = [
      {
        decision: 'keep-local' as const,
        winner: 'local' as const,
        reason: 'test',
        shouldPushToCloud: true,
        shouldUpdateLocal: false,
      },
      {
        decision: 'take-cloud' as const,
        winner: 'cloud' as const,
        reason: 'test',
        shouldPushToCloud: false,
        shouldUpdateLocal: true,
      },
      {
        decision: 'conflict-detected' as const,
        winner: null,
        reason: 'test',
        shouldPushToCloud: false,
        shouldUpdateLocal: false,
      },
      {
        decision: 'keep-local' as const,
        winner: null, // No change
        reason: 'test',
        shouldPushToCloud: false,
        shouldUpdateLocal: false,
      },
    ];

    const stats = getMergeStats(results);

    expect(stats.total).toBe(4);
    expect(stats.localWins).toBe(1);
    expect(stats.cloudWins).toBe(1);
    expect(stats.conflicts).toBe(1);
    expect(stats.noChange).toBe(2); // Both conflict and keep-local with null winner count as noChange
    expect(stats.pushToCloud).toBe(1);
    expect(stats.updateLocal).toBe(1);
  });
});

describe('simpleHash', () => {
  it('should produce consistent hashes', () => {
    const content = 'Test content for hashing';
    const hash1 = simpleHash(content);
    const hash2 = simpleHash(content);

    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different content', () => {
    const hash1 = simpleHash('Content A');
    const hash2 = simpleHash('Content B');

    expect(hash1).not.toBe(hash2);
  });

  it('should handle unicode content', () => {
    const content = '测试内容 🚀 with emoji and 中文';
    const hash = simpleHash(content);

    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');
  });

  it('should handle large content', () => {
    const largeContent = 'a'.repeat(1024 * 1024); // 1MB
    const hash = simpleHash(largeContent);

    expect(hash).toBeTruthy();
    expect(hash.length).toBeGreaterThan(0);
  });
});

describe('hashRecord', () => {
  it('should hash record content fields', () => {
    const record = {
      id: 'test-1',
      title: 'Test Chapter',
      body: 'Content here',
      created_at: 1000,
      updated_at: 2000,
    };

    const hash = hashRecord(record);

    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');
  });

  it('should produce same hash for same content', () => {
    const record1 = {
      id: 'test-1',
      title: 'Test',
      body: 'Content',
      updated_at: 1000,
    };

    const record2 = {
      id: 'test-1',
      title: 'Test',
      body: 'Content',
      updated_at: 2000, // Different timestamp
    };

    const hash1 = hashRecord(record1);
    const hash2 = hashRecord(record2);

    // Hashes should be same because content is same (timestamps excluded)
    expect(hash1).toBe(hash2);
  });

  it('should produce different hash when content changes', () => {
    const record1 = {
      id: 'test-1',
      title: 'Test',
      body: 'Content A',
    };

    const record2 = {
      id: 'test-1',
      title: 'Test',
      body: 'Content B',
    };

    const hash1 = hashRecord(record1);
    const hash2 = hashRecord(record2);

    expect(hash1).not.toBe(hash2);
  });

  it('should handle custom field selection', () => {
    const record = {
      id: 'test-1',
      title: 'Test',
      body: 'Content',
      metadata: { foo: 'bar' },
    };

    const hash1 = hashRecord(record, ['title', 'body']);
    const hash2 = hashRecord(record, ['title', 'body', 'metadata']);

    // Different fields = different hashes
    expect(hash1).not.toBe(hash2);
  });
});

describe('Edge Cases', () => {
  it('should handle missing last_synced_at gracefully', () => {
    const local: LocalRecord = {
      id: 'test',
      updated_at: 1000,
      last_synced_at: 0,
      content: 'Test',
    } as any; // Simulate missing field

    const cloud: CloudRecord = {
      id: 'test',
      updated_at: 2000,
      content: 'Cloud test',
    };

    const result = lwwMerge(local, cloud);

    expect(result.decision).toBeDefined();
    expect(result.winner).toBeDefined();
  });

  it('should handle records without hashes', () => {
    const local: LocalRecord = {
      id: 'test',
      updated_at: 1000,
      last_synced_at: 1000,
      content: 'Test',
      // No client_hash
    };

    const cloud: CloudRecord = {
      id: 'test',
      updated_at: 1000,
      content: 'Test',
      // No client_hash
    };

    const result = lwwMerge(local, cloud);

    expect(result.decision).toBe('keep-local');
    expect(result.winner).toBeNull();
  });

  it('should handle very close timestamps (race condition)', () => {
    const baseTime = Date.now();

    const local: LocalRecord = {
      id: 'test',
      updated_at: baseTime,
      last_synced_at: baseTime - 1000,
      content: 'Local',
    };

    const cloud: CloudRecord = {
      id: 'test',
      updated_at: baseTime + 1, // 1ms newer
      content: 'Cloud',
    };

    const result = lwwMerge(local, cloud);

    expect(result.winner).toBe('cloud'); // Cloud wins even by 1ms
  });
});
