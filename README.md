# Inkwell — Professional AI-Powered Writing Platform

**Inkwell** is a local-first fiction writing platform built for novelists, screenwriters, and storytellers who need professional-grade tools. Combining distraction-free writing with intelligent AI assistance and visual story management, Inkwell helps authors plan, write, and refine their stories from concept to publication.

**Built with React + TypeScript + TailwindCSS** • **Powered by Claude AI** • **Local-first & Private**

---

## Current Features (October 2025)

### Core Writing Experience

- **TipTap Rich Text Editor** with real-time word counts and auto-save
- **Focus Mode** with distraction-free writing environment
- **Scene-Based Organization** with chapter management
- **Professional Exports** (PDF, DOCX, Markdown, TXT) with clean formatting

### AI-Powered Story Development

- **Story Architect Mode** — Generate complete story outlines from premise to scene details
- **Consistency Guardian** — AI analysis of character, timeline, and plot consistency
- **AI Writing Toolbar** — Context-aware suggestions for continuing scenes and improving flow
- **Character Development** — AI-assisted character arcs, motivations, and conflicts

### Enhanced Timeline Management

- **Advanced Timeline Integration** — Comprehensive conflict detection and scene linking
- **Smart Conflict Detection** — Automatic detection of time overlaps, character inconsistencies, and plot holes
- **Scene-Timeline Linkage** — Intelligent suggestions for connecting scenes to timeline events
- **Chronological Navigation** — Navigate between scenes in timeline order with sibling scene detection
- **Timeline Validation** — Overall timeline health scoring with detailed conflict resolution
- **Time Anchoring** — Lock critical story moments to prevent timeline inconsistencies

### Visual Story Management

- **Timeline View** — Map story events across POV lanes with filtering and drag-reorder
- **Plot Boards** — Kanban-style story structure visualization with collaborative editing, real-time sync, and comprehensive export/import
- **Story Structure Visualizer** — Professional story health analytics and pacing insights
- **Planning Tools** — Beat sheet templates, character profiles, and project analytics

### Professional Features

- **Command Palette** (⌘K) with full keyboard navigation
- **Writing Goals & Analytics** — Daily targets, streak tracking, and productivity insights
- **Multi-layer Backups** with version history and recovery
- **Export Templates** — Standard manuscript formatting for agent submissions

---

## Tech Stack

**Frontend:** React 18, TypeScript, TailwindCSS, Vite  
**Editor:** TipTap v3 with custom extensions  
**AI Integration:** Claude API with secure key management  
**Storage:** IndexedDB with localStorage fallbacks  
**Charts:** Recharts for analytics visualization  
**Deployment:** Vercel with CI/CD pipeline

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/oklahomahail/Inkwell2.git
cd Inkwell2

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:5173
```

### Development Commands

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview build locally

# Code Quality
pnpm typecheck    # TypeScript type checking (✅ Major errors resolved)
pnpm lint         # ESLint check (strict)
pnpm lint:relaxed # ESLint with warnings only
pnpm lint:fix     # Auto-fix ESLint issues
pnpm test         # Run tests in watch mode (✅ 200/200 tests passing)
pnpm test:run     # Run tests once
pnpm test:coverage # Run tests with coverage

# Deployment
./scripts/deploy.sh  # Complete deployment pipeline
pnpm vercel:test     # Test production build locally
```

---

## Project Status

**Current Phase:** Phase 2 Advanced Features ✅ (Plot Boards MVP Complete)

**Recently Completed (October 2025):**

- ✅ **TypeScript & Developer Experience Improvements** — Major cleanup and stability improvements:
  - Complete trace logger system overhaul with proper API usage
  - StorageManager compatibility layer for backward compatibility
  - All TypeScript compilation errors resolved (200/200 tests passing)
  - Enhanced type safety across plotboards and storage systems
  - Improved developer experience with clear error messages
