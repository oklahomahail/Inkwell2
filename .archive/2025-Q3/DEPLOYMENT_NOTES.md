# Deployment Notes

## Configuration Issues Fixed

1. Fixed vite.config.ts to handle missing environment variables gracefully
2. Added PWA configuration to .env.local
3. Created minimal vercel.json with simple SPA rewrites

## CLI Deployment Issues

We encountered persistent issues with Vercel CLI deployment related to route configuration in vercel.json. Despite multiple attempts with different configurations, the CLI deployment failed with the error:

```
Error: Capturing groups are not allowed at 43
```

## Recommended Deployment Method

1. Use the Vercel web interface at https://vercel.com/nexuspartners/inkwell
2. Click "Deploy" button and select "Deploy Site" (not via CLI)
3. Enable "Clear Build Cache" in the advanced options
4. Make sure environment variables are properly set in the Vercel project settings

## Environment Variables Required

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_ENABLE_PWA (set to "true" for production, "false" for development)

## Current vercel.json Configuration

We've simplified vercel.json to the minimum required for SPA routing:

```json
{
  "rewrites": [{ "source": "/:path*", "destination": "/index.html" }]
}
```

## Next Steps

After successful deployment:

1. Verify that all static assets load correctly (check browser console for 404s)
2. Test the authentication flow
3. Verify that the PWA functionality works properly:
   - Check for "Add to Home Screen" prompt on mobile
   - Verify offline functionality
   - Test app updates via service worker
4. Verify that client-side routing works (refresh any page and confirm it loads properly)
5. Test the features that depend on environment variables
6. Consider adding more specific route handling in vercel.json after initial deployment succeeds
7. For better caching and security headers, add them through the Vercel web interface instead of in vercel.json

## Post-Deployment Verification Checklist

Use this checklist to ensure the application is deployed correctly:

### Basic Functionality

- [ ] Application loads without errors in console
- [ ] Static assets (images, CSS, JS) load correctly
- [ ] Authentication flow works (sign in/sign up/sign out)
- [ ] Client-side routing works (navigate between pages)
- [ ] Client-side routing survives page refresh (no 404 errors)

### Feature-specific

- [ ] Project creation and loading works
- [ ] Writing and editing functionality works
- [ ] Analytics features work correctly
- [ ] Export functionality generates correct files

### PWA Features

- [ ] Service worker is registered (check Application tab in DevTools)
- [ ] "Add to Home Screen" prompt appears on supported devices
- [ ] Offline functionality works as expected
- [ ] App updates are detected and applied

### Performance

- [ ] Initial load time is acceptable
- [ ] Navigation between pages is smooth
- [ ] No memory leaks during extended use

### Cross-browser Testing

- [ ] Works in Chrome/Edge
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
