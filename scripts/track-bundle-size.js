#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Bundle Size Tracking Script
 * Analyzes dist/ directory and creates size reports
 */

const DIST_DIR = path.join(__dirname, '..', 'dist');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const BASELINE_TAG = 'v1.0.3-cleanup-2025-10-10';

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDistDirectory() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist/ directory not found. Run pnpm build first.');
    process.exit(1);
  }

  const analysis = {
    timestamp: new Date().toISOString(),
    totalSize: 0,
    files: {},
    assets: {},
    chunks: {}
  };

  function scanDirectory(dir, prefix = '') {
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const relativePath = path.join(prefix, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, relativePath);
      } else {
        const size = stat.size;
        analysis.totalSize += size;
        analysis.files[relativePath] = size;
        
        // Categorize files
        if (entry.endsWith('.js')) {
          analysis.chunks[relativePath] = size;
        } else if (entry.endsWith('.css') || entry.endsWith('.png') || entry.endsWith('.svg') || entry.endsWith('.ico')) {
          analysis.assets[relativePath] = size;
        }
      }
    }
  }
  
  scanDirectory(DIST_DIR);
  return analysis;
}

function generateReport(analysis) {
  const report = [];
  
  report.push('# Bundle Size Report');
  report.push(`Generated: ${analysis.timestamp}`);
  report.push(`Total Size: ${formatBytes(analysis.totalSize)}`);
  report.push('');
  
  // JavaScript chunks
  report.push('## JavaScript Chunks');
  const sortedChunks = Object.entries(analysis.chunks)
    .sort(([,a], [,b]) => b - a);
  
  if (sortedChunks.length === 0) {
    report.push('No JavaScript chunks found.');
  } else {
    for (const [file, size] of sortedChunks) {
      report.push(`- ${file}: ${formatBytes(size)}`);
    }
  }
  report.push('');
  
  // Assets
  report.push('## Assets');
  const sortedAssets = Object.entries(analysis.assets)
    .sort(([,a], [,b]) => b - a);
  
  if (sortedAssets.length === 0) {
    report.push('No assets found.');
  } else {
    for (const [file, size] of sortedAssets) {
      report.push(`- ${file}: ${formatBytes(size)}`);
    }
  }
  report.push('');
  
  // All files summary
  report.push('## All Files');
  const sortedFiles = Object.entries(analysis.files)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20); // Top 20 largest files
  
  for (const [file, size] of sortedFiles) {
    report.push(`- ${file}: ${formatBytes(size)}`);
  }
  
  return report.join('\n');
}

function saveAnalysis(analysis) {
  ensureReportsDir();
  
  // Save raw analysis
  const analysisFile = path.join(REPORTS_DIR, 'bundle-analysis.json');
  fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
  
  // Save human-readable report
  const report = generateReport(analysis);
  const reportFile = path.join(REPORTS_DIR, 'bundle-size-report.md');
  fs.writeFileSync(reportFile, report);
  
  console.log('📊 Bundle analysis saved:');
  console.log(`   Analysis: ${analysisFile}`);
  console.log(`   Report: ${reportFile}`);
}

function loadBaselineAnalysis() {
  const baselineFile = path.join(REPORTS_DIR, `bundle-baseline-${BASELINE_TAG}.json`);
  
  if (!fs.existsSync(baselineFile)) {
    console.log(`ℹ️  No baseline found for ${BASELINE_TAG}`);
    return null;
  }
  
  try {
    return JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  } catch (error) {
    console.warn(`⚠️  Could not load baseline: ${error.message}`);
    return null;
  }
}

function compareWithBaseline(current, baseline) {
  if (!baseline) return;
  
  console.log('');
  console.log('📈 Bundle Size Comparison:');
  console.log('');
  
  const currentTotal = current.totalSize;
  const baselineTotal = baseline.totalSize;
  const diff = currentTotal - baselineTotal;
  const percentChange = ((diff / baselineTotal) * 100).toFixed(1);
  
  console.log(`Total Size: ${formatBytes(currentTotal)} (${diff >= 0 ? '+' : ''}${formatBytes(diff)}, ${percentChange}%)`);
  
  // Check for significant changes in key files
  const significantChanges = [];
  
  for (const [file, currentSize] of Object.entries(current.files)) {
    const baselineSize = baseline.files[file] || 0;
    const fileDiff = currentSize - baselineSize;
    const filePercentChange = baselineSize > 0 ? ((fileDiff / baselineSize) * 100) : 0;
    
    if (Math.abs(filePercentChange) > 10 && Math.abs(fileDiff) > 1024) { // >10% and >1KB
      significantChanges.push({
        file,
        currentSize,
        baselineSize,
        diff: fileDiff,
        percentChange: filePercentChange
      });
    }
  }
  
  if (significantChanges.length > 0) {
    console.log('');
    console.log('🔍 Significant Changes:');
    for (const change of significantChanges) {
      const sign = change.diff >= 0 ? '+' : '';
      console.log(`  ${change.file}: ${formatBytes(change.currentSize)} (${sign}${formatBytes(change.diff)}, ${change.percentChange.toFixed(1)}%)`);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('📦 Bundle Size Tracker');
  console.log('');
  
  if (command === '--save-baseline') {
    console.log(`💾 Saving current build as baseline for ${BASELINE_TAG}`);
    const analysis = analyzeDistDirectory();
    const baselineFile = path.join(REPORTS_DIR, `bundle-baseline-${BASELINE_TAG}.json`);
    ensureReportsDir();
    fs.writeFileSync(baselineFile, JSON.stringify(analysis, null, 2));
    console.log(`✅ Baseline saved: ${baselineFile}`);
    return;
  }
  
  const analysis = analyzeDistDirectory();
  console.log(`📊 Total bundle size: ${formatBytes(analysis.totalSize)}`);
  console.log(`📁 Files analyzed: ${Object.keys(analysis.files).length}`);
  
  saveAnalysis(analysis);
  
  if (command === '--compare' || !command) {
    const baseline = loadBaselineAnalysis();
    compareWithBaseline(analysis, baseline);
  }
}

main();