/**
 * Proof of Concept: Last Write Wins (LWW) Merge Engine
 *
 * Tests conflict resolution logic for always-on cloud sync.
 * This POC validates that LWW is deterministic and handles edge cases correctly.
 *
 * Run with: npx tsx docs/sync/poc-suite/01-lww-merge-poc.ts
 */

interface SyncRecord {
  id: string;
  content: string;
  updated_at: number; // Server timestamp (Supabase)
  client_hash?: string; // Optional content hash
}

interface LocalRecord extends SyncRecord {
  last_synced_at: number; // Last time we saw this record from cloud
  local_updated_at: number; // Client-side timestamp (unreliable clock)
}

interface CloudRecord extends SyncRecord {}

type MergeDecision = 'keep-local' | 'take-cloud' | 'conflict-detected';

interface MergeResult {
  decision: MergeDecision;
  winner: 'local' | 'cloud' | null;
  reason: string;
  shouldPushToCloud: boolean;
  shouldUpdateLocal: boolean;
}

/**
 * LWW Merge Engine
 *
 * Rules:
 * 1. Server timestamp is authoritative (Postgres TIMESTAMPTZ)
 * 2. If cloud.updated_at > local.updated_at → cloud wins
 * 3. If local.updated_at > cloud.updated_at → local wins (push to cloud)
 * 4. If timestamps equal but hashes differ → conflict (should be rare)
 * 5. If local has never been synced → push to cloud
 */
function lwwMerge(local: LocalRecord, cloud: CloudRecord): MergeResult {
  // Case 1: Local has never been synced (new local record)
  if (local.last_synced_at === 0) {
    return {
      decision: 'keep-local',
      winner: 'local',
      reason: 'Local record never synced - push to cloud',
      shouldPushToCloud: true,
      shouldUpdateLocal: false,
    };
  }

  // Case 2: Cloud record is newer than local
  if (cloud.updated_at > local.updated_at) {
    return {
      decision: 'take-cloud',
      winner: 'cloud',
      reason: `Cloud is newer (cloud: ${cloud.updated_at}, local: ${local.updated_at})`,
      shouldPushToCloud: false,
      shouldUpdateLocal: true,
    };
  }

  // Case 3: Local record is newer than cloud
  if (local.updated_at > cloud.updated_at) {
    return {
      decision: 'keep-local',
      winner: 'local',
      reason: `Local is newer (local: ${local.updated_at}, cloud: ${cloud.updated_at})`,
      shouldPushToCloud: true,
      shouldUpdateLocal: false,
    };
  }

  // Case 4: Timestamps are equal
  // This should be very rare since Postgres uses microsecond precision
  // Use content hash as tiebreaker
  if (local.client_hash && cloud.client_hash) {
    if (local.client_hash === cloud.client_hash) {
      return {
        decision: 'keep-local',
        winner: null,
        reason: 'Timestamps and hashes match - no action needed',
        shouldPushToCloud: false,
        shouldUpdateLocal: false,
      };
    } else {
      return {
        decision: 'conflict-detected',
        winner: null,
        reason: 'Timestamps equal but content differs - rare conflict',
        shouldPushToCloud: false,
        shouldUpdateLocal: false,
      };
    }
  }

  // Fallback: No hash available, timestamps equal, assume in sync
  return {
    decision: 'keep-local',
    winner: null,
    reason: 'Timestamps equal, assuming in sync',
    shouldPushToCloud: false,
    shouldUpdateLocal: false,
  };
}

/**
 * Simple hash function for content (not cryptographic)
 */
function simpleHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Test Suite
 */
function runTests() {
  console.log('🧪 LWW Merge Engine POC - Test Suite\n');

  let passed = 0;
  let failed = 0;

  function test(
    name: string,
    local: LocalRecord,
    cloud: CloudRecord,
    expectedDecision: MergeDecision,
    expectedWinner: 'local' | 'cloud' | null,
  ) {
    const result = lwwMerge(local, cloud);
    const success = result.decision === expectedDecision && result.winner === expectedWinner;

    if (success) {
      console.log(`✅ ${name}`);
      console.log(`   Decision: ${result.decision}, Winner: ${result.winner || 'none'}`);
      console.log(`   Reason: ${result.reason}\n`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      console.log(`   Expected: ${expectedDecision} / ${expectedWinner}`);
      console.log(`   Got: ${result.decision} / ${result.winner || 'none'}`);
      console.log(`   Reason: ${result.reason}\n`);
      failed++;
    }
  }

  // Test 1: Cloud is newer
  test(
    'Test 1: Cloud updated more recently than local',
    {
      id: 'chapter-1',
      content: 'Old content',
      updated_at: 1000,
      local_updated_at: 1000,
      last_synced_at: 1000,
      client_hash: simpleHash('Old content'),
    },
    {
      id: 'chapter-1',
      content: 'New content from cloud',
      updated_at: 2000,
      client_hash: simpleHash('New content from cloud'),
    },
    'take-cloud',
    'cloud',
  );

  // Test 2: Local is newer
  test(
    'Test 2: Local updated more recently than cloud',
    {
      id: 'chapter-1',
      content: 'Fresh local edits',
      updated_at: 3000,
      local_updated_at: 3000,
      last_synced_at: 2000,
      client_hash: simpleHash('Fresh local edits'),
    },
    {
      id: 'chapter-1',
      content: 'Stale cloud content',
      updated_at: 2000,
      client_hash: simpleHash('Stale cloud content'),
    },
    'keep-local',
    'local',
  );

  // Test 3: Never synced before (new local record)
  test(
    'Test 3: New local record never pushed to cloud',
    {
      id: 'chapter-2',
      content: 'Brand new chapter',
      updated_at: 5000,
      local_updated_at: 5000,
      last_synced_at: 0, // Never synced
      client_hash: simpleHash('Brand new chapter'),
    },
    {
      id: 'chapter-2',
      content: '', // Empty cloud record (shouldn't exist but testing edge case)
      updated_at: 0,
      client_hash: '',
    },
    'keep-local',
    'local',
  );

  // Test 4: Timestamps equal, content matches
  test(
    'Test 4: Timestamps and content are identical (already in sync)',
    {
      id: 'chapter-3',
      content: 'Synced content',
      updated_at: 10000,
      local_updated_at: 10000,
      last_synced_at: 10000,
      client_hash: simpleHash('Synced content'),
    },
    {
      id: 'chapter-3',
      content: 'Synced content',
      updated_at: 10000,
      client_hash: simpleHash('Synced content'),
    },
    'keep-local',
    null,
  );

  // Test 5: Timestamps equal, content differs (rare conflict)
  test(
    'Test 5: Timestamps equal but content differs (conflict)',
    {
      id: 'chapter-4',
      content: 'Local version',
      updated_at: 15000,
      local_updated_at: 15000,
      last_synced_at: 14000,
      client_hash: simpleHash('Local version'),
    },
    {
      id: 'chapter-4',
      content: 'Cloud version',
      updated_at: 15000,
      client_hash: simpleHash('Cloud version'),
    },
    'conflict-detected',
    null,
  );

  // Test 6: Cloud record deleted (soft delete scenario)
  test(
    'Test 6: Local has content but cloud shows older empty state',
    {
      id: 'chapter-5',
      content: 'User is actively writing',
      updated_at: 20000,
      local_updated_at: 20000,
      last_synced_at: 18000,
      client_hash: simpleHash('User is actively writing'),
    },
    {
      id: 'chapter-5',
      content: '',
      updated_at: 18000,
      client_hash: simpleHash(''),
    },
    'keep-local',
    'local',
  );

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  return failed === 0;
}

/**
 * Edge Case Tests
 */
function runEdgeCaseTests() {
  console.log('\n🔬 Edge Case Tests\n');

  let passed = 0;
  let failed = 0;

  function testEdgeCase(name: string, testFn: () => boolean) {
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error}`);
      failed++;
    }
  }

  testEdgeCase('Large content (10MB chapter)', () => {
    const largeContent = 'a'.repeat(10 * 1024 * 1024);
    const hash = simpleHash(largeContent);
    return hash.length > 0;
  });

  testEdgeCase('Unicode content (emoji, Chinese)', () => {
    const unicodeContent = '测试内容 🚀 with emoji and 中文';
    const hash = simpleHash(unicodeContent);
    const local: LocalRecord = {
      id: 'test',
      content: unicodeContent,
      updated_at: 1000,
      local_updated_at: 1000,
      last_synced_at: 1000,
      client_hash: hash,
    };
    const cloud: CloudRecord = {
      id: 'test',
      content: unicodeContent,
      updated_at: 1000,
      client_hash: hash,
    };
    const result = lwwMerge(local, cloud);
    return result.decision === 'keep-local';
  });

  testEdgeCase('Clock skew (local clock 1 hour ahead)', () => {
    const now = Date.now();
    const local: LocalRecord = {
      id: 'test',
      content: 'Local content',
      updated_at: now - 3600000, // Local thinks it's 1 hour ago
      local_updated_at: now, // But local clock is ahead
      last_synced_at: now - 7200000,
      client_hash: simpleHash('Local content'),
    };
    const cloud: CloudRecord = {
      id: 'test',
      content: 'Cloud content',
      updated_at: now, // Server time is correct
      client_hash: simpleHash('Cloud content'),
    };
    const result = lwwMerge(local, cloud);
    // Cloud should win because server timestamp is authoritative
    return result.winner === 'cloud';
  });

  testEdgeCase('Rapid updates (100ms apart)', () => {
    const base = Date.now();
    const local: LocalRecord = {
      id: 'test',
      content: 'Version 1',
      updated_at: base,
      local_updated_at: base,
      last_synced_at: base - 1000,
      client_hash: simpleHash('Version 1'),
    };
    const cloud: CloudRecord = {
      id: 'test',
      content: 'Version 2',
      updated_at: base + 100, // 100ms newer
      client_hash: simpleHash('Version 2'),
    };
    const result = lwwMerge(local, cloud);
    return result.winner === 'cloud';
  });

  console.log('\n' + '='.repeat(50));
  console.log(`Edge Cases: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  return failed === 0;
}

/**
 * Performance Tests
 */
function runPerformanceTests() {
  console.log('\n⚡ Performance Tests\n');

  function perfTest(name: string, iterations: number, testFn: () => void) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      testFn();
    }
    const end = performance.now();
    const totalMs = end - start;
    const avgMs = totalMs / iterations;
    console.log(
      `${name}: ${avgMs.toFixed(3)}ms avg (${iterations} iterations, ${totalMs.toFixed(1)}ms total)`,
    );
  }

  const testLocal: LocalRecord = {
    id: 'perf-test',
    content: 'Test content for performance',
    updated_at: 1000,
    local_updated_at: 1000,
    last_synced_at: 1000,
    client_hash: simpleHash('Test content for performance'),
  };

  const testCloud: CloudRecord = {
    id: 'perf-test',
    content: 'Test content for performance',
    updated_at: 2000,
    client_hash: simpleHash('Test content for performance'),
  };

  perfTest('LWW merge decision', 10000, () => {
    lwwMerge(testLocal, testCloud);
  });

  perfTest('Content hashing (small)', 10000, () => {
    simpleHash('This is a small test string');
  });

  perfTest('Content hashing (medium - 10KB)', 1000, () => {
    simpleHash('x'.repeat(10 * 1024));
  });

  perfTest('Content hashing (large - 1MB)', 100, () => {
    simpleHash('x'.repeat(1024 * 1024));
  });
}

/**
 * Main execution
 */
function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   LWW Merge Engine - Proof of Concept         ║');
  console.log('║   Inkwell Cloud Sync - Pre-Implementation     ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const testsPassed = runTests();
  const edgeTestsPassed = runEdgeCaseTests();
  runPerformanceTests();

  console.log('\n' + '='.repeat(50));
  if (testsPassed && edgeTestsPassed) {
    console.log('✅ All tests passed - LWW merge engine is ready');
  } else {
    console.log('❌ Some tests failed - review implementation');
  }
  console.log('='.repeat(50) + '\n');

  process.exit(testsPassed && edgeTestsPassed ? 0 : 1);
}

main();
