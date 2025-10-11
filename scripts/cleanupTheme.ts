// Cleanup script to remove legacy theme storage

function cleanupThemeStorage() {
  // Clear all potential theme-related storage
  localStorage.removeItem('theme');
  localStorage.removeItem('preferred_theme');
  localStorage.removeItem('inkwell_theme');
  localStorage.removeItem('ui_theme');

  // Remove any theme classes from document
  document.documentElement.classList.remove('dark');
  document.body.classList.remove('dark');

  // Log cleanup
  console.log('Theme storage cleared and dark mode classes removed');
}

// Execute cleanup
cleanupThemeStorage();

// Export for potential reuse
export { cleanupThemeStorage };
