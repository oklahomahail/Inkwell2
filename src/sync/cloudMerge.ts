/**
 * Cloud Merge Engine - Last Write Wins (LWW)
 *
 * Deterministic conflict resolution for cloud sync.
 * Server timestamps are authoritative (Postgres TIMESTAMPTZ).
 *
 * Ported from validated POC: docs/sync/poc-suite/01-lww-merge-poc.ts
 * All POC tests passed before production use.
 */

import devLog from '@/utils/devLog';

import type { CloudRecord, LocalRecord, MergeResult } from './types';

/**
 * Last Write Wins merge algorithm
 *
 * Decision rules:
 * 1. Server timestamp is authoritative (eliminates clock skew)
 * 2. If cloud.updated_at > local.updated_at → cloud wins
 * 3. If local.updated_at > cloud.updated_at → local wins (push to cloud)
 * 4. If timestamps equal but hashes differ → conflict (rare)
 * 5. If local has never been synced → push to cloud
 *
 * @param local - Record from IndexedDB with client metadata
 * @param cloud - Record from Supabase with server timestamp
 * @returns Merge decision with actions to take
 */
export function lwwMerge(local: LocalRecord, cloud: CloudRecord): MergeResult {
  // Case 1: Local has never been synced (new local record)
  if (local.last_synced_at === 0 || !local.last_synced_at) {
    devLog.debug('[CloudMerge] New local record never synced', {
      recordId: local.id,
      localUpdatedAt: local.updated_at,
    });

    return {
      decision: 'keep-local',
      winner: 'local',
      reason: 'Local record never synced - push to cloud',
      shouldPushToCloud: true,
      shouldUpdateLocal: false,
      mergedRecord: local,
    };
  }

  // Case 2: Cloud record is newer than local
  if (cloud.updated_at > local.updated_at) {
    devLog.debug('[CloudMerge] Cloud is newer', {
      recordId: local.id,
      cloudUpdatedAt: cloud.updated_at,
      localUpdatedAt: local.updated_at,
      delta: cloud.updated_at - local.updated_at,
    });

    return {
      decision: 'take-cloud',
      winner: 'cloud',
      reason: `Cloud is newer (cloud: ${new Date(cloud.updated_at).toISOString()}, local: ${new Date(local.updated_at).toISOString()})`,
      shouldPushToCloud: false,
      shouldUpdateLocal: true,
      mergedRecord: {
        ...cloud,
        last_synced_at: Date.now(),
      },
    };
  }

  // Case 3: Local record is newer than cloud
  if (local.updated_at > cloud.updated_at) {
    devLog.debug('[CloudMerge] Local is newer', {
      recordId: local.id,
      localUpdatedAt: local.updated_at,
      cloudUpdatedAt: cloud.updated_at,
      delta: local.updated_at - cloud.updated_at,
    });

    return {
      decision: 'keep-local',
      winner: 'local',
      reason: `Local is newer (local: ${new Date(local.updated_at).toISOString()}, cloud: ${new Date(cloud.updated_at).toISOString()})`,
      shouldPushToCloud: true,
      shouldUpdateLocal: false,
      mergedRecord: local,
    };
  }

  // Case 4: Timestamps are equal (very rare with microsecond precision)
  // Use content hash as tiebreaker if available
  if (local.client_hash && cloud.client_hash) {
    if (local.client_hash === cloud.client_hash) {
      devLog.debug('[CloudMerge] Records in sync (hashes match)', {
        recordId: local.id,
        hash: local.client_hash,
      });

      return {
        decision: 'keep-local',
        winner: null,
        reason: 'Timestamps and hashes match - records in sync',
        shouldPushToCloud: false,
        shouldUpdateLocal: false,
        mergedRecord: local,
      };
    } else {
      // Timestamps equal but content differs - rare conflict
      devLog.warn('[CloudMerge] Conflict detected - equal timestamps, different content', {
        recordId: local.id,
        timestamp: new Date(local.updated_at).toISOString(),
        localHash: local.client_hash,
        cloudHash: cloud.client_hash,
      });

      return {
        decision: 'conflict-detected',
        winner: null,
        reason: 'Timestamps equal but content differs - rare conflict',
        shouldPushToCloud: false,
        shouldUpdateLocal: false,
        mergedRecord: local, // Keep local as fallback
      };
    }
  }

  // Fallback: Timestamps equal, no hash available
  // Assume records are in sync (rare case)
  devLog.debug('[CloudMerge] Timestamps equal, no hash comparison available', {
    recordId: local.id,
    timestamp: new Date(local.updated_at).toISOString(),
  });

  return {
    decision: 'keep-local',
    winner: null,
    reason: 'Timestamps equal, assuming in sync',
    shouldPushToCloud: false,
    shouldUpdateLocal: false,
    mergedRecord: local,
  };
}

