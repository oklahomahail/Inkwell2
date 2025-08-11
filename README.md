# Inkwell – Offline-First Fiction Writing Platform

Inkwell is a local-first writing app designed specifically for novelists. Track chapters, develop characters, manage plot threads, and monitor your writing progress—all with optional AI assistance. Your data stays on your device using IndexedDB, so you can write anywhere, anytime, even without an internet connection.

## ✨ Features

- **📖 Chapter Tracker** – Manage summaries, word counts, and draft status
- **👥 Character Bible** – Create detailed profiles, character arcs, and relationships
- **🔍 Clue Tracker** – Plant and resolve plot threads throughout your story
- **⏰ Timeline Manager** – Ensure continuity and spot potential conflicts
- **📊 Writing Analytics** – Track streaks, set goals, and monitor writing velocity
- **🤖 AI Assistant** – Optional brainstorming and revision help with Claude AI
- **💾 Offline-First** – IndexedDB persistence with local backups (planned)
- **🌙 Dark Mode** – Beautiful, responsive UI built with Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 20.11+
- pnpm 9+ (or npm/yarn)
- Vite 7
- Tailwind CSS 3.4.x

### Installation

```bash
git clone https://github.com/oklahomahail/Inkwell2.git
cd Inkwell2
pnpm install
pnpm dev
```

The app will be available at `http://localhost:5173`

### Useful Commands

```bash
pnpm typecheck    # Type checking with TypeScript
pnpm lint         # ESLint with zero warnings policy
pnpm lint:fix     # Auto-fix linting issues
pnpm build        # Production build
pnpm preview      # Preview production build
```

## 📁 Project Structure

```
src/
├── app/          # App bootstrap and routing
├── layout/       # Sidebar, Topbar, and shell components
├── panels/       # Main feature panels (Dashboard, Writing, Timeline, Analysis)
├── ui/           # Reusable UI components (Button, Card, Input, Modal, Toast)
├── context/      # React contexts (AppContext, ClaudeProvider)
├── reducers/     # State management and types
├── services/     # External services (Claude API, storage, analytics)
├── hooks/        # Custom hooks (localStorage, IndexedDB, keyboard shortcuts)
├── models/       # TypeScript type definitions
├── styles/       # Tailwind configuration and design tokens
└── utils/        # Helper functions and utilities
```

**Note:** Domain logic is organized under `panels/`, `services/`, and `models/` rather than a generic `features/` directory. The `@/*` path alias points to `src/*` and is configured in both Vite and TypeScript.

## 🤖 AI Assistant Setup (Optional)

The Claude AI integration is completely optional. If you choose to use it, you'll need to configure your API credentials.

### Environment Configuration

Create a `.env.local` file in your project root:

```env
# Claude API configuration
VITE_CLAUDE_API_BASE=https://api.anthropic.com/v1/messages
VITE_CLAUDE_MODEL=claude-3-5-sonnet

# Encryption salt for API key storage
# Use a random string in development; set via CI/CD in production
VITE_CLAUDE_KEY_ENC_SALT=your-random-salt-here
```

### Security Notes

- Your API key is stored locally and encrypted for convenience
- The encryption salt is provided via `VITE_CLAUDE_KEY_ENC_SALT`
- Use different salt values for different environments
- You can clear your saved key through app settings or by clearing browser storage
- **Never commit API keys to version control**

## 🔒 Data & Privacy

**Local Storage:**
- **IndexedDB:** Chapters, characters, clues, timeline data, and analytics
- **localStorage:** UI preferences, settings, and encrypted AI credentials

**Privacy First:**
- All data stays on your device
- No cloud sync or data collection
- Export/import functionality coming soon
- Local backup system planned

## 🛠️ Development

### Technical Decisions

- **Tailwind CSS 3.4.x** used for stability (avoid 4.x until stable)
- **Husky + lint-staged** available for commit quality control
- **Vitest + React Testing Library** recommended for testing

### Recommended Development Flow

1. Run type checking: `pnpm typecheck`
2. Fix linting issues: `pnpm lint:fix`
3. Test your changes locally: `pnpm dev`
4. Build for production: `pnpm build && pnpm preview`

## 🗺️ Roadmap

**Coming Soon:**
- [ ] Project export/import functionality
- [ ] Automated local backups
- [ ] PWA support investigation
- [ ] Comprehensive test coverage
- [ ] In-app keyboard shortcuts guide

**Future Considerations:**
- [ ] Plugin system for custom workflows
- [ ] Collaborative features
- [ ] Advanced analytics and insights

## 🤝 Contributing

We welcome contributions! Please feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy writing! 📝**
