# Sentry Configuration for Domain Migration

## Quick Setup (2 minutes)

### 1. Access Sentry Project Settings

Navigate to: **https://sentry.io/settings/YOUR_ORG/projects/inkwell/security-headers/**

Or manually:

1. Go to https://sentry.io
2. Select your organization
3. Click on "inkwell" project
4. Go to **Settings** → **Security & Privacy** → **Security Headers**

---

### 2. Configure Allowed Domains

**Section:** Content Security Policy (CSP) / Allowed Domains

**Add these domains:**

```
writewithinkwell.com
www.writewithinkwell.com
```

**Keep existing (verify present):**

```
inkwell.leadwithnexus.com
localhost
127.0.0.1
```

---

### 3. Configure CORS Origins (if applicable)

**Section:** CORS Allowed Origins

If your project uses Sentry's JavaScript SDK with CORS:

**Add:**

```
https://writewithinkwell.com
https://www.writewithinkwell.com
```

---

### 4. Update Source Maps Origins (Optional)

If you upload source maps to Sentry:

**Location:** Settings → General → Source Maps

**Verify release artifacts can be uploaded from:**

- CI/CD pipeline (GitHub Actions, Vercel, etc.)
- Local development (if needed)

No changes needed if using Vercel automatic source map upload.

---

### 5. Verify Environment Configuration

**Location:** Settings → Environments

Ensure you have these environments configured:

- `production` (for writewithinkwell.com)
- `development` (for localhost)
- `preview` (for Vercel preview deployments)

---

## Environment-Specific Configuration

### Production Environment

Your `.env.production` or Vercel environment variables should have:

```bash
VITE_SENTRY_DSN=https://YOUR_DSN@sentry.io/YOUR_PROJECT_ID
VITE_SENTRY_ENVIRONMENT=production
```

### Development Environment

Your `.env.local` should have:

```bash
VITE_SENTRY_DSN=https://YOUR_DSN@sentry.io/YOUR_PROJECT_ID
VITE_SENTRY_ENVIRONMENT=development
```

---

## Test Sentry Integration

After configuration, test error reporting:

### 1. Deploy to Production

Deploy your migration code to production.

### 2. Test Error Capture

Visit https://writewithinkwell.com and open browser console:

```javascript
// Trigger a test error
throw new Error('Sentry domain migration test');
```

### 3. Verify in Sentry Dashboard

1. Go to Sentry → Issues
2. Look for the test error
3. Click on the error
4. Verify **Environment** shows `production`
5. Verify **URL** shows `writewithinkwell.com`
6. Check breadcrumbs and context are captured correctly

---

## Release Tracking (Optional but Recommended)

To track which release introduced issues:

### 1. Enable Release Tracking

In your deployment script (or `vite.config.ts`):

```typescript
// Example: Sentry Vite plugin configuration
sentryVitePlugin({
  org: 'your-org',
  project: 'inkwell',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  release: {
    name: `inkwell@${process.env.npm_package_version}`,
    uploadLegacySourcemaps: {
      paths: ['./dist'],
      urlPrefix: '~/assets',
    },
  },
});
```

### 2. Create Releases via CLI

Or manually create releases:

```bash
# Install Sentry CLI
pnpm add -g @sentry/cli

# Create release
sentry-cli releases new "inkwell@1.2.1"

# Upload source maps
sentry-cli releases files "inkwell@1.2.1" upload-sourcemaps ./dist

# Finalize release
sentry-cli releases finalize "inkwell@1.2.1"
```

---

## Alert Rules for Domain Migration

Consider creating alerts for migration-related issues:

### 1. Create Alert Rule

**Location:** Alerts → Create Alert

**Suggested Alert: Domain Migration Issues**

```
Trigger: When an event is seen
Filter:
  - Environment: production
  - URL contains: leadwithnexus.com
  - Error count > 10 in 5 minutes

Action: Send notification to Slack/Email
Message: "High error rate on legacy domain during migration"
```

This helps you catch issues users might encounter on the old domain.

---

## Copy-Paste Values

### Allowed Domains

```
writewithinkwell.com
www.writewithinkwell.com
inkwell.leadwithnexus.com
```

### CORS Origins

```
https://writewithinkwell.com
https://www.writewithinkwell.com
https://inkwell.leadwithnexus.com
```

---

## Troubleshooting

### Events not appearing in Sentry

**Check:**

1. VITE_SENTRY_DSN is set correctly in Vercel environment variables
2. Domain is in allowed list
3. Browser console for Sentry initialization errors
4. Network tab for blocked requests to Sentry

**Common Fix:**

- Clear browser cache
- Verify CSP headers allow Sentry domain
- Check ad blockers aren't blocking Sentry

### Source maps not working

**Check:**

1. Source maps uploaded correctly (Sentry → Releases)
2. Release name matches deployed version
3. URL prefix configured correctly
4. Files visible in Sentry release artifacts

**Common Fix:**

- Re-upload source maps with correct URL prefix
- Ensure `sourcemap: true` in vite.config.ts build options

### Wrong environment showing

**Check:**

1. VITE_SENTRY_ENVIRONMENT variable in Vercel
2. Sentry initialization in src/main.tsx
3. No hardcoded environment in code

**Fix:**

```typescript
// src/main.tsx
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
  // ... other config
});
```

---

## Migration Monitoring Dashboard

Create a custom dashboard to monitor migration:

**Metrics to track:**

- Error rate by domain (new vs old)
- User sessions by domain
- Auth errors by domain
- Performance metrics by domain

**Location:** Dashboards → Create Dashboard → Add Widgets

---

## Removal Timeline

### After 30 Days

If migration is successful:

- Legacy domain should have minimal traffic
- Can reduce monitoring on old domain

### After 60 Days

Safe to remove legacy domain:

- Remove `inkwell.leadwithnexus.com` from allowed domains
- Update alert rules to only monitor new domain
- Archive old domain data for reference

---

**Configuration Time:** ~2 minutes
**Verification Time:** ~5 minutes
**Monitoring Period:** 30-60 days

For Sentry docs: https://docs.sentry.io/
