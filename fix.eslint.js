const fs = require('fs');

// Fix App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace('process.env.NODE_ENV === \'development\'', 'import.meta.env.DEV');
fs.writeFileSync('src/App.tsx', app);

// Fix other files with regex replacements for unused variables
const files = [
  'src/components/Recovery/StorageRecoveryBanner.tsx',
  'src/services/connectivityService.ts', 
  'src/services/importService.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/} catch \(error\) {/g, '} catch (_error) {');
    content = content.replace(/process\.env\.NODE_ENV === 'development'/g, 'import.meta.env.DEV');
    fs.writeFileSync(file, content);
  }
});

console.log('✅ Fixed ESLint errors');