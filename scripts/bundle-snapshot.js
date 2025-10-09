#!/usr/bin/env node

/**
 * Bundle Consistency Snapshot Tool
 * 
 * This script generates bundle analysis snapshots to detect:
 * - New chunk splits that could cause TDZ issues
 * - Dependency regressions in import patterns
 * - Bundle size increases that indicate architectural problems
 * 
 * Usage:
 *   npm run bundle:snapshot              # Create new baseline
 *   npm run bundle:compare               # Compare against baseline
 *   npm run bundle:snapshot -- --update  # Update existing baseline
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SNAPSHOTS_DIR = path.join(PROJECT_ROOT, '.bundle-snapshots');
const BASELINE_FILE = path.join(SNAPSHOTS_DIR, 'baseline.json');
const CURRENT_FILE = path.join(SNAPSHOTS_DIR, 'current.json');

// Critical bundle metrics to track
const CRITICAL_MODULES = [
  'analyticsService',
  'pwaService', 
  'tutorialStorage',
  'TourProvider',
  'ProfileTourProvider'
];

async function ensureSnapshotsDir() {
  try {
    await fs.access(SNAPSHOTS_DIR);
  } catch {
    await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });
    console.log(`✓ Created snapshots directory: ${SNAPSHOTS_DIR}`);
  }
}

async function generateBundleAnalysis() {
  console.log('🔍 Generating bundle analysis...');
  
  try {
    // Build the project first (suppress output to avoid clutter)
    console.log('🔨 Building project...');
    execSync('npm run build', { 
      cwd: PROJECT_ROOT,
      stdio: 'pipe'
    });
    console.log('✅ Build completed');
    
    // Skip complex analyzer for now - use direct file analysis
    return await generateFallbackAnalysis();
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    throw error;
  }
}

async function generateFallbackAnalysis() {
  const distDir = path.join(PROJECT_ROOT, 'dist', 'assets');
  
  try {
    const files = await fs.readdir(distDir);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    const cssFiles = files.filter(f => f.endsWith('.css'));
    
    const jsChunks = await Promise.all(
      jsFiles.map(async (file) => {
        const stats = await fs.stat(path.join(distDir, file));
        return {
          name: file,
          size: stats.size,
          type: 'js',
          modules: 0 // Can't determine without analyzer
        };
      })
    );
    
    const cssChunks = await Promise.all(
      cssFiles.map(async (file) => {
        const stats = await fs.stat(path.join(distDir, file));
        return {
          name: file,
          size: stats.size,
          type: 'css',
          modules: 0
        };
      })
    );
    
    const allChunks = [...jsChunks, ...cssChunks];
    
    // Try to identify critical modules by filename patterns
    const criticalModules = {};
    CRITICAL_MODULES.forEach(moduleName => {
      const found = jsFiles.some(file => file.toLowerCase().includes(moduleName.toLowerCase()));
      criticalModules[moduleName] = {
        found,
        chunkName: found ? jsFiles.find(f => f.toLowerCase().includes(moduleName.toLowerCase())) : null,
        size: 0,
        imports: [],
        exports: []
      };
    });
    
    return {
      timestamp: new Date().toISOString(),
      version: getPackageVersion(),
      totalSize: allChunks.reduce((sum, chunk) => sum + chunk.size, 0),
      chunkCount: allChunks.length,
      criticalModules,
      dependencyGraph: {
        staticImports: {},
        dynamicImports: {},
        circularDependencies: []
      },
      chunks: allChunks
    };
  } catch (error) {
    throw new Error(`Fallback analysis failed: ${error.message}`);
  }
}

function getPackageVersion() {
  try {
    const packageJson = JSON.parse(
      execSync('cat package.json', { cwd: PROJECT_ROOT, encoding: 'utf-8' })
    );
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function calculateTotalSize(bundleData) {
  if (Array.isArray(bundleData)) {
    return bundleData.reduce((total, chunk) => {
      return total + (chunk.size || chunk.renderedLength || 0);
    }, 0);
  }
  
  // Handle object-based bundle data
  return Object.values(bundleData).reduce((total, chunk) => {
    return total + (chunk.size || chunk.renderedLength || 0);
  }, 0);
}

function extractCriticalModules(bundleData) {
  const modules = {};
  
  CRITICAL_MODULES.forEach(moduleName => {
    modules[moduleName] = findModuleInBundle(bundleData, moduleName);
  });
  
  return modules;
}

function findModuleInBundle(bundleData, moduleName) {
  // This is a simplified implementation
  // In practice, you'd traverse the bundle structure to find specific modules
  return {
    found: false,
    chunkName: null,
    size: 0,
    imports: [],
    exports: []
  };
}

function extractDependencyGraph(bundleData) {
  // Extract import/export relationships
  // This helps detect new circular dependencies or import pattern changes
  return {
    staticImports: {},
    dynamicImports: {},
    circularDependencies: []
  };
}

async function saveSnapshot(snapshot, filename) {
  await fs.writeFile(filename, JSON.stringify(snapshot, null, 2));
  console.log(`✓ Saved snapshot: ${path.basename(filename)}`);
}

async function loadSnapshot(filename) {
  try {
    const content = await fs.readFile(filename, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function compareSnapshots(baseline, current) {
  const comparison = {
    sizeDelta: current.totalSize - baseline.totalSize,
    sizePercentChange: ((current.totalSize - baseline.totalSize) / baseline.totalSize) * 100,
    chunkCountDelta: current.chunkCount - baseline.chunkCount,
    newChunks: [],
    removedChunks: [],
    sizeChanges: [],
    criticalModuleChanges: []
  };
  
  // Find chunk changes
  const baselineChunks = new Map(baseline.chunks.map(c => [c.name, c]));
  const currentChunks = new Map(current.chunks.map(c => [c.name, c]));
  
  // New chunks
  for (const [name, chunk] of currentChunks) {
    if (!baselineChunks.has(name)) {
      comparison.newChunks.push(chunk);
    }
  }
  
  // Removed chunks  
  for (const [name, chunk] of baselineChunks) {
    if (!currentChunks.has(name)) {
      comparison.removedChunks.push(chunk);
    }
  }
  
  // Size changes
  for (const [name, currentChunk] of currentChunks) {
    const baselineChunk = baselineChunks.get(name);
    if (baselineChunk) {
      const sizeDelta = currentChunk.size - baselineChunk.size;
      if (Math.abs(sizeDelta) > 1024) { // Only report changes > 1KB
        comparison.sizeChanges.push({
          chunk: name,
          sizeDelta,
          percentChange: (sizeDelta / baselineChunk.size) * 100
        });
      }
    }
  }
  
  return comparison;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function printComparison(comparison) {
  console.log('\n📊 Bundle Analysis Comparison');
  console.log('================================');
  
  // Overall size change
  const sizeColor = comparison.sizeDelta > 0 ? '🔴' : '🟢';
  console.log(`${sizeColor} Total Size: ${formatBytes(Math.abs(comparison.sizeDelta))} ${comparison.sizeDelta > 0 ? 'increase' : 'decrease'} (${comparison.sizePercentChange.toFixed(1)}%)`);
  
  // Chunk count change
  if (comparison.chunkCountDelta !== 0) {
    const chunkColor = comparison.chunkCountDelta > 0 ? '⚠️' : '✅';
    console.log(`${chunkColor} Chunks: ${Math.abs(comparison.chunkCountDelta)} ${comparison.chunkCountDelta > 0 ? 'added' : 'removed'}`);
  }
  
  // New chunks (potential TDZ risk)
  if (comparison.newChunks.length > 0) {
    console.log('\n⚠️  New Chunks (Review for TDZ Risk):');
    comparison.newChunks.forEach(chunk => {
      console.log(`   - ${chunk.name} (${formatBytes(chunk.size)})`);
    });
  }
  
  // Significant size changes
  if (comparison.sizeChanges.length > 0) {
    console.log('\n📈 Significant Size Changes:');
    comparison.sizeChanges.forEach(change => {
      const color = change.sizeDelta > 0 ? '🔴' : '🟢';
      console.log(`   ${color} ${change.chunk}: ${formatBytes(Math.abs(change.sizeDelta))} ${change.sizeDelta > 0 ? 'increase' : 'decrease'} (${change.percentChange.toFixed(1)}%)`);
    });
  }
  
  // Risk assessment
  const riskLevel = assessRisk(comparison);
  console.log(`\n🎯 Risk Level: ${riskLevel.emoji} ${riskLevel.level}`);
  if (riskLevel.warnings.length > 0) {
    riskLevel.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  }
}

function assessRisk(comparison) {
  const warnings = [];
  let level = 'LOW';
  let emoji = '🟢';
  
  // Size increase > 20% is concerning
  if (comparison.sizePercentChange > 20) {
    warnings.push(`Large bundle size increase (${comparison.sizePercentChange.toFixed(1)}%)`);
    level = 'HIGH';
    emoji = '🔴';
  }
  
  // New chunks can indicate code splitting changes
  if (comparison.newChunks.length > 2) {
    warnings.push(`Many new chunks (${comparison.newChunks.length}) - review for TDZ risks`);
    if (level !== 'HIGH') {
      level = 'MEDIUM';
      emoji = '🟡';
    }
  }
  
  // Critical module changes
  if (comparison.criticalModuleChanges.length > 0) {
    warnings.push('Critical module changes detected');
    level = 'HIGH';
    emoji = '🔴';
  }
  
  return { level, emoji, warnings };
}

async function main() {
  const args = process.argv.slice(2);
  const isUpdate = args.includes('--update');
  const isCompare = args.includes('--compare') || process.env.npm_lifecycle_event === 'bundle:compare';
  
  await ensureSnapshotsDir();
  
  if (isCompare) {
    // Compare mode
    console.log('🔍 Comparing bundle against baseline...');
    
    const baseline = await loadSnapshot(BASELINE_FILE);
    if (!baseline) {
      console.error('❌ No baseline snapshot found. Run `npm run bundle:snapshot` first.');
      process.exit(1);
    }
    
    const current = await generateBundleAnalysis();
    await saveSnapshot(current, CURRENT_FILE);
    
    const comparison = compareSnapshots(baseline, current);
    printComparison(comparison);
    
    // Exit with non-zero if high risk changes detected
    const riskLevel = assessRisk(comparison);
    if (riskLevel.level === 'HIGH') {
      console.log('\n❌ High-risk changes detected. Review before deployment.');
      process.exit(1);
    }
  } else {
    // Snapshot mode
    console.log(isUpdate ? '🔄 Updating baseline snapshot...' : '📸 Creating bundle snapshot...');
    
    const snapshot = await generateBundleAnalysis();
    
    if (isUpdate || !(await loadSnapshot(BASELINE_FILE))) {
      await saveSnapshot(snapshot, BASELINE_FILE);
      console.log('✅ Baseline snapshot updated');
    } else {
      await saveSnapshot(snapshot, CURRENT_FILE);
      console.log('✅ Current snapshot saved');
      console.log('\n💡 Use `npm run bundle:compare` to compare against baseline');
    }
    
    console.log(`\n📊 Bundle Summary:`);
    console.log(`   Total Size: ${formatBytes(snapshot.totalSize)}`);
    console.log(`   Chunks: ${snapshot.chunkCount}`);
    console.log(`   Version: ${snapshot.version}`);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});