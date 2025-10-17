# Inkwell Deployment Guide

This document outlines the process for deploying Inkwell to production using Vercel.

## Domain Setup

- Primary domain: `inkwell.app`
- Development domain: `dev.inkwell.app`
- Preview domain pattern: `pr-{number}.inkwell.app`

### Domain Migration Checklist

1. [ ] Update DNS records to point to Vercel nameservers
2. [ ] Configure SSL certificates in Vercel project settings
3. [ ] Set up redirects in vercel.json
4. [ ] Verify domains with proper HTTPS configuration

## Environment Variables

### Required Variables

These must be set for the application to run properly:

- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk public key for authentication
- `VITE_BASE_URL`: The base URL of the application

### Optional but Important

- `VITE_CLERK_FRONTEND_API`: Clerk frontend API endpoint
- `VITE_SENTRY_DSN`: Sentry DSN for error tracking

### Setting Environment Variables in Vercel

1. Go to Project Settings > Environment Variables
2. Add all variables from `.env.example`
3. Set environment-specific overrides (Production/Preview/Development)

## Vercel Configuration

Ensure `vercel.json` includes:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ],
  "redirects": [{ "source": "/app", "destination": "/", "permanent": true }]
}
```

## Deployment Workflow

1. Merge changes to `main` branch
2. Vercel automatically deploys the new build
3. Verify deployment using the Preview URL
4. Run the smoke tests from `/scripts/smoke-test.sh`
5. Promote to production if all tests pass
