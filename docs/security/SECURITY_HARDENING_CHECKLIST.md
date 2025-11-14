# Supabase Security Hardening Checklist

This checklist ensures your Supabase schema maintains robust security controls and prevents RLS bypass vulnerabilities.

## 🔴 CRITICAL - Immediate Action Required

### 1. Fix SECURITY DEFINER Functions (HIGH PRIORITY)

#### ⚠️ Fix `soft_delete()` Function

**Current Risk:** Allows any authenticated user to soft-delete ANY row

- [ ] Review [soft_delete_helpers.sql:19-29](supabase/migrations/20250128000003_soft_delete_helpers.sql#L19-L29)
- [ ] Add authorization checks before deletion
- [ ] Test that users can only delete their own resources
- [ ] Deploy fix to production

**Recommended Fix:**

```sql
create or replace function public.soft_delete(_table text, _id uuid)
returns void language plpgsql security definer as $$
declare
  target_project_id uuid;
begin
  -- Validate table name
  if _table not in ('projects', 'chapters', 'characters', 'notes') then
    raise exception 'Invalid table name: %', _table;
  end if;

  -- Authorization checks
  if _table = 'projects' then
    -- Only project owner can soft-delete
    if not exists(
      select 1 from public.projects
      where id = _id and owner_id = auth.uid()
    ) then
      raise exception 'Permission denied: not project owner';
    end if;
  else
    -- For chapters, characters, notes: check write permission
    execute format(
      'select project_id from public.%I where id = $1',
      _table
    ) into target_project_id using _id;

    if target_project_id is null then
      raise exception 'Resource not found';
    end if;

    if not public.can_write_project(target_project_id) then
      raise exception 'Permission denied: cannot write to project';
    end if;
  end if;

  -- Perform soft delete
  execute format(
    'update public.%I set deleted_at = now() where id = $1',
    _table
  ) using _id;
end;
$$;
```

#### ⚠️ Fix `bulk_upsert_*()` Functions

**Current Risk:** Allows bulk insert/update to ANY project

- [ ] Review [bulk_upsert.sql:5-18](supabase/migrations/20250128000005_bulk_upsert.sql#L5-L18) (chapters)
- [ ] Review [bulk_upsert.sql:22-35](supabase/migrations/20250128000005_bulk_upsert.sql#L22-L35) (characters)
- [ ] Review [bulk_upsert.sql:39-52](supabase/migrations/20250128000005_bulk_upsert.sql#L39-L52) (notes)
- [ ] Add authorization validation for all rows BEFORE inserting
- [ ] Test that users can only bulk upsert to their own projects
- [ ] Deploy fix to production

**Recommended Fix (Example for chapters):**

```sql
create or replace function public.bulk_upsert_chapters(rows jsonb)
returns void language plpgsql security definer as $$
declare
  row_data record;
  project_ids uuid[];
begin
  -- Extract all unique project_ids from input
  select array_agg(distinct (value->>'project_id')::uuid)
  into project_ids
  from jsonb_array_elements(rows);

  -- Validate user has write access to ALL projects
  for project_id in select unnest(project_ids) loop
    if not public.can_write_project(project_id) then
      raise exception 'Permission denied for project %', project_id;
    end if;
  end loop;

  -- Now perform bulk upsert
  insert into public.chapters
    select * from jsonb_populate_recordset(null::public.chapters, rows)
  on conflict (id) do update
    set title = excluded.title,
        body = excluded.body,
        index_in_project = excluded.index_in_project,
        client_rev = excluded.client_rev,
        client_hash = excluded.client_hash,
        updated_at = now(),
        deleted_at = excluded.deleted_at;
end;
$$;
```

---

## 🟠 HIGH PRIORITY - Complete Within Sprint

### 2. Add Missing DELETE Policies

#### Projects

- [ ] Add DELETE policy for project owners
- [ ] Test that non-owners cannot hard-delete projects
- [ ] Document whether hard delete should be allowed at all

```sql
drop policy if exists "projects_delete" on public.projects;
create policy "projects_delete" on public.projects
for delete using (owner_id = auth.uid());
```

#### Chapters, Characters, Notes

- [ ] Add DELETE policies requiring write access
- [ ] Test that viewers cannot delete
- [ ] Test that editors can delete

```sql
drop policy if exists "chapters_delete" on public.chapters;
create policy "chapters_delete" on public.chapters
for delete using (public.can_write_project(project_id));

drop policy if exists "characters_delete" on public.characters;
create policy "characters_delete" on public.characters
for delete using (public.can_write_project(project_id));

drop policy if exists "notes_delete" on public.notes;
create policy "notes_delete" on public.notes
for delete using (public.can_write_project(project_id));
```

#### Profiles

- [ ] Decide if users should be able to delete their own profiles
- [ ] If yes, add DELETE policy
- [ ] Consider cascade implications

```sql
-- Only if profile deletion is desired
drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete" on public.profiles
for delete using (id = auth.uid());
```

---

### 3. Add Missing UPDATE Policy

#### Project Members

- [ ] Add UPDATE policy for role changes
- [ ] Test that only project owners can change roles
- [ ] Test that members cannot promote themselves

```sql
drop policy if exists "members_update" on public.project_members;
create policy "members_update" on public.project_members
for update using (
  exists(
    select 1 from public.projects p
    where p.id = project_members.project_id
    and p.owner_id = auth.uid()
  )
) with check (
  -- Prevent non-owners from changing role to 'owner'
  role in ('editor', 'viewer')
  or exists(
    select 1 from public.projects p
    where p.id = project_members.project_id
    and p.owner_id = auth.uid()
  )
);
```

---

## 🟡 MEDIUM PRIORITY - Complete This Quarter

### 4. Create Automated Security Tests

- [ ] Set up test environment for security testing
- [ ] Create RLS bypass detection tests (see SECURITY_TESTING.md)
- [ ] Add tests to CI/CD pipeline
- [ ] Configure tests to fail builds on security issues
- [ ] Document how to run security tests locally

---

### 5. Enable Database Audit Logging

- [ ] Enable PostgreSQL query logging for security events
- [ ] Configure log retention policy
- [ ] Set up log monitoring and alerting
- [ ] Document how to review audit logs

```sql
-- Enable audit logging (Supabase dashboard or CLI)
ALTER DATABASE postgres SET log_statement = 'mod';  -- Log all modifications
ALTER DATABASE postgres SET log_duration = on;
ALTER DATABASE postgres SET log_min_duration_statement = 1000;  -- Log slow queries
```

---

### 6. Add Statement Timeouts

- [ ] Set reasonable statement timeout (prevent DoS)
- [ ] Test that normal queries complete within timeout
- [ ] Document timeout value and reasoning

```sql
-- Prevent long-running queries (adjust time as needed)
ALTER DATABASE postgres SET statement_timeout = '30s';
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '60s';
```

---

### 7. Review and Minimize Permissions

- [ ] Audit all GRANT statements
- [ ] Remove any excessive permissions
- [ ] Document why each permission is needed
- [ ] Consider implementing custom database roles

```sql
-- Audit current grants
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, table_name;
```

---

## 🟢 LOW PRIORITY - Ongoing Maintenance

### 8. Regular Security Reviews

- [ ] Schedule quarterly RLS policy reviews
- [ ] Review all SECURITY DEFINER functions after each migration
- [ ] Audit new tables for RLS enablement
- [ ] Review and update this checklist

---

### 9. Documentation and Training

- [ ] Document security architecture
- [ ] Create security guidelines for developers
- [ ] Train team on RLS bypass risks
- [ ] Document incident response procedures

---

### 10. Advanced Security Controls

#### Consider Implementing:

- [ ] Custom database roles (viewer, editor, admin)
- [ ] Connection pooling security review
- [ ] Network-level access controls
- [ ] Secrets management review
- [ ] API key rotation policy

---

## 📋 Pre-Migration Checklist

Run this checklist before deploying ANY new migration:

### Required Checks

- [ ] All new tables have RLS enabled
- [ ] All new tables have SELECT, INSERT, UPDATE policies
- [ ] All new tables have DELETE policy (or documented why not)
- [ ] All new views use `security_invoker = true`
- [ ] All new SECURITY DEFINER functions have authorization checks
- [ ] All new functions validate user input
- [ ] No new GRANT statements to `anon` role
- [ ] Migration is idempotent (safe to run multiple times)
- [ ] Migration has been tested locally
- [ ] Migration has rollback plan documented

### Testing

- [ ] RLS bypass tests pass
- [ ] Unauthorized access tests fail as expected
- [ ] Role-based access tests pass (owner, editor, viewer)
- [ ] Edge cases tested (deleted items, non-existent IDs, etc.)

### Documentation

- [ ] Security implications documented in migration file
- [ ] Breaking changes documented
- [ ] Related policies/functions updated

---

## 🧪 Testing Procedures

### Manual Security Testing

#### Test 1: Unauthorized Project Access

```javascript
// As User A: Create a project
const { data: project } = await supabase
  .from('projects')
  .insert({ title: 'Private Project' })
  .select()
  .single();

// As User B: Try to read project (should fail)
const { data, error } = await supabase.from('projects').select('*').eq('id', project.id);

console.assert(data === null && error !== null, 'RLS BYPASS: User B can read User A project!');
```

#### Test 2: Viewer Cannot Write

```javascript
// As Project Owner: Add User B as viewer
await supabase
  .from('project_members')
  .insert({ project_id: projectId, user_id: userB.id, role: 'viewer' });

// As User B (viewer): Try to create chapter (should fail)
const { data, error } = await supabase
  .from('chapters')
  .insert({ project_id: projectId, title: 'Hacked' });

console.assert(data === null && error !== null, 'RLS BYPASS: Viewer can write!');
```

#### Test 3: Cannot Access Deleted Items via View

```javascript
// As Owner: Soft delete a chapter
await supabase.rpc('soft_delete', { _table: 'chapters', _id: chapterId });

// Try to read from active view (should not appear)
const { data } = await supabase.from('chapters_active').select('*').eq('id', chapterId);

console.assert(data.length === 0, 'BYPASS: Deleted item visible in active view!');
```

---

## 📊 Security Metrics

Track these metrics over time:

- [ ] Number of tables with RLS enabled: **6/6 (100%)**
- [ ] Number of tables missing DELETE policies: **5**
- [ ] Number of SECURITY DEFINER functions: **4**
- [ ] Number of SECURITY DEFINER functions with auth checks: **1/4 (25%)**
- [ ] Percentage of migrations with security review: **Track going forward**
- [ ] Number of security incidents: **0 (target)**
- [ ] Time to fix critical security issues: **< 24 hours (target)**

---

## 🚨 Incident Response Checklist

If you discover an RLS bypass or security vulnerability:

### Immediate (< 1 hour)

- [ ] Assess severity and impact
- [ ] Create emergency fix migration
- [ ] Test fix in staging
- [ ] Deploy to production
- [ ] Verify fix is working

### Short-term (< 24 hours)

- [ ] Audit database logs for unauthorized access
- [ ] Identify affected users/data
- [ ] Document timeline and impact
- [ ] Notify affected users (if data was exposed)
- [ ] Create incident report

### Long-term (< 1 week)

- [ ] Create regression test
- [ ] Update security documentation
- [ ] Review similar code for same vulnerability
- [ ] Update CI/CD checks to prevent recurrence
- [ ] Conduct team training on root cause
- [ ] Update this checklist with lessons learned

---

## ✅ Definition of Done

Your Supabase schema is security-hardened when:

- [x] All tables have RLS enabled
- [x] All tables have comprehensive policies (SELECT, INSERT, UPDATE)
- [ ] All tables have DELETE policies or documented exceptions
- [x] All views use `security_invoker = true`
- [ ] All SECURITY DEFINER functions have authorization checks
- [ ] All SECURITY DEFINER functions validate input
- [ ] Automated RLS bypass tests exist and pass
- [ ] Security tests run in CI/CD
- [ ] Security documentation is up to date
- [ ] Team is trained on secure RLS patterns
- [ ] Incident response procedures are documented

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/sql-grant.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Full Security Audit Report](./SECURITY_AUDIT.md)
- [Automated Testing Guide](./SECURITY_TESTING.md)

---

**Last Updated:** 2025-11-13
**Next Review Date:** 2026-02-13 (Quarterly)
