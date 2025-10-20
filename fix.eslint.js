import * as fs from 'node:fs';
import * as path from 'node:path';

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

// Fix hook usage - replace direct useNavigate with useGo
function findFilesWithPattern(dir, pattern) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
        results.push(...findFilesWithPattern(fullPath, pattern));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (pattern.test(content)) {
        results.push(fullPath);
      }
    }
  }
  
  return results;
}

// Find files that import both useNavigate and useGo
const mixedNavigationHookFiles = findFilesWithPattern('src', /useNavigate.*useGo|useGo.*useNavigate/s);

if (mixedNavigationHookFiles.length > 0) {
  console.log('🔍 Found files mixing navigation hooks:', mixedNavigationHookFiles);
  
  mixedNavigationHookFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace direct useNavigate with useGo
    if (content.includes('import { useNavigate }') || 
        content.includes('useNavigate,') || 
        content.includes(', useNavigate') ||
        content.includes('useNavigate }')) {
      
      console.log(`🔧 Fixing navigation hooks in ${file}`);
      
      // Remove useNavigate from imports
      content = content.replace(/import\s+{\s*([^}]*)useNavigate([^}]*)\s*}\s*from\s+['"]react-router-dom['"];?/g, (match, before, after) => {
        const cleanBefore = before.replace(/,\s*$/, '');
        const cleanAfter = after.replace(/^\s*,\s*/, '');
        
        if (!cleanBefore && !cleanAfter) {
          return ''; // Remove the entire import if useNavigate was the only import
        }
        
        return `import { ${cleanBefore}${cleanBefore && cleanAfter ? ', ' : ''}${cleanAfter} } from 'react-router-dom';`;
      });
      
      // Ensure useGo is imported
      if (!content.includes("import { useGo }") && !content.includes("useGo }")) {
        content = content.replace(/import React/i, "import { useGo } from '@/utils/navigate';\nimport React");
        if (!content.includes("useGo from")) {
          content = "import { useGo } from '@/utils/navigate';\n" + content;
        }
      }
      
      // Replace useNavigate() instances with useGo()
      content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);?/g, 'const go = useGo();');
      
      // Replace navigate(...) calls with go(...)
      content = content.replace(/navigate\(/g, 'go(');
      
      fs.writeFileSync(file, content);
    }
  });
}

console.log('✅ Fixed ESLint errors');