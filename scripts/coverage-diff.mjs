#!/usr/bin/env node
/**
 * Coverage Diff Report Generator
 *
 * Compares current coverage with baseline and generates a delta report.
 * Usage: node scripts/coverage-diff.mjs [baseline-file]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Paths
const CURRENT_SUMMARY = path.join(ROOT, 'coverage/coverage-summary.json');
const BASELINE_FILE = process.argv[2] || path.join(ROOT, 'coverage-baseline.json');
const OUTPUT_FILE = path.join(ROOT, 'COVERAGE_WEEKLY_REPORT.md');

/**
 * Load JSON file safely
 */
function loadJSON(filepath) {
  try {
    if (!fs.existsSync(filepath)) {
      return null;
    }
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filepath}:`, error.message);
    return null;
  }
}

/**
 * Calculate percentage change
 */
function calcDelta(current, baseline) {
  if (!baseline) return { delta: current, symbol: '🆕', color: '🟢' };
  const delta = current - baseline;
  const symbol = delta > 0 ? '▲' : delta < 0 ? '▼' : '━';
  const color =
    delta > 2 ? '🟢' : delta > 0 ? '🟡' : delta < -2 ? '🔴' : delta < 0 ? '🟠' : '⚪';
  return { delta: Math.abs(delta).toFixed(2), symbol, color, change: delta };
}

/**
 * Format coverage percentage
 */
function fmt(pct) {
  return pct?.toFixed(2) || '0.00';
}

/**
 * Generate markdown report
 */
function generateReport(current, baseline) {
  const now = new Date().toISOString().split('T')[0];
  const currentTotal = current?.total;
  const baselineTotal = baseline?.total;

  if (!currentTotal) {
    return '# Coverage Report\n\n❌ No current coverage data found.\n';
  }

  // Calculate deltas for total coverage
  const linesDelta = calcDelta(currentTotal.lines.pct, baselineTotal?.lines?.pct);
  const branchesDelta = calcDelta(currentTotal.branches.pct, baselineTotal?.branches?.pct);
  const functionsDelta = calcDelta(currentTotal.functions.pct, baselineTotal?.functions?.pct);
  const statementsDelta = calcDelta(currentTotal.statements.pct, baselineTotal?.statements?.pct);

  let report = `# Coverage Weekly Report

**Generated:** ${now}
**Baseline:** ${baseline ? 'Previous snapshot' : 'No baseline (first run)'}

---

## Overall Coverage

| Metric | Current | Baseline | Change | Status |
|--------|---------|----------|--------|--------|
| **Lines** | ${fmt(currentTotal.lines.pct)}% | ${fmt(baselineTotal?.lines?.pct)}% | ${linesDelta.symbol} ${linesDelta.delta}% | ${linesDelta.color} |
| **Branches** | ${fmt(currentTotal.branches.pct)}% | ${fmt(baselineTotal?.branches?.pct)}% | ${branchesDelta.symbol} ${branchesDelta.delta}% | ${branchesDelta.color} |
| **Functions** | ${fmt(currentTotal.functions.pct)}% | ${fmt(baselineTotal?.functions?.pct)}% | ${functionsDelta.symbol} ${functionsDelta.delta}% | ${functionsDelta.color} |
| **Statements** | ${fmt(currentTotal.statements.pct)}% | ${fmt(baselineTotal?.statements?.pct)}% | ${statementsDelta.symbol} ${statementsDelta.delta}% | ${statementsDelta.color} |

`;

  // Summary
  const totalChange =
    (linesDelta.change || 0) +
    (branchesDelta.change || 0) +
    (functionsDelta.change || 0) +
    (statementsDelta.change || 0);

  if (totalChange > 2) {
    report += `### 🎉 Coverage Improved!\n\nOverall coverage increased by **${totalChange.toFixed(2)}%** across all metrics.\n\n`;
  } else if (totalChange < -2) {
    report += `### ⚠️ Coverage Decreased\n\nOverall coverage decreased by **${Math.abs(totalChange).toFixed(2)}%**. Please add tests for new code.\n\n`;
  } else {
    report += `### ✅ Coverage Stable\n\nCoverage remained stable (${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%).\n\n`;
  }

  report += `---

## File-Level Changes

Top 10 files with significant changes:\n\n`;

  // Calculate file-level deltas
  const fileDeltas = [];
  for (const [filepath, currentCov] of Object.entries(current)) {
    if (filepath === 'total') continue;

    const baselineCov = baseline?.[filepath];
    const lineChange = currentCov.lines.pct - (baselineCov?.lines?.pct || 0);

    if (Math.abs(lineChange) > 1) {
      // Only show files with >1% change
      fileDeltas.push({
        file: filepath.replace('/Users/davehail/Developer/inkwell/', ''),
        currentLines: currentCov.lines.pct,
        baselineLines: baselineCov?.lines?.pct || 0,
        change: lineChange,
      });
    }
  }

  // Sort by absolute change (largest first)
  fileDeltas.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  if (fileDeltas.length === 0) {
    report += `_No significant file-level changes (all within ±1%)_\n\n`;
  } else {
    report += `| File | Current | Baseline | Change |\n`;
    report += `|------|---------|----------|--------|\n`;

    fileDeltas.slice(0, 10).forEach((item) => {
      const delta = calcDelta(item.currentLines, item.baselineLines);
      report += `| \`${item.file}\` | ${fmt(item.currentLines)}% | ${fmt(item.baselineLines)}% | ${delta.color} ${delta.symbol} ${delta.delta}% |\n`;
    });

    report += `\n`;
  }

  // Critical gaps (files with <25% coverage)
  report += `---

## 🚨 Critical Coverage Gaps (<25%)

Files that urgently need testing:\n\n`;

  const criticalGaps = [];
  for (const [filepath, cov] of Object.entries(current)) {
    if (filepath === 'total') continue;
    if (cov.lines.pct < 25) {
      criticalGaps.push({
        file: filepath.replace('/Users/davehail/Developer/inkwell/', ''),
        lines: cov.lines.pct,
        functions: cov.functions.pct,
      });
    }
  }

  criticalGaps.sort((a, b) => a.lines - b.lines);

  if (criticalGaps.length === 0) {
    report += `✅ **No files below 25% coverage!**\n\n`;
  } else {
    report += `| File | Lines | Functions |\n`;
    report += `|------|-------|----------|\n`;

    criticalGaps.slice(0, 15).forEach((item) => {
      report += `| \`${item.file}\` | **${fmt(item.lines)}%** | ${fmt(item.functions)}% |\n`;
    });

    report += `\n_Showing top ${Math.min(criticalGaps.length, 15)} of ${criticalGaps.length} critical files_\n\n`;
  }

  // Next Steps
  report += `---

## 📋 Next Steps

`;

  if (linesDelta.change < 0) {
    report += `1. ⚠️ **Coverage decreased** - Review recent commits for untested code\n`;
  }

  if (criticalGaps.length > 0) {
    report += `2. 🎯 **Address critical gaps** - Focus on files with <25% coverage\n`;
  }

  report += `3. 📊 **Review weekly progress** - Track against Phase 1 targets (72-75% lines)\n`;
  report += `4. 🔄 **Update baseline** - Run \`cp coverage/coverage-summary.json coverage-baseline.json\` to lock in progress\n`;

  report += `\n---

_Generated by \`scripts/coverage-diff.mjs\`_
`;

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('📊 Generating coverage diff report...\n');

  // Load current and baseline coverage
  const current = loadJSON(CURRENT_SUMMARY);
  const baseline = loadJSON(BASELINE_FILE);

  if (!current) {
    console.error('❌ No current coverage data found. Run `pnpm test:coverage` first.\n');
    process.exit(1);
  }

  // Generate report
  const report = generateReport(current, baseline);

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, report, 'utf8');

  console.log(`✅ Coverage report generated: ${OUTPUT_FILE}\n`);

  // Also print summary to console
  const currentTotal = current.total;
  const baselineTotal = baseline?.total;

  console.log('Coverage Summary:');
  console.log(`  Lines:      ${fmt(currentTotal.lines.pct)}% (${baselineTotal ? `${calcDelta(currentTotal.lines.pct, baselineTotal.lines.pct).symbol} ${calcDelta(currentTotal.lines.pct, baselineTotal.lines.pct).delta}%` : 'baseline'})`);
  console.log(`  Branches:   ${fmt(currentTotal.branches.pct)}% (${baselineTotal ? `${calcDelta(currentTotal.branches.pct, baselineTotal.branches.pct).symbol} ${calcDelta(currentTotal.branches.pct, baselineTotal.branches.pct).delta}%` : 'baseline'})`);
  console.log(`  Functions:  ${fmt(currentTotal.functions.pct)}% (${baselineTotal ? `${calcDelta(currentTotal.functions.pct, baselineTotal.functions.pct).symbol} ${calcDelta(currentTotal.functions.pct, baselineTotal.functions.pct).delta}%` : 'baseline'})`);
  console.log('');

  // If no baseline, create one
  if (!baseline) {
    console.log('💡 No baseline found. Creating baseline for future comparisons...');
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(current, null, 2), 'utf8');
    console.log(`✅ Baseline saved: ${BASELINE_FILE}\n`);
  }
}

main();
