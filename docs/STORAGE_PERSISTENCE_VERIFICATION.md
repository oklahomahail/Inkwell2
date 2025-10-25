# Storage Persistence Verification Guide

This guide helps you verify that Inkwell's IndexedDB data survives browser refreshes, re-authentication, and other scenarios.

## Quick Start

### Console Utilities

Open DevTools Console and run:

```javascript
// Check everything at once
await storageDebug.checkAll();

// Individual checks
await storageDebug.checkPersistence(); // Is storage persistent?
await storageDebug.requestPersistence(); // Request persistence permission
await storageDebug.checkQuota(); // Show usage and quota
await storageDebug.listDatabases(); // List all databases
await storageDebug.inspectDatabase('inkwell_v1'); // Inspect specific DB
await storageDebug.listStoreContents('inkwell_v1', 'projects'); // List items

// Simulate re-auth (clears Supabase tokens only)
storageDebug.clearAuthToken();
```

### E2E Persistence Test

```javascript
// Full automated test
await persistenceE2E.runFullTest();

// Manual step-by-step
await persistenceE2E.createTestData(); // Create test project & chapter
await persistenceE2E.verifyTestData(); // Check if data exists
persistenceE2E.simulateReauth(); // Clear auth token
// Refresh page, sign back in
await persistenceE2E.verifyTestData(); // Verify data survived
await persistenceE2E.cleanupTestData(); // Remove test data
```

## Verification Steps

### 1. Persistence Status Check

**What to check:**

- Is persistent storage granted?
- What's the storage quota and usage?
- Are there any warnings?

**How:**

```javascript
await storageDebug.checkAll();
```

**Expected output:**

```
[Storage] Persistence status: ✅ GRANTED
[Storage] Quota info:
  Used: 2.45 MB
  Total: 5.00 GB
  Percent: 0.05%
[Storage] Databases found: ["inkwell_v1"]
[Storage] Origin: https://inkwell.leadwithnexus.com
```

**What if persistence is NOT granted?**

```javascript
await storageDebug.requestPersistence();
```

This should prompt the user (if allowed by browser) to grant persistent storage.

### 2. Database Inspection

**Check what's in your database:**

```javascript
// List all databases
await storageDebug.listDatabases();
// → ["inkwell_v1"]

// Inspect structure
await storageDebug.inspectDatabase('inkwell_v1');
// → { name: 'inkwell_v1', version: 3, stores: ['projects', 'chapters', 'scenes'] }

// See actual data
await storageDebug.listStoreContents('inkwell_v1', 'projects', 10);
```

### 3. Refresh Test (Simplest)

**Goal:** Verify data survives a page refresh

**Steps:**

1. Create a unique test project/chapter
2. Hard refresh (Cmd/Ctrl + Shift + R)
3. Check if it's still there

**Using E2E helper:**

```javascript
await persistenceE2E.createTestData();
// Refresh page
await persistenceE2E.verifyTestData(); // Should show ✅
```

### 4. Re-authentication Test

**Goal:** Verify data survives sign-out/sign-in

**Why this matters:** IndexedDB is per-origin, not per-session. Clearing the auth token should NOT clear the database.

**Steps:**

1. **Create test data:**

   ```javascript
   await persistenceE2E.createTestData();
   ```

2. **Simulate re-auth (clears Supabase token only):**

   ```javascript
   persistenceE2E.simulateReauth();
   ```

3. **Refresh and sign back in**

4. **Verify data:**
   ```javascript
   await persistenceE2E.verifyTestData();
   ```

**Expected:** ✅ Test data survived

### 5. Browser Restart Test

**Goal:** Verify data survives browser close/reopen

**Steps:**

1. Create test data: `await persistenceE2E.createTestData()`
2. Close browser completely
3. Reopen browser and navigate to app
4. Sign in
5. Verify: `await persistenceE2E.verifyTestData()`

**Expected:** ✅ Test data survived (if persistence was granted)

### 6. Private Mode Test

**Goal:** Understand private mode limitations

**Steps:**

1. Open private/incognito window
2. Navigate to your app
3. Run: `await storageDebug.checkAll()`

**Expected:**

```
[Storage] Persistence status: ❌ NOT GRANTED
[Storage] Quota info:
  Used: 0 B
  Total: 10 MB  (severely limited)
  Percent: 0%
```

**Behavior in private mode:**

- Storage quota is very limited (often ~10MB)
- Data is cleared when window closes
- Your app should detect this and show a warning

**Check if your warning appears:**

```javascript
await storageDebug.checkAll();
// Look for: warnings: ["Running in private/incognito mode - data will be lost..."]
```

## Common Issues & Fixes

### Issue: Persistence Not Granted

**Symptom:**

```javascript
await storageDebug.checkPersistence();
// → ❌ NOT GRANTED
```

**Fix:**

```javascript
// Request it
const granted = await storageDebug.requestPersistence()
if (granted) {
  console.log('✅ Persistence granted!')
} else {
  console.log('❌ User denied or browser doesn't support')
}
```

**Note:** Browsers may require a user gesture (click) to grant persistence. Consider adding a "Keep my work safe" button in your UI.

### Issue: Data Disappeared After Re-auth

**Possible causes:**

1. **Different origin:**

   ```javascript
   await storageDebug.checkAll();
   // Check the "Origin" value
   ```

   Storage is per-origin. `localhost:3000` ≠ `localhost:5173` ≠ `your-app.vercel.app`

2. **Database version changed:**
   If you incremented the DB version without proper migration, old data may be lost.

3. **Manually cleared IndexedDB:**
   Check DevTools → Application → Storage → IndexedDB
   Did you accidentally delete it?

### Issue: Private Mode Warning Not Showing

**Check:**

```javascript
await storageDebug.checkQuota();
```

If quota is < 200MB, you're likely in private mode.

**Your app should detect this** in `storageHealth.ts`:

```javascript
const health = await getStorageHealth();
console.log(health.privateMode); // Should be true
console.log(health.warnings); // Should include private mode warning
```

### Issue: Service Worker Clearing Data

**Check your service worker:**

- Does it clear IndexedDB on `activate`?
- It should only clear Cache Storage, NOT IndexedDB

**Verify:**

```javascript
// In service worker code, look for:
indexedDB.deleteDatabase(...)  // ⚠️ This would delete data!
caches.delete(...)             // ✅ This is fine
```

## Origin-Specific Testing

**Remember:** IndexedDB storage is per-origin.

| Environment | Origin                              | Separate Storage |
| ----------- | ----------------------------------- | ---------------- |
| Local dev   | `http://localhost:5173`             | Yes              |
| Preview     | `https://inkwell-pr-123.vercel.app` | Yes              |
| Production  | `https://inkwell.leadwithnexus.com` | Yes              |

**Implications:**

- Test data created on localhost won't appear in production
- Each preview deployment has its own storage
- Moving from localhost to production = fresh database

**For testing continuity:**
Export/import your data when switching environments.

## Automated E2E Test Checklist

Use this checklist when testing persistence:

```javascript
// Step 1: Initial health check
await storageDebug.checkAll();
// ✅ Persisted: true
// ✅ Quota: > 1GB
// ✅ Databases: ["inkwell_v1"]

// Step 2: Create test data
await persistenceE2E.createTestData();
// ✅ Created: "PERSIST-E2E-TEST" project

// Step 3: Immediate verification
await persistenceE2E.verifyTestData();
// ✅ Found test data

// Step 4: Hard refresh
// (Cmd+Shift+R)
await persistenceE2E.verifyTestData();
// ✅ Data survived refresh

// Step 5: Re-auth test
persistenceE2E.simulateReauth();
// → Refresh, sign back in
await persistenceE2E.verifyTestData();
// ✅ Data survived re-auth

// Step 6: Browser restart
// → Close browser, reopen, sign in
await persistenceE2E.verifyTestData();
// ✅ Data survived restart

// Step 7: Cleanup
await persistenceE2E.cleanupTestData();
// ✅ Cleaned up 2 test items
```

## Integrating into Your UI

Consider adding a "Storage Health" panel to your app settings:

```tsx
import { useStorageHealth } from '@/hooks/useStorageHealth';

function StorageHealthPanel() {
  const health = useStorageHealth();

  return (
    <div>
      <h3>Storage Status</h3>
      <div>Persistence: {health.persisted ? '✅ Granted' : '❌ Not Granted'}</div>
      <div>
        Usage: {health.usageFormatted} / {health.quotaFormatted}
      </div>
      <div>Private Mode: {health.privateMode ? '⚠️ Yes' : '✅ No'}</div>
      {health.warnings.map((w) => (
        <div key={w}>⚠️ {w}</div>
      ))}
    </div>
  );
}
```

## Quick Reference

### Console Commands

| Command                                           | Purpose                 |
| ------------------------------------------------- | ----------------------- |
| `await storageDebug.checkAll()`                   | Full health check       |
| `await storageDebug.checkPersistence()`           | Check if persistent     |
| `await storageDebug.requestPersistence()`         | Request persistence     |
| `await storageDebug.checkQuota()`                 | Show quota info         |
| `await storageDebug.listDatabases()`              | List all DBs            |
| `await storageDebug.inspectDatabase(name)`        | Inspect DB structure    |
| `await storageDebug.listStoreContents(db, store)` | List items in store     |
| `storageDebug.clearAuthToken()`                   | Simulate re-auth        |
| `await persistenceE2E.runFullTest()`              | Run full E2E test       |
| `await persistenceE2E.createTestData()`           | Create test data        |
| `await persistenceE2E.verifyTestData()`           | Verify test data exists |
| `await persistenceE2E.cleanupTestData()`          | Remove test data        |
| `persistenceE2E.simulateReauth()`                 | Clear auth tokens       |

### Storage Health Status Codes

| Status              | Meaning                  |
| ------------------- | ------------------------ |
| `healthy: true`     | All good                 |
| `privateMode: true` | In private browsing      |
| `persisted: false`  | Storage not persistent   |
| `percentUsed > 80`  | Running low on space     |
| `restricted: true`  | Very limited quota       |
| `!dbExists`         | Database not initialized |

## Troubleshooting

### Data Lost After Deployment

**Check:**

1. Did you change the database name or version?
2. Are you testing the same origin?
3. Did the service worker change?

**Fix:**

- Add migration code for version bumps
- Test on the actual deployment URL
- Review SW changes

### Storage Full Errors

**Check:**

```javascript
await storageDebug.checkQuota();
```

**Fix:**

- Delete old projects
- Clear browser data
- Request more quota (browser-dependent)

### Private Mode Detection Not Working

**Verify detection logic:**

```javascript
const estimate = await navigator.storage.estimate();
console.log('Quota:', estimate.quota);
// If < 200MB, likely private mode
```

**Update detection threshold** in `storageHealth.ts` if needed.

## Further Reading

- [MDN: StorageManager API](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager)
- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Chrome: Persistent Storage](https://web.dev/persistent-storage/)
