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
 *   npm run build && node scripts/check-bundle-sizes.mjs --output-json reports/bundle-size.json
 *   npm run build && node scripts/check-bundle-sizes.mjs --output-html reports/bundle-size.html
 *
 * Exit codes:
 *   0 - All bundles within limits
 *   1 - One or more bundles exceed error threshold
 */

import { readFile, readdir, stat, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

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
 * Generate HTML report
 */
function generateHTMLReport(results, baseline, current, hasErrors, hasWarnings) {
  const totalSize = Object.values(current).reduce((sum, size) => sum + size, 0);
  const timestamp = new Date().toISOString();

  const statusColors = {
    error: '#dc2626',
    warn: '#f59e0b',
    'ok-increased': '#10b981',
    'ok-unchanged': '#10b981',
    'ok-decreased': '#10b981',
    new: '#3b82f6',
    removed: '#6b7280',
  };

  const rows = results
    .map(
      (r) => `
      <tr style="background-color: ${r.status.startsWith('ok') ? '#f0fdf4' : r.status === 'error' ? '#fef2f2' : r.status === 'warn' ? '#fffbeb' : '#fff'}">
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${r.file}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${r.currentSize ?? '-'} KB</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${r.baselineSize ?? '-'} KB</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${r.diff && r.diff > 0 ? '#dc2626' : r.diff && r.diff < 0 ? '#10b981' : '#6b7280'}">
          ${r.diff !== undefined ? (r.diff > 0 ? '+' : '') + r.diff + ' KB' : '-'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${r.diffPercent && r.diffPercent > 0 ? '#dc2626' : r.diffPercent && r.diffPercent < 0 ? '#10b981' : '#6b7280'}">
          ${r.diffPercent !== undefined ? (r.diffPercent > 0 ? '+' : '') + r.diffPercent + '%' : '-'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: ${statusColors[r.status]}20; color: ${statusColors[r.status]}">
            ${r.status.toUpperCase()}
          </span>
        </td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle Size Report - Inkwell</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f9fafb; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { margin: 0 0 8px; color: #111827; }
    .meta { color: #6b7280; margin-bottom: 32px; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .summary-card { padding: 20px; border-radius: 8px; background: #f9fafb; border: 1px solid #e5e7eb; }
    .summary-card h3 { margin: 0 0 8px; font-size: 14px; color: #6b7280; font-weight: 500; }
    .summary-card .value { font-size: 32px; font-weight: 700; color: #111827; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
    .status-badge.success { background: #d1fae5; color: #065f46; }
    .status-badge.warning { background: #fef3c7; color: #92400e; }
    .status-badge.error { background: #fee2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    th.right { text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Bundle Size Report</h1>
    <div class="meta">Generated: ${timestamp}</div>

    <div class="summary">
      <div class="summary-card">
        <h3>Total Size</h3>
        <div class="value">${totalSize} KB</div>
      </div>
      <div class="summary-card">
        <h3>Bundles Tracked</h3>
        <div class="value">${Object.keys(current).length}</div>
      </div>
      <div class="summary-card">
        <h3>Status</h3>
        <div class="value" style="font-size: 24px; color: ${hasErrors ? '#dc2626' : hasWarnings ? '#f59e0b' : '#10b981'}">
          ${hasErrors ? '❌ Failed' : hasWarnings ? '⚠️ Warning' : '✅ Passed'}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Bundle</th>
          <th class="right">Current</th>
          <th class="right">Baseline</th>
          <th class="right">Diff (KB)</th>
          <th class="right">Diff (%)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
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

  // Generate JSON report if requested
  const args = process.argv.slice(2);
  const jsonIndex = args.indexOf('--output-json');
  const htmlIndex = args.indexOf('--output-html');

  if (jsonIndex !== -1 && args[jsonIndex + 1]) {
    const jsonPath = args[jsonIndex + 1];
    const totalSize = Object.values(current).reduce((sum, size) => sum + size, 0);

    const jsonReport = {
      timestamp: new Date().toISOString(),
      status: hasErrors ? 'failed' : hasWarnings ? 'warning' : 'passed',
      summary: {
        totalSize,
        bundleCount: Object.keys(current).length,
        hasErrors,
        hasWarnings,
      },
      bundles: results.map((r) => ({
        file: r.file,
        currentSize: r.currentSize,
        baselineSize: r.baselineSize,
        diff: r.diff,
        diffPercent: r.diffPercent,
        status: r.status,
      })),
    };

    await mkdir(dirname(jsonPath), { recursive: true });
    await writeFile(jsonPath, JSON.stringify(jsonReport, null, 2));
    console.log(`📄 JSON report saved to: ${jsonPath}`);
  }

  // Generate HTML report if requested
  if (htmlIndex !== -1 && args[htmlIndex + 1]) {
    const htmlPath = args[htmlIndex + 1];
    const html = generateHTMLReport(results, baseline, current, hasErrors, hasWarnings);

    await mkdir(dirname(htmlPath), { recursive: true });
    await writeFile(htmlPath, html);
    console.log(`📄 HTML report saved to: ${htmlPath}`);
  }

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
