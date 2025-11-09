# Coverage Tooling & Automation

**Purpose:** Automated tools to track, report, and enforce coverage improvements across development cycles.

---

## 🛠️ Available Tools

### 1. Coverage Diff Reporter

**Script:** `scripts/coverage-diff.mjs`

**Purpose:** Generates weekly delta reports comparing current coverage against baseline.

**Usage:**

```bash
# Run tests with coverage and generate diff report
pnpm test:coverage:diff

# Generate report from existing coverage (no test run)
pnpm coverage:report

# Save current coverage as new baseline
pnpm coverage:save-baseline
```

**Output:** `COVERAGE_WEEKLY_REPORT.md`

**Features:**

- ▲/▼ symbols showing coverage trends
- 🟢/🟡/🟠/🔴 color-coded status indicators
- File-level change tracking (top 10 deltas)
- Critical gaps report (<25% coverage files)
- Actionable next steps

**Example Output:**

```markdown
## Overall Coverage

| Metric       | Current | Baseline | Change  | Status |
| ------------ | ------- | -------- | ------- | ------ |
| **Lines**    | 64.85%  | 63.13%   | ▲ 1.72% | 🟢     |
| **Branches** | 78.66%  | 78.00%   | ▲ 0.66% | 🟡     |
```

---

### 2. Directory-Level Thresholds

**File:** `vitest.config.ts`

**Purpose:** Enforce coverage standards per directory to prevent regressions in critical areas.

**Configuration:**

```typescript
thresholds: {
  // Global baseline
  lines: 64,
  functions: 50,
  branches: 60,
  statements: 64,

  // Critical areas (prevent regressions)
  'src/model/**': { lines: 7 },      // Will increase to 70% in Phase 1
  'src/onboarding/**': { lines: 90 }, // Maintain excellence
  'src/domain/**': { lines: 100 },    // Maintain perfection
  'src/editor/**': { lines: 100 },    // Maintain perfection
  'src/utils/storage/**': { lines: 90 },

  // Improvement targets
  'src/services/**': { lines: 60 },   // Target 75% in Phase 2
  'src/context/**': { lines: 65 },    // Target 80% in Phase 2
}
```

**Benefits:**

- Prevents "hiding" low coverage in high-coverage directories
- Forces attention to critical business logic (model, services)
- Locks in quality gains in well-tested areas
- Gradual improvement path with phase-aligned targets

---

### 3. Test Audit Tool

**Script:** `scripts/audit-tests.mjs`

**Purpose:** Scans test files for health issues (obsolete, duplicate, stale).

**Usage:**

```bash
# Run automated test health check
pnpm node scripts/audit-tests.mjs
```

**Output:** `TEST_AUDIT_REPORT.md`

**Identifies:**

- Obsolete files (in archive/skipped folders)
- Redundant duplicates (tests not in `__tests__`)
- Stale tests (broken imports, missing dependencies)
- Current health status

---

## 🔄 Recommended Workflows

### Weekly Coverage Review

**Every Monday morning:**

```bash
# 1. Run coverage and generate diff
pnpm test:coverage:diff

# 2. Review COVERAGE_WEEKLY_REPORT.md
cat COVERAGE_WEEKLY_REPORT.md

# 3. If coverage improved, save new baseline
pnpm coverage:save-baseline

# 4. Commit baseline for team tracking
git add coverage-baseline.json COVERAGE_WEEKLY_REPORT.md
git commit -m "chore: weekly coverage report - $(date +%Y-%m-%d)"
```

**Benefits:**

- Weekly accountability
- Visual progress tracking
- Team visibility into coverage trends

---

### Pre-Release Coverage Gate

**Before cutting a release:**

```bash
# 1. Run full coverage
pnpm test:coverage

# 2. Check against Phase targets
# Phase 1: 72-75% lines
# Phase 2: 77-80% lines
# Phase 3: 80%+ lines

# 3. Generate final report
pnpm coverage:report

# 4. Tag release if thresholds met
git tag v0.9.0-qa
```

---

### PR Coverage Workflow

**On every pull request:**

1. CI runs `pnpm test:coverage`
2. Coverage report uploaded as GitHub Actions artifact
3. PR comment shows coverage delta
4. Block merge if:
   - Global coverage decreases
   - Directory threshold violated
   - New files have <50% coverage

