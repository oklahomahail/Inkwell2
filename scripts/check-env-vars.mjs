#!/usr/bin/env node

/**
 * CI Environment Variable Check
 *
 * Ensures .env.example contains all required VITE_ variables
 * Run this in CI to catch missing environment variable documentation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Required environment variables
const REQUIRED_VARS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_BASE_URL'];

// Optional but recommended variables
const RECOMMENDED_VARS = ['VITE_SENTRY_DSN'];

function checkEnvExample() {
  const envExamplePath = join(rootDir, '.env.example');

  try {
    const envExample = readFileSync(envExamplePath, 'utf-8');
    const lines = envExample.split('\n');
    const definedVars = new Set();

    // Parse .env.example to find all defined variables
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key] = trimmed.split('=');
        if (key) {
          definedVars.add(key.trim());
        }
      }
    }

    // Check required variables
    const missingRequired = REQUIRED_VARS.filter((v) => !definedVars.has(v));
    const missingRecommended = RECOMMENDED_VARS.filter((v) => !definedVars.has(v));

    if (missingRequired.length > 0) {
      console.error('❌ Missing required environment variables in .env.example:');
      missingRequired.forEach((v) => console.error(`   - ${v}`));
      console.error('\nPlease add these variables to .env.example');
      process.exit(1);
    }

    if (missingRecommended.length > 0) {
      console.warn('⚠️  Missing recommended environment variables in .env.example:');
      missingRecommended.forEach((v) => console.warn(`   - ${v}`));
      console.warn('\nConsider adding these for a complete setup');
    }

    console.log('✅ All required environment variables are documented in .env.example');
    console.log(`   Required: ${REQUIRED_VARS.join(', ')}`);

    if (missingRecommended.length === 0) {
      console.log(`   Recommended: ${RECOMMENDED_VARS.join(', ')}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error reading .env.example:', error.message);
    process.exit(1);
  }
}

checkEnvExample();
