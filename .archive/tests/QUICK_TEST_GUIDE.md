# Quick Test Guide: Service Worker & Asset Fixes

## 🚀 Quick Start

### 1. Clean Old Cache (One-Time)

```bash
# Stop local dev server if running
# Then run in DevTools Console:

navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
location.reload();
```

### 2. Hard Refresh

- **macOS/Windows:** `Ctrl+Shift+R` or `Cmd+Shift+R`
- Clears browser cache and reloads

### 3. Verify in DevTools

#### Check Service Worker

1. **Application → Service Workers**
   - Should show ONE active registration
   - No "Failed to install" errors
   - No "add-to-cache-list-conflicting-entries" errors

#### Check Cache Storage

1. **Application → Cache Storage**
   - Should have fresh caches (timestamps recent)
   - No duplicate entries for `site.webmanifest`
   - Should see: `google-fonts-cache`, `gstatic-fonts-cache`, `api-cache`, `images-cache`, `workbox-precache-*`

#### Check Network Tab

1. **Network tab, then reload page**
2. Filter for "brand" in search:
   - ✅ `/brand/inkwell-favicon-32.png` → **200**
   - ✅ `/brand/inkwell-lockup-dark.svg` → **200**
   - ✅ `/brand/inkwell-wordmark.svg` → **200**
   - ✅ Any other brand assets → **200**
   - ❌ NO `404` responses for brand assets

3. Filter for "manifest":
   - ✅ `/site.webmanifest` → **200**
   - ❌ NO `?__WB_REVISION__` querystring
   - ❌ NO `404` errors

#### Check Console

- Look for these logs (indicates fix is working):
  - `🔄 Service Worker controller changed - new version active`
  - `📡 Requested service worker update`
  - ❌ NO errors like `add-to-cache-list-conflicting-entries`
  - ❌ NO 404 errors for `/assets/brand/...`

---

## 🧪 Test Tour Positioning

1. Open app as normal user
2. Start tour (if you have onboarding setup)
3. **Expected:** Tooltips align correctly on first load
4. **Bad (pre-fix):** Tooltips misaligned or shift as page loads

---

## 🔧 Build Verification

```bash
# Build for production
pnpm build

# Check brand assets exist
ls -la dist/brand/inkwell-*.{png,svg,ico}

# Should output something like:
# dist/brand/inkwell-favicon-32.png
# dist/brand/inkwell-lockup-dark.svg
# dist/brand/inkwell-wordmark.svg
# etc.

# Verify no old paths in bundles
grep -r "/assets/brand" dist/assets/ 2>/dev/null && echo "❌ OLD PATHS FOUND" || echo "✅ All fixed"

# Verify manifest at root
test -f dist/site.webmanifest && echo "✅ Manifest exists" || echo "❌ Manifest missing"
```

---

## 📋 Troubleshooting

### Still seeing 404s for brand assets?

1. **Clear ALL caches:**

   ```javascript
   // DevTools Console
   caches.keys().then((k) => Promise.all(k.map((x) => caches.delete(x))));
   ```

2. **Unregister ALL SWs:**

   ```javascript
   navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
   ```

3. **Hard refresh:** `Cmd+Shift+R`

4. **Check file existence:**
   ```bash
   ls -la public/assets/brand/
   ls -la src/public/brand/   # if moved
   ```

### Still seeing precache conflicts?

1. **Verify vite.config.ts:**
   - `site.webmanifest` should NOT be in `includeAssets`
   - `site.webmanifest` should NOT be in `additionalManifestEntries`

2. **Check for manual version params:**
   - Search for `?v=` or `?__WB_REVISION__` near manifest URLs
   - Should not exist

3. **Rebuild SW:**
   ```bash
   rm -rf dist/.vite node_modules/.vite
   pnpm build
   ```

### Tour still misaligned?

1. **Confirm assets load without 404s** (see Network check above)
2. **Check browser console** for JS errors that might shift layout
3. **Verify fonts loaded:**
   ```javascript
   // DevTools Console
   await document.fonts.ready;
   console.log('✅ Fonts loaded');
   ```

---

## ✅ Pre-Deployment Checklist

- [ ] Hard refreshed page multiple times (cache cleared)
- [ ] DevTools Service Workers shows active registration
- [ ] DevTools Network shows all `/brand/*` assets as **200**
- [ ] DevTools Network shows `/site.webmanifest` as **200**
- [ ] Console shows no "add-to-cache-list-conflicting-entries" error
- [ ] Console shows no "404" errors for brand assets
- [ ] Console shows SW controller change messages (optional, nice-to-have)
- [ ] Tour (if enabled) positions correctly on first page load
- [ ] Built project has all assets in `dist/brand/`
- [ ] Built project has `dist/site.webmanifest`

---

## 📞 Still Having Issues?

If tour is still misaligned after confirming all checks above:

1. **Add layout stability guards** to tour component (see main fix doc)
2. **Re-measure after first render** with `requestAnimationFrame`
3. **Wait for fonts & images** before measuring element positions

See `SW_AND_ASSETS_FIXES_COMPLETE.md` for detailed implementation.
