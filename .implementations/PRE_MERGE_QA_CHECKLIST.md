# Pre-Merge QA Checklist: v0.9.0 Beta Foundation

**Branch**: `feat/v0.9.0-beta-foundation`  
**Target**: `main`  
**Features**: IndexedDB Optimization, Autosave Metrics, Offline Queue UI, Error Boundaries & Recovery

---

## ✅ Automated Test Suite

- [ ] Run full test suite: `pnpm test:ci`
- [ ] Run typecheck: `pnpm typecheck`
- [ ] Run lint: `pnpm lint`
- [ ] Verify test coverage: `pnpm test:coverage`

**Expected Results**:

- All tests passing
- No TypeScript errors
- No ESLint warnings (or <50 warnings for CI)
- Coverage >70% for new code

---

## 🛡️ Tiered Recovery Tests

### Tier 1: Supabase Recovery

**Test Case**: Cloud backup pull on IndexedDB corruption

1. **Setup**:

   ```bash
   # Open DevTools Console
   localStorage.setItem('hasAuthSession', 'true')
   ```

2. **Corrupt IndexedDB**:
   - DevTools → Application → IndexedDB
   - Delete `inkwell_chapters` objectStore

3. **Trigger Recovery**:
   - Navigate to Editor panel
   - Error boundary should catch failure

4. **Expected Outcome**:
   - Recovery UI displays "Attempting recovery..."
   - Tier 1 indicator shows "In Progress"
   - Data restored from Supabase
   - Panel renders successfully

5. **Verify**:
   ```javascript
   // Check recovery state
   window.Inkwell?.recovery?.inspect();
   ```

**Pass Criteria**: ✅ Data restored, p95 < 500ms

---

### Tier 2: localStorage Shadow Copy Recovery

**Test Case**: Local shadow copy restore when Supabase unavailable

1. **Setup**:

   ```bash
   # Simulate offline mode
   # DevTools → Network → Set to "Offline"
   ```

2. **Verify Shadow Copy Exists**:

   ```javascript
   const shadow = localStorage.getItem('inkwell_shadow_copy');
   console.log(JSON.parse(shadow));
   ```

3. **Corrupt IndexedDB**:
   - Delete `inkwell_chapters` database completely

4. **Trigger Recovery**:
   - Navigate to Dashboard panel

5. **Expected Outcome**:
   - Tier 1 fails (offline)
   - Tier 2 activates automatically
   - Shadow copy data restored
   - Success message: "Recovered from local backup"

**Pass Criteria**: ✅ Shadow copy <7 days old, data restored

---

### Tier 3: User Upload Recovery

**Test Case**: Manual JSON backup upload

1. **Setup**:

   ```bash
   # Clear all recovery sources
   localStorage.removeItem('inkwell_shadow_copy')
   # DevTools → Application → IndexedDB → Delete all
   # Network → Offline
   ```

2. **Prepare Backup File**:
   - Export project from Backup panel first
   - Save `inkwell_backup_YYYYMMDD.json`

3. **Trigger Recovery**:
   - Corrupt IndexedDB
   - Navigate to any protected panel

4. **Expected Outcome**:
   - Tier 1 fails (offline)
   - Tier 2 fails (no shadow copy)
   - Tier 3 prompts for file upload
   - File picker opens

5. **Upload Backup**:
   - Select exported JSON
   - Click "Restore"

6. **Verify**:
   - Data restored from uploaded file
   - Panel renders with recovered data

**Pass Criteria**: ✅ Valid JSON accepted, invalid JSON rejected with error

---

### Edge Case: Shadow Copy Age Validation

**Test Case**: Reject shadow copy older than 7 days

1. **Setup**:

   ```javascript
   // Manually age the shadow copy
   const shadow = JSON.parse(localStorage.getItem('inkwell_shadow_copy'));
   shadow.timestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
   localStorage.setItem('inkwell_shadow_copy', JSON.stringify(shadow));
   ```

2. **Trigger Recovery** (Tier 2 should skip)

3. **Expected Outcome**:
   - Tier 2 skipped
   - Proceeds to Tier 3

**Pass Criteria**: ✅ Old shadow copy rejected, Tier 3 activated

---

## 🔄 Functional Smoke Tests

### Autosave During Cache Refresh

**Test Case**: No data loss during cache operations

1. **Start Editing**:
   - Open Editor panel
   - Type 200+ characters rapidly

