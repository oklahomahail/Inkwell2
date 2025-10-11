// Script to apply fixes for detailed undefined and event param shadowing
import { cleanupStorage } from './cleanupTheme';

// Run the script
async function main() {
  // Clear theme storage
  cleanupStorage();

  // Clean up dark mode persistence
  localStorage.removeItem('theme');
  sessionStorage.removeItem('theme');
  document.documentElement.classList.remove('dark');
  document.body.classList.remove('dark');

  console.log('Fixes applied successfully!');
  console.log('Theme storage cleared');
  console.log('Dark mode classes removed');
}

// Execute
main().catch(console.error);
