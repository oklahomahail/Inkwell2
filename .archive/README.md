# Documentation Archive

**Archive Date:** November 3, 2025  
**Archived By:** Documentation cleanup automation

## Purpose

This directory contains historical documentation that is no longer actively maintained but is preserved for reference.

## Structure

```
.archive/
├── implementations/  # Completed feature implementation summaries
├── tests/           # Historical test documentation and summaries
├── tours/           # Tour system implementation documentation
├── releases/        # Deployment checklists and release docs
├── 2025-Q3/         # Session notes and status docs from Q3 2025
├── brands/          # Brand implementation and reference docs
└── README.md        # This file
```

## Contents Summary

- **109 archived markdown files** (down from 120 in root)
- **12 files remain in root** (essential documentation only)

### What Was Archived

1. **Implementation Summaries** (~40 files)
   - Feature completion summaries (\*\_SUMMARY.md)
   - Implementation complete docs (\*\_COMPLETE.md)
   - Fix documentation (_\_FIX_.md)

2. **Deployment & Checklists** (~15 files)
   - Deployment checklists
   - Release checklists
   - Verification checklists

3. **Tour System** (~5 files)
   - Tour implementation docs
   - Spotlight tour integration docs
   - (Kept: TOUR_QUICK_REFERENCE.md in root)

4. **Brand Implementation** (~3 files)
   - Brand fix documentation
   - Brand deployment guides
   - Color reference (duplicate of docs/COLORS.md)

5. **Historical Status** (~20 files)
   - Session summaries
   - Phase completion notes
   - Status verification docs
   - Merge and rebase plans

6. **Testing** (~5 files)
   - Quick test guide (covered by docs/TESTING_GUIDE.md)
   - Test summaries

### Files Kept in Root (12 files)

Essential documentation that remains active:

1. `README.md` - Main project documentation
2. `CHANGELOG.md` - Version history
3. `ROADMAP.md` - Product roadmap
4. `CONTRIBUTING.md` - Contributor guidelines
5. `USER_GUIDE.md` - End user documentation
6. `DOCUMENTATION_AUDIT_2025.md` - Audit history
7. `v0.8.0_RELEASE_NOTES.md` - Current release notes
8. `DEFENSIVE_GUARDS_INDEX.md` - Tour stability reference
9. `DEFENSIVE_GUARDS_USAGE_GUIDE.md` - Developer guide
10. `README_DEFENSIVE_GUARDS.md` - Defensive guards overview
11. `QUICK_REFERENCE.md` - Quick cheat sheet
12. `TOUR_QUICK_REFERENCE.md` - Tour quick reference

## Accessing Archived Documentation

To find archived documentation:

```bash
# Search for a specific topic
grep -r "topic" .archive/

# List all files in a category
ls .archive/implementations/

# View a specific archived file
cat .archive/implementations/AUTH_FIX_SUMMARY.md
```

## Restoration

If you need to restore an archived document:

```bash
# Copy from archive back to root
cp .archive/implementations/FILENAME.md .

# Or restore via git if needed
git log --all --full-history -- "FILENAME.md"
```

## Maintenance

- **Archive Policy:** Completed feature docs are archived after release
- **Review Cycle:** Annual audit (next: January 2026)
- **Retention:** Archives are kept indefinitely for historical reference

---

**Note:** This archive was created as part of the November 2025 documentation cleanup. See `DOCUMENTATION_AUDIT_2025.md` for the original audit plan.
