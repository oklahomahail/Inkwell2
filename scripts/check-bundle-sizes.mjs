#!/usr/bin/env node
/**
 * Bundle Size Checker
 *
 * Compares current bundle sizes against baseline thresholds.
 * Fails CI if any chunk exceeds error threshold (+10%).
 * Warns if any chunk exceeds warn threshold (+5%).
 *
 * Usage:
 *   npm run build && node scripts/check-bundle-sizes.mjs
 *
 * Exit codes:
 *   0 - All bundles within limits
 *   1 - One or more bundles exceed error threshold
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

const DIST_DIR = 'dist/assets';
const BASELINE_FILE = 'bundle-baseline.json';

/**
 * Get file size in KB
 */
async function getFileSizeKB(filePath) {
  const stats = await stat(filePath);
  return Math.round(stats.size / 1024);
}

/**
 * Load baseline thresholds
 */
async function loadBaseline() {
  try {
    const json = await readFile(BASELINE_FILE, 'utf-8');
    return JSON.parse(json);
  } catch (error) {
    console.error(`❌ Failed to load baseline file: ${BASELINE_FILE}`);
    console.error('   Run: node scripts/generate-bundle-baseline.mjs');
    process.exit(1);
  }
}

/**
 * Scan current bundle sizes
 */
async function scanCurrentSizes() {
  const files = await readdir(DIST_DIR);
  const bundles = {};

  for (const file of files) {
    if (file.endsWith('.js') && !file.endsWith('.map')) {
      const filePath = join(DIST_DIR, file);
      const sizeKB = await getFileSizeKB(filePath);
      bundles[file] = sizeKB;
    }
  }

  return bundles;
}

/**
 * Extract chunk name pattern (remove hash) for matching
 * Examples:
 *   index-CbLRcMAx.js -> index-*.js
 *   chunk-CuWcKfTH.js -> chunk-*.js
 */
function getChunkPattern(filename) {
  return filename.replace(/-[a-zA-Z0-9_]+\.js$/, '-*.js');
}

/**
 * Find matching baseline entry for a bundle file
 * Matches by pattern (e.g., index-*.js matches index-CbLRcMAx.js)
 */
function findBaselineMatch(filename, baseline) {
  // First try exact match
  if (baseline[filename]) {
    return baseline[filename];
  }

  // Then try pattern match
  const pattern = getChunkPattern(filename);
  for (const [key, value] of Object.entries(baseline)) {
    if (getChunkPattern(key) === pattern) {
      return value;
    }
  }

  return null;
}

/**
 * Check bundle sizes against baseline
 */
async function checkBundleSizes() {
  console.log('📊 Checking bundle sizes...\n');

  const baseline = await loadBaseline();
  const current = await scanCurrentSizes();

  let hasErrors = false;
  let hasWarnings = false;

  const results = [];

  // Check each current bundle against baseline
  for (const [file, currentSize] of Object.entries(current)) {
    const baselineEntry = findBaselineMatch(file, baseline);

    if (!baselineEntry) {
      results.push({
        file,
        currentSize,
        status: 'new',
        message: '🆕 New bundle (not in baseline)',
      });
      continue;
    }

    const { baseline: baselineSize, warn: warnThreshold, error: errorThreshold } = baselineEntry;
    const diff = currentSize - baselineSize;
    const diffPercent = Math.round((diff / baselineSize) * 100);

    if (currentSize > errorThreshold) {
      hasErrors = true;
      results.push({
        file,
        currentSize,
        baselineSize,
        diff,
        diffPercent,
        status: 'error',
        message: `❌ ERROR: ${currentSize} KB > ${errorThreshold} KB (+${diffPercent}%)`,
      });
    } else if (currentSize > warnThreshold) {
      hasWarnings = true;
      results.push({
        file,
        currentSize,
        baselineSize,
        diff,
        diffPercent,
        status: 'warn',
        message: `⚠️  WARN: ${currentSize} KB > ${warnThreshold} KB (+${diffPercent}%)`,
      });
    } else if (diff > 0) {
      results.push({
        file,
        currentSize,
        baselineSize,
        diff,
        diffPercent,
        status: 'ok-increased',
        message: `✅ OK: ${currentSize} KB (baseline: ${baselineSize} KB, +${diffPercent}%)`,
      });
    } else if (diff < 0) {
      results.push({
        file,
        currentSize,
        baselineSize,
        diff,
        diffPercent,
        status: 'ok-decreased',
        message: `✅ OK: ${currentSize} KB (baseline: ${baselineSize} KB, ${diffPercent}%)`,
      });
    } else {
      results.push({
        file,
        currentSize,
        status: 'ok-unchanged',
        message: `✅ OK: ${currentSize} KB (unchanged)`,
      });
    }
  }

  // Check for removed bundles
  for (const baselineFile of Object.keys(baseline)) {
    const found = Object.keys(current).some((currentFile) => {
      return currentFile === baselineFile || getChunkPattern(currentFile) === getChunkPattern(baselineFile);
    });

    if (!found) {
      results.push({
        file: baselineFile,
        status: 'removed',
        message: '🗑️  Removed (not in current build)',
      });
    }
  }

  // Sort results: errors first, then warns, then OK, then new/removed
  const statusOrder = { error: 0, warn: 1, 'ok-increased': 2, 'ok-unchanged': 3, 'ok-decreased': 4, new: 5, removed: 6 };
  results.sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 99;
    const orderB = statusOrder[b.status] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    // Within same status, sort by size (largest first)
    return (b.currentSize ?? 0) - (a.currentSize ?? 0);
  });

  // Print results
  for (const result of results) {
    console.log(`  ${result.file.padEnd(45)} ${result.message}`);
  }

  console.log('');

  // Summary
  if (hasErrors) {
    console.log('❌ Bundle size check FAILED');
    console.log('   One or more bundles exceed error threshold (+10%)');
    console.log('   Please optimize bundle size or update baseline');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Bundle size check PASSED with warnings');
    console.log('   Some bundles exceed warn threshold (+5%)');
    console.log('   Consider optimizing or updating baseline');
    process.exit(0);
  } else {
    console.log('✅ Bundle size check PASSED');
    console.log('   All bundles within thresholds');
    process.exit(0);
  }
}

// Run
checkBundleSizes().catch((error) => {
  console.error('❌ Bundle size check failed:', error);
  process.exit(1);
});
