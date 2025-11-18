# Security Pre-Deployment Checklist

Use this checklist before every production deployment to ensure security best practices.

## 🔐 Supabase Security

### Row-Level Security (RLS)

- [ ] All tables have RLS enabled
- [ ] All tables have appropriate read policies
- [ ] All tables have appropriate write policies
- [ ] All tables have appropriate delete policies
- [ ] Test RLS policies with multiple user accounts

**How to check:**

```bash
# Run RLS tests
pnpm test:security

# Check migration files for RLS
grep -r "enable row level security" supabase/migrations/
```

### SECURITY DEFINER Functions

- [ ] All `SECURITY DEFINER` functions have authorization checks
- [ ] Functions validate `auth.uid()` or use helper functions
- [ ] Functions use `set search_path = public` for safety
- [ ] No dynamic SQL from user input without validation

**How to check:**

```bash
# List all SECURITY DEFINER functions
grep -ri "security definer" supabase/migrations/ | grep -v "^#"

# Review each function for authorization
```

### Database Configuration

- [ ] Service role key is NOT exposed to client
- [ ] Storage buckets are private (if using storage)
- [ ] Storage buckets have RLS enabled (if using storage)
- [ ] Realtime channels respect RLS policies
- [ ] CORS is configured (no wildcard `*`)

**How to check:**

1. Go to Supabase Dashboard → Settings → API
2. Verify CORS only includes your domains
3. Go to Storage → Policies (if applicable)

---

## 🔒 GitHub Security

### Repository Protection

- [ ] Branch protection enabled on `main`
  - [ ] Require pull request before merge
  - [ ] Require 1+ code review approvals
  - [ ] Require status checks to pass
  - [ ] Block force push
- [ ] Secret scanning enabled
- [ ] Dependabot alerts enabled
- [ ] Dependabot security updates enabled

**How to check:**

1. Go to Settings → Branches → Branch protection rules
2. Go to Settings → Code security and analysis

### Secrets Management

- [ ] No secrets in code
- [ ] No secrets in git history
- [ ] `.env` files properly gitignored
- [ ] GitHub Actions secrets properly masked
- [ ] No personal access tokens in workflows

**How to check:**

```bash
# Scan git history for secrets
git log --all --full-history -- "*.env" ".env*" "**/*.key"

# Should return empty or only legitimate commits
```

### 2FA & Access

- [ ] 2FA enabled on your GitHub account
- [ ] Remove unused personal access tokens
- [ ] Review collaborator access

**How to check:**

1. GitHub → Settings → Password and authentication
2. GitHub → Settings → Developer settings → Personal access tokens

---

## ☁️ Vercel Security

### Environment Variables

- [ ] Only `VITE_*` variables set (client-safe)
- [ ] No service role keys in Vercel
- [ ] No server API keys in client env vars
- [ ] All sensitive variables marked "Encrypted"

**How to check:**

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Verify no `SUPABASE_SERVICE_KEY`
3. Verify no `ANTHROPIC_API_KEY` (unless for server-side edge function)

### Deployment Configuration

- [ ] CORS configured in Supabase (no wildcard)
- [ ] Preview deployments protected (optional but recommended)
- [ ] Custom domains configured correctly
- [ ] SSL/HTTPS enforced (Vercel default)

**How to check:**

1. Vercel → Settings → Domains
2. Vercel → Settings → Deployment Protection (optional)
3. Supabase → Settings → API → CORS

---

## 💻 Codebase Security

### API Keys & Secrets

- [ ] No hardcoded API keys in code
- [ ] User API keys stored in localStorage only
- [ ] Environment variables use `VITE_` prefix for client
- [ ] `.env.example` doesn't contain real keys

**How to check:**

```bash
# Search for potential secrets
grep -r "api.*key.*=" src/ --include="*.ts" --include="*.tsx" | grep -v "VITE_"
grep -r "secret.*=" src/ --include="*.ts" --include="*.tsx"
```

### Error Logging

- [ ] Error logs don't contain user IDs
- [ ] Error logs don't contain API keys
- [ ] Error logs don't contain user content
- [ ] Sentry configured with proper filtering

**How to check:**

```bash
# Review error handling
grep -r "console.error\|console.warn" src/ -A 2
```

### Console Logs

- [ ] No `console.log` in production code (use `devLog`)
- [ ] Production builds strip debug logs
- [ ] No sensitive data in debug logs

**How to check:**

```bash
# Run cleanup script
./scripts/cleanup-console-logs.sh

# Or manually check
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v "devLog"
```

### E2EE Implementation

- [ ] Master key never stored (derived from passphrase)
- [ ] DEK encrypted with master key
- [ ] Encrypted content not sent to server
- [ ] Recovery kit export works

**How to check:**

```bash
# Run E2EE tests
pnpm test src/services/__tests__/e2eeKeyManager.comprehensive.test.ts
pnpm test src/services/__tests__/cryptoService.test.ts
```

---

## 🛡️ Security Headers

### Vercel Headers Configuration

- [ ] `X-Frame-Options: DENY` (prevents clickjacking)
- [ ] `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` configured (camera, mic, etc.)
- [ ] `X-XSS-Protection: 1; mode=block`

**How to check:**

1. Review `vercel.json` headers section
2. Test with: https://securityheaders.com/

---

## 🔍 Code Quality & Testing

### Linting & Type Safety

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] No TypeScript `any` in critical security code

**How to check:**

```bash
pnpm typecheck
pnpm lint
pnpm test
```

### Security Tests

- [ ] RLS bypass detection tests pass
- [ ] Authentication tests pass
- [ ] E2EE tests pass
- [ ] Rate limiting tests pass

**How to check:**

```bash
pnpm test:security
pnpm test src/services/__tests__/e2eeKeyManager.comprehensive.test.ts
pnpm test src/sync/__tests__/errorRecovery.test.ts
```

---

## 📦 Dependencies

### Vulnerability Scanning

- [ ] No critical vulnerabilities in dependencies
- [ ] No high-severity vulnerabilities
- [ ] Lockfile is up to date

**How to check:**

```bash
pnpm audit
# Fix any issues with: pnpm audit --fix
```

### Dependency Updates

- [ ] Review Dependabot PRs
- [ ] Update critical security patches
- [ ] Test after updates

---

## 🚀 Pre-Deployment Final Checks

### Before Merging to Main

- [ ] All tests pass in CI
- [ ] Security tests pass
- [ ] No console.log statements
- [ ] No commented-out security code
- [ ] No TODO comments in security-critical sections

### Before Deploying to Production

- [ ] Verify Vercel environment variables
- [ ] Verify Supabase CORS configuration
- [ ] Run full test suite locally
- [ ] Check Sentry for recent errors
- [ ] Review recent commits for security issues

### Post-Deployment

- [ ] Verify security headers (securityheaders.com)
- [ ] Test authentication flow
- [ ] Test E2EE if enabled
- [ ] Monitor Sentry for new errors
- [ ] Check Vercel deployment logs

---

## 📋 Quick Command Reference

```bash
# Security audit
pnpm test:security

# Full test suite
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Dependency audit
pnpm audit

# Console log cleanup
./scripts/cleanup-console-logs.sh

# Check for secrets in git history
git log --all --full-history -- "*.env" ".env*"

# Search for potential API keys
grep -r "api.*key.*=" src/ --include="*.ts" --include="*.tsx"
```

---

## 🆘 Security Incident Response

If you discover a security vulnerability:

1. **DO NOT** commit the fix to a public branch immediately
2. **DO NOT** disclose the vulnerability publicly
3. **DO** create a security advisory on GitHub
4. **DO** fix the issue in a private branch
5. **DO** coordinate disclosure with affected users
6. **DO** document the incident and response

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Vercel Security](https://vercel.com/docs/security)
- [Security Headers](https://securityheaders.com/)
- [Full Security Audit Report](../SECURITY_AUDIT.md)

---

**Last Updated:** 2025-11-18
**Next Review:** Every 3 months or after major changes
