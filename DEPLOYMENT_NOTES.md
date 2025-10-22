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
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Next Steps

After successful deployment:

1. Verify that all static assets load correctly (check browser console for 404s)
2. Test the authentication flow
3. Consider adding more specific route handling in vercel.json after initial deployment succeeds
4. For better caching and security headers, add them through the Vercel web interface instead of in vercel.json
