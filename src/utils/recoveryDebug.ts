/**
 * Recovery Debug Utilities
 *
 * Helper functions for testing and inspecting recovery behavior in browser console.
 * Usage: Open DevTools console and call window.Inkwell.recovery.* functions.
 */

/* eslint-disable no-console */

import { recoveryService } from '@/services/recoveryService';

/**
 * Inspect current recovery state and shadow copy
 */
export function inspectRecovery() {
  console.group('🛡️ Recovery System Status');

  // Check shadow copy
  const shadowCopy = localStorage.getItem('inkwell_shadow_copy');
  if (shadowCopy) {
    try {
      const parsed = JSON.parse(shadowCopy);
      const ageMs = Date.now() - parsed.timestamp;
      const ageDays = (ageMs / (24 * 60 * 60 * 1000)).toFixed(1);

      console.log('Shadow Copy:', {
        exists: true,
        age: `${ageDays} days`,
        tooOld: ageMs > 7 * 24 * 60 * 60 * 1000,
        projects: parsed.projects?.length ?? 0,
        chapters: parsed.chapters?.length ?? 0,
        version: parsed.version,
        timestamp: new Date(parsed.timestamp).toISOString(),
      });
    } catch {
      console.warn('Shadow copy exists but is malformed');
    }
  } else {
    console.log('Shadow Copy: None');
  }

  // Check IndexedDB health
  console.log('IndexedDB: Will check on next recovery attempt');

  // Check Supabase auth
  const hasAuth = localStorage.getItem('hasAuthSession') === 'true';
  console.log('Supabase Auth:', hasAuth ? '✅ Authenticated' : '⚠️ Not authenticated');

  console.groupEnd();
}

/**
 * Simulate recovery scenarios for testing
 */
export function simulate(scenario: 'tier1' | 'tier2' | 'tier3' | 'all-fail') {
  console.group(`🧪 Simulating Recovery: ${scenario}`);

  switch (scenario) {
    case 'tier1':
      console.log('✅ Tier 1 (Supabase) - Set up for success');
      console.log('Actions:');
      console.log('  1. Ensure you are logged in');
      console.log('  2. Delete IndexedDB chapter data');
      console.log('  3. Navigate to Editor panel');
      console.log('Expected: Recovery from Supabase cloud backup');
      break;

    case 'tier2':
      console.log('✅ Tier 2 (localStorage shadow) - Set up for success');
      console.log('Actions:');
      console.log('  1. Set Network to Offline (DevTools → Network → Offline)');
      console.log('  2. Delete IndexedDB chapter data');
      console.log('  3. Navigate to Dashboard panel');
      console.log('Expected: Recovery from localStorage shadow copy');
      break;

    case 'tier3':
      console.log('✅ Tier 3 (User Upload) - Set up for success');
      console.log('Actions:');
      console.log('  1. Clear shadow copy: localStorage.removeItem("inkwell_shadow_copy")');
      console.log('  2. Set Network to Offline');
      console.log('  3. Delete all IndexedDB data');
      console.log('  4. Navigate to any protected panel');
      console.log('Expected: Prompt for manual backup file upload');
      break;

    case 'all-fail':
      console.log('⚠️ All Tiers Fail - Worst case scenario');
      console.log('Actions:');
      console.log('  1. localStorage.removeItem("inkwell_shadow_copy")');
      console.log('  2. Set Network to Offline');
      console.log('  3. Delete all IndexedDB data');
      console.log('Expected: User prompted for manual upload, no auto-recovery');
      break;
  }

  console.groupEnd();
}

/**
 * Force a test recovery attempt (requires user to trigger error)
 */
export async function testRecovery() {
  console.log('🧪 Starting test recovery...');

  try {
    const result = await recoveryService.attemptRecovery({
      attemptSupabase: true,
      attemptLocalStorage: true,
      requireUserUpload: false,
    });

    console.group('✅ Recovery Test Complete');
    console.log('Success:', result.success);
    console.log('Tier Used:', result.tier);
    console.log('Projects Recovered:', result.recoveredProjects);
    console.log('Chapters Recovered:', result.recoveredChapters);
    if (result.message) console.log('Message:', result.message);
    if (result.error) console.warn('Error:', result.error);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error('❌ Recovery test failed:', error);
    throw error;
  }
}

/**
 * Check shadow copy age and validity
 */
export function checkShadowCopy() {
  const shadowCopy = localStorage.getItem('inkwell_shadow_copy');

  if (!shadowCopy) {
    console.log('❌ No shadow copy found');
    return null;
  }

  try {
    const parsed = JSON.parse(shadowCopy);
    const ageMs = Date.now() - parsed.timestamp;
    const ageHours = (ageMs / (60 * 60 * 1000)).toFixed(1);
    const ageDays = (ageMs / (24 * 60 * 60 * 1000)).toFixed(1);
    const tooOld = ageMs > 7 * 24 * 60 * 60 * 1000;

    const status = {
      valid: !tooOld,
      age: `${ageHours}h (${ageDays} days)`,
      timestamp: new Date(parsed.timestamp).toISOString(),
      projects: parsed.projects?.length ?? 0,
      chapters: parsed.chapters?.length ?? 0,
      version: parsed.version,
      size: `${(shadowCopy.length / 1024).toFixed(1)} KB`,
      warning: tooOld ? '⚠️ Shadow copy is too old (>7 days), will be rejected' : undefined,
    };

    console.table(status);
    return status;
  } catch (error) {
    console.error('❌ Shadow copy is malformed:', error);
    return null;
  }
}

/**
 * Manually age shadow copy for testing
 */
export function ageShadowCopy(days: number) {
  const shadowCopy = localStorage.getItem('inkwell_shadow_copy');

  if (!shadowCopy) {
    console.warn('❌ No shadow copy to age');
    return;
  }

  try {
    const parsed = JSON.parse(shadowCopy);
    parsed.timestamp = Date.now() - days * 24 * 60 * 60 * 1000;
    localStorage.setItem('inkwell_shadow_copy', JSON.stringify(parsed));
    console.log(`✅ Shadow copy aged by ${days} days`);
    checkShadowCopy();
  } catch (error) {
    console.error('❌ Failed to age shadow copy:', error);
  }
}

/**
 * Clear shadow copy for testing
 */
export function clearShadowCopy() {
  localStorage.removeItem('inkwell_shadow_copy');
  console.log('✅ Shadow copy cleared');
}

// Expose globally for console access
if (typeof window !== 'undefined') {
  (window as any).Inkwell = {
    ...(window as any).Inkwell,
    recovery: {
      inspect: inspectRecovery,
      simulate,
      test: testRecovery,
      checkShadow: checkShadowCopy,
      ageShadow: ageShadowCopy,
      clearShadow: clearShadowCopy,
    },
  };

  console.log('✅ Inkwell recovery debug utilities loaded');
  console.log('Try: window.Inkwell.recovery.inspect()');
}
