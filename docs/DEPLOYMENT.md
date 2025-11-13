# Deployment Guide

## Production Deployment Checklist

### Pre-Deployment

- [ ] All tests pass locally (`npm test`)
- [ ] Build succeeds without errors (`npm run build`)
- [ ] Preview server works (`npm run preview`)
- [ ] Git working tree is clean
- [ ] Version bumped in `package.json` (if needed)

### Deployment Process

1. **Commit Changes**

   ```bash
   git add .
   git commit -m "descriptive message"
   ```

2. **Push to GitHub**

   ```bash
   git push origin main
   ```

3. **Verify Vercel Deployment**
   - GitHub push triggers automatic Vercel deployment
   - Check deployment status at: https://vercel.com/dashboard
   - Typical deployment time: 2-5 minutes

### Post-Deployment Verification

After deployment completes, verify:

1. **Application Loads**
   - Visit: https://inkwell.leadwithnexus.com
   - Check for JavaScript errors in console (F12)
   - Verify service worker registration

2. **Critical Features**
   - [ ] Authentication works (sign in/sign up)
   - [ ] Project creation works
   - [ ] Writing panel loads and shows "Online" status
   - [ ] Autosave triggers when typing
   - [ ] Analytics panel loads without errors
   - [ ] Section/chapter ordering is correct

3. **No Console Errors**
   - [ ] No 404 errors for worker files
   - [ ] No "Invalid project ID format" errors
   - [ ] No TypeScript/runtime errors

## Common Issues

### Worker 404 Errors

**Symptom:** Console shows 404 for `autosaveWorker-*.js`

**Cause:** Build artifacts not deployed or cached version

**Fix:**

1. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
2. Verify worker file exists at: `/workers/autosaveWorker.js`
3. Trigger fresh Vercel deployment

### Invalid Project ID Errors

**Symptom:** Console shows "Invalid project ID format detected"

**Supported Formats:**

- ✅ UUID: `550e8400-e29b-41d4-a716-446655440000`
- ✅ Welcome: `proj_welcome_1763045880279`
- ✅ Legacy: `project-1763045880279`

**Fix:** Update validation in:

- `src/context/AppContext.tsx`
- `src/hooks/useSections.ts`
- `src/utils/idUtils.ts`

### Sections Not Loading

**Symptoms:**

- Writing panel empty
- Sections list doesn't populate
- "Offline" status shown

**Common Causes:**

1. Project ID validation failing
2. Autosave worker not loading
3. IndexedDB access blocked
4. Network issues preventing sync

**Debugging:**

```javascript
// Check in browser console
localStorage.getItem('inkwell_currentProjectId');
// Should return valid project ID
```

## Architecture Notes

### Worker Files

We use two deployment strategies for Web Workers:

**Fixed Path (public/):**

- `public/workers/autosaveWorker.js`
- Served at predictable URL: `/workers/autosaveWorker.js`
- No Vite hashing, prevents 404s
- Use for critical, frequently-loaded workers

**Dynamic Import (src/):**

- `src/workers/searchWorker.ts`
- `src/workers/phraseWorker.ts`
- Vite-hashed chunks for cache busting
- Use for optional, infrequently-loaded workers

### Build Output

```
dist/
├── assets/               # Hashed JavaScript/CSS bundles
│   ├── index-*.js
│   ├── autosaveWorkerService-*.js
│   └── ...
├── workers/             # Fixed-path workers (from public/)
│   └── autosaveWorker.js
├── brand/               # Static assets
├── sw.js               # Service worker
└── index.html          # Entry point
```

## Rollback Process

If deployment causes issues:

1. **Revert in GitHub**

   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Vercel Auto-Redeploys**
   - Vercel automatically deploys the revert commit
   - Previous working version restored in ~2 minutes

3. **Manual Rollback (Vercel Dashboard)**
   - Go to https://vercel.com/dashboard
   - Select project → Deployments
   - Find last working deployment
   - Click "⋯" → "Promote to Production"

## Environment Variables

Required in Vercel:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_ENABLE_PWA` - Enable PWA features (default: true)

## Performance Monitoring

After deployment, monitor:

1. **Build Size**
   - Check Vite build output for chunk sizes
   - Largest chunks should be <500KB gzipped

2. **Loading Performance**
   - First Contentful Paint (FCP) < 1.5s
   - Time to Interactive (TTI) < 3.5s
   - Cumulative Layout Shift (CLS) < 0.1

3. **Error Rates**
   - Monitor browser console errors
   - Check Vercel Analytics for 4xx/5xx errors

## Support

For deployment issues:

- GitHub Issues: https://github.com/oklahomahail/Inkwell2/issues
- Vercel Logs: https://vercel.com/dashboard → Deployments → View Logs
