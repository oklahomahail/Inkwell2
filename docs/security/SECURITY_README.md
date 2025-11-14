# Inkwell Security Documentation

Complete guide to the security audit, hardening, and testing for the Inkwell Supabase schema.

## 📚 Documentation Index

### 1. [Security Audit Report](./SECURITY_AUDIT.md)

**Comprehensive audit of the entire Supabase schema**

- **What it is:** Full analysis of all tables, policies, functions, and views
- **When to use:** Understanding current security posture, identifying vulnerabilities
- **Key findings:**
  - ✅ All tables have RLS enabled
  - 🔴 **CRITICAL:** `soft_delete()` and `bulk_upsert_*()` functions bypass RLS
  - ⚠️ Missing DELETE policies on multiple tables
  - ✅ Views fixed to use SECURITY INVOKER

**Start here if:** You want to understand the full security landscape

---

### 2. [Security Hardening Checklist](./SECURITY_HARDENING_CHECKLIST.md)

**Step-by-step guide to fixing security issues**

- **What it is:** Actionable checklist with fix recommendations
- **When to use:** Implementing security improvements, pre-deployment reviews
- **Key sections:**
  - 🔴 Critical: Fix SECURITY DEFINER functions (URGENT)
  - 🟠 High: Add missing DELETE policies
  - 🟡 Medium: Create automated tests
  - 🟢 Low: Ongoing maintenance

**Start here if:** You need to fix security issues and want a clear action plan

---

### 3. [Security Testing Guide](./SECURITY_TESTING.md)

**How to run and write security tests**

- **What it is:** Guide for automated RLS bypass detection tests
- **When to use:** Running tests locally, CI/CD integration, writing new tests
- **Key sections:**
  - Quick start guide
  - Test suite overview (26 tests)
  - CI/CD integration (GitHub Actions, GitLab CI)
  - Writing new security tests
  - Troubleshooting

**Start here if:** You want to run security tests or add new ones

---

### 4. [Security Quick Reference](./SECURITY_QUICK_REFERENCE.md)

**One-page cheat sheet**

- **What it is:** Quick reference for common security patterns
- **When to use:** Writing migrations, quick lookups, emergency responses
- **Key sections:**
  - Critical security rules
  - Quick audit commands
  - Pre-deployment checklist
  - Common vulnerabilities and fixes

**Start here if:** You need quick answers or are writing a new migration

---

### 5. [RLS Bypass Detection Tests](../supabase/tests/rls-bypass-detection.test.ts)

**Automated security test suite**

- **What it is:** 26 automated tests that verify RLS cannot be bypassed
- **When to use:** Automatically in CI/CD, manually after migrations
- **What it tests:**
  - Unauthorized access prevention
  - Role-based access control
  - SECURITY DEFINER function safety
  - View security
  - Profile privacy

**Start here if:** You want to see the actual test code

---

## 🚀 Quick Start

### For Developers

