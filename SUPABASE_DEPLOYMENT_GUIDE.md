# Supabase Integration - Deployment Guide

This guide covers the final steps to deploy your Supabase-integrated Inkwell application to production.

---

## Prerequisites ✅

All completed:

- ✅ Supabase project created and linked
- ✅ Migrations files created and renamed
- ✅ Environment variables configured
- ✅ Application code implemented
- ✅ Health check route functional
- ✅ Dev server running successfully

---

## Step 1: Push Remaining Migrations to Supabase

The setup script has already applied one migration. To apply the rest:

```bash
# Push all migrations to your Supabase project
npm run supabase:push
```

This will apply:

- Core schema (tables + RLS)
- Auto-touch updated_at triggers
- Profile auto-creation
- Soft-delete helpers
- Role-based write guards
- Bulk upsert RPCs
- Performance indexes
- Seed data (optional)

**Verify in Dashboard:**

1. Go to https://app.supabase.com/project/lzurjjorjzeubepnhkgg/editor
2. Confirm these tables exist:
   - `profiles`
   - `projects`
   - `project_members`
   - `chapters`
   - `characters`
   - `notes`
3. Confirm these views exist:
   - `projects_active`
   - `chapters_active`
   - `characters_active`
   - `notes_active`

---

## Step 2: Configure Auth Redirect URLs

1. Go to: https://app.supabase.com/project/lzurjjorjzeubepnhkgg/auth/url-configuration

2. **Set Site URL:**
   - Development: `http://localhost:5173`
   - Production: `https://inkwell.leadwithnexus.com`

3. **Add Redirect URLs:**

   ```
   http://localhost:5173
   http://localhost:5173/auth/callback
   http://localhost:5173/auth/update-password
   https://inkwell.leadwithnexus.com
   https://inkwell.leadwithnexus.com/auth/callback
   https://inkwell.leadwithnexus.com/auth/update-password
   ```

4. Click **Save**

---

## Step 3: Test Integration Locally

### Test Health Check

```bash
# Open health check in browser
npm run supabase:health
```

Or visit manually: http://localhost:5173/health/supabase

**Expected Result:**

- Status: `ok`
- Details: `auth=yes, query=head-select ok` (if signed in)
- Details: `auth=no, query=head-select ok` (if not signed in)

### Test Authentication

1. Sign up with a test account
2. Check Supabase Dashboard → Authentication → Users
3. Verify profile was auto-created in `profiles` table

### Test Data Operations (After Integration)

1. Create a project
2. Add chapters, characters, notes
3. Check Supabase Dashboard → Table Editor
4. Verify data appears in respective tables

---

## Step 4: Deploy to Production

### Option A: Vercel Deployment

#### Configure Environment Variables

In Vercel dashboard or via CLI:

```bash
# Using Vercel CLI
vercel env add VITE_SUPABASE_URL production
# When prompted, enter: https://lzurjjorjzeubepnhkgg.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# When prompted, enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add VITE_ENABLE_SUPABASE_SYNC production
# When prompted, enter: false (start with sync disabled)
```

#### Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch if auto-deploy is configured
git add .
git commit -m "feat: integrate Supabase for cloud sync"
git push origin main
```

### Option B: Netlify Deployment

#### Configure Environment Variables

In Netlify dashboard:

1. Go to Site Settings → Environment Variables
2. Add:
   ```
   VITE_SUPABASE_URL = https://lzurjjorjzeubepnhkgg.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_ENABLE_SUPABASE_SYNC = false
   ```

#### Deploy

```bash
# Deploy via Git
git add .
git commit -m "feat: integrate Supabase for cloud sync"
git push origin main

# Or use Netlify CLI
netlify deploy --prod
```

### Option C: Custom Hosting

#### Build Application

```bash
# Build for production
npm run build
```

#### Configure Environment Variables

Ensure these are set in your hosting environment:

```
VITE_SUPABASE_URL=https://lzurjjorjzeubepnhkgg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ENABLE_SUPABASE_SYNC=false
```

#### Deploy

Upload the `dist/` folder to your hosting provider.

---

## Step 5: Post-Deployment Verification

### Test Production Health Check

Visit: `https://inkwell.leadwithnexus.com/health/supabase`

**Expected:**

- Status: `ok`
- Query test passes

### Test Production Authentication

1. Sign up with a new account
2. Verify profile creation in Supabase Dashboard
3. Test sign in/out

### Test RLS Policies

1. Create a project as User A
2. Sign in as User B
3. Verify User B cannot see User A's project
4. Invite User B to User A's project
5. Verify User B can now see the project

---

## Step 6: Enable Cloud Sync (Optional)

Once everything is tested:

### Update Environment Variable

```bash
# Vercel
vercel env add VITE_ENABLE_SUPABASE_SYNC production
# Enter: true

# Netlify
# Update in dashboard: VITE_ENABLE_SUPABASE_SYNC = true
```

### Redeploy

```bash
vercel --prod
# or
netlify deploy --prod
```

### Test Sync

1. Create content while online
2. Check Supabase Table Editor for synced data
3. Make changes on another device
4. Verify sync works bidirectionally

---

## Monitoring and Maintenance

### Regular Checks

**Weekly:**

- Check Supabase Dashboard → Database → Health
- Review error logs in Supabase Dashboard → Logs
- Monitor storage usage

**Monthly:**

- Review and optimize RLS policies
- Check for unused indexes
- Update types: `npm run supabase:types`

### Troubleshooting

**Issue: "Auth session not found"**

- Verify redirect URLs in Supabase Dashboard
- Check that cookies are enabled
- Clear browser cache and retry

**Issue: "Row Level Security violation"**

- Verify user is authenticated
- Check RLS policies in Supabase Dashboard
- Ensure project membership is set correctly

**Issue: "Sync not working"**

- Check `VITE_ENABLE_SUPABASE_SYNC` is `true`
- Verify network connectivity
- Check browser console for errors
- Review sync queue in IndexedDB

**Issue: "Types out of sync"**

```bash
# Regenerate types
npm run supabase:types
```

---

## Rollback Plan

If issues occur in production:

### Option 1: Disable Cloud Sync

```bash
# Set environment variable
VITE_ENABLE_SUPABASE_SYNC=false

# Redeploy
vercel --prod
```

### Option 2: Revert Migration

```bash
# Connect to Supabase
npx supabase db reset --linked

# This will drop all tables and reapply migrations from scratch
# USE WITH CAUTION - THIS WILL DELETE ALL DATA
```

### Option 3: Rollback Deployment

```bash
# Vercel
vercel rollback

# Netlify
# Use dashboard to rollback to previous deployment
```

---

## Success Criteria

✅ Health check returns "ok" in production  
✅ Users can sign up and profiles are auto-created  
✅ RLS policies enforce proper permissions  
✅ Data syncs correctly between devices (if sync enabled)  
✅ Offline functionality works as expected  
✅ No TypeScript errors  
✅ No console errors in browser

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

## Support

If you encounter issues:

1. Check the health endpoint: `/health/supabase`
2. Review browser console for errors
3. Check Supabase logs: https://app.supabase.com/project/lzurjjorjzeubepnhkgg/logs
4. Consult documentation in:
   - `SUPABASE_QUICK_REFERENCE.md`
   - `SUPABASE_MIGRATION_GUIDE.md`
   - `SUPABASE_INTEGRATION_COMPLETE.md`

---

**Ready to Deploy!** 🚀
