# Real-Time Chapter Sync - Deployment Checklist

## ✅ Implementation Status

### Completed

- [x] Real-time sync service (`chaptersSyncService.ts`)
- [x] Chapter management hook (`useChaptersHybrid.ts`)
- [x] Real-time status UI component (`RealtimeStatus.tsx`)
- [x] WritingPanel integration
- [x] Build successfully passes
- [x] TypeScript type checks pass
- [x] ESLint warnings resolved (only pre-existing warnings remain)

## 🚀 Pre-Deployment Checks

### 1. Supabase Configuration

**Action Required:** Verify Supabase Realtime is enabled

```sql
-- Run this in Supabase SQL Editor to verify realtime is enabled
ALTER PUBLICATION supabase_realtime ADD TABLE chapters;
```

**Verify:**

1. Open Supabase Dashboard → Database → Replication
2. Ensure `chapters` table is listed under "Realtime"
3. If not listed, run the SQL command above

### 2. Database Schema

**Verify chapters table exists with correct columns:**

```sql
-- Verify table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'chapters';
```

**Required columns:**

- `id` (text, primary key)
- `project_id` (text, foreign key)
- `title` (text)
- `content` (text)
- `summary` (text)
- `word_count` (integer)
- `order_index` (integer)
- `status` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 3. Row-Level Security (RLS)

**Verify RLS policies are in place:**

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'chapters';
```

**Required policies:**

- Users can read their own chapters
- Users can create chapters for their own projects
- Users can update their own chapters
- Users can delete their own chapters

### 4. Environment Variables

**Verify .env file has:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Build and Test

**Run final checks:**

```bash
# Type check
pnpm typecheck

# Build
pnpm build

# Test locally (optional)
pnpm dev
```

## 📋 Deployment Steps

### Step 1: Commit Changes

```bash
git add src/services/chaptersSyncService.ts \
        src/hooks/useChaptersHybrid.ts \
        src/components/Chapters/RealtimeStatus.tsx \
        src/components/Writing/EnhancedWritingPanel.tsx \
        docs/REALTIME_SYNC_IMPLEMENTATION.md \
        docs/REALTIME_INTEGRATION_EXAMPLE.md

git commit -m "feat: add real-time chapter sync with Supabase

- Implement bidirectional sync (IndexedDB ↔ Supabase)
- Add WebSocket-based real-time updates
- Create RealtimeStatus component with visual indicators
- Integrate chapter management into WritingPanel
- Support offline-first with graceful degradation
- Add debounced autosave (600ms)
- Background sync every 3 minutes


```

### Step 2: Push to Repository

```bash
git push origin main
```

### Step 3: Verify Vercel Deployment

1. Wait for Vercel build to complete
2. Check build logs for errors
3. Visit production URL

### Step 4: Test in Production

**Manual Testing Checklist:**

1. **Single Device Testing**
   - [ ] Create a new project
   - [ ] Create a new chapter
   - [ ] Edit chapter content
   - [ ] Verify autosave (RealtimeStatus shows "Syncing" → "Saved")
   - [ ] Click manual sync button
   - [ ] Refresh page - verify content persists

2. **Multi-Device Testing**
   - [ ] Open same project in two browser tabs
   - [ ] Edit content in Tab 1
   - [ ] Verify Tab 2 shows "Live update" flash
   - [ ] Verify Tab 2 content updates automatically
   - [ ] Test bidirectional updates

3. **Offline Testing**
   - [ ] Open DevTools → Network → Throttling → Offline
   - [ ] Edit chapter content
   - [ ] Verify RealtimeStatus shows "Offline"
   - [ ] Re-enable network
   - [ ] Verify status changes to "Live"
   - [ ] Verify content syncs automatically

4. **Chapter Navigation**
   - [ ] Create multiple chapters
   - [ ] Use prev/next buttons to navigate
   - [ ] Verify chapter content loads correctly
   - [ ] Delete a chapter
   - [ ] Verify UI updates correctly

5. **Performance**
   - [ ] Type continuously for 10 seconds
   - [ ] Verify no lag or stuttering
   - [ ] Check Network tab for excessive requests
   - [ ] Verify debouncing works (no request on every keystroke)

## 🐛 Troubleshooting

### Issue: "Realtime disconnected" shows constantly

**Solution:**

1. Check Supabase Dashboard → Settings → API → Is project paused?
2. Verify Realtime is enabled: Database → Replication → `chapters` listed
3. Check browser console for WebSocket errors
4. Verify Supabase URL and anon key in environment variables

### Issue: Changes not syncing across devices

**Solution:**

1. Open browser console on both devices
2. Check for sync errors
3. Verify both devices are authenticated as same user
4. Check RLS policies allow read/write for current user
5. Try manual sync button

### Issue: "Failed to pull chapters" error

**Solution:**

1. Check Supabase connection
2. Verify `chapters` table exists
3. Check RLS policies
4. Verify user is authenticated

### Issue: Content loss on page refresh

**Solution:**

1. Check IndexedDB in DevTools → Application → IndexedDB
2. Verify `inkwell_chapters` database exists
3. Check `chapter_meta` and `chapter_docs` stores
4. If empty, sync issue - check Supabase connection

## 📊 Monitoring

### Metrics to Watch

1. **Realtime Connection Status**
   - Expected: Green "Live" 99%+ of the time
   - Alert if: Gray "Offline" persists > 1 minute

2. **Sync Frequency**
   - Auto-sync: Every 3 minutes
   - Manual sync: User-triggered
   - Debounced save: After 600ms idle

3. **Database Calls**
   - Should see minimal calls (debouncing working)
   - Expect spike on page load (initial pull)
   - Expect WebSocket connection (not HTTP polling)

### Useful Supabase Queries

```sql
-- Count chapters by project
SELECT project_id, COUNT(*) as chapter_count
FROM chapters
GROUP BY project_id;

-- Recent chapter updates
SELECT id, title, updated_at
FROM chapters
ORDER BY updated_at DESC
LIMIT 10;

-- Check for orphaned chapters (no valid project)
SELECT c.id, c.title, c.project_id
FROM chapters c
LEFT JOIN projects p ON c.project_id = p.id
WHERE p.id IS NULL;
```

## 🎉 Success Criteria

Deployment is successful when:

- [x] Build completes without errors
- [ ] Realtime connection shows "Live" in production
- [ ] Content syncs across devices within 2 seconds
- [ ] Offline mode works (content persists locally)
- [ ] No console errors in production
- [ ] Manual sync button works
- [ ] Chapter navigation works correctly
- [ ] No performance degradation

## 📝 Rollback Plan

If issues arise:

1. **Quick Fix (if minor):**
   - Fix bug locally
   - Deploy patch
   - Test again

2. **Full Rollback (if major):**

   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Database Rollback (if schema issues):**
   - Remove realtime from chapters table:
   ```sql
   ALTER PUBLICATION supabase_realtime DROP TABLE chapters;
   ```

## 📚 Documentation

- [Real-Time Sync Implementation Guide](./REALTIME_SYNC_IMPLEMENTATION.md)
- [Integration Example](./REALTIME_INTEGRATION_EXAMPLE.md)
- [Chapter Tabs Implementation](./CHAPTER_TABS_IMPLEMENTATION.md)

## 🔗 Resources

- Supabase Realtime Docs: https://supabase.com/docs/guides/realtime
- IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- React Hooks Best Practices: https://react.dev/reference/react
