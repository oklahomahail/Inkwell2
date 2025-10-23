// scripts/tailwind-text-replacer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-friendly filename/dirname without shadowing Node globals in ESLint
const FILE_ESM = fileURLToPath(import.meta.url);
const DIR_ESM = path.dirname(FILE_ESM);

// --- Replacement map: extend as needed ---
const replacements = {
  'text-xl': 'text-xl font-semibold leading-snug',
  'text-lg': 'text-lg font-semibold',
  'text-sm': 'text-sm',
  'text-2xl': 'text-2xl font-bold',
  'text-gray-600': 'text-gray-600',
  'text-gray-900': 'text-gray-900',

  // Custom aliases
  'heading-xl': 'text-3xl font-bold leading-tight',
  'text-base': 'text-base leading-normal',
  'text-3xl': 'text-3xl font-extrabold leading-tight',
  'text-muted': 'text-gray-500 italic',
};

// --- File extensions to process ---
const validExtensions = new Set(['.tsx', '.ts', '.jsx', '.js', '.html', '.mdx']);

// --- Directories to skip during traversal ---
const ignoreDirs = new Set(['node_modules', 'dist', 'build', '.git']);

// --- Target directory (repoRoot/src) ---
const targetDir = path.resolve(DIR_ESM, '../src');

// --- Utilities ---
function escapeRegExp(str) {
  // Safer regex generation when class names include dashes, etc.
  return str.replace(/[.*+?^${}|[\]\\]/g, '\\$&');
}

function shouldProcessFile(fileName) {
  return validExtensions.has(path.extname(fileName));
}

// Replace class tokens with word-boundary matches to avoid partial hits
function replaceInFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let content = original;

  for (const [key, value] of Object.entries(replacements)) {
    const re = new RegExp(`\\b${escapeRegExp(key)}\\b`, 'g');
    content = content.replace(re, value);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      walk(fullPath);
      continue;
    }

    if (entry.isFile() && shouldProcessFile(entry.name)) {
      replaceInFile(fullPath);
    }
  }
}

// --- Run ---
if (!fs.existsSync(targetDir)) {
  console.error('❌ Target directory not found:', targetDir);
  process.exitCode = 1;
} else {
  walk(targetDir);
  console.log('✨ Tailwind text replacement complete.');
}
