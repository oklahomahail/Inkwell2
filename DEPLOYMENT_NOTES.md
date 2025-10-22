# Deployment Notes

## Configuration Issues Fixed
1. Fixed vite.config.ts to handle missing environment variables gracefully
2. Added PWA configuration to .env.local
3. Simplified vercel.json to avoid regex capturing group issues

## Deployment Instructions
1. Use the Vercel web interface at https://vercel.com/nexuspartners/inkwell
2. Click "Deploy" button and select "Deploy Site" (not via CLI)
3. Enable "Clear Build Cache" in the advanced options
4. Make sure environment variables are properly set in the Vercel project settings

## Environment Variables Required
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_ENABLE_PWA

## Next Steps
After successful deployment:
1. Verify that all static assets load correctly (check browser console for 404s)
2. Test the authentication flow
3. Consider adding more specific route handling in vercel.json after initial deployment succeeds
