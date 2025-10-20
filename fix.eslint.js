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

// Find files that only use useNavigate but could be converted
const useNavigateOnlyFiles = findFilesWithPattern('src', /useNavigate/);
const useNavigateWithoutGoFiles = useNavigateOnlyFiles.filter(file => 
  !mixedNavigationHookFiles.includes(file)
);

// First handle files with mixed hooks
if (mixedNavigationHookFiles.length > 0) {
  console.log('� Found files mixing navigation hooks:', mixedNavigationHookFiles);
  
  mixedNavigationHookFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace direct useNavigate with useGo
    if (content.includes('import { useNavigate }') || 
        content.includes('useNavigate,') || 
        content.includes(', useNavigate') ||
        content.includes('useNavigate }')) {
      
      console.log(`🔧 Fixing mixed navigation hooks in ${file}`);
      
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
      
      // Fix useEffect dependencies that might reference navigate
      content = content.replace(/\[([^\]]*?)navigate([^\]]*?)\]/g, '[$1go$2]');
      
      fs.writeFileSync(file, content);
    }
    
    // Check if any useNavigate calls were missed
    if (content.includes('useNavigate(')) {
      console.warn(`⚠️ WARNING: File ${file} still has useNavigate() calls that couldn't be automatically fixed. Please review manually.`);
    }
  });
}

// Then handle files that only use useNavigate
if (useNavigateWithoutGoFiles.length > 0) {
  console.log('🔍 Found files using only useNavigate that can be converted:', useNavigateWithoutGoFiles);
  
  useNavigateWithoutGoFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    console.log(`🔧 Converting useNavigate to useGo in ${file}`);
    
    // Add useGo import
    content = content.replace(/import\s+{\s*([^}]*)useNavigate([^}]*)\s*}\s*from\s+['"]react-router-dom['"];?/g, (match, before, after) => {
      const cleanBefore = before.replace(/,\s*$/, '');
      const cleanAfter = after.replace(/^\s*,\s*/, '');
      
      if (!cleanBefore && !cleanAfter) {
        // useNavigate was the only import, replace with useGo
        return `import { useGo } from '@/utils/navigate';`;
      }
      
      return `import { ${cleanBefore}${cleanBefore && cleanAfter ? ', ' : ''}${cleanAfter} } from 'react-router-dom';\nimport { useGo } from '@/utils/navigate';`;
    });
    
    // Replace useNavigate() instances with useGo()
    content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);?/g, 'const go = useGo();');
    
    // Replace navigate(...) calls with go(...)
    content = content.replace(/navigate\(/g, 'go(');
    
    // Fix useEffect dependencies that might reference navigate
    content = content.replace(/\[([^\]]*?)navigate([^\]]*?)\]/g, '[$1go$2]');
    
    fs.writeFileSync(file, content);
    
    // Check if any useNavigate calls were missed
    if (content.includes('useNavigate(')) {
      console.warn(`⚠️ WARNING: File ${file} still has useNavigate() calls that couldn't be automatically fixed. Please review manually.`);
    }
  });
}

// Look for bad conditional hook patterns
const conditionalHookFiles = findFilesWithPattern('src', /if\s*\([^)]*\)\s*\{\s*.*use[A-Z]/);
if (conditionalHookFiles.length > 0) {
  console.warn('⚠️ WARNING: Found potential conditional hook usage (violates Rules of Hooks):');
  conditionalHookFiles.forEach(file => {
    console.warn(`  - ${file} (please review manually)`);
  });
}

// Check for hooks used inside loops, callbacks or nested functions
const badHookPatternFiles = findFilesWithPattern('src', /for\s*\([^)]*\)\s*\{[^{]*use[A-Z]|\.map\s*\([^)]*\)\s*=>\s*\{[^{]*use[A-Z]|\(\)\s*=>\s*\{[^{]*use[A-Z]/);
if (badHookPatternFiles.length > 0) {
  console.warn('⚠️ WARNING: Found potential hooks inside loops, callbacks or nested functions (violates Rules of Hooks):');
  badHookPatternFiles.forEach(file => {
    console.warn(`  - ${file} (please review manually)`);
  });
}

console.log('✅ Fixed ESLint errors');