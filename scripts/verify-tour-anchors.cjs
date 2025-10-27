#!/usr/bin/env node

/**
 * Tour Anchor Verification Script
 * 
 * Validates that all tour anchors referenced in configs exist in components
 * and that all data-tour-id attributes are documented.
 * 
 * Usage:
 *   node scripts/verify-tour-anchors.js
 *   node scripts/verify-tour-anchors.js --tour=core
 *   node scripts/verify-tour-anchors.js --verbose
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const tourFilter = args.find(arg => arg.startsWith('--tour='))?.split('=')[1];

let errorCount = 0;
let warningCount = 0;
let successCount = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  successCount++;
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  errorCount++;
  log(`✗ ${message}`, colors.red);
}

function warning(message) {
  warningCount++;
  log(`⚠ ${message}`, colors.yellow);
}

function info(message) {
  if (verbose) {
    log(`ℹ ${message}`, colors.cyan);
  }
}

/**
 * Extract tour IDs from tour config files
 */
function extractTourIdsFromConfigs() {
  const tourIds = new Set();
  const configsDir = path.join(__dirname, '../src/tour/configs');
  
  if (!fs.existsSync(configsDir)) {
    warning('Tour configs directory not found');
    return tourIds;
  }
  
  const files = fs.readdirSync(configsDir).filter(f => f.endsWith('.ts'));
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join(configsDir, file), 'utf8');
    
    // Match data-tour-id patterns
    const matches = content.matchAll(/data-tour-id=["']([^"']+)["']/g);
    for (const match of matches) {
      tourIds.add(match[1]);
    }
    
    // Match target: 'anchor-id' patterns
    const targetMatches = content.matchAll(/target:\s*["']([^"']+)["']/g);
    for (const match of targetMatches) {
      tourIds.add(match[1]);
    }
  });
  
  return tourIds;
}

/**
 * Search for data-tour-id attributes in source files
 */
function findTourAnchorsInSource() {
  const anchors = new Map(); // id -> [file paths]
  const srcDir = path.join(__dirname, '../src');
  
  function searchDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        searchDirectory(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.matchAll(/data-tour-id=["']([^"']+)["']/g);
        
        for (const match of matches) {
          const id = match[1];
          if (!anchors.has(id)) {
            anchors.set(id, []);
          }
          const relativePath = path.relative(srcDir, fullPath);
          anchors.get(id).push(relativePath);
        }
      }
    });
  }
  
  searchDirectory(srcDir);
  return anchors;
}

/**
 * Load documented tour IDs from TOUR_DATA_ATTRIBUTES.md
 */
function loadDocumentedAnchors() {
  const documented = new Set();
  const docsPath = path.join(__dirname, '../docs/TOUR_DATA_ATTRIBUTES.md');
  
  if (!fs.existsSync(docsPath)) {
    warning('TOUR_DATA_ATTRIBUTES.md not found');
    return documented;
  }
  
  const content = fs.readFileSync(docsPath, 'utf8');
  const matches = content.matchAll(/data-tour-id="([^"]+)"/g);
  
  for (const match of matches) {
    documented.add(match[1]);
  }
  
  return documented;
}

/**
 * Validate tour ID format (kebab-case)
 */
function validateTourIdFormat(id) {
  return /^[a-z]+(-[a-z]+)*$/.test(id);
}

/**
 * Main verification
 */
function main() {
  log('\n🔍 Tour Anchor Verification\n', colors.blue);
  
  // Load all data
  info('Loading tour configs...');
  const configIds = extractTourIdsFromConfigs();
  
  info('Searching source files...');
  const sourceAnchors = findTourAnchorsInSource();
  
  info('Loading documentation...');
  const documentedIds = loadDocumentedAnchors();
  
  log(`Found ${configIds.size} tour IDs in configs`, colors.cyan);
  log(`Found ${sourceAnchors.size} anchors in source`, colors.cyan);
  log(`Found ${documentedIds.size} documented anchors\n`, colors.cyan);
  
  // Check 1: All config IDs exist in source
  log('Checking config IDs exist in source...', colors.blue);
  configIds.forEach(id => {
    if (sourceAnchors.has(id)) {
      success(`${id} found in source`);
      if (verbose) {
        sourceAnchors.get(id).forEach(path => {
          info(`  → ${path}`);
        });
      }
    } else {
      error(`${id} referenced in config but not found in source`);
    }
  });
  
  // Check 2: All source anchors are documented
  log('\nChecking source anchors are documented...', colors.blue);
  sourceAnchors.forEach((paths, id) => {
    if (documentedIds.has(id)) {
      success(`${id} is documented`);
    } else {
      warning(`${id} found in source but not documented (${paths[0]})`);
    }
  });
  
  // Check 3: Validate ID formats
  log('\nValidating tour ID formats...', colors.blue);
  const allIds = new Set([...configIds, ...sourceAnchors.keys()]);
  allIds.forEach(id => {
    if (validateTourIdFormat(id)) {
      success(`${id} uses valid format (kebab-case)`);
    } else {
      error(`${id} uses invalid format (should be kebab-case)`);
    }
  });
  
  // Check 4: Find orphaned anchors (in source but not in configs)
  log('\nChecking for orphaned anchors...', colors.blue);
  let orphanCount = 0;
  sourceAnchors.forEach((paths, id) => {
    if (!configIds.has(id)) {
      warning(`${id} exists in source but not used in any tour config`);
      orphanCount++;
    }
  });
  
  if (orphanCount === 0) {
    success('No orphaned anchors found');
  }
  
  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  log('Summary:', colors.blue);
  log(`  ✓ Successes: ${successCount}`, colors.green);
  log(`  ⚠ Warnings: ${warningCount}`, colors.yellow);
  log(`  ✗ Errors: ${errorCount}`, colors.red);
  log('='.repeat(60) + '\n', colors.blue);
  
  if (errorCount > 0) {
    log('❌ Verification failed with errors', colors.red);
    process.exit(1);
  } else if (warningCount > 0) {
    log('⚠️  Verification passed with warnings', colors.yellow);
    process.exit(0);
  } else {
    log('✅ All checks passed!', colors.green);
    process.exit(0);
  }
}

main();
