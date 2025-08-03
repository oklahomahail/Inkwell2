// tailwind-text-replacer.js
const fs = require('fs');
const path = require('path');

const replacements = {
  'text-2xl': 'text-2xl font-bold',
  'text-xl': 'text-xl font-semibold leading-snug',
  'text-lg': 'text-lg font-medium',
  'text-sm': 'text-sm text-gray-600',
  'text-xs': 'text-xs text-gray-500',
};

function replaceClasses(content) {
  let updated = content;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    updated = updated.replace(regex, value);
  }
  return updated;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      const original = fs.readFileSync(fullPath, 'utf8');
      const replaced = replaceClasses(original);

      if (original !== replaced) {
        fs.writeFileSync(fullPath, replaced, 'utf8');
        console.log(`✅ Updated: ${fullPath}`);
      }
    }
  }
}

// Start at ./src
walkDir(path.join(__dirname, 'src'));
