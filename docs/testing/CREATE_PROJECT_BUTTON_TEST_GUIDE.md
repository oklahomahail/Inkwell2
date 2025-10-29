# Quick Test Guide: Create Project Button

## 🚀 Quick Start

```bash
# 1. Verify the fix
bash scripts/verify-create-project-fix.sh

# 2. Start dev server
pnpm dev

# 3. Navigate to dashboard and test
```

## ✅ Test Checklist

### Basic Functionality

- [ ] Dashboard loads without errors
- [ ] "Create Your First Project" button is visible (when no projects exist)
- [ ] Button is clickable and styled correctly
- [ ] Button opens NewProjectDialog modal
- [ ] Dialog has proper styling and layout

### Dialog Interaction

- [ ] Project name input field is focused on open
- [ ] Can type project name
- [ ] Can type description (optional)
- [ ] Placeholder text shows correctly
- [ ] Cancel button closes dialog
- [ ] X button closes dialog
- [ ] Escape key closes dialog
- [ ] Clicking outside closes dialog

### Project Creation

- [ ] Create button creates project with given name
- [ ] Create button works with empty name (defaults to "Untitled Project")
- [ ] Cmd/Ctrl+Enter submits the form
- [ ] After creation, navigates to Writing view
- [ ] New project appears in project list
- [ ] New project is set as current project

### Alternative Buttons

- [ ] "+ New Project" button in header (when projects exist)
- [ ] "Start New Project" button in Welcome (when projects exist)
- [ ] All buttons use the same dialog

### Edge Cases

- [ ] Dialog doesn't break with special characters in name
- [ ] Long project names are handled
- [ ] Very long descriptions are handled
- [ ] Rapid clicking doesn't create multiple dialogs

## 🐛 Debug Commands

### Check if UIProvider is loaded

```javascript
// In DevTools Console:
console.log('UIProvider loaded:', document.querySelector('[class*="UIProvider"]') !== null);
```

### Check button click handler

```javascript
// Get the button
const btn = document.querySelector('[data-testid="create-first-project"]');

// Check if it has onClick handler
console.log('Has onClick:', btn.onclick !== null || btn.getAttribute('onclick') !== null);

// Manually trigger click
btn.click();
```

### Check context state

```javascript
// This requires React DevTools
// 1. Open React DevTools
// 2. Select DashboardPanel component
// 3. Check props/hooks for 'openNewProjectDialog'
```

## 📊 Console Output Examples

### ✅ Success

```
No errors in console
Dialog opens smoothly
Project created successfully
```

### ❌ Failure (Before Fix)

```
[Silent failure - button does nothing]
No console errors (which was the problem!)
```

### ❌ Provider Missing

```
Warning: useContext called outside of UIProvider
```

## 🔍 Visual Inspection

### Button States

- Default: Blue background (`bg-blue-600`)
- Hover: Darker blue (`hover:bg-blue-700`)
- Icon: Plus circle visible
- Text: "Create Your First Project"

### Dialog Appearance

- Backdrop: Semi-transparent black
- Modal: White with rounded corners
- Title: "Create New Project"
- Inputs: Two text fields (name, description)
- Buttons: Cancel (ghost) and Create (primary)

## 🎯 Performance Check

```bash
# Check bundle size impact
pnpm build

# Should be minimal since UIProvider was always in bundle,
# just not being used
```

## 🔄 Regression Tests

After fix, ensure these still work:

- [ ] Sidebar toggle
- [ ] Other modals (Search, Notifications, Help)
- [ ] Navigation between views
- [ ] Project selection
- [ ] All existing features

## 📝 Known Issues

None after fix applied.

## 🆘 If Problems Persist

1. **Clear browser cache**: Cmd+Shift+R (Chrome)
2. **Clear storage**: DevTools → Application → Clear storage
3. **Check console**: Look for any React warnings
4. **Verify provider**: Run verification script
5. **Restart dev server**: Stop and run `pnpm dev` again

## 📞 Support

If issues persist after following this guide:

1. Check `docs/troubleshooting/CREATE_PROJECT_BUTTON_FIX.md`
2. Review `CREATE_PROJECT_BUTTON_FIX_SUMMARY.md`
3. Check Git history for `AppProviders.tsx` changes