2. **Monitor**:

   ```javascript
   window.Inkwell.performance.getAutosaveMetrics();
   ```

3. **Expected**:
   - p95 latency < 250ms
   - No lost keystrokes
   - StatusBar shows "Saved" confirmation

**Pass Criteria**: ✅ p95 < 250ms, no data loss

---

### Offline Edit → Reconnect

**Test Case**: Offline queue drains successfully

1. **Go Offline**:
   - DevTools → Network → Offline
   - Edit project (add chapter, modify text)

2. **Verify Queue**:
   - StatusBar shows "Offline" indicator
   - Edits buffered locally

3. **Reconnect**:
   - Network → Online

4. **Expected**:
   - Queue drains automatically
   - StatusBar shows sync progress
   - All changes saved to Supabase

**Pass Criteria**: ✅ Queue drains, all changes persisted

---

### Catastrophic Render Error in Editor Panel

**Test Case**: Recovery UI appears on React error

1. **Trigger Error**:

   ```javascript
   // Force a render error
   throw new Error('Simulated catastrophic failure');
   ```

2. **Expected**:
   - RecoveryErrorBoundary catches error
   - Recovery sequence initiates
   - User sees recovery progress UI

**Pass Criteria**: ✅ Recovery UI renders, auto-recovery attempted

---

### Shadow Copy Older Than 7 Days

**Test Case**: Tier 2 skipped for stale shadow

1. **Age Shadow Copy** (see edge case above)
2. **Trigger Recovery**
3. **Expected**: Tier 2 bypassed

**Pass Criteria**: ✅ Tier 2 skipped, logs show age rejection

---

### E2EE Stub Mode Active

**Test Case**: Passphrase prompt without blocking

1. **Simulate E2EE**:

   ```javascript
   // Currently stubs return dummy data
   window.Inkwell.recovery.testE2EE();
   ```

2. **Expected**:
   - Prompt for passphrase (UI stub)
   - Recovery not blocked
   - Success message displayed

**Pass Criteria**: ✅ Passphrase stub executes, no blocking

---

## 📊 Telemetry Verification

### Recovery Event Tracking

1. **Check Telemetry**:

   ```javascript
   // After recovery test
   window.Inkwell.telemetry.getEvents();
   ```

2. **Expected Events**:
   - `recovery.attempt` (tier: 1|2|3)
   - `recovery.success` (tier: X, duration: Yms)
   - `recovery.failure` (tier: X, reason: "...")

3. **PII Verification**:
   - No project titles in logs
   - No user email in events
   - Only anonymized metrics

**Pass Criteria**: ✅ Events logged, PII-free

---

## 🔧 Week 2 Hardening Checklist

### LRU Cache Integration

- [ ] Validate LRU and shadow copy interaction
- [ ] Confirm no double writes on save
- [ ] Test cache eviction during recovery

### Autosave Stress Test

- [ ] Force Tier 2 recovery during autosave
- [ ] Monitor for race conditions
- [ ] Verify queue stability

### StatusBar Integration

- [ ] Confirm "Recovery Mode Active" indicator
- [ ] Test StatusBar during recovery sequence
- [ ] Verify tier indicators update correctly

### Graceful Degradation

- [ ] RecoveryErrorBoundary fails gracefully
- [ ] RecoveryService throws handled correctly
- [ ] UI remains usable even if recovery fails

---

## 🚀 Pre-Commit Verification

### Final Checks Before PR Merge

1. **Code Quality**:

   ```bash
   pnpm lint:strict
   pnpm typecheck
   pnpm test:coverage
   ```

2. **Branch State**:

   ```bash
   git status
   git log --oneline -5
   ```

3. **Commit Messages**:
   - [ ] Follow conventional commit format
   - [ ] Include issue/feature references

4. **Documentation**:
   - [ ] All `.implementations/*.md` files updated
   - [ ] README.md updated (if needed)
   - [ ] CHANGELOG.md entry added

5. **No Debugging Code**:
   - [ ] No `console.log` in production code
   - [ ] No commented-out blocks
   - [ ] No `// TODO` without tracking

---

## 📝 Sign-Off

**Tester**: ******\_\_\_\_******  
**Date**: ******\_\_\_\_******  
**Status**: ⬜ Pass | ⬜ Fail | ⬜ Pass with Caveats

**Notes**:
