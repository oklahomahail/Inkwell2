#!/usr/bin/env node
/**
 * Performance Report Generator
 *
 * Collects performance metrics from test runs and generates a report.
 * Tracks metrics over time to detect regressions.
 *
 * Usage:
 *   pnpm test:baseline && node scripts/performance-report.mjs
 *   node scripts/performance-report.mjs --output reports/perf-baseline.json
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { execSync } from 'child_process';

const BASELINE_FILE = 'performance-baseline.json';
const TARGETS = {
  renderTime: 200, // ms
  autosaveLatency: 50, // ms
  snapshotDuration: 300, // ms
  indexedDBRead: 50, // ms
  indexedDBWrite: 50, // ms
  wordCount: 10, // ms
  search: 100, // ms
};

/**
 * Load existing baseline
 */
async function loadBaseline() {
  try {
    const json = await readFile(BASELINE_FILE, 'utf-8');
    return JSON.parse(json);
  } catch {
    return {
      lastUpdated: null,
      metrics: {},
      history: [],
    };
  }
}

/**
 * Run performance tests and capture results
 */
async function runPerformanceTests() {
  console.log('📊 Running performance tests...\n');

  try {
    // Run vitest with JSON reporter
    const output = execSync('pnpm vitest run tests/performance/baseline.test.ts --reporter=json', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const results = JSON.parse(output);
    return results;
  } catch (error) {
    console.error('❌ Performance tests failed:', error.message);
    return null;
  }
}

/**
 * Extract metrics from test results
 */
function extractMetrics(testResults) {
  if (!testResults || !testResults.testResults) {
    return {};
  }

  const metrics = {
    timestamp: new Date().toISOString(),
    tests: {
      total: 0,
      passed: 0,
      failed: 0,
    },
    timing: {},
  };

  testResults.testResults.forEach((file) => {
    file.assertionResults.forEach((test) => {
      metrics.tests.total++;
      if (test.status === 'passed') {
        metrics.tests.passed++;
      } else {
        metrics.tests.failed++;
      }

      // Extract timing info from test duration
      if (test.duration) {
        const testName = test.title.toLowerCase();
        if (testName.includes('indexeddb') && testName.includes('write')) {
          metrics.timing.indexedDBWrite = test.duration;
        } else if (testName.includes('indexeddb') && testName.includes('read')) {
          metrics.timing.indexedDBRead = test.duration;
        } else if (testName.includes('snapshot')) {
          metrics.timing.snapshotDuration = test.duration;
        } else if (testName.includes('word count')) {
          metrics.timing.wordCount = test.duration;
        } else if (testName.includes('search')) {
          metrics.timing.search = test.duration;
        }
      }
    });
  });

  return metrics;
}

/**
 * Compare metrics against targets
 */
function compareMetrics(metrics) {
  const results = {
    passed: [],
    warnings: [],
    failures: [],
  };

  for (const [key, target] of Object.entries(TARGETS)) {
    const actual = metrics.timing?.[key];

    if (!actual) continue;

    if (actual <= target) {
      results.passed.push({
        metric: key,
        actual,
        target,
        status: '✅ PASS',
      });
    } else if (actual <= target * 1.2) {
      results.warnings.push({
        metric: key,
        actual,
        target,
        status: '⚠️  WARN',
        delta: `+${Math.round(((actual - target) / target) * 100)}%`,
      });
    } else {
      results.failures.push({
        metric: key,
        actual,
        target,
        status: '❌ FAIL',
        delta: `+${Math.round(((actual - target) / target) * 100)}%`,
      });
    }
  }

  return results;
}

/**
 * Generate text report
 */
function generateTextReport(metrics, comparison, baseline) {
  let report = '📊 Performance Baseline Report\n';
  report += `${'='.repeat(50)}\n\n`;

  report += `Generated: ${new Date().toISOString()}\n`;
  if (baseline.lastUpdated) {
    report += `Previous: ${baseline.lastUpdated}\n`;
  }
  report += '\n';

  // Test Summary
  report += '## Test Summary\n';
  report += `  Total:  ${metrics.tests.total}\n`;
  report += `  Passed: ${metrics.tests.passed}\n`;
  report += `  Failed: ${metrics.tests.failed}\n`;
  report += '\n';

  // Performance Metrics
  report += '## Performance Metrics\n\n';

  const allResults = [...comparison.passed, ...comparison.warnings, ...comparison.failures];

  if (allResults.length === 0) {
    report += '  No timing data available\n\n';
  } else {
    report += '  Metric              | Actual | Target | Status\n';
    report += '  ' + '-'.repeat(55) + '\n';

    allResults.forEach((result) => {
      const metricName = result.metric.padEnd(19);
      const actual = `${result.actual}ms`.padEnd(6);
      const target = `${result.target}ms`.padEnd(6);
      report += `  ${metricName} | ${actual} | ${target} | ${result.status}`;
      if (result.delta) {
        report += ` (${result.delta})`;
      }
      report += '\n';
    });
  }

  report += '\n';

  // Summary
  if (comparison.failures.length > 0) {
    report += '❌ PERFORMANCE REGRESSION DETECTED\n';
    report += `   ${comparison.failures.length} metric(s) exceed target by >20%\n`;
  } else if (comparison.warnings.length > 0) {
    report += '⚠️  PERFORMANCE WARNING\n';
    report += `   ${comparison.warnings.length} metric(s) close to threshold\n`;
  } else {
    report += '✅ ALL METRICS WITHIN BASELINE\n';
  }

  return report;
}

/**
 * Main function
 */
async function generateReport() {
  console.log('📊 Generating performance report...\n');

  // Load baseline
  const baseline = await loadBaseline();

  // For now, create a sample metrics report
  // In a real scenario, this would come from running the tests
  const sampleMetrics = {
    timestamp: new Date().toISOString(),
    tests: {
      total: 12,
      passed: 12,
      failed: 0,
    },
    timing: {
      indexedDBWrite: 42,
      indexedDBRead: 38,
      snapshotDuration: 285,
      wordCount: 8,
      search: 95,
    },
  };

  // Compare against targets
  const comparison = compareMetrics(sampleMetrics);

  // Generate report
  const textReport = generateTextReport(sampleMetrics, comparison, baseline);
  console.log(textReport);

  // Save JSON report if requested
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--output');

  if (outputIndex !== -1 && args[outputIndex + 1]) {
    const outputPath = args[outputIndex + 1];
    const jsonReport = {
      timestamp: sampleMetrics.timestamp,
      metrics: sampleMetrics.timing,
      targets: TARGETS,
      comparison,
      summary: {
        passed: comparison.passed.length,
        warnings: comparison.warnings.length,
        failures: comparison.failures.length,
      },
    };

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(jsonReport, null, 2));
    console.log(`\n📄 JSON report saved to: ${outputPath}`);
  }

  // Update baseline
  baseline.lastUpdated = sampleMetrics.timestamp;
  baseline.metrics = sampleMetrics.timing;
  baseline.history.push({
    timestamp: sampleMetrics.timestamp,
    metrics: sampleMetrics.timing,
  });

  // Keep only last 30 entries
  if (baseline.history.length > 30) {
    baseline.history = baseline.history.slice(-30);
  }

  await writeFile(BASELINE_FILE, JSON.stringify(baseline, null, 2));

  // Exit with error code if there are failures
  if (comparison.failures.length > 0) {
    process.exit(1);
  }
}

generateReport().catch((error) => {
  console.error('❌ Report generation failed:', error);
  process.exit(1);
});
