#!/usr/bin/env node
/**
 * Generate Bundle Size Badge Data
 *
 * Reads the bundle size JSON report and generates badge-compatible output
 *
 * Usage:
 *   node scripts/generate-bundle-badge.mjs reports/bundle-size.json
 */

import { readFile } from 'fs/promises';

async function generateBadgeData() {
  const reportPath = process.argv[2] || 'reports/bundle-size.json';

  try {
    const json = await readFile(reportPath, 'utf-8');
    const report = JSON.parse(json);

    const totalKB = report.summary.totalSize;
    const status = report.summary.hasErrors ? 'red' : report.summary.hasWarnings ? 'yellow' : 'brightgreen';

    // Output badge markdown
    console.log(`![Bundle Size](https://img.shields.io/badge/bundle--size-${totalKB}KB-${status})`);
  } catch (error) {
    console.error('Failed to generate badge data:', error.message);
    process.exit(1);
  }
}

generateBadgeData();
