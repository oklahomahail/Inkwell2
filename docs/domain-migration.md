# Domain Migration Guide (writewithinkwell.com)

**Last updated: November 2025**

This document outlines the complete and updated plan for migrating Inkwell from:

**Current**
https://inkwell.leadwithnexus.com

**To**
https://writewithinkwell.com

This guide incorporates all recent architectural changes, including:

- Supabase auth & realtime integration
- UUID project ID standardization
- New analytics pipelines
- Phrase Hygiene system
- Updated service worker and PWA configuration
- Sentry integration
- Claude AI endpoints
- Vercel environment variable restructuring

---

## 1. Overview

`writewithinkwell.com` will become the primary production domain for Inkwell.
`inkwell.leadwithnexus.com` remains the official staging environment.

**Future product expansion** for screenwriting will use:

> https://inkwellstudio.com

This migration guide ensures stability across all systems: Offline storage, Auth, Realtime sync, PWA, and AppContext.

---

## 2. Migration Steps Summary

1. Add & verify domain in Vercel (already done)
2. Make `writewithinkwell.com` the primary domain
3. Update all Supabase settings
4. Update Sentry allowed domains
5. Update environment variables in Vercel
6. Update PWA manifest scope
7. Bump Service Worker cache version
8. Update Claude allowed origins (if configured)
9. Deploy to production
10. Test critical pathways

---

## 3. Vercel Configuration

### A. Set Primary Domain

In Vercel:

- **Project → Settings → Domains**
- Make `writewithinkwell.com` the **Primary Domain**
- Keep legacy domain as alias for now

### B. Environment Variables

Update the following in:

**Vercel → Project → Settings → Environment Variables**

```env
VITE_APP_URL = https://writewithinkwell.com
VITE_PUBLIC_URL = https://writewithinkwell.com
VITE_PWA_START_URL = /
VITE_SENTRY_ENVIRONMENT = production
```

No other code changes required.

---

## 4. Supabase Changes (Required)

Supabase validates CORS and redirect origins strictly.
You must update all three areas below.

### A. Auth Redirect URLs

**Supabase → Authentication → URL Configuration → Redirect URLs**

**Add:**

```
https://writewithinkwell.com/*
```

**Keep:**

```
https://inkwell.leadwithnexus.com/*
```

### B. Allowed Origins

**Supabase → Authentication → URL Configuration → Allowed Origins**

**Add:**

```
writewithinkwell.com
```

### C. Realtime + Edge Function CORS

If your analytics worker or sync worker calls edge functions:

**Add to Edge Function CORS settings:**

```
https://writewithinkwell.com
```

---

## 5. PWA Configuration

Update:

**public/manifest.webmanifest**

```json
"start_url": "/",
"scope": "/"
```

Do not include domain names.
The browser will re-scope automatically during install.

---

## 6. Service Worker Update

Because cached assets are domain-scoped, bump the cache version:

**src/service-worker.ts (or sw.ts)**

Change:

```typescript
const CACHE_VERSION = 'inkwell-vX';
```

**Increment X.**

This ensures a clean post-migration install.

---

## 7. Sentry Configuration

In **Sentry → Project Settings → Security → Allowed Domains**

**Add:**

```
writewithinkwell.com
www.writewithinkwell.com
```

---

## 8. Claude AI Allowed Origins

Only required if you're restricting origins on the Claude API gateway.

**Add:**

```
https://writewithinkwell.com
```

---

## 9. Code Changes Checklist

These files require updates:

### 1. vite.config.ts

Confirm base URL is relative:

```typescript
base: '/';
```

### 2. src/lib/urls.ts or equivalent

Replace any explicit domain references:

```typescript
export const APP_URL = import.meta.env.VITE_APP_URL;
```

### 3. supabaseClient.ts

Supabase initialization remains unchanged; domain migration does not affect the client.

### 4. AppContext and RootLayout

No changes needed unless referencing domain-specific patterns.

---

## 10. Post-Migration Testing

Perform full QA on production domain:

### A. Authentication

- Magic link login
- Logout
- Session persistence

### B. Project System

- Create new project (UUID creation pipeline)
- Load legacy project
- Autosave
- Realtime sync
- Offline behavior

### C. Analytics

- Word count
- Session stats
- Phrase Hygiene modal

### D. AI Features

- AI Story Architect
- Rewrite / Suggestion Box
- Claude streaming
- Error reporting

### E. PWA

- Install app
- Open from home screen
- Offline mode
- Updates propagate after version bump

---

## 11. Future Product Expansion: inkwellstudio.com

Use this domain for the future screenwriting-focused version of Inkwell.

**Advantages:**

- Brand clarity
- Independent UX
- Shared Supabase backend
- One repo / two apps
- Optional multi-app monorepo

Nothing in this migration blocks the screenwriting expansion.

---

## 12. Final Notes

- This migration is **non-destructive**: IndexedDB data survives domain changes.
- All new project IDs are UUIDs, which simplifies cross-domain sync.
- Domain switch is safe to deploy at any time after Supabase updates are in place.
