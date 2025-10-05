# Inkwell Deployment Guide

This guide covers deploying Inkwell to production environments.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended)

**Prerequisites:**

- Node.js 20.11+ and pnpm 9+ installed
- Vercel account
- Git repository

**Note:** Inkwell now uses ESLint 9 with flat config. Ensure your development environment supports modern tooling.

**Steps:**

1. **Install Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **Build and Deploy**

   ```bash
   ./scripts/deploy.sh
   # Choose 'y' when prompted to deploy with Vercel
   ```

3. **Or Deploy Manually**
   ```bash
   pnpm build
   vercel --prod
   ```

### Option 2: Netlify

1. **Connect GitHub Repository**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Select your Inkwell repository

2. **Build Settings**

   ```
   Build command: pnpm build
   Publish directory: dist
   ```

3. **Environment Variables** (Optional)
   ```
   NODE_ENV=production
   ```

### Option 3: Static Hosting (Any Provider)

1. **Build the Application**

   ```bash
   pnpm build
   ```

2. **Upload `dist/` Folder**
   - Upload entire `dist` folder contents
   - Ensure `index.html` is served for all routes
   - Configure gzip compression for assets

## ⚙️ Configuration

### Environment Variables

Inkwell is a client-side application, but you can set build-time variables:

```bash
# .env (optional)
NODE_ENV=production
VITE_APP_NAME=Inkwell
VITE_VERSION=1.0.1
```

### Server Requirements

**Minimum Requirements:**

- Static file hosting
- HTTP/2 support (recommended)
- Gzip/Brotli compression
- HTTPS (required for some features)

**Recommended Headers:**

```
# Security Headers
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin

# Performance Headers
Cache-Control: public, max-age=31536000, immutable (for /assets/*)
Cache-Control: public, max-age=0, must-revalidate (for /)
```

## 🔧 Build Optimization

### Bundle Analysis

Check bundle sizes after optimization:

```bash
pnpm build
ls -lh dist/assets/
```

**Expected Output:**

```
vendor-react-*.js     ~12KB   # React core
vendor-ui-*.js        ~52KB   # UI components
vendor-tiptap-*.js    ~345KB  # Editor (lazy loaded)
vendor-charts-*.js    ~472KB  # Analytics (lazy loaded)
index-*.js            ~422KB  # Main application
```

### Performance Monitoring

**Key Metrics to Monitor:**

- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

## 🌐 CDN Configuration

### Recommended CDN Rules

**Cache Rules:**

```
/assets/*           Cache: 1 year, immutable
/*.js              Cache: 1 day
/*.css             Cache: 1 day
/index.html        Cache: 0 (always revalidate)
```

**Compression:**

- Enable Gzip/Brotli for all text assets
- Minimum compression level: 6

### Preload Hints

The application includes intelligent chunk preloading:

```html
<!-- Critical chunks load immediately -->
<link rel="preload" as="script" href="/assets/vendor-react-*.js" />

<!-- Heavy chunks prefetch for later -->
<link rel="prefetch" as="script" href="/assets/vendor-tiptap-*.js" />
```

## 🔒 Security Considerations

### Content Security Policy (CSP)

**Recommended CSP Header:**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.anthropic.com;
  img-src 'self' data: blob:;
  font-src 'self' data:;
```

### HTTPS Requirements

**Required for:**

- Service Workers (future feature)
- Clipboard API
- Secure storage features
- PWA installation

## 📱 Progressive Web App (PWA)

### Service Worker Setup

**Coming Soon**: Offline support and PWA features.

**Preparation:**

```bash
# Add to package.json
"workbox-cli": "^6.5.4"
```

## 🐛 Troubleshooting Deployment

### Common Issues

#### Build Fails with "Out of Memory"

**Solution:**

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

#### Assets Not Loading

**Check:**

- Base URL configuration in `vite.config.ts`
- Server routing (SPA fallback to index.html)
- CORS headers if serving from different domain

#### Performance Issues

**Debug Steps:**

```bash
# Analyze bundle
npx vite-bundle-analyzer dist

# Check gzip sizes
find dist -name "*.js" -exec gzip -9 -c {} \; | wc -c
```

#### ESLint Parsing Errors

**Common Issues:**

- "Declaration or statement expected" - Usually caused by module declaration formatting
- ESLint flat config not recognized - Ensure ESLint 9+ is installed
- Plugin compatibility issues - Check plugin versions for ESLint 9 support

**Solutions:**

```bash
# Check ESLint version
npx eslint --version  # Should be 9.x

# Run with relaxed rules for deployment
pnpm lint:relaxed

# Update dependencies if needed
pnpm add -D eslint@^9 @typescript-eslint/parser@^8 @typescript-eslint/eslint-plugin@^8
```

### Error Monitoring

**Recommended Services:**

- Sentry (error tracking)
- LogRocket (session replay)
- Google Analytics (usage metrics)

## 📊 Monitoring & Analytics

### Health Checks

**Endpoints to Monitor:**

- `/` - Main application loads
- `/assets/index-*.js` - Main bundle accessible
- API connectivity (if Claude API configured)

**Key Metrics:**

- Application startup time
- Bundle download time
- Error rates
- User engagement

### Performance Budgets

**Recommended Limits:**

- Main bundle: < 500KB
- First paint: < 1.5s
- Interactive: < 3s
- Lighthouse score: > 90

## 🔄 Continuous Deployment

### GitHub Actions (Example)

```yaml
# .github/workflows/deploy.yml
name: Deploy Inkwell
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test:run

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 🎯 Production Checklist

### Pre-Deploy

- [ ] All tests passing
- [ ] Bundle size optimized
- [ ] Performance benchmarks met
- [ ] Security headers configured
- [ ] Error monitoring setup

### Post-Deploy

- [ ] Application loads correctly
- [ ] All features functional
- [ ] Performance metrics acceptable
- [ ] Error rates normal
- [ ] Monitoring alerts configured

---

## Support

**Need Help?**

- Check [GitHub Issues](https://github.com/oklahomahail/Inkwell2/issues)
- Review logs in browser developer tools
- Verify network connectivity for AI features

**Deployment successful?** 🎉
Share your Inkwell instance and start writing!
