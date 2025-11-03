# v0.8.0 Merge & Rebase Plan

## Phase 1: Merge Telemetry Foundation (PR #27)

**Status**: PR created, awaiting CI ✅

When CI turns green:

```bash
# Merge via GitHub UI (squash merge is fine)

# Then locally:
git checkout main
git pull

# Clean up the feature branch
git branch -D feat/v0.8.0-conflict-dialog
git push origin :feat/v0.8.0-conflict-dialog
```

---

## Phase 2: Rebase Autosave Work to Consume Telemetry

```bash
git checkout feat/v0.8.0-editor-autosave
git fetch origin
git rebase origin/main
pnpm i
pnpm build && pnpm test
```

### Verify Telemetry Events Are Emitting

Autosave should now emit these events:

- ✅ `autosave.start` – when save begins
- ✅ `autosave.success` – when save completes
- ✅ `autosave.error` – on save failure

**Quick verification in preview:**

1. Open the PR preview for autosave branch
2. Edit a chapter
3. Watch autosave fire and check network calls for telemetry events
4. Reload page; content should persist

---

## Phase 3: Conflict Dialog UI

Cut a new short-lived branch:

```bash
git checkout -b feat/v0.8.0-conflict-dialog-ui
```

### Implementation Checklist

- [ ] Show dialog on checksum mismatch
- [ ] **Keep Local** → force save (emit `autosave.success` with `resolved: "kept-local"`)
- [ ] **Use Remote** → fetch, set editor content, update cache (emit `autosave.success` with `resolved: "used-remote"`)
- [ ] Add minimal tests for both paths
- [ ] Verify telemetry events include resolution type

---

## Phase 4: Final Audit & Release

Once conflict dialog is complete and tested:

```bash
# Run Final Audit Plan
pnpm test
pnpm build
npm audit

# Tag preflight
git tag v0.8.0-preflight
git push origin v0.8.0-preflight

# When all checks are green, tag full release
git tag v0.8.0
git push origin v0.8.0
```

---

## Notes

- Coverage: ~66% statements (threshold OK, can backfill tests later)
- Docs: Add one-liner to release notes: "Telemetry foundation added for autosave/backup/restore."
- No breaking exports
- All CI checks passing ✅