- ✅ **Plot Boards Feature** — Complete Kanban-style story organization system with:
  - Drag-and-drop interface with @dnd-kit integration
  - Chapter/scene synchronization and two-way data binding
  - Built-in story structure templates (Three-Act, Hero's Journey)
  - Timeline event linking and progress tracking
  - **Multi-user collaboration** with real-time presence and conflict resolution
  - **Comprehensive export/import system** supporting JSON, Markdown, CSV, and portable packages
  - **Advanced filtering and saved views** with persistent user preferences
  - **Full accessibility support** with keyboard navigation and screen reader compatibility
  - Feature flag system for controlled rollout
  - Comprehensive test suite with 120+ test cases covering all collaboration scenarios
- ✅ **Enhanced Timeline Service** — Comprehensive conflict detection and validation system
- ✅ **Scene-Timeline Linkage** — Intelligent auto-detection and manual linking with validation
- ✅ **Timeline Navigation** — Chronological scene navigation with sibling detection
- ✅ **Conflict Detection UI** — Visual timeline validation panel with auto-fix capabilities
- ✅ **Linkage Suggestions UI** — AI-powered scene linkage recommendations interface
- ✅ **Timeline Health Scoring** — Overall timeline quality assessment (0-100 scale)
- ✅ **Time Anchoring System** — Lock critical story moments for consistency

**Previously Completed:**

- ✅ Story Architect Mode (AI story generation)
- ✅ Consistency Guardian (AI analysis)
- ✅ Visual Timeline with POV lanes
- ✅ Enhanced Focus Mode baseline
- ✅ Professional export system
- ✅ ESLint 9 migration with flat config
- ✅ TypeScript strict mode compliance

**Next Priority (Phase 3 Transition):**

- 🚧 **Advanced Plot Boards** — Enhanced features for power users:
  - PDF/image export of plot boards
  - Advanced filtering and search within boards
  - Collaboration features (comments, assignments)
  - Custom template creation and sharing
- 🚧 **AI-Enhanced Plot Analysis** — AI-powered story structure insights:
  - Plot hole detection across board cards
  - Pacing analysis and recommendations
  - Character arc consistency checking
  - Genre-specific structure validation

**Future Phases:**

- **Phase 3** — Advanced AI Integration (Claude API, plot hole detection, style analysis)
- **Phase 4** — Collaboration Features (multi-user editing, comments, version control)
- **Phase 5** — Publishing & Export (professional formatting, EPUB, platform integration)
- **Phase 6** — Advanced Analytics (writing patterns, productivity insights, story metrics)

---

## Architecture

```
src/
├── components/
│   ├── Views/           # Main application views
│   ├── Planning/        # Story planning tools
│   ├── Writing/         # Editor components
│   ├── timeline/        # Enhanced timeline components
│   │   ├── TimelineValidationPanel.tsx
│   │   ├── SceneLinkageSuggestions.tsx
│   │   └── TimelineNavigation.tsx
│   └── Claude/          # AI integration
├── features/            # Feature-based architecture
│   └── plotboards/      # Plot Boards feature
│       ├── components/          # Kanban UI components
│       │   ├── collaboration/   # Multi-user collaboration UI
│       │   ├── filters/         # Advanced filtering interface
│       │   └── views/           # Saved views management
│       ├── collaboration/       # Collaboration backend systems
│       ├── export/              # Board export functionality
│       ├── import/              # Board import with validation
│       ├── portability/         # Universal board portability
│       ├── views/               # Saved view persistence
│       ├── hooks/               # Feature-specific hooks
│       ├── store.ts             # Zustand state management
│       ├── types.ts             # Plot boards data models
│       ├── utils/               # Integration utilities
│       └── tests/               # Comprehensive test suite
├── services/
│   ├── claudeService.ts           # AI API integration
│   ├── storyArchitectService.ts   # Story outline & templates
│   ├── timelineService.ts         # Basic timeline management
│   ├── enhancedTimelineService.ts # Advanced timeline features
│   ├── storageService.ts          # Data persistence
│   ├── searchService.ts           # Full-text search
│   └── backupService.ts           # Backup & recovery
├── hooks/               # Custom React hooks
│   └── stores/          # Zustand store definitions
├── utils/               # Shared utilities
│   ├── flags.ts         # Feature flag system
│   ├── storage.ts       # Enhanced storage with IndexedDB + compatibility layer
│   └── trace.ts         # Comprehensive tracing system (performance, user actions, storage)
├── types/              # TypeScript definitions
└── styles/             # CSS modules and globals
```

---

## Contributing

We welcome contributions! Please:

1. Check [Issues](https://github.com/oklahomahail/Inkwell2/issues) for open tasks
2. Follow TypeScript + ESLint conventions
3. Test thoroughly before submitting PRs
4. Include clear commit messages

### Development Guidelines

- Use TypeScript strict mode
- Follow component patterns in existing codebase
- Add error boundaries for new features
- Include accessibility considerations

---

## License

MIT License © 2025 Inkwell Authors

---

## Documentation

📚 **[User Guide](USER_GUIDE.md)** - Complete guide for writers using Inkwell  
🚀 **[Deployment Guide](DEPLOYMENT.md)** - Instructions for deploying to production  
🎨 **[Plot Boards Guide](docs/PLOT_BOARDS.md)** - Complete documentation for the Plot Boards feature  
🔧 **[ESLint Migration Guide](docs/ESLINT_MIGRATION.md)** - Technical details about ESLint 9 upgrade  
📊 **[Trace System Guide](docs/TRACE_SYSTEM.md)** - Performance monitoring and debugging system documentation

---

## Links

**Live Demo:** https://vercel.com/dave-hails-projects-c68e1a61/inkwell2  
**Repository:** https://github.com/oklahomahail/Inkwell2  
**Issues:** https://github.com/oklahomahail/Inkwell2/issues
