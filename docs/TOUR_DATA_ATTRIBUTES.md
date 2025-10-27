# Tour Data Attributes Reference

Quick reference for implementing tour anchors in your UI components.

## Usage

Add `data-tour-id` attributes to elements that tours should highlight:

```tsx
<button data-tour-id="export-open">Export</button>
```

## Core Tour (Existing)

✅ Already implemented in the codebase

| Tour ID            | Element                     | Description              |
| ------------------ | --------------------------- | ------------------------ |
| `dashboard`        | Main dashboard container    | Welcome step target      |
| `sidebar`          | Navigation sidebar          | Navigation explanation   |
| `topbar`           | Top header bar              | Quick actions overview   |
| `storage-banner`   | Storage notification banner | Storage health alerts    |
| `focus-toggle`     | Focus mode toggle button    | Distraction-free writing |
| `help-tour-button` | Help menu button            | Tour restart option      |

## AI Tools Tour

🆕 **New tour variant** - Add these to your AI feature components:

| Tour ID           | Element                    | Description                      |
| ----------------- | -------------------------- | -------------------------------- |
| `model-selector`  | AI model dropdown/selector | Choose Claude, GPT-4, or Gemini  |
| `assistant-panel` | AI assistant panel toggle  | Draft, rewrite, brainstorm panel |
| `privacy-hint`    | Privacy notice/icon        | Data handling explanation        |

### Example Implementation

```tsx
// AI Settings Panel
<div className="ai-settings">
  <div data-tour-id="model-selector">
    <Select>
      <option>Claude</option>
      <option>GPT-4</option>
      <option>Gemini</option>
    </Select>
  </div>
</div>

// AI Assistant Panel
<aside data-tour-id="assistant-panel" className="ai-panel">
  {/* AI tools UI */}
</aside>

// Privacy Notice
<div data-tour-id="privacy-hint" className="privacy-badge">
  <InfoIcon /> Your data stays local
</div>
```

## Export Tour

🆕 **New tour variant** - Add these to your export feature:

| Tour ID           | Element                 | Description                       |
| ----------------- | ----------------------- | --------------------------------- |
| `export-open`     | Export button in topbar | Opens export modal                |
| `export-template` | Template selector       | Choose manuscript/synopsis format |
| `export-run`      | Generate/Export button  | Creates the PDF                   |

### Example Implementation

```tsx
// Topbar Export Button
<button data-tour-id="export-open" onClick={openExportModal}>
  <FileDown /> Export
</button>

// Export Modal
<Modal>
  <div data-tour-id="export-template">
    <RadioGroup>
      <Radio value="manuscript">Manuscript Format</Radio>
      <Radio value="synopsis">Synopsis</Radio>
      <Radio value="analysis">Analysis Summary</Radio>
    </RadioGroup>
  </div>

  <button data-tour-id="export-run" onClick={generatePDF}>
    Generate PDF
  </button>
</Modal>
```

## Best Practices

### ✅ Do's

- **Use stable selectors**: Prefer `data-tour-id` over classes or generic tags
- **Place on container**: Add to the wrapper element, not deeply nested children
- **Keep unique**: One `data-tour-id` per element
- **Be semantic**: Use descriptive IDs like `model-selector` not `btn-1`
- **Test visibility**: Ensure element is visible when tour reaches that step

### ❌ Don'ts

- **Don't use dynamic IDs**: Avoid `data-tour-id={`step-${index}`}`
- **Don't duplicate**: Each ID should appear only once in the DOM
- **Don't hide elements**: Tour will fail if target is `display: none`
- **Don't nest tours**: Avoid placing tour-id on elements inside other tour-id elements
- **Don't rely on order**: Tours should work regardless of DOM order

## Conditional Rendering

If a tour target might not always be present:

```tsx
// Option 1: Always render, hide with CSS
<div
  data-tour-id="assistant-panel"
  className={assistantOpen ? 'block' : 'hidden'}
>
  {/* Content */}
</div>

// Option 2: Use fallback selectors in tour config
{
  target: '[data-tour-id="assistant-panel"], .ai-panel-fallback',
  title: 'AI Assistant',
  content: 'Access AI tools here.',
  placement: 'left',
}
```

## Testing Tour Anchors

Use browser DevTools to verify anchors:

```javascript
// Check if element exists
document.querySelector('[data-tour-id="model-selector"]');

// List all tour anchors
document.querySelectorAll('[data-tour-id]');

// Highlight tour anchors (dev tool)
document.querySelectorAll('[data-tour-id]').forEach((el) => {
  el.style.outline = '2px solid red';
});
```

## Multiple Selectors

Tours support fallback selectors:

```typescript
{
  target: '[data-tour-id="export-open"], [aria-label="Export"], button.export-btn',
  title: 'Export Your Work',
  content: 'Click to access export options.',
  placement: 'bottom',
}
```

The tour will use the first matching selector.

## Dynamic Content

For dynamically loaded content:

```typescript
// Wait for element to be available
{
  target: '[data-tour-id="model-selector"]',
  title: 'AI Model Selector',
  content: 'Choose your AI model.',
  beforeShow: async () => {
    // Wait for AI panel to load
    await waitForElement('[data-tour-id="model-selector"]');
  },
  placement: 'bottom',
}
```

## Accessibility

Tour anchors should be accessible:

```tsx
// Good: Focusable element with aria-label
<button
  data-tour-id="export-open"
  aria-label="Export document"
>
  <FileDown />
</button>

// Bad: Non-semantic div without label
<div data-tour-id="export-open" onClick={handleExport}>
  Export
</div>
```

## Complete Checklist

Use this checklist when implementing tours:

- [ ] All `data-tour-id` attributes added to UI components
- [ ] Elements are visible when tour reaches them
- [ ] No duplicate `data-tour-id` values
- [ ] Elements are keyboard accessible
- [ ] Elements have proper ARIA labels
- [ ] Tour tested in development mode
- [ ] Tour tested with screen reader
- [ ] Tour tested on mobile/tablet viewports
- [ ] Analytics events verified in localStorage
- [ ] Tour can be restarted from Help menu

## Troubleshooting

| Issue                    | Solution                                 |
| ------------------------ | ---------------------------------------- |
| Tour step skipped        | Element not found - check `data-tour-id` |
| Spotlight not positioned | Element hidden or `display: none`        |
| Tour won't start         | Check console for errors                 |
| Step shows wrong element | Duplicate `data-tour-id` in DOM          |
| Analytics not recording  | Check localStorage quota                 |

## Quick Start Commands

```bash
# Search for tour anchors in codebase
grep -r "data-tour-id" src/

# Find missing tour anchors
# (Compare tour configs with actual DOM elements)

# Test specific tour
# In browser console:
inkwellTour.start(TOUR_REGISTRY['ai-tools'])
```

---

**Last Updated:** October 27, 2025
