# Inkwell Scripts

Utility scripts for maintaining the Inkwell project.

## Documentation Maintenance

### `docs-maintenance.sh`

Automated documentation health check and cleanup recommendations.

**Purpose**: Identifies stale documentation, temporary implementation files, and outdated critical docs.

**Usage**:

```bash
# Run from project root
./scripts/docs-maintenance.sh

# Or with explicit path
bash scripts/docs-maintenance.sh
```

**What it checks**:

- **Critical Docs** (README, ROADMAP, CONTRIBUTING, USER_GUIDE, CHANGELOG): Flags if not updated in 2+ days
- **Temporary Files**: Identifies implementation summaries and completion notes (IMPLEMENTATION*\*, COVERAGE*_, TEST*AUDIT*_)
- **Stale Files**: Flags docs not updated in 5+ days

**Output**:

The script generates a color-coded report with:

- 🔴 Critical files needing updates
- 🟡 Temporary files to archive
- 🟠 Stale files to review
- Summary statistics and health score

**Exit codes**:

- `0`: Documentation is healthy (0-5 issues)
- `1`: Documentation needs attention (6+ issues)

**Best practices**:

1. **Weekly Review**: Run every Monday before sprint planning
2. **Pre-Release**: Run before cutting a new release
3. **Post-Feature**: Run after completing major features

**Example workflow**:

```bash
# Run the maintenance check
./scripts/docs-maintenance.sh

# Review flagged files
# Archive temporary files
mkdir -p .archive/implementation-notes/$(date +%Y-%m)
git mv IMPLEMENTATION_SUMMARY.md .archive/implementation-notes/$(date +%Y-%m)/

# Update stale docs as needed
# ...

# Commit cleanup
git add .
git commit -m "docs: archive stale implementation notes and update critical docs"
```

**Customization**:

Edit these variables in the script to adjust thresholds:

```bash
DAYS_STALE=5         # Regular docs older than this are flagged
DAYS_CRITICAL=2      # Critical docs older than this are flagged
ARCHIVE_DIR=".archive"
```

## Other Scripts

### `check-bundle-sizes.mjs`

Validates bundle sizes against baseline to prevent bundle bloat.

### `generate-bundle-baseline.mjs`

Generates baseline bundle size measurements for comparison.

### `coverage-diff.mjs`

Compares test coverage against baseline to track improvements.

---

**Maintained by**: @davehail
**Last updated**: November 9, 2025
