#!/usr/bin/env node

/**
 * Tour Verification Script
 * Performs automated checks for tour implementation
 */

const fs = require('fs');
const path = require('path');

// Colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

let passed = 0;
let failed = 0;
let warned = 0;

const checkPass = (msg) => {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
  passed++;
};

const checkFail = (msg) => {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
  failed++;
};

const checkWarn = (msg) => {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
  warned++;
};

const fileExists = (filePath) => {
  return fs.existsSync(path.join(process.cwd(), filePath));
};

const fileContains = (filePath, searchString) => {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
    return content.includes(searchString);
  } catch {
    return false;
  }
};

console.log('🎯 Tour Verification Script');
console.log('==========================\n');

// 1. Check Files
console.log('1. Checking Tour Files...');
console.log('-------------------------');

const files = [
  'src/tour/TourService.ts',
  'src/tour/tourEntry.ts',
  'src/tour/configs/defaultTour.ts',
  'src/components/Onboarding/WelcomeModal.tsx',
  'src/components/Onboarding/utils/tourSafety.ts',
  'src/components/Onboarding/tourRegistry.ts',
  'src/components/Navigation/HelpMenu.tsx',
];

files.forEach((file) => {
  if (fileExists(file)) {
    checkPass(`Found: ${file}`);
  } else {
    checkFail(`Missing: ${file}`);
  }
});

// 2. Feature Flag
console.log('\n2. Checking Feature Flag...');
console.log('---------------------------');

if (fileContains('src/services/featureFlagService.ts', 'tour_simpleTour')) {
  checkPass("Feature flag 'tour_simpleTour' exists");

  if (fileContains('src/services/featureFlagService.ts', 'enabled: true')) {
    checkPass('Feature flag can be enabled');
  }
} else {
  checkFail("Feature flag 'tour_simpleTour' not found");
}

// 3. Tour Steps
console.log('\n3. Checking Tour Steps...');
console.log('------------------------');

if (fileContains('src/components/Onboarding/tourRegistry.ts', 'CORE_TOUR_STEPS')) {
  checkPass('CORE_TOUR_STEPS defined in registry');
} else {
  checkWarn('CORE_TOUR_STEPS not found in registry');
}

if (fileContains('src/tour/configs/defaultTour.ts', 'defaultTourSteps')) {
  checkPass('defaultTourSteps defined in config');
} else {
  checkFail('defaultTourSteps not found');
}

// 4. Global Functions
console.log('\n4. Checking Global Functions...');
console.log('-------------------------------');

if (fileContains('src/tour/tourEntry.ts', 'inkwellStartTour')) {
  checkPass('Global inkwellStartTour() function exposed');
} else {
  checkFail('Global inkwellStartTour() not found');
}

// 5. Help Menu
console.log('\n5. Checking Help Menu Integration...');
console.log('------------------------------------');

if (fileContains('src/components/Navigation/HelpMenu.tsx', 'startDefaultTour')) {
  checkPass('Help menu imports startDefaultTour');
} else {
  checkWarn('Help menu may not have Restart Tour option');
}

if (fileContains('src/components/Navigation/HelpMenu.tsx', 'RotateCw')) {
  checkPass('Restart Tour button icon imported');
} else {
  checkWarn('Restart Tour button may be missing');
}

// 6. Tour Safety
console.log('\n6. Checking Tour Safety...');
console.log('-------------------------');

if (fileContains('src/components/Onboarding/utils/tourSafety.ts', 'skipMissingAnchors')) {
  checkPass('Tour safety uses skipMissingAnchors');
} else {
  checkFail('skipMissingAnchors not configured');
}

if (
  fileContains('src/components/Onboarding/utils/tourSafety.ts', 'skipMissingAnchors: true')
) {
  checkPass('skipMissingAnchors enabled in safety utils');
} else {
  checkWarn('skipMissingAnchors may not be enabled');
}

// 7. Test Coverage
console.log('\n7. Checking Test Coverage...');
console.log('----------------------------');

const testFiles = [
  'src/components/Onboarding/__tests__/tourSafety.test.ts',
  'src/tour/__tests__/TourService.test.ts',
  'e2e/tour-happy-path.spec.ts',
];

testFiles.forEach((file) => {
  if (fileExists(file)) {
    checkPass(`Test file exists: ${file}`);
  } else {
    checkWarn(`Test file missing: ${file}`);
  }
});

// 8. Analytics
console.log('\n8. Checking Analytics...');
console.log('-----------------------');

const analyticsEvents = [
  { name: 'tour_started', method: 'tourAnalytics.started' },
  { name: 'tour_step_viewed', method: 'tourAnalytics.stepViewed' },
  { name: 'tour_completed', method: 'tourAnalytics.completed' },
  { name: 'tour_skipped', method: 'tourAnalytics.skipped' },
];

analyticsEvents.forEach(({ name, method }) => {
  if (fileContains('src/tour/TourService.ts', method)) {
    checkPass(`Analytics: ${name} tracked`);
  } else {
    checkWarn(`${name} event may not be tracked`);
  }
});

// Summary
console.log('\n==========================');
console.log('Summary');
console.log('==========================');
console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
console.log(`${colors.yellow}Warnings: ${warned}${colors.reset}\n`);

if (failed === 0) {
  console.log(`${colors.green}✓ All critical checks passed!${colors.reset}\n`);
  console.log('Next steps:');
  console.log('1. Run unit tests: pnpm test --run src/components/Onboarding/__tests__/');
  console.log('2. Run E2E tests: pnpm test:e2e e2e/tour-happy-path.spec.ts');
  console.log('3. Manual testing: pnpm dev');
  console.log('4. Test console command: inkwellStartTour()');
  process.exit(0);
} else {
  console.log(`${colors.red}✗ Some checks failed. Please review.${colors.reset}`);
  process.exit(1);
}
