#!/usr/bin/env node
/**
 * Generate Bundle Baseline
 *
 * Creates bundle-baseline.json from current build output.
 * Run this after a successful build to establish size thresholds.
 *
 * Usage:
 *   npm run build && node scripts/generate-bundle-baseline.mjs
 */

import { readdir, stat, writeFile } from 'fs/promises';
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
 * Scan dist/assets directory and extract bundle sizes
 */
async function scanBundleSizes() {
  const files = await readdir(DIST_DIR);
  const bundles = {};

  for (const file of files) {
    // Only track .js files (skip .map files and CSS)
    if (file.endsWith('.js') && !file.endsWith('.map')) {
      const filePath = join(DIST_DIR, file);
      const sizeKB = await getFileSizeKB(filePath);

      // Use full filename as key (with .js extension for clarity)
      bundles[file] = sizeKB;
    }
  }

  return bundles;
}

/**
 * Generate baseline with warn/error thresholds
 */
async function generateBaseline() {
  console.log('📊 Scanning bundle sizes...\n');

  const bundles = await scanBundleSizes();
  const baseline = {};

  // Sort by size (largest first) for readable output
  const sortedEntries = Object.entries(bundles).sort((a, b) => b[1] - a[1]);

  for (const [chunk, sizeKB] of sortedEntries) {
    // Set thresholds: +5% warn, +10% error
    const warnKB = Math.ceil(sizeKB * 1.05);
    const errorKB = Math.ceil(sizeKB * 1.10);

    baseline[chunk] = {
      baseline: sizeKB,
      warn: warnKB,
      error: errorKB,
    };

    console.log(`  ${chunk.padEnd(40)} ${String(sizeKB).padStart(6)} KB  (warn: ${warnKB} KB, error: ${errorKB} KB)`);
  }

  // Write baseline file
  const json = JSON.stringify(baseline, null, 2);
  await writeFile(BASELINE_FILE, json, 'utf-8');

  console.log(`\n✅ Baseline saved to ${BASELINE_FILE}`);
  console.log(`   Total chunks: ${Object.keys(baseline).length}`);
  console.log(`   Largest chunk: ${sortedEntries[0][0]} (${sortedEntries[0][1]} KB)`);
  console.log(`\nThresholds: +5% warn, +10% error`);
}

// Run
generateBaseline().catch((error) => {
  console.error('❌ Failed to generate baseline:', error);
  process.exit(1);
});
