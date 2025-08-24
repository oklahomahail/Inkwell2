# Inkwell — Professional AI-Powered Writing Platform

**Inkwell** is a local-first fiction writing platform built for novelists, screenwriters, and storytellers who need professional-grade tools. Combining distraction-free writing with intelligent AI assistance and visual story management, Inkwell helps authors plan, write, and refine their stories from concept to publication.

**Built with React + TypeScript + TailwindCSS** • **Powered by Claude AI** • **Local-first & Private**

---

## Current Features (Phase 3 - August 2025)

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

### Visual Story Management
- **Timeline View** — Map story events across POV lanes with filtering and drag-reorder
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
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview build
pnpm tsc          # Type checking
pnpm lint         # ESLint check
```

---

## Project Status

**Current Phase:** Phase 3 P0 (Publication-Ready Features)

**Recently Completed:**
- ✅ Story Architect Mode (AI story generation)
- ✅ Consistency Guardian (AI analysis)
- ✅ Visual Timeline with POV lanes
- ✅ Enhanced Focus Mode baseline
- ✅ Professional export system

**In Progress:**
- 🚧 Focus Mode polish (typewriter mode, sprint timers)
- 🚧 Full-text search with filtering
- 🚧 EPUB export with metadata

**Next Up:**
- Corkboard view for scene organization
- Performance optimizations for large manuscripts
- Beta reader pack with feedback import

---

## Architecture

```
src/
├── components/
│   ├── Views/           # Main application views
│   ├── Planning/        # Story planning tools
│   ├── Writing/         # Editor components
│   └── Claude/          # AI integration
├── services/
│   ├── claudeService.ts      # AI API integration
│   ├── storyArchitectService.ts
│   ├── timelineService.ts
│   └── storageService.ts
├── hooks/               # Custom React hooks
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

## Links

**Live Demo:** https://vercel.com/dave-hails-projects-c68e1a61/inkwell2  
**Repository:** https://github.com/oklahomahail/Inkwell2  
**Issues:** https://github.com/oklahomahail/Inkwell2/issues
