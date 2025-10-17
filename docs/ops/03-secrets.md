# Secrets Management

This document outlines the policies and procedures for managing secrets in the Inkwell application.

## Secret Types

Inkwell uses the following types of secrets:

- **Authentication Keys**: Clerk API keys
- **Error Monitoring**: Sentry DSN
- **AI Services**: Claude API key, OpenAI API key
- **Analytics**: Analytics API key

## Secret Storage

### Development

- Secrets are stored in `.env.local` files (not committed to git)
- `.env.example` provides templates without actual values

### Production

- Secrets are stored in Vercel Environment Variables
- Separate environments for Production, Preview, and Development

## Secret Rotation Policy

### Scheduled Rotation

- **Authentication Keys**: Rotate every 90 days
- **AI Service Keys**: Rotate every 60 days
- **Other API Keys**: Rotate every 180 days

### Emergency Rotation

Immediate rotation is required if:

- A secret is accidentally committed to the repository
- A team member with access to secrets leaves the project
- There is any suspected security breach

## Push Protection

The repository is configured with:

1. Git pre-commit hooks to prevent committing `.env` files
2. GitHub Secret Scanning to detect leaked secrets
3. `.gitignore` rules to prevent accidental secret commits

## Secret Rotation Procedure

1. Generate new secret in the service provider's dashboard
2. Update the secret in Vercel Environment Variables
3. Deploy the application with the new secret
4. Verify functionality with the new secret
5. Deactivate the old secret after confirming the new one works

## Emergency Contacts

If a secret is compromised:

1. Contact the security team immediately at `security@inkwell.app`
2. Rotate the affected secret following the emergency procedure
3. File an incident report documenting the exposure
