# Clerk Authentication Setup

This document outlines the configuration and setup of Clerk authentication for Inkwell.

## Clerk Dashboard Setup

1. Login to [Clerk Dashboard](https://dashboard.clerk.dev/)
2. Select the Inkwell application
3. Navigate to API Keys

## Required Configuration

### API Keys

- Publishable Key: Used in the frontend (set as `VITE_CLERK_PUBLISHABLE_KEY`)
- Secret Key: Used in the backend if needed (NEVER expose in frontend code)

### Authorized Origins & Redirects

#### Production

- Add `https://inkwell.app` as an authorized origin
- Add `https://inkwell.app/callback` as a redirect URL

#### Development

- Add `http://localhost:5173` as an authorized origin
- Add `http://localhost:5173/callback` as a redirect URL

#### Staging/Preview

- Add `https://dev.inkwell.app` as an authorized origin
- Add `https://dev.inkwell.app/callback` as a redirect URL
- For PR previews: `https://pr-{number}.inkwell.app`

## Authentication Flow

1. User arrives at Inkwell
2. If not authenticated, they're redirected to the Clerk-hosted sign-in page
3. After successful authentication, they're redirected back to the application
4. The `useAuth()` hook is used throughout the application to check authentication status

## Customization

### Appearance

Clerk's sign-in UI has been customized to match Inkwell's branding:

- Primary color: `#0C5C3D` (Deep Navy)
- Secondary color: `#D4A537` (Warm Gold)
- Font: Source Serif Pro

### Social Connections

The following social login methods are enabled:

- Google
- GitHub

## Testing Authentication

1. Run the application in development mode: `pnpm dev`
2. Open `http://localhost:5173`
3. Click on the "Sign In" button
4. Verify that you can sign in using the configured methods
5. After sign-in, verify that you're redirected back to the application

## Troubleshooting

If authentication issues occur:

1. Verify API keys are correctly set in environment variables
2. Confirm authorized origins and redirect URLs are properly configured
3. Check browser console for CORS errors (may indicate misconfigured origins)
4. Verify Clerk service status at [status.clerk.dev](https://status.clerk.dev)
