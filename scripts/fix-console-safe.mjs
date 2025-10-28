#!/usr/bin/env node

/**
 * Fix console.* statements by converting to devLog.*
 * This script is careful about import placement and preserves file structure
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

// Files to process
const FILES_TO_FIX = [
  // Services
  'src/services/advancedCharacterConsistencyAnalyzer.ts',
  'src/services/consistencyGuardianService.ts',
  'src/services/professionalExportService.ts',
  'src/services/projectContextService.ts',
  'src/services/timelinePlotConsistencyAnalyzer.ts',
  'src/services/enhancedStorageService.ts',
  // Context
  'src/context/AppContext.tsx',
  'src/context/ClaudeProvider.tsx',
  'src/context/EditorContext.tsx',
  // Auth/Routes
  'src/components/RouteGuards/PreviewGuard.tsx',
  'src/context/AuthContext.tsx',
  'src/pages/Login.tsx',
  // Onboarding (not in _archive)
  'src/components/Onboarding/hooks/tourHookUtils.ts',
  'src/components/Onboarding/hooks/useAutostart.ts',
  'src/components/Onboarding/tourAnalytics.ts',
  'src/components/Onboarding/tourPersistence.ts',
  'src/components/Onboarding/useInkwellSpotlightTour.ts',
  'src/components/Onboarding/utils/debug.ts',
  // Storage utils
  'src/utils/storage/persistenceE2E.ts',
  'src/utils/storage/storageVerification.ts',
  'src/utils/tourTriggers.ts',
  // Dev tools - allow console here
  // 'src/dev/printTourFlags.ts',
  // 'src/dev/tourAnalyticsExport.ts',
];

function hasDevLogImport(content) {
  return /import\s+devLog\s+from\s+["'](@\/utils\/devLog|src\/utils\/devLog)["']/.test(content);
}

function addDevLogImport(content) {
  if (hasDevLogImport(content)) {
    return content;
  }

  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i]?.trim() || '')) {
      lastImportIndex = i;
    }
    // Stop at first non-import, non-comment, non-blank line after imports started
    if (lastImportIndex >= 0 && lines[i] && !lines[i].startsWith('import') && !lines[i].startsWith('//') && lines[i].trim() !== '') {
      break;
    }
  }

  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, 'import devLog from "@/utils/devLog";');
  } else {
    // No imports found, add at top after comments
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i]?.startsWith('//') && !lines[i]?.startsWith('/*') && lines[i]?.trim() !== '') {
        insertIndex = i;
        break;
      }
    }
    lines.splice(insertIndex, 0, 'import devLog from "@/utils/devLog";');
  }

  return lines.join('\n');
}

function fixConsoleStatements(content) {
  let modified = content;
  
  // Replace console.log( with devLog.debug(
  modified = modified.replace(/\bconsole\.log\(/g, 'devLog.debug(');
  
  // Replace console.warn( with devLog.warn(
  modified = modified.replace(/\bconsole\.warn\(/g, 'devLog.warn(');
  
  // Replace console.error( with devLog.error(
  modified = modified.replace(/\bconsole\.error\(/g, 'devLog.error(');
  
  // Replace console.debug( with devLog.debug(
  modified = modified.replace(/\bconsole\.debug\(/g, 'devLog.debug(');
  
  return modified;
}

function processFile(filePath) {
  const fullPath = path.join(ROOT, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${filePath} (not found)`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // Check if file needs console fixes
  if (!/\bconsole\.(log|warn|error|debug)\(/.test(content)) {
    console.log(`✓ ${filePath} (no console statements)`);
    return false;
  }

  // Add import if needed
  content = addDevLogImport(content);
  
  // Fix console statements
  content = fixConsoleStatements(content);

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 Converting console statements to devLog...\n');
  
  let fixedCount = 0;
  
  for (const file of FILES_TO_FIX) {
    if (processFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log('\nNext: Run pnpm eslint "src/**/*.{ts,tsx}" --fix');
}

main();