/**
 * Batch merge multiple records
 *
 * @param localRecords - Array of local records
 * @param cloudRecords - Array of cloud records
 * @returns Array of merge results
 */
export function batchMerge(
  localRecords: LocalRecord[],
  cloudRecords: CloudRecord[],
): MergeResult[] {
  const cloudMap = new Map(cloudRecords.map((r) => [r.id, r]));
  const results: MergeResult[] = [];

  for (const local of localRecords) {
    const cloud = cloudMap.get(local.id);

    if (!cloud) {
      // Cloud record doesn't exist - push local
      results.push({
        decision: 'keep-local',
        winner: 'local',
        reason: 'Record does not exist in cloud',
        shouldPushToCloud: true,
        shouldUpdateLocal: false,
        mergedRecord: local,
      });
    } else {
      // Both exist - run LWW merge
      results.push(lwwMerge(local, cloud));
    }
  }

  // Check for cloud records that don't exist locally
  const localMap = new Map(localRecords.map((r) => [r.id, r]));
  for (const cloud of cloudRecords) {
    if (!localMap.has(cloud.id)) {
      results.push({
        decision: 'take-cloud',
        winner: 'cloud',
        reason: 'Record does not exist locally',
        shouldPushToCloud: false,
        shouldUpdateLocal: true,
        mergedRecord: {
          ...cloud,
          last_synced_at: Date.now(),
        },
      });
    }
  }

  return results;
}

/**
 * Get merge statistics from batch results
 *
 * @param results - Array of merge results
 * @returns Statistics about merge operations
 */
export function getMergeStats(results: MergeResult[]): {
  total: number;
  localWins: number;
  cloudWins: number;
  conflicts: number;
  noChange: number;
  pushToCloud: number;
  updateLocal: number;
} {
  return {
    total: results.length,
    localWins: results.filter((r) => r.winner === 'local').length,
    cloudWins: results.filter((r) => r.winner === 'cloud').length,
    conflicts: results.filter((r) => r.decision === 'conflict-detected').length,
    noChange: results.filter((r) => r.winner === null).length,
    pushToCloud: results.filter((r) => r.shouldPushToCloud).length,
    updateLocal: results.filter((r) => r.shouldUpdateLocal).length,
  };
}

/**
 * Simple hash function for content comparison
 * (Not cryptographic, just for quick equality check)
 *
 * @param content - String content to hash
 * @returns Base36 hash string
 */
export function simpleHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Calculate hash for a record's content fields
 *
 * @param record - Record to hash
 * @param fields - Fields to include in hash (default: all except metadata)
 * @returns Hash string
 */
export function hashRecord(record: any, fields?: string[]): string {
  const fieldsToHash =
    fields ||
    Object.keys(record).filter(
      (key) =>
        ![
          'id',
          'created_at',
          'updated_at',
          'deleted_at',
          'client_rev',
          'client_hash',
          'last_synced_at',
        ].includes(key),
    );

  const content = fieldsToHash
    .sort() // Consistent ordering
    .map((key) => {
      const value = record[key];
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
    })
    .join('|');

  return simpleHash(content);
}
