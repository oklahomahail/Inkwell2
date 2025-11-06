#!/usr/bin/env node
/**
 * Brand Asset Validation Script
 * Ensures all required brand assets exist before building
 */

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Required brand assets for production
const REQUIRED_ASSETS = [
  // SVG assets (semantic names)
  'public/brand/inkwell-icon.svg',
  'public/brand/inkwell-lockup-dark.svg',
  'public/brand/inkwell-lockup-light.svg',

  // PNG icons for PWA and meta tags
  'public/brand/inkwell-icon-32.png',
  'public/brand/inkwell-icon-180.png',
  'public/brand/inkwell-icon-192.png',
  'public/brand/inkwell-icon-512.png',
  'public/brand/inkwell-og-1200x630.png',
];

// Check for missing assets
const missing = REQUIRED_ASSETS.filter((assetPath) => {
  const fullPath = join(projectRoot, assetPath);
  return !existsSync(fullPath);
});

if (missing.length > 0) {
  console.error('\n❌ Missing required brand assets:\n');
  missing.forEach((asset) => {
    console.error(`  - ${asset}`);
  });
  console.error('\nPlease ensure all brand assets are present before building.');
  console.error('See public/brand/README.md for more information.\n');
  process.exit(1);
}

console.log('✅ All required brand assets found');
process.exit(0);
