# Branch Protection Quick Checklist

**Repository**: inkwell
**Branch**: `main`
**Time Required**: 5 minutes

## GitHub Settings Steps

1. Navigate to: **Settings** → **Branches**

2. Click **Add rule** or edit existing `main` rule

3. **Branch name pattern**: `main`

4. ✅ Enable these settings:
   - [ ] **Require a pull request before merging**
     - Recommended: Set approvals to 1

   - [ ] **Require status checks to pass before merging**
     - [ ] ✅ **Require branches to be up to date before merging**

   - [ ] **Require conversation resolution before merging**

5. **Add these required status checks**:

   Search and select each:
   - [ ] `react-hooks-guard` ⭐ (from `lint-react-hooks.yml`)
   - [ ] `build` (from your CI workflow)
   - [ ] `test` (from your test workflow)
   - [ ] `typecheck` (from your CI workflow)
   - [ ] `lint` (from your CI workflow)

   > **Note**: If a check doesn't appear, push a PR to trigger it first

6. **Additional recommended** (optional):
   - [ ] **Require linear history**
   - [ ] **Include administrators**

7. Click **Create** or **Save changes**

## Verification

Create a test PR with a hooks violation:

```typescript
// In any React component
useEffect(() => {
  doSomething(userId);
}, []); // Missing userId - should fail!
```

Expected results:

- ✅ CI runs `react-hooks-guard` job
- ✅ Job fails with hooks violation
- ✅ "Merge" button is disabled
- ✅ After fixing (adding `userId` to deps), job passes
- ✅ "Merge" button becomes enabled

## Done! 🎉

Your `main` branch is now protected from hooks violations.

## Rollback

If needed, you can:

1. Disable the branch protection rule temporarily
2. Merge critical fixes
3. Re-enable immediately
4. Fix violations in a follow-up PR

---

For detailed instructions, see [docs/dev/BRANCH_PROTECTION_SETUP.md](./BRANCH_PROTECTION_SETUP.md)
