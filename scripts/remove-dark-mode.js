const fs = require('fs');
const path = require('path');

// Function to remove dark mode classes
function removeDarkModeClasses(content) {
  // Remove Tailwind dark: variants
  content = content.replace(/dark:[^"'\s}]+/g, '');
  
  // Clean up multiple spaces and empty class strings
  content = content.replace(/className=["']\s+["']/g, 'className=""');
  content = content.replace(/\s+/g, ' ');
  
  // Clean up leftover commas and spaces in className concatenations
  content = content.replace(/className={\[([^}]+)\]}/g, (match, group) => {
    // Clean up the class list
    const cleaned = group
      .split(',')
      .map(item => item.trim())
      .filter(item => item && !item.includes('dark:'))
      .join(', ');
    return cleaned ? `className={[${cleaned}]}` : 'className=""';
  });

  return content;
}

// Function to process a file
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = removeDarkModeClasses(content);
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${filePath}`);
  }
}

// Function to recursively process directory
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (
      /\.(tsx|jsx|ts|js)$/.test(file) &&
      !file.includes('.test.') &&
      !file.includes('.spec.')
    ) {
      processFile(filePath);
    }
  });
}

// Start processing from src directory
processDirectory(path.join(__dirname, '..', 'src'));