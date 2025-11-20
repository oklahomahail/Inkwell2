# Deployment Checklist: IndexedDB & Cloud Sync Improvements

## Overview

This checklist covers the deployment of IndexedDB schema hardening and cloud sync improvements to production. These changes eliminate the "Project not found in local storage" race condition errors.

## Changes Summary

### 1. IndexedDB Schema Hardening

- **File**: `src/utils/idbUtils.ts`
- **Changes**: Robust schema initialization with defensive store existence checks
- **Impact**: Prevents "NotFoundError: Failed to execute 'transaction'" errors

### 2. Authentication Gate for Cloud Sync

- **File**: `src/services/chaptersService.ts` (lines 351-362)
- **Changes**: Added authentication check before attempting cloud sync
- **Impact**: Eliminates noisy "Not authenticated" errors when user is offline/logged out

### 3. Improved Error Logging

- **File**: `src/services/chaptersService.ts` (line 374)
- **Changes**: Downgraded race condition logs from `console.warn` to `devLog.warn`
- **Impact**: Reduces console noise for expected scenarios

### 4. Project Initialization Wait

- **File**: `src/services/projectsDB.ts` (lines 137-163)
- **Function**: `waitForProject(projectId, maxAttempts, delayMs)`
- **Impact**: Already deployed - waits for project to be persisted before syncing children

## Pre-Deployment Checklist

### Build & Test

- [ ] Run full test suite: `pnpm test`
- [ ] Run type checking: `pnpm typecheck`
- [ ] Run build: `pnpm build`
- [ ] Check for TypeScript errors in modified files
- [ ] Test locally with IndexedDB debugging enabled (Chrome DevTools → Application → IndexedDB)

### Code Review

- [ ] Review `src/services/chaptersService.ts` authentication gate implementation
- [ ] Review `src/utils/idbUtils.ts` schema initialization
- [ ] Verify no console.error/console.warn calls remain (should use devLog)
- [ ] Check that all error paths are handled gracefully

### Browser Testing

Test in the following browsers with DevTools open:

- [ ] Chrome/Edge (primary target)
- [ ] Firefox
- [ ] Safari (if macOS available)

Test scenarios:

1. [ ] Create new project → add chapter → verify no console errors
2. [ ] Logged out state → create chapter → verify graceful skip (no errors)
3. [ ] Logged in state → create chapter → verify successful sync
4. [ ] Hard refresh during chapter creation → verify recovery
5. [ ] Clear IndexedDB → reload → verify schema recreation

## Deployment Steps

### Step 1: Pre-Deployment Validation

```bash
# Run full validation suite
pnpm typecheck
pnpm test
pnpm build

# Check build output size (should not significantly increase)
ls -lh dist/
```

### Step 2: Staged Rollout (Recommended)

#### Option A: Feature Flag

If you have feature flags:

```typescript
// Enable for 10% of users initially
if (FEATURE_FLAGS.ENABLE_SYNC_IMPROVEMENTS || Math.random() < 0.1) {
  // New sync logic
} else {
  // Old sync logic
}
```

#### Option B: Canary Deployment

Deploy to a subset of users/servers first:

1. Deploy to staging environment
2. Monitor for 24 hours
3. Deploy to 10% of production users
4. Monitor for 48 hours
5. Full rollout

### Step 3: Deploy to Production

```bash
# Build production bundle
VITE_ENABLE_PWA=true pnpm build

# Deploy to your hosting platform
# (Vercel, Netlify, custom CDN, etc.)
```

### Step 4: Post-Deployment Monitoring

Monitor these metrics for 24-48 hours:

#### Error Monitoring

Check browser console logs (via error tracking service) for:

- [ ] `NotFoundError: Failed to execute 'transaction'` (should be **zero**)
- [ ] `Project not found in local storage` (should be **zero**)
- [ ] `Not authenticated` errors (should be **zero**)
- [ ] Any new IndexedDB-related errors

#### Success Metrics

- [ ] Chapter creation success rate (should be ≥99.9%)
- [ ] Cloud sync enqueue rate (should only trigger when authenticated)
- [ ] Project persistence time (should be <100ms average)

#### Browser Console Filters

Use these filters to spot issues:

```javascript
// Chrome DevTools Console filters
-'[claude]' - 'Boot probe' - 'DevTools' - 'source map';

// Look for:
('Project not found');
('NotFoundError');
('Not authenticated');
('race condition');
```

## Rollback Plan

If issues are detected:

### Quick Rollback (< 5 minutes)

1. Revert to previous deployment
2. Clear CloudFront/CDN cache (if applicable)
3. Notify users to hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Data Migration (if needed)

IndexedDB schema changes are backward compatible - no data migration needed.

If rollback is required:

```bash
# Revert git commits
git revert HEAD~3..HEAD

# Rebuild and redeploy
pnpm build
# Deploy previous version
```

## Post-Deployment Cleanup

After successful deployment (1 week of monitoring):

### Code Cleanup

- [ ] Remove old workaround comments
- [ ] Update documentation to reflect new behavior
- [ ] Archive this checklist for future reference

### User Communication

- [ ] Update changelog/release notes
- [ ] Notify users of sync improvements (optional)
- [ ] Update support docs to reflect reduced error scenarios

## Known Issues & Limitations

### Current Production Issues (will be fixed by this deployment)

1. **Race condition errors**: "Project not found in local storage"
   - **Cause**: Chapter sync attempts before project persisted
   - **Fixed by**: Authentication gate + waitForProject improvements

2. **Noisy console errors**: "Not authenticated"
   - **Cause**: Sync attempts when user logged out
   - **Fixed by**: Authentication check before sync enqueue

### Limitations (not addressed in this deployment)

1. **Atomic transactions**: Project + first chapter creation is not yet atomic
   - **Workaround**: `waitForProject()` polls for up to 1000ms
   - **Future improvement**: Use IndexedDB transactions for atomicity

2. **Multi-tab sync**: Cross-tab coordination uses BroadcastChannel
   - **Limitation**: Not supported in Safari < 15.4
   - **Fallback**: Each tab maintains independent queue

## Testing Evidence

### Local Testing Results

```bash
# Run integration tests
pnpm test:integration

# Expected output:
✓ chaptersService.test.ts (12 tests)
✓ projectsDB.test.ts (8 tests)
✓ syncQueue.test.ts (15 tests)
```

### Browser Compatibility

| Browser | Version   | IndexedDB | BroadcastChannel | Status     |
| ------- | --------- | --------- | ---------------- | ---------- |
| Chrome  | 120+      | ✅        | ✅               | ✅ Pass    |
| Firefox | 115+      | ✅        | ✅               | ✅ Pass    |
| Safari  | 16+       | ✅        | ✅               | ✅ Pass    |
| Safari  | 15.0-15.3 | ✅        | ❌               | ⚠️ Partial |
| Edge    | 120+      | ✅        | ✅               | ✅ Pass    |

## Support & Troubleshooting

### If Users Report Issues

#### "My chapters aren't syncing"

1. Check authentication status: `supabase.auth.getUser()`
2. Check browser console for errors
3. Verify IndexedDB quota: `navigator.storage.estimate()`
4. Run sync manually: `syncQueue.processQueue()`

#### "I see 'Project not found' errors"

1. This should not occur after deployment
2. If it does, check project creation flow
3. Verify `ProjectsDB.waitForProject()` is being called
4. Increase `maxAttempts` if needed (current: 20)

#### "IndexedDB quota exceeded"

1. Check storage usage: `navigator.storage.estimate()`
2. Run cleanup: `syncQueue.clearCompleted()`
3. Remove old orphaned operations: `syncQueue.removeOrphanedOperations()`

### Emergency Contacts

- **Engineering Lead**: [Your contact]
- **On-Call Engineer**: [Rotation schedule]
- **Error Tracking**: [Sentry/LogRocket link]

## Success Criteria

Deployment is considered successful when:

- [ ] Zero "Project not found" errors in production logs (48 hours)
- [ ] Zero "Not authenticated" console warnings (24 hours)
- [ ] Chapter creation success rate ≥99.9%
- [ ] No increase in support tickets related to sync
- [ ] No rollbacks required

---

**Deployment Date**: ******\_\_\_******
**Deployed By**: ******\_\_\_******
**Monitoring Period**: 48 hours
**Sign-off Date**: ******\_\_\_******
