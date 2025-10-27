#!/usr/bin/env bash
# Quick integration reference - paste this into your terminal

cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║         Inkwell Documentation Pack - Quick Integration            ║
╚═══════════════════════════════════════════════════════════════════╝

📦 STEP 1: Integrate the pack
────────────────────────────────────────────────────────────────────
./scripts/integrate-docs-pack.sh

# Or with custom path:
# ./scripts/integrate-docs-pack.sh ~/path/to/inkwell-docs-clean


🧹 STEP 2: Run cleanup (archives legacy docs)
────────────────────────────────────────────────────────────────────
./scripts/cleanup-docs-all.sh

# Optional: dry-run first to preview changes
# ./scripts/cleanup-docs-all.sh --dry-run


👀 STEP 3: Review changes
────────────────────────────────────────────────────────────────────
git status
git diff README.md
tree docs/ -L 2
tree .archive/ -L 2


✅ STEP 4: Commit
────────────────────────────────────────────────────────────────────
git add .
git commit -m "docs: reorganize documentation structure and consolidate guides"


📚 NEW STRUCTURE
────────────────────────────────────────────────────────────────────
docs/
  ├── README.md              # Doc index
  ├── brand/
  │   ├── BRAND_GUIDE.md     # Blue/gold system
  │   └── ACCESSIBILITY.md   # A11y guidelines
  ├── dev/
  │   ├── SETUP.md
  │   ├── DEPLOYMENT.md
  │   ├── TESTING_GUIDE.md
  │   ├── linting/
  │   │   └── ESLINT_MIGRATION.md
  │   └── performance/
  │       ├── PERFORMANCE.md
  │       ├── PERFORMANCE_GUARDRAILS.md
  │       └── TRACE_SYSTEM.md
  ├── features/
  │   ├── AI_SERVICES.md         # Merged & consolidated
  │   ├── AUTHENTICATION.md      # ✨ NEW: Auth system docs
  │   ├── CHAPTER_MANAGEMENT.md  # ✨ NEW: Chapter/scene system
  │   ├── PLOT_BOARDS.md
  │   └── TOUR_SYSTEM.md         # ✨ NEW: Spotlight tours
  ├── user/
  │   └── USER_GUIDE.md          # Onboarding + beginner mode
  ├── product/
  │   ├── ROADMAP.md             # Moved from root
  │   └── RELEASE.md             # Moved from root
  └── ops/
      ├── UPTIME_MONITORING.md
      └── ROLLBACK_PROCEDURES.md

CHANGELOG.md stays in root (standard location)


📋 ARCHIVED TO .archive/
────────────────────────────────────────────────────────────────────
  summaries/        - 50+ implementation summaries
  checklists/       - 15+ testing/deployment checklists
  phase-summaries/  - Historical phase docs
  migrations/       - Migration guides


📖 For detailed info, see: DOCS_INTEGRATION_GUIDE.md

EOF