1. **Before writing any migration:**
   - Read [Security Quick Reference](./SECURITY_QUICK_REFERENCE.md)
   - Review [Pre-Deployment Checklist](./SECURITY_HARDENING_CHECKLIST.md#-pre-migration-checklist)

2. **After writing a migration:**

   ```bash
   # Apply migration locally
   supabase db reset

   # Run security tests
   pnpm test:security
   ```

3. **Before creating a PR:**
   - Ensure security tests pass
   - Review [Security Hardening Checklist](./SECURITY_HARDENING_CHECKLIST.md)

---

### For Security Reviewers

1. **Start with the audit:**
   - Read [Security Audit Report](./SECURITY_AUDIT.md)
   - Review critical findings section

2. **Check automated tests:**

   ```bash
   pnpm test:security
   ```

3. **Manual review:**
   - Check for new SECURITY DEFINER functions
   - Verify all new tables have RLS
   - Ensure views use `security_invoker = true`

---

### For DevOps/CI/CD

1. **Set up automated testing:**
   - Copy [.github/workflows/security-tests.yml](../.github/workflows/security-tests.yml)
   - Follow [CI/CD Integration Guide](./SECURITY_TESTING.md#cicd-integration)

2. **Configure alerts:**
   - Security test failures should block deployment
   - Set up notifications for test failures

---

## 🔴 Critical Issues (Action Required)

### 1. Fix `soft_delete()` Function

**Risk Level:** CRITICAL
**Impact:** Anyone can delete any project, chapter, character, or note
**Location:** [soft_delete_helpers.sql:19-29](../supabase/migrations/20250128000003_soft_delete_helpers.sql#L19-L29)
**Fix:** Add authorization checks before deletion
**Details:** [Security Hardening Checklist](./SECURITY_HARDENING_CHECKLIST.md#️-fix-soft_delete-function)

### 2. Fix `bulk_upsert_*()` Functions

**Risk Level:** CRITICAL
**Impact:** Anyone can bulk insert/update data in any project
**Location:** [bulk_upsert.sql](../supabase/migrations/20250128000005_bulk_upsert.sql)
**Fix:** Add authorization validation for all rows before inserting
**Details:** [Security Hardening Checklist](./SECURITY_HARDENING_CHECKLIST.md#️-fix-bulk_upsert_-functions)

---

## 📊 Current Security Status

| Category        | Status   | Details                                      |
| --------------- | -------- | -------------------------------------------- |
| RLS Enabled     | ✅ 100%  | All 6 tables have RLS                        |
| Read Policies   | ✅ 100%  | All tables have SELECT policies              |
| Write Policies  | ✅ 100%  | All tables have INSERT/UPDATE policies       |
| Delete Policies | ⚠️ 17%   | Only 1/6 tables (project_members)            |
| Views           | ✅ Fixed | All use `security_invoker = true`            |
| Functions       | 🔴 25%   | Only 1/4 SECURITY DEFINER functions are safe |
| Automated Tests | ✅ Done  | 26 tests covering all attack vectors         |
| CI/CD           | ✅ Done  | GitHub Actions workflow configured           |

---

## 🎯 Security Roadmap

### Phase 1: Critical Fixes (Week 1)

- [ ] Fix `soft_delete()` function
- [ ] Fix `bulk_upsert_chapters()` function
- [ ] Fix `bulk_upsert_characters()` function
- [ ] Fix `bulk_upsert_notes()` function
- [ ] Deploy fixes to production
- [ ] Verify automated tests pass

### Phase 2: High Priority (Week 2)

- [ ] Add DELETE policies to all tables
- [ ] Add UPDATE policy to `project_members`
- [ ] Review and test all policies
- [ ] Update documentation

### Phase 3: Testing & Automation (Week 3-4)

- [ ] Integrate security tests into CI/CD
- [ ] Set up daily automated security scans
- [ ] Configure alerts for test failures
- [ ] Train team on security best practices

### Phase 4: Ongoing Maintenance

- [ ] Quarterly security reviews
- [ ] Review SECURITY DEFINER functions after each migration
- [ ] Update tests for new features
- [ ] Maintain security documentation

---

## 🧪 Running Tests

```bash
# Run all security tests
pnpm test:security

# Run in watch mode (for development)
pnpm test:security:watch

# Run with coverage
pnpm test:security:coverage

# Run specific test file
vitest run supabase/tests/rls-bypass-detection.test.ts
```

---

## 📖 Additional Resources

### Internal

- [Main README](../README.md)
- [Supabase Migrations](../supabase/migrations/)
- [Test Suite](../supabase/tests/)

### External

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)

---

## 🆘 Getting Help

### Found a Security Issue?

1. **DO NOT** commit it to a public repository
2. Create a private security advisory on GitHub
3. Contact the security team immediately
4. Follow [Incident Response](./SECURITY_AUDIT.md#appendix-b-incident-response)

### Questions?

- Review the [Security Quick Reference](./SECURITY_QUICK_REFERENCE.md)
- Check the [Security Testing Guide](./SECURITY_TESTING.md#troubleshooting)
- Ask in the team security channel

---

## 📝 Document Maintenance

| Document            | Last Updated | Next Review |
| ------------------- | ------------ | ----------- |
| Security Audit      | 2025-11-13   | 2026-02-13  |
| Hardening Checklist | 2025-11-13   | 2026-02-13  |
| Testing Guide       | 2025-11-13   | 2026-02-13  |
| Quick Reference     | 2025-11-13   | 2026-02-13  |

**Review Schedule:** Quarterly (every 3 months)

---

## ✅ Definition of Done

Your Supabase schema is security-hardened when:

- [x] All tables have RLS enabled
- [x] All tables have comprehensive policies (SELECT, INSERT, UPDATE)
- [ ] All tables have DELETE policies or documented exceptions
- [x] All views use `security_invoker = true`
- [ ] All SECURITY DEFINER functions have authorization checks
- [ ] All SECURITY DEFINER functions validate input
- [x] Automated RLS bypass tests exist and pass
- [ ] Security tests run in CI/CD
- [x] Security documentation is up to date
- [ ] Team is trained on secure RLS patterns
- [ ] Incident response procedures are documented

**Progress: 7/11 (64%)**

---

**Remember:** Security is not a one-time task. It's an ongoing process that requires vigilance, testing, and regular reviews.

---

**Last Updated:** 2025-11-13
**Version:** 1.0
**Status:** Active Development
