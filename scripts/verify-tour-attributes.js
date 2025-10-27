/**
 * DevTools Verification Script for Tour Data Attributes
 * 
 * Run this in the browser console to verify all tour data-tour-id attributes
 * are present and visible in the DOM.
 * 
 * Usage:
 * 1. Open DevTools (F12 or Cmd+Option+I)
 * 2. Copy and paste this entire script into the console
 * 3. Press Enter
 */

(function verifyTourDataAttributes() {
  console.log('🔍 Verifying Tour Data Attributes...\n');

  // Expected tour attributes with their descriptions
  const expectedAttributes = {
    // Core Tour (already implemented)
    'dashboard': { location: 'Main dashboard container', tour: 'Core' },
    'sidebar': { location: 'Navigation sidebar', tour: 'Core' },
    'topbar': { location: 'Top header bar', tour: 'Core' },
    
    // Export Tour
    'export-open': { location: 'Export button in topbar', tour: 'Export' },
    'export-template': { location: 'Template radio group', tour: 'Export' },
    'export-run': { location: 'Generate PDF button', tour: 'Export' },
    
    // AI Tools Tour
    'model-selector': { location: 'AI model dropdown', tour: 'AI Tools' },
    'assistant-panel': { location: 'AI assistant panel', tour: 'AI Tools' },
    'privacy-hint': { location: 'Privacy notice', tour: 'AI Tools' },
  };

  const results = {
    found: [],
    missing: [],
    hidden: [],
  };

  // Check each expected attribute
  Object.entries(expectedAttributes).forEach(([tourId, info]) => {
    const element = document.querySelector(`[data-tour-id="${tourId}"]`);
    
    if (!element) {
      results.missing.push({ tourId, ...info });
      return;
    }

    // Check if element is visible
    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0 && 
                     window.getComputedStyle(element).display !== 'none' &&
                     window.getComputedStyle(element).visibility !== 'hidden';

    if (isVisible) {
      results.found.push({ tourId, ...info, element });
    } else {
      results.hidden.push({ tourId, ...info, element });
    }
  });

  // Display results
  console.log('✅ FOUND & VISIBLE (%d):', results.found.length);
  results.found.forEach(({ tourId, location, tour }) => {
    console.log(`   • [${tour}] ${tourId} → ${location}`);
  });

  if (results.hidden.length > 0) {
    console.log('\n⚠️  FOUND BUT HIDDEN (%d):', results.hidden.length);
    results.hidden.forEach(({ tourId, location, tour }) => {
      console.log(`   • [${tour}] ${tourId} → ${location}`);
      console.log(`     (May require user action to reveal)`);
    });
  }

  if (results.missing.length > 0) {
    console.log('\n❌ MISSING (%d):', results.missing.length);
    results.missing.forEach(({ tourId, location, tour }) => {
      console.log(`   • [${tour}] ${tourId} → ${location}`);
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  const total = Object.keys(expectedAttributes).length;
  const foundCount = results.found.length + results.hidden.length;
  const percentage = Math.round((foundCount / total) * 100);
  
  console.log(`📊 SUMMARY: ${foundCount}/${total} attributes present (${percentage}%)`);
  
  if (results.missing.length === 0) {
    console.log('✨ All tour data attributes are implemented!');
  } else {
    console.log(`⚠️  ${results.missing.length} attributes still need to be added.`);
  }

  // Highlight visible elements
  if (results.found.length > 0) {
    console.log('\n💡 TIP: Run highlightTourElements() to visually highlight all tour anchors');
  }

  // Make highlighting function globally available
  window.highlightTourElements = function() {
    // Remove existing highlights
    document.querySelectorAll('.tour-highlight-overlay').forEach(el => el.remove());
    
    results.found.forEach(({ element, tourId }) => {
      const rect = element.getBoundingClientRect();
      const overlay = document.createElement('div');
      overlay.className = 'tour-highlight-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid #ff0000;
        background: rgba(255, 0, 0, 0.1);
        pointer-events: none;
        z-index: 999999;
      `;
      
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        top: -20px;
        left: 0;
        background: #ff0000;
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        font-family: monospace;
        border-radius: 2px;
        white-space: nowrap;
      `;
      label.textContent = tourId;
      overlay.appendChild(label);
      
      document.body.appendChild(overlay);
    });

    console.log('✨ Tour elements highlighted in red!');
    console.log('💡 Run clearTourHighlights() to remove highlights');
  };

  window.clearTourHighlights = function() {
    document.querySelectorAll('.tour-highlight-overlay').forEach(el => el.remove());
    console.log('✨ Highlights cleared!');
  };

  return {
    found: results.found.length,
    hidden: results.hidden.length,
    missing: results.missing.length,
    total: total,
    percentage: percentage,
    details: results,
  };
})();
