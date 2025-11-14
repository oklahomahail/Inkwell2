# Security Quick Reference

One-page reference for securing your Supabase schema.

## 🚨 Critical Security Rules

### 1. Always Enable RLS

```sql
-- ALWAYS do this for every table
alter table public.table_name enable row level security;
```

### 2. Always Add Policies

```sql
-- Read policy (required)
create policy "read_policy" on public.table_name
for select using (/* condition */);

-- Write policies (required)
create policy "insert_policy" on public.table_name
for insert with check (/* condition */);

create policy "update_policy" on public.table_name
for update using (/* condition */);

create policy "delete_policy" on public.table_name
for delete using (/* condition */);
```

### 3. Always Use `security_invoker` for Views

```sql
-- ✅ SAFE - Respects RLS
create view view_name
with (security_invoker = true) as
select * from table_name;

-- ❌ UNSAFE - Bypasses RLS
create view view_name as
select * from table_name;
```

### 4. Add Authorization Checks to SECURITY DEFINER Functions

```sql
-- ❌ UNSAFE - No authorization check
create function dangerous_func()
returns void language plpgsql security definer as $$
begin
  -- Anyone can do anything!
  delete from sensitive_table;
end;
$$;

-- ✅ SAFE - Has authorization check
create function safe_func()
returns void language plpgsql security definer as $$
begin
  if not authorized() then
    raise exception 'Permission denied';
  end if;
  delete from sensitive_table where owner_id = auth.uid();
end;
$$;
```

---

## 🔍 Quick Audit Commands

### Check All Tables Have RLS

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
and rowsecurity = false;
-- Should return 0 rows
```

### Check All Tables Have Policies

```sql
select t.tablename
from pg_tables t
left join pg_policies p on p.tablename = t.tablename
where t.schemaname = 'public'
group by t.tablename
having count(p.policyname) = 0;
-- Should return 0 rows
```

### List All SECURITY DEFINER Functions

```sql
select n.nspname, p.proname
from pg_proc p
join pg_namespace n on p.pronamespace = n.oid
where p.prosecdef = true
and n.nspname = 'public';
-- Review each one for authorization checks
```

### Check Views Security Mode

```sql
select viewname, definition
from pg_views
where schemaname = 'public';
-- Check each view for "security_invoker" option
```

---

## 📋 Pre-Deployment Checklist

Before deploying any migration:

- [ ] All new tables have `enable row level security`
- [ ] All new tables have SELECT, INSERT, UPDATE, DELETE policies
- [ ] All new views use `with (security_invoker = true)`
- [ ] All new SECURITY DEFINER functions have authorization checks
- [ ] All new functions validate user input
- [ ] No new GRANT statements to `anon` role
- [ ] Tested locally with `pnpm test:security`
- [ ] Reviewed by another developer

---

## 🧪 Quick Test Commands

```bash
# Run security tests
pnpm test:security

# Run in watch mode
pnpm test:security:watch

# Run with coverage
pnpm test:security:coverage
```

---

## 🔥 Common Vulnerabilities

### ❌ Missing RLS

```sql
create table public.secrets (
  id uuid primary key,
  data text
);
-- PROBLEM: No RLS enabled!
-- Anyone can read all secrets
```

### ❌ Weak Policy

```sql
create policy "weak_read" on public.projects
for select using (true);
-- PROBLEM: Everyone can read everything!
```

### ❌ Unsafe View

```sql
create view projects_active as
select * from projects where deleted_at is null;
-- PROBLEM: Defaults to SECURITY DEFINER, bypasses RLS!
```

### ❌ Unsafe Function

```sql
create function bulk_delete(ids uuid[])
returns void language plpgsql security definer as $$
begin
  delete from projects where id = any(ids);
end;
$$;
-- PROBLEM: No authorization check!
-- Anyone can delete any project
```

---

## ✅ Secure Patterns

### Owner-Only Access

```sql
create policy "owner_only" on public.projects
for select using (owner_id = auth.uid());
```

### Membership-Based Access

```sql
create policy "member_access" on public.chapters
for select using (
  exists(
    select 1 from projects p
    left join project_members m on m.project_id = p.id
    where p.id = chapters.project_id
    and (p.owner_id = auth.uid() or m.user_id = auth.uid())
  )
);
```

### Role-Based Write Access

```sql
create policy "editor_write" on public.chapters
for insert with check (
  exists(
    select 1 from project_members m
    where m.project_id = chapters.project_id
    and m.user_id = auth.uid()
    and m.role in ('owner', 'editor')
  )
);
```

### Secure View

```sql
create view active_projects
with (security_invoker = true) as
select * from projects where deleted_at is null;
```

### Secure Function

```sql
create function soft_delete(table_name text, row_id uuid)
returns void language plpgsql security definer as $$
begin
  -- Validate table name
  if table_name not in ('projects', 'chapters') then
    raise exception 'Invalid table';
  end if;

  -- Check authorization
  if table_name = 'projects' then
    if not exists(select 1 from projects where id = row_id and owner_id = auth.uid()) then
      raise exception 'Permission denied';
    end if;
  end if;

  -- Perform soft delete
  execute format('update %I set deleted_at = now() where id = $1', table_name) using row_id;
end;
$$;
```

---

## 🆘 Emergency Response

If you discover an RLS bypass:

1. **Immediate (< 1 hour)**

   ```bash
   # Create emergency fix migration
   supabase migration new fix_rls_bypass

   # Apply immediately
   supabase db push
   ```

2. **Verify Fix**

   ```bash
   pnpm test:security
   ```

3. **Audit Logs**

   ```sql
   -- Check for unauthorized access
   select * from auth.audit_log_entries
   where created_at > now() - interval '24 hours'
   order by created_at desc;
   ```

4. **Document**
   - Create incident report
   - Update security documentation
   - Add regression test

---

## 📚 Full Documentation

- [Complete Security Audit](./SECURITY_AUDIT.md)
- [Security Hardening Checklist](./SECURITY_HARDENING_CHECKLIST.md)
- [Security Testing Guide](./SECURITY_TESTING.md)
- [RLS Bypass Detection Tests](../supabase/tests/rls-bypass-detection.test.ts)

---

## 🔗 External Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Remember:** When in doubt, deny access. It's easier to grant permissions later than to fix a security breach.
