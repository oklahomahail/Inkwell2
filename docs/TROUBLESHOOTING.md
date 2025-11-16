# Troubleshooting Guide

Common issues and solutions for Inkwell.

---

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Settings Panel Problems](#settings-panel-problems)
3. [Storage & Data Issues](#storage--data-issues)
4. [Writing & Editing Issues](#writing--editing-issues)
5. [Focus Mode Issues](#focus-mode-issues)
6. [Performance Problems](#performance-problems)
7. [Browser Compatibility](#browser-compatibility)
8. [Development Environment](#development-environment)

---

## Authentication Issues

### Can't Sign In / Stuck at Auth Callback

**Symptoms**:

- Redirected to `/auth/callback` and stuck
- "Invalid credentials" error with correct password
- Session expires immediately after login

**Solutions**:

1. **Check Supabase Project Status**:
   - Visit [dashboard.supabase.com](https://dashboard.supabase.com)
   - Verify project is active and not paused
   - Check for service outages

2. **Verify Environment Variables**:

   ```bash
   # Check .env or .env.local
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_BASE_URL=http://localhost:5173  # or your domain
   ```

3. **Check Callback URLs in Supabase**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add these URLs:
     - `http://localhost:5173/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)
     - `http://localhost:5173` (site URL)

4. **Clear Browser Storage** (see [Complete Storage Reset](#complete-storage-reset))

5. **Try Different Browser/Incognito Mode**:
   - Rules out browser extension conflicts
   - Tests without cached data

### Password Reset Not Working

**Symptoms**:

- Password reset email not received
- Reset link expires or doesn't work

**Solutions**:

1. **Check SMTP Settings** in Supabase:
   - Dashboard → Project Settings → Auth → SMTP Settings
   - Verify email provider configuration
   - Test email delivery

2. **Check Spam Folder**:
   - Reset emails may be filtered

3. **Verify Email Templates**:
   - Dashboard → Authentication → Email Templates
   - Ensure "Reset Password" template is active

4. **Check Redirect URL**:
   - Must match configured callback URLs

---

## Settings Panel Problems

### Settings Panel Fails to Load

**Symptoms**:

- Clicking Settings shows blank page
- Console error: "Cannot read properties of undefined"
- Settings route doesn't render

**Causes**:

- Router/anchor guard issue
- Invalid route state
- Missing route configuration
- Browser extension conflict

**Solutions**:

1. **Hard Refresh**:
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + F5`

2. **Clear Browser Cache**:
   - Chrome: Settings → Privacy → Clear browsing data
   - Firefox: Preferences → Privacy → Clear Data
   - Safari: Preferences → Privacy → Manage Website Data

3. **Disable Browser Extensions**:
   - Try incognito/private mode first
   - If that works, disable extensions one by one

4. **Check Console for Errors**:
   - Open DevTools (F12)
   - Look for routing errors
   - Check Network tab for failed requests

5. **Navigate via URL**:
   - Try `/settings` directly in address bar
   - Try `/dashboard` then click Settings again

---

## Storage & Data Issues

### Duplicate Chapters Appearing

**Symptoms**:

- Chapters appear twice in the sidebar
- Analytics shows inflated chapter counts
- Occurs after navigating to analytics panel or syncing
- More common on Safari and mobile browsers

**Solutions**:

1. **Update to Latest Version** (Fixed in 2025-11-15 release):
   - Chapter duplication bug was fixed in recent update
   - Clear browser cache and hard reload (`Cmd+Shift+R` or `Ctrl+Shift+R`)
   - If using PWA, uninstall and reinstall the app

2. **Temporary Workaround** (if not updated):
   - Avoid rapid navigation between writing and analytics panels
   - Refresh the page to deduplicate display
   - Wait a few seconds between panel switches

3. **Clean Existing Duplicates**:

   The fix prevents new duplicates but doesn't remove existing ones. To clean up:

   **Option A - Manual Cleanup (DevTools)**:

   ```
   1. Open DevTools (F12)
   2. Application → IndexedDB → inkwell_chapters → chapter_meta
   3. Look for duplicate entries (same title/content, different timestamps)
   4. Right-click duplicate → Delete
   ```

   **Option B - Console Cleanup Script**:

   ```javascript
   // Open DevTools Console and paste:
   const db = await indexedDB.databases();
   const request = indexedDB.open('inkwell_chapters');
   request.onsuccess = async (e) => {
     const db = e.target.result;
     const tx = db.transaction('chapter_meta', 'readwrite');
     const store = tx.objectStore('chapter_meta');
     const all = await store.getAll();

     // Group by ID and keep most recent
     const seen = new Map();
     for (const chapter of all.result) {
       const existing = seen.get(chapter.id);
       if (!existing || new Date(chapter.updatedAt) > new Date(existing.updatedAt)) {
         if (existing) await store.delete(chapter.id);
         seen.set(chapter.id, chapter);
       } else {
         await store.delete(chapter.id);
       }
     }
     console.log('Cleanup complete!');
   };
   ```

4. **If Problem Persists**:
   - Export your project data (Settings → Export)
   - Clear all site data (DevTools → Application → Clear storage)
   - Sign back in and re-import project

**Technical Details**:

The bug was caused by sync operations using `.add()` instead of `.put()` in IndexedDB, which created duplicate entries instead of updating existing chapters. Fixed in `chaptersService.ts:210`.

### MutationObserver Errors

**Symptom**: Console shows "MutationObserver.observe... parameter 1 is not a Node"

**Cause**: DOM element not yet mounted when observer initializes

**Impact**: Usually harmless, auto-recovers

**Solutions**:

1. **Ignore if not causing issues** - This warning is cosmetic
2. **If persistent**:
   - Refresh the page
   - Clear browser cache
   - Update browser to latest version

### "Quota Exceeded" Errors

**Symptoms**:

- Can't save projects
- "Storage quota exceeded" error
- Data not persisting

**Solutions**:

1. **Check Storage Usage**:
   - Open DevTools (F12) → Application tab
   - Check IndexedDB size
   - Check localStorage size

2. **Export and Clean Up**:

   ```typescript
   // Export all projects first!
   // Then in DevTools Console:
   localStorage.clear();
   indexedDB.databases().then((dbs) => {
     dbs.forEach((db) => indexedDB.deleteDatabase(db.name));
   });
   ```

3. **Increase Browser Quota** (if available):
   - Chrome: Settings → Site Settings → Storage
   - Firefox: about:preferences#privacy

4. **Use Smaller Projects**:
   - Split large novels into parts
   - Archive completed works

### Data Not Saving

**Symptoms**:

- Changes disappear after refresh
- "Auto-save failed" message
- Work lost

**Solutions**:

1. **Check Browser Storage Permissions**:
   - Ensure site is allowed to store data
   - Check if private browsing is enabled (won't persist)

2. **Verify IndexedDB is Working**:

   ```javascript
   // In DevTools Console:
   indexedDB.databases().then(console.log);
   // Should show Inkwell databases
   ```

3. **Check for Storage Errors**:
   - Open DevTools Console
   - Look for "IndexedDB" or "storage" errors

4. **Manual Export as Backup**:
   - Use Dashboard → Export regularly
   - Keep backups of important work

### Complete Storage Reset

**⚠️ WARNING**: This deletes ALL local data. Export first!

**When to Use**:

- Last resort for persistent issues
- After major version upgrades
- When auth is completely broken

**Steps**:

1. **Export All Projects**:
   - Dashboard → Each project → Export
   - Save files to safe location

2. **Open Browser DevTools** (F12)

3. **Go to Application/Storage Tab**

4. **Run in Console**:

   ```javascript
   // Clear everything
   localStorage.clear();
   sessionStorage.clear();

   // Delete all IndexedDB databases
   indexedDB.databases().then((dbs) => {
     dbs.forEach((db) => {
       if (db.name) {
         console.log('Deleting database:', db.name);
         indexedDB.deleteDatabase(db.name);
       }
     });
   });
   ```

5. **Clear Cookies**:
   - Chrome: Settings → Privacy → Cookies → See all site data
   - Search for your domain
   - Remove all

6. **Hard Refresh** (Cmd+Shift+R / Ctrl+Shift+F5)

7. **Sign In Again**

8. **Import Projects** from exports

---

## Writing & Editing Issues

### Can't Create New Sections/Chapters

**Symptoms**:

- "New Section" button doesn't work after an error
- Button appears disabled or unresponsive
- Error message appears but can't retry
- Must refresh page to create sections again

**Solutions**:

1. **Update to Latest Version** (Fixed in 2025-11-15 release):
   - Section creation error recovery was improved
   - Rate limiter now resets on errors, allowing immediate retry
   - No longer need to refresh page after errors

2. **Immediate Workaround**:
   - Wait 1-2 seconds and try clicking again
   - If still blocked, refresh the page (`F5` or `Cmd+R`)

3. **Check Browser Console** for specific errors:
   - Open DevTools (`F12`) → Console tab
   - Look for errors related to IndexedDB or chapter creation
   - Common issues:
     - "Chapter not found" - Refresh and try again
     - "Storage quota exceeded" - See [Quota Exceeded Errors](#quota-exceeded-errors)
     - "Network error" - Check internet connection

4. **If Problem Persists**:
   - Save your work first (content auto-saves)
   - Hard reload: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Check that you have space available (see storage solutions above)

**Technical Details**:

Previously, the rate limiter prevented retry for 1000ms even after errors. Now it resets immediately on failure, allowing users to retry section creation without waiting. Fixed in `EnhancedWritingPanel.tsx:506`.

---

## Focus Mode Issues

### Can't Exit Focus Mode

**Symptoms**:

- Focus Mode won't exit
- Buttons don't work
- Stuck in full-screen

**Solutions**:

1. **Press Escape Key**: Primary exit method
2. **Press F11**: Toggles focus mode
3. **Click Exit Button**: Look for "Exit Focus" in top-right
4. **Refresh Page**: Cmd+R / Ctrl+R (work may be auto-saved)
5. **Press Esc twice**: Sometimes needed for nested focus states

### Focus Mode Not Entering

**Symptoms**:

- F11 doesn't work
- Focus button doesn't respond

**Solutions**:

1. **Check Browser Full-Screen Settings**:
   - Some browsers block full-screen without user gesture
   - Try clicking a button instead of keyboard shortcut

2. **Disable Browser Extensions**:
   - Extensions may intercept F11
   - Try incognito mode

3. **Check Console for Errors**:
   - Open DevTools
   - Look for permission or security errors

---

## Performance Problems

### Slow Loading / Lag

**Symptoms**:

- App loads slowly
- Typing has delay
- UI feels sluggish

**Solutions**:

1. **Check Project Size**:
   - Projects >100,000 words may be slower
   - Split into multiple projects

2. **Close Other Tabs**:
   - Free up browser memory
   - Close unused applications

3. **Clear Browser Cache**:
   - Old cached data can slow things down

4. **Disable Browser Extensions**:
   - Test in incognito mode
   - Remove unnecessary extensions

5. **Check System Resources**:
   - Close memory-intensive apps
   - Restart browser
   - Restart computer

### High Memory Usage

**Symptoms**:

- Browser uses lots of RAM
- System becomes slow
- "Page unresponsive" warnings

**Solutions**:

1. **Split Long Scenes**:
   - Break scenes at natural chapter breaks
   - Keep scenes under 5,000 words

2. **Close Unused Projects**:
   - Work on one project at a time

3. **Restart Browser Periodically**:
   - Fresh start clears memory leaks

4. **Use Desktop Instead of Mobile**:
   - Mobile browsers have less memory

---

## Browser Compatibility

### Recommended Browsers

- ✅ **Chrome** 90+ (best performance)
- ✅ **Firefox** 88+ (good privacy)
- ✅ **Safari** 14+ (Mac users)
- ✅ **Edge** 90+ (Windows users)

### Known Issues

**Internet Explorer**:

- ❌ Not supported (use Edge instead)

**Opera**:

- ⚠️ May have IndexedDB quirks

**Brave**:

- ⚠️ Shields may block some features
- Disable shields for Inkwell

**Safari Private Mode**:

- ⚠️ Storage won't persist between sessions

---

## Development Environment

### "indexedDB is not defined" in Tests

**Cause**: Node.js doesn't have IndexedDB

**Solution**: Add `fake-indexeddb` polyfill

```bash
pnpm add -D fake-indexeddb
```

```typescript
// vitest.setup.ts
import 'fake-indexeddb/auto';
```

<!-- See [docs/TESTING.md](./TESTING.md) for details. -->

### Environment Variables Not Loading

**Symptoms**:

- "Missing VITE_SUPABASE_URL" error
- Auth doesn't work in development

**Solutions**:

1. **Check File Name**:
   - Should be `.env` or `.env.local`
   - NOT `.env.example`

2. **Verify Variables Start with VITE\_**:

   ```bash
   VITE_SUPABASE_URL=...  # ✅ Correct
   SUPABASE_URL=...       # ❌ Won't work
   ```

3. **Restart Dev Server**:
   - Stop (`Ctrl+C`)
   - Run `pnpm dev` again

4. **Check .gitignore**:
   - Ensure `.env.local` is gitignored
   - Don't commit secrets to git

### TypeScript Errors After Update

**Symptoms**:

- Red squiggles everywhere
- "Cannot find module" errors

**Solutions**:

1. **Rebuild node_modules**:

   ```bash
   rm -rf node_modules
   pnpm install
   ```

2. **Clear TypeScript Cache**:

   ```bash
   rm -rf node_modules/.cache
   ```

3. **Restart TypeScript Server**:
   - VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"

4. **Check tsconfig.json**:
   - Ensure paths are correct
   - Verify include/exclude patterns

---

## Getting Further Help

### Before Reporting Issues

1. **Try troubleshooting steps above**
2. **Check browser console for errors** (F12)
3. **Export your work as backup**
4. **Note**:
   - Browser version
   - Operating system
   - Steps to reproduce
   - Error messages

### Where to Get Help

- **GitHub Issues**: [github.com/your-repo/issues](https://github.com)
- **Documentation**: `/docs` folder
- **Community**: Join our Discord/forum

### Useful Information to Include

```
Browser: Chrome 120.0.0
OS: macOS 14.1
Inkwell Version: 1.2.0

Steps to reproduce:
1. Go to Settings
2. Click AI Configuration
3. Error appears

Error message:
"Cannot read properties of undefined"

Console log:
[paste relevant errors]
```

---

**Last Updated**: October 25, 2025
