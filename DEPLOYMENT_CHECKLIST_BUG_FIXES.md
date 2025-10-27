# Deployment Checklist - Bug Fixes (October 27, 2025)

## 📋 Pre-Deployment Verification

Run the verification script:

```bash
./verify-fixes.sh
```

Expected output: All ✅ green checkmarks

---

## 🚀 Deployment Steps

### 1. Build the Application

```bash
pnpm build
```

Verify:

- No TypeScript errors
- Build completes successfully
- `dist/` folder contains all assets

### 2. Check Generated Assets

```bash
# Verify icons are in dist
ls -la dist/assets/brand/inkwell-logo-icon-192.png
ls -la dist/assets/brand/inkwell-logo-icon-512.png

# Verify SVGs are in dist
ls -la dist/assets/brand/*.svg

# Check service worker
ls -la dist/sw.js
```

### 3. Preview Build Locally

```bash
pnpm preview
```

Open browser to localhost and check:

- [ ] No 404 errors in console
- [ ] No Workbox precache conflicts
- [ ] Brand assets load correctly
- [ ] Theme defaults to light mode

### 4. Deploy to Production

```bash
# Your deployment command here, e.g.:
# vercel --prod
# netlify deploy --prod
# firebase deploy
```

---

## 🧪 Post-Deployment Testing

### Immediate Checks (Do these first!)

#### 1. Clear Service Worker

1. Open DevTools → Application tab
2. Go to Service Workers
3. Click "Unregister" on any existing service workers
4. Go to Storage → Clear site data
5. Hard reload (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

#### 2. Console Errors

Open DevTools → Console and verify:

- [ ] No `add-to-cache-list-conflicting-entries` errors
- [ ] No `MutationObserver` errors
- [ ] No 404 errors for brand assets
- [ ] No "preloaded but not used" warnings

#### 3. Network Tab

Open DevTools → Network tab and verify:

- [ ] All `/assets/brand/*.svg` files return 200
- [ ] All `/assets/brand/*.png` files return 200
- [ ] No 404s for `/brand/` paths

### PWA Installation Test

1. Click the install prompt or:
   - Chrome: Menu → Install Inkwell
   - Safari: Share → Add to Home Screen

2. Verify in Chrome DevTools → Application → Manifest:
   - [ ] Icon at 192x192 shows no size warnings
   - [ ] Icon at 512x512 shows no size warnings
   - [ ] "Installability" section shows "Page is installable"

3. Install the app and verify:
   - [ ] App icon appears correctly
   - [ ] App launches in standalone mode
   - [ ] No console errors on first launch

### Theme Test

1. Open app in incognito/private mode
2. Verify:
   - [ ] App defaults to light mode
   - [ ] No dark mode flash on load
   - [ ] No localStorage errors in console

### Brand Assets Test

Navigate to each auth page and verify no 404s:

- [ ] `/sign-in` - Logo loads
- [ ] `/sign-up` - Logo loads
- [ ] `/auth/forgot-password` - Logo loads
- [ ] `/auth/update-password` - Logo loads

### Tour System Test

1. Sign in to the app
2. Navigate to Settings
3. Click "Start Tour" or similar
4. Verify:
   - [ ] Spotlight overlay appears
   - [ ] Tour dialog shows
   - [ ] Clicking "Next" advances steps
   - [ ] No MutationObserver errors in console
   - [ ] Spotlight highlights correct elements

---

## 🔧 Rollback Plan

If critical issues are found after deployment:

### Option 1: Quick Rollback

```bash
# Revert to previous deployment
# (depends on your hosting platform)
```

### Option 2: Emergency Patches

If service worker is causing issues:

1. Deploy a version with `VitePWA` disabled in `vite.config.ts`
2. Users will need to hard refresh to get the new version

If icons are broken:

1. Revert icon files to previous versions
2. Rebuild and deploy

If theme flash persists:

1. Check localStorage key matches between `index.html` and `main.tsx`
2. Consider setting inline style on `<html>` tag as backup

---

## 📊 Success Metrics

After 24 hours, check:

### Error Rate

- [ ] Console error rate decreased by 60%+ (from ~8-12 errors to ~1-2)
- [ ] Zero Workbox precache errors
- [ ] Zero 404 errors for brand assets

### PWA Metrics

- [ ] PWA install prompt appears for eligible users
- [ ] PWA install success rate > 80%
- [ ] No icon size warnings in production

### User Experience

- [ ] Tour completion rate stable or improved
- [ ] No increase in support tickets about missing assets
- [ ] Theme switching works correctly

---

## 🐛 Known Edge Cases

### Service Worker Caching

Some users may have old service workers cached. They will need to:

1. Close all tabs of the app
2. Wait 24 hours (service worker auto-updates)
   OR
3. Manually clear cache and reload

### Safari PWA Icons

Safari may cache old icon sizes. Users may need to:

1. Remove app from home screen
2. Clear Safari cache
3. Re-install PWA

### Private Mode

Theme preference won't persist in private/incognito mode (expected behavior)

---

## 📝 Communication

### User Notification (Optional)

If doing maintenance:

```
🔧 Quick maintenance update!
We've fixed several bugs and improved PWA installation.
Please refresh your browser to get the latest version.
```

### Internal Team

```
Deployed bug fixes:
✅ Service worker precache conflict resolved
✅ PWA icons now correct size (192x192, 512x512)
✅ Brand asset 404s fixed
✅ Theme flash eliminated
✅ All MutationObserver guards in place

Monitor console errors and PWA install metrics over next 24h.
```

---

## ✅ Sign-Off Checklist

Before marking deployment as complete:

- [ ] All pre-deployment checks passed
- [ ] Build completed successfully
- [ ] Local preview shows no errors
- [ ] Production deployment completed
- [ ] Service worker unregistered and verified
- [ ] Console shows no critical errors
- [ ] PWA installation tested and working
- [ ] Brand assets loading correctly
- [ ] Tour system functioning
- [ ] Theme defaulting correctly
- [ ] Documentation updated (this file committed to repo)

**Deployed by**: ******\_\_\_******  
**Date/Time**: ******\_\_\_******  
**Version**: ******\_\_\_******  
**Rollback tested**: [ ] Yes [ ] No

---

## 🎉 Success!

If all checks pass, you're done! The app should now be:

- Free of console errors related to these bugs
- Installable as a PWA with correct icons
- Loading all brand assets correctly
- Defaulting to light theme consistently
- Running tours smoothly without MutationObserver errors

**Next recommended steps**:

1. Monitor error logs for 48 hours
2. Check PWA install conversion rate
3. Gather user feedback
4. Consider adding automated tests for these scenarios
