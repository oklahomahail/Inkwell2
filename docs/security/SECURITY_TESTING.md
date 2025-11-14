# Security Testing Guide

This guide explains how to run automated RLS bypass detection tests and integrate them into your CI/CD pipeline.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Suite Overview](#test-suite-overview)
3. [Running Tests Locally](#running-tests-locally)
4. [CI/CD Integration](#cicd-integration)
5. [Writing New Security Tests](#writing-new-security-tests)
6. [Manual Testing Procedures](#manual-testing-procedures)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase local development setup or access to staging environment
- Test database with migrations applied

### Install Dependencies

```bash
npm install @supabase/supabase-js vitest --save-dev
```

### Run Security Tests

```bash
# Run all security tests
npm run test:security

# Run with coverage
npm run test:security -- --coverage

# Run in watch mode during development
npm run test:security -- --watch
```

---

## Test Suite Overview

The security test suite is located at [`supabase/tests/rls-bypass-detection.test.ts`](../supabase/tests/rls-bypass-detection.test.ts).

### Test Categories

| Category              | Tests   | Purpose                                                      |
| --------------------- | ------- | ------------------------------------------------------------ |
| **Projects**          | 4 tests | Verify users cannot access other users' projects             |
| **Chapters**          | 4 tests | Verify chapter access is controlled by project membership    |
| **Characters**        | 2 tests | Verify character access follows project permissions          |
| **Notes**             | 2 tests | Verify note access follows project permissions               |
| **Views**             | 3 tests | Verify `*_active` views respect RLS and filter deleted items |
| **SECURITY DEFINER**  | 3 tests | Verify SECURITY DEFINER functions check authorization        |
| **Role-Based Access** | 3 tests | Verify viewer/editor/owner role enforcement                  |
| **Profiles**          | 3 tests | Verify users can only access their own profiles              |
| **Project Members**   | 2 tests | Verify membership management security                        |

**Total:** 26 automated security tests

### What These Tests Check

✅ **Unauthorized Read Prevention**

- Users cannot read data from projects they don't have access to
- Views properly enforce RLS
- Profile data is private to each user

✅ **Unauthorized Write Prevention**

- Users cannot create/update/delete data in projects they don't own or aren't members of
- Viewers cannot write (read-only access)
- Editors can write but not change project metadata

✅ **Role-Based Access Control**

- Viewer role grants read-only access
- Editor role grants read/write access to entities
- Owner role has full control

✅ **SECURITY DEFINER Function Safety**

- `soft_delete()` cannot be used to delete other users' data
- `bulk_upsert_*()` cannot be used to insert into unauthorized projects
- Trigger functions (`handle_new_user()`) are properly scoped

✅ **View Security**

- Active views (`*_active`) use SECURITY INVOKER
- Soft-deleted items are properly filtered
- Views cannot bypass RLS

---

## Running Tests Locally

### Option 1: Supabase Local Development

```bash
# Start Supabase local stack
supabase start

# Run migrations
supabase db reset

# Set environment variables
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_ANON_KEY="your-local-anon-key"
export SUPABASE_SERVICE_KEY="your-local-service-key"

# Run tests
npm run test:security
```

### Option 2: Staging Environment

```bash
# Set staging environment variables
export SUPABASE_URL="https://your-staging-project.supabase.co"
export SUPABASE_ANON_KEY="your-staging-anon-key"
export SUPABASE_SERVICE_KEY="your-staging-service-key"

# Run tests
npm run test:security
```

### Option 3: Using .env File

Create `.env.test` in project root:

```env
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

Then run:

```bash
npm run test:security
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/security-tests.yml`:

```yaml
name: Security Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'

jobs:
  security-tests:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase local
        run: supabase start

      - name: Run database migrations
        run: supabase db reset --db-url $DATABASE_URL

      - name: Run security tests
        env:
          SUPABASE_URL: http://localhost:54321
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_LOCAL_ANON_KEY }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_LOCAL_SERVICE_KEY }}
        run: npm run test:security

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: security-test-results
          path: coverage/

      - name: Fail if security tests fail
        if: failure()
        run: |
          echo "::error::Security tests failed! Please review the results."
          exit 1
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
security-tests:
  stage: test
  image: node:18
  services:
    - postgres:15
  variables:
    POSTGRES_DB: postgres
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  before_script:
    - npm ci
    - curl -sL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
    - ./supabase start
  script:
    - npm run test:security
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 30 days
  only:
    - merge_requests
    - main
```

### Pre-commit Hook

Install [Husky](https://typicode.github.io/husky/) and create `.husky/pre-push`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running security tests before push..."
npm run test:security || {
  echo "Security tests failed! Push aborted."
  exit 1
}
```

Make it executable:

```bash
chmod +x .husky/pre-push
```

---

## Writing New Security Tests

### Test Template

```typescript
describe('RLS Bypass Detection: [Feature Name]', () => {
  it('should prevent unauthorized access to [resource]', async () => {
    // Arrange: Set up test data
    const { data: resource } = await userA.client
      .from('table_name')
      .insert({
        /* data */
      })
      .select()
      .single();

    // Act: Attempt unauthorized access as User B
    const { data, error } = await userB.client
      .from('table_name')
      .select('*')
      .eq('id', resource.id)
      .single();

    // Assert: Access should be denied
    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.message).toContain('Row-level security');
  });
});
```

### Testing Checklist

When adding a new table or feature:

- [ ] Test unauthorized SELECT (read)
- [ ] Test unauthorized INSERT (create)
- [ ] Test unauthorized UPDATE (modify)
- [ ] Test unauthorized DELETE (remove)
- [ ] Test authorized access works correctly
- [ ] Test role-based access (viewer, editor, owner)
- [ ] Test soft delete filtering (if applicable)
- [ ] Test SECURITY DEFINER functions (if any)

### Best Practices

1. **Use descriptive test names**

   ```typescript
   // Good
   it('should prevent viewer from deleting project chapters', async () => {});

   // Bad
   it('test delete', async () => {});
   ```

2. **Test both positive and negative cases**

   ```typescript
   it('should prevent User B from reading User A project', async () => {});
   it('should allow User A to read their own project', async () => {});
   ```

3. **Test edge cases**
   - Soft-deleted items
   - Non-existent IDs
   - NULL values
   - Empty arrays

4. **Clean up test data**
   ```typescript
   afterEach(async () => {
     // Clean up resources
   });
   ```

---

## Manual Testing Procedures

### Manual Test 1: Unauthorized Project Access

```javascript
// 1. Sign in as User A
const userA = await supabase.auth.signInWithPassword({
  email: 'usera@example.com',
  password: 'password123',
});

// 2. Create a project
const { data: project } = await supabase
  .from('projects')
  .insert({ title: 'Private Project' })
  .select()
  .single();

console.log('Project ID:', project.id);

// 3. Sign out and sign in as User B
await supabase.auth.signOut();
const userB = await supabase.auth.signInWithPassword({
  email: 'userb@example.com',
  password: 'password123',
});

// 4. Try to read User A's project (should fail)
const { data, error } = await supabase.from('projects').select('*').eq('id', project.id).single();

// Expected: data = null, error = "Row-level security policy violation"
console.log('Data:', data);
console.log('Error:', error);
```

### Manual Test 2: Viewer Cannot Write

```javascript
// 1. As project owner, add User B as viewer
await supabase.from('project_members').insert({
  project_id: projectId,
  user_id: userBId,
  role: 'viewer',
});

// 2. Sign in as User B
// (sign out, sign in as User B)

// 3. Try to create a chapter (should fail)
const { data, error } = await supabase
  .from('chapters')
  .insert({
    project_id: projectId,
    title: 'New Chapter',
    body: 'Content',
    index_in_project: 0,
  })
  .select();

// Expected: data = null, error = "Row-level security policy violation"
console.log('Data:', data);
console.log('Error:', error);
```

### Manual Test 3: Soft Delete Function Security

```javascript
// 1. As User B, try to soft delete User A's project
const { error } = await supabase.rpc('soft_delete', {
  _table: 'projects',
  _id: projectA.id,
});

// Expected: error = "Permission denied" or similar
console.log('Error:', error);

// If this succeeds, you have a CRITICAL vulnerability!
```

---

## Troubleshooting

### Tests Fail with "Connection refused"

**Issue:** Cannot connect to Supabase

**Solution:**

```bash
# Check if Supabase is running
supabase status

# If not, start it
supabase start

# Verify connection
curl http://localhost:54321
```

### Tests Fail with "Invalid JWT"

**Issue:** Incorrect anon or service key

**Solution:**

```bash
# Get correct keys
supabase status | grep "anon key"
supabase status | grep "service_role key"

# Update .env.test with correct keys
```

### Tests Timeout

**Issue:** Database queries are slow

**Solution:**

```bash
# Increase test timeout in vitest.config.ts
export default {
  test: {
    testTimeout: 30000 // 30 seconds
  }
}
```

### "Permission denied" on All Tests

**Issue:** RLS policies are too restrictive

**Solution:**

1. Check that test users are being created correctly
2. Verify authentication tokens are valid
3. Review RLS policies for syntax errors
4. Check database logs: `supabase db logs`

### False Positives (Tests Pass When They Shouldn't)

**Issue:** Tests are not correctly simulating attack vectors

**Solution:**

1. Add `console.log` to verify test data
2. Manually test the scenario in Supabase Studio
3. Review the test setup and assertions
4. Check if test users are accidentally given admin privileges

---

## Security Test Metrics

Track these metrics over time:

| Metric                 | Target | Current |
| ---------------------- | ------ | ------- |
| Test coverage          | > 90%  | TBD     |
| Tests passing          | 100%   | TBD     |
| Tests run per deploy   | 100%   | TBD     |
| Average test duration  | < 60s  | TBD     |
| Failed security audits | 0      | TBD     |

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Vitest Documentation](https://vitest.dev/)
- [Security Audit Report](./SECURITY_AUDIT.md)
- [Security Hardening Checklist](./SECURITY_HARDENING_CHECKLIST.md)

---

**Last Updated:** 2025-11-13
**Next Review:** 2026-02-13