**GitHub Actions Example:**

```yaml
- name: Run tests with coverage
  run: pnpm test:coverage

- name: Generate coverage diff
  run: pnpm coverage:report

- name: Upload coverage artifacts
  uses: actions/upload-artifact@v3
  with:
    name: coverage-report
    path: |
      coverage/
      COVERAGE_WEEKLY_REPORT.md

- name: Comment PR with coverage
  uses: actions/github-script@v6
  with:
    script: |
      const fs = require('fs');
      const report = fs.readFileSync('COVERAGE_WEEKLY_REPORT.md', 'utf8');
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: report
      });
```

---

## 📊 Coverage Metrics Dashboard

**Tracked Metrics:**

| Metric              | Current | Phase 1 Target | Phase 2 Target | Phase 3 Target |
| ------------------- | ------- | -------------- | -------------- | -------------- |
| Global Lines        | 64.85%  | 72-75%         | 77-80%         | 80%+           |
| Global Branches     | 78.66%  | 82%            | 85%            | 87%            |
| Global Functions    | 58.85%  | 65%            | 70%            | 73%            |
| Model Layer         | 7%      | **70%**        | 75%            | 80%            |
| Services            | 60% avg | 65%            | **75%**        | 80%            |
| Critical Files <25% | 15      | **<10**        | <5             | 0              |

---

## 🎯 Future Enhancements

### Planned Additions

1. **Mutation Testing Integration** (Phase 2)

   ```bash
   pnpm add -D @stryker-mutator/core
   pnpm stryker run
   ```

   - Detects "zombie tests" (tests that don't actually test)
   - Ensures tests catch real bugs

2. **Property-Based Testing** (Phase 2)

   ```bash
   pnpm add -D fast-check
   ```

   - Covers edge cases in AI/content handling
   - Generates thousands of test cases automatically

3. **Coverage Badges** (Phase 1)

   ```markdown
   ![Coverage](https://img.shields.io/badge/coverage-75%25-green)
   ```

   - Auto-updated in README
   - Shows status at a glance

4. **Snapshot Testing for Models** (Phase 1)

   ```typescript
   expect(serialize(chapter)).toMatchSnapshot();
   ```

   - Cheap tests for serialization logic
   - High line coverage with minimal effort

5. **GitHub Actions Coverage Enforcement**
   - PR label `coverage-required` blocks merge
   - Must-touch: modified files need ≥target coverage
   - Ratchet: coverage can only increase, never decrease

---

## 📝 Maintenance

### Updating Baselines

**When to update:**

- After successful Phase completion
- Weekly (if coverage improved)
- Before release tags

**How to update:**

```bash
# Save current as new baseline
pnpm coverage:save-baseline

# Commit for team tracking
git add coverage-baseline.json
git commit -m "chore: update coverage baseline after Phase 1 completion"
```

### Updating Directory Thresholds

**When Phase targets are met:**

```typescript
// vitest.config.ts
'src/model/**': {
  lines: 70,  // Increased from 7 after Phase 1
},
```

**Commit with explanation:**

```bash
git commit -m "chore: raise model layer coverage threshold to 70%

Phase 1 complete - model layer now meets target.
New baseline prevents future regressions."
```

---

## 🔍 Troubleshooting

### "Coverage decreased" in CI

**Cause:** New code added without tests.

**Fix:**

```bash
# Identify uncovered files
pnpm coverage:report

# Review "Critical Coverage Gaps" section
# Add tests for new files
```

### "Directory threshold violated"

**Cause:** Regression in critical directory (model, services).

**Fix:**

```bash
# Check which directory failed
pnpm test:coverage | grep "does not meet"

# Add tests to restore coverage
```

### "Baseline drift"

**Cause:** Baseline not updated after coverage improvements.

**Fix:**

```bash
# Update baseline to lock in gains
pnpm coverage:save-baseline
git add coverage-baseline.json
git commit -m "chore: update coverage baseline"
```

---

**Last Updated:** 2025-11-07
**Maintained By:** Development Team
**Related Docs:** [COVERAGE_ATTACK_PLAN.md](COVERAGE_ATTACK_PLAN.md), [COVERAGE_BASELINE_SUMMARY.md](COVERAGE_BASELINE_SUMMARY.md)
