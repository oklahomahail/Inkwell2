const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files
const files = execSync('find src -type f -name "*.ts" -o -type f -name "*.tsx"', {
  encoding: 'utf-8',
})
  .trim()
  .split('\n')
  .filter(Boolean);

let count = 0;
files.forEach((file) => {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('src/utils/devLogger')) {
      const newContent = content.replace(/src\/utils\/devLogger/g, 'src/utils/devLog');
      fs.writeFileSync(file, newContent, 'utf-8');
      count++;
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
});

console.log(`✅ Fixed import paths in ${count} files`);
