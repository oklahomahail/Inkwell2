#!/usr/bin/env node
/**
 * Test File Audit Script
 * Analyzes test files for staleness, duplication, and value
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Find all test files
function findTestFiles() {
  const cmd = `find src -name "*.test.ts*" -o -name "*.spec.ts*"`;
  const output = execSync(cmd, { cwd: projectRoot, encoding: 'utf8' });
  return output.trim().split('\n').filter(Boolean);
}

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(path.join(projectRoot, filePath));
  } catch {
    return false;
  }
}

// Extract imports from test file
function extractImports(testFile) {
  try {
    const content = fs.readFileSync(path.join(projectRoot, testFile), 'utf8');
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  } catch (error) {
    return [];
  }
}

// Resolve import path to actual file
function resolveImportPath(importPath, testFilePath) {
  if (importPath.startsWith('@/')) {
    // Alias import
    return importPath.replace('@/', 'src/');
  } else if (importPath.startsWith('.')) {
    // Relative import
    const testDir = path.dirname(testFilePath);
    return path.join(testDir, importPath);
  }
  return null; // External package
}

// Check if import exists
function checkImportExists(importPath, testFilePath) {
  const resolved = resolveImportPath(importPath, testFilePath);
  if (!resolved) return { exists: true, external: true }; // External package

  const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    if (fileExists(resolved + ext)) {
      return { exists: true, path: resolved + ext };
    }
  }

  // Check if it's a directory with index file
  for (const ext of extensions) {
    if (fileExists(path.join(resolved, `index${ext}`))) {
      return { exists: true, path: path.join(resolved, `index${ext}`) };
    }
  }

  return { exists: false, path: resolved };
}

// Get file last modified date from git
function getLastModified(filePath) {
  try {
    const cmd = `git log -1 --format=%ci "${filePath}"`;
    const output = execSync(cmd, { cwd: projectRoot, encoding: 'utf8' });
    return output.trim() || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// Get file size
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(path.join(projectRoot, filePath));
    const kb = stats.size / 1024;
    return `${kb.toFixed(1)}KB`;
  } catch {
    return 'Unknown';
  }
}

// Categorize test file
function categorizeTest(testFile, staleImports) {
  const fileName = path.basename(testFile);
  const dirName = path.dirname(testFile);

  // Check for archive/skipped
  if (testFile.includes('.archive') || testFile.includes('test-skipped')) {
    return { category: 'OBSOLETE', reason: 'In archive/skipped folder' };
  }

  // Check for .skip extension
  if (fileName.endsWith('.skip')) {
    return { category: 'OBSOLETE', reason: 'Skipped test file (.skip extension)' };
  }

  // Check for duplicate test files (not in __tests__ subfolder)
  if (!dirName.includes('__tests__') && !dirName.includes('tests')) {
    const testName = fileName.replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, '');
    const possibleDuplicate = path.join(path.dirname(testFile), '__tests__', fileName);
    if (fileExists(possibleDuplicate)) {
      return { category: 'REDUNDANT', reason: `Duplicate of ${possibleDuplicate}` };
    }
  }

  // Check for stale imports
  if (staleImports.length > 0) {
    return {
      category: 'STALE',
      reason: `${staleImports.length} stale import(s): ${staleImports.slice(0, 2).join(', ')}${staleImports.length > 2 ? '...' : ''}`
    };
  }

  // Check for legacy naming patterns
  if (fileName.includes('.legacy.') || fileName.includes('.old.')) {
    return { category: 'STALE', reason: 'Legacy naming pattern' };
  }

  return { category: 'CURRENT', reason: 'No issues detected' };
}

// Main audit function
function auditTests() {
  console.log('🔍 Starting Test File Audit...\n');

  const testFiles = findTestFiles();
  console.log(`Found ${testFiles.length} test files\n`);

  const results = [];

  for (const testFile of testFiles) {
    const imports = extractImports(testFile);
    const staleImports = [];

    for (const imp of imports) {
      const check = checkImportExists(imp, testFile);
      if (!check.exists && !check.external) {
        staleImports.push(imp);
      }
    }

    const classification = categorizeTest(testFile, staleImports);
    const lastModified = getLastModified(testFile);
    const fileSize = getFileSize(testFile);

    results.push({
      file: testFile,
      ...classification,
      staleImports: staleImports.length,
      lastModified,
      fileSize,
    });
  }

  // Group by category
  const grouped = {
    OBSOLETE: results.filter(r => r.category === 'OBSOLETE'),
    REDUNDANT: results.filter(r => r.category === 'REDUNDANT'),
    STALE: results.filter(r => r.category === 'STALE'),
    CURRENT: results.filter(r => r.category === 'CURRENT'),
  };

  // Generate report
  console.log('📊 AUDIT RESULTS\n');
  console.log('=' .repeat(80));
  console.log(`Total Test Files: ${testFiles.length}`);
  console.log(`├─ ❌ Obsolete: ${grouped.OBSOLETE.length}`);
  console.log(`├─ ⚠️  Redundant: ${grouped.REDUNDANT.length}`);
  console.log(`├─ 🔧 Stale: ${grouped.STALE.length}`);
  console.log(`└─ ✅ Current: ${grouped.CURRENT.length}`);
  console.log('=' .repeat(80));
  console.log();

  // Print details for non-current files
  ['OBSOLETE', 'REDUNDANT', 'STALE'].forEach(category => {
    if (grouped[category].length > 0) {
      const icon = category === 'OBSOLETE' ? '❌' : category === 'REDUNDANT' ? '⚠️' : '🔧';
      console.log(`${icon} ${category} FILES (${grouped[category].length}):`);
      console.log('-'.repeat(80));

      grouped[category].forEach(result => {
        console.log(`\n📄 ${result.file}`);
        console.log(`   Reason: ${result.reason}`);
        console.log(`   Size: ${result.fileSize} | Last Modified: ${result.lastModified.split(' ')[0]}`);
        if (result.staleImports > 0) {
          console.log(`   Stale Imports: ${result.staleImports}`);
        }
      });

      console.log('\n');
    }
  });

  // Generate markdown report
  const mdReport = generateMarkdownReport(grouped, testFiles.length);
  fs.writeFileSync(path.join(projectRoot, 'TEST_AUDIT_REPORT.md'), mdReport);
  console.log('✅ Detailed report saved to TEST_AUDIT_REPORT.md\n');

  return grouped;
}

function generateMarkdownReport(grouped, total) {
  const lines = [];

  lines.push('# Test File Audit Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Category | Count | Percentage |`);
  lines.push(`|----------|-------|------------|`);
  lines.push(`| ❌ Obsolete | ${grouped.OBSOLETE.length} | ${((grouped.OBSOLETE.length / total) * 100).toFixed(1)}% |`);
  lines.push(`| ⚠️ Redundant | ${grouped.REDUNDANT.length} | ${((grouped.REDUNDANT.length / total) * 100).toFixed(1)}% |`);
  lines.push(`| 🔧 Stale | ${grouped.STALE.length} | ${((grouped.STALE.length / total) * 100).toFixed(1)}% |`);
  lines.push(`| ✅ Current | ${grouped.CURRENT.length} | ${((grouped.CURRENT.length / total) * 100).toFixed(1)}% |`);
  lines.push(`| **Total** | **${total}** | **100%** |`);
  lines.push('');

  ['OBSOLETE', 'REDUNDANT', 'STALE'].forEach(category => {
    if (grouped[category].length > 0) {
      const icon = category === 'OBSOLETE' ? '❌' : category === 'REDUNDANT' ? '⚠️' : '🔧';
      const action = category === 'OBSOLETE' ? 'DELETE' : category === 'REDUNDANT' ? 'MERGE/DELETE' : 'UPDATE';

      lines.push(`## ${icon} ${category} Files`);
      lines.push('');
      lines.push(`**Recommendation:** ${action}`);
      lines.push('');
      lines.push(`| File | Reason | Size | Last Modified | Stale Imports |`);
      lines.push(`|------|--------|------|---------------|---------------|`);

      grouped[category].forEach(result => {
        const date = result.lastModified.split(' ')[0];
        lines.push(`| \`${result.file}\` | ${result.reason} | ${result.fileSize} | ${date} | ${result.staleImports} |`);
      });

      lines.push('');
    }
  });

  lines.push('## Recommendations');
  lines.push('');
  lines.push('### Immediate Actions');
  lines.push('');
  lines.push('1. **Delete Obsolete Files** - These are in archive folders or explicitly skipped');
  lines.push('2. **Resolve Redundant Files** - Merge or delete duplicate test files');
  lines.push('3. **Update Stale Tests** - Fix broken imports and update to current architecture');
  lines.push('');
  lines.push('### Commands');
  lines.push('');
  lines.push('```bash');
  lines.push('# Delete obsolete files');
  grouped.OBSOLETE.forEach(r => {
    lines.push(`rm "${r.file}"`);
  });
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

// Run audit
try {
  const results = auditTests();

  const issueCount = results.OBSOLETE.length + results.REDUNDANT.length + results.STALE.length;
  if (issueCount > 0) {
    console.log(`⚠️  Found ${issueCount} test files that need attention`);
    process.exit(0); // Don't fail CI, just report
  } else {
    console.log('✅ All test files are current and healthy');
  }
} catch (error) {
  console.error('❌ Audit failed:', error.message);
  process.exit(1);
}
