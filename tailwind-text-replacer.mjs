// tailwind-text-replacer.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replacement map: add/extend freely
const replacements = {
  'text-xl': 'text-xl font-semibold leading-snug',
  'text-lg': 'text-lg font-semibold',
  'text-sm': 'text-sm',
  'text-2xl': 'text-2xl font-bold',
  'text-gray-600': 'text-gray-600',
  'text-gray-900': 'text-gray-900',
  // Extend here:
  'heading-xl': 'text-3xl font-bold leading-tight',
  'text-base': 'text-base leading-normal',
   'text-3xl': 'text-3xl font-extrabold leading-tight',
  'text-muted': 'text-gray-500 italic',
  // etc...
};

// File extensions to process
const validExtensions = ['.tsx', '.ts', '.jsx', '.js', '.html', '.mdx'];

// Directory to walk
const targetDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    content = content.replace(regex, value);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (
      entry.isFile() &&
      validExtensions.includes(path.extname(entry.name))
    ) {
      replaceInFile(fullPath);
    }
  }
}

// Run the replacement
walk(targetDir);
