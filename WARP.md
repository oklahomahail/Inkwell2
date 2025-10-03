# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking only
pnpm typecheck

# Linting and formatting
pnpm lint              # ESLint check
pnpm lint:fix          # ESLint auto-fix
pnpm lint:css          # Stylelint check
pnpm lint:css:fix      # Stylelint auto-fix
pnpm format            # Prettier formatting

# Combined checks
pnpm check             # Relaxed lint + typecheck
pnpm ci                # Full CI pipeline (typecheck, lint, test, audit)
```

### Testing

```bash
# Run tests
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # With coverage report
pnpm test:baseline     # Baseline performance tests

# Run benchmarks
pnpm bench             # Vitest benchmarks
```

### Code Quality & Auditing

```bash
# Repository audits
pnpm repo:audit        # Run all audits
pnpm audit:knip        # Unused dependencies/files
pnpm audit:depcheck    # Dependency analysis
pnpm audit:orphans     # Orphaned files
pnpm audit:cycles      # Circular dependencies
```

### Single Test Execution

```bash
# Run specific test file
pnpm test src/components/Search/SearchBar.test.tsx

# Run tests matching pattern
pnpm test --grep "search functionality"

# Run single test with coverage
pnpm test:coverage src/components/Search/SearchBar.test.tsx
```

## Architecture Overview

### High-Level Architecture

Inkwell is a React-based fiction writing platform with a **modular panel-based architecture**. The application uses a **provider composition pattern** at the root with three core layers:

1. **Provider Layer**: `ClaudeProvider` → `AppProvider` → `CommandPaletteProvider`
2. **Platform Layer**: Panel-based UI system with lazy-loaded components
3. **Service Layer**: Local-first storage with IndexedDB/localStorage hybrid

### Core Systems

#### Panel Architecture (`src/components/Platform/`)

The application uses a **dynamic panel system** where each view is a composable panel:

- **Panel Registry**: Central registration of all available panels with metadata
- **Dynamic Rendering**: Panels are lazy-loaded and rendered based on configuration
- **Context-Aware**: Panels automatically receive required props based on current state

```typescript
// Panel registration pattern
{
  id: 'writing',
  title: 'Writing',
  group: 'Writing Tools',
  icon: React.createElement(Edit3),
  component: lazy(() => import('./WritingPanel')),
  requiresProps: true
}
```

#### State Management Architecture

- **Context-First**: Primary state lives in `AppContext` with reducer pattern
- **Service Integration**: Services are stateless and called from contexts/hooks
- **Local-First**: All data persists locally with optional cloud sync

#### AI Integration (`src/services/claudeService.ts`)

- **Claude API Integration**: Direct integration with Anthropic's Claude API
- **Context-Aware**: AI receives project context and selected text
- **Specialized Workflows**: Story Architect mode, Consistency Guardian, writing assistance
- **Token Management**: Configurable token limits for different AI tasks

#### Storage Architecture

**Dual Storage System**:

1. **Enhanced Projects** (`EnhancedProject`): Metadata, analytics, sessions
2. **Writing Chapters** (`WritingChapter[]`): Editor content with scenes and chapters

**Key Services**:

- `enhancedStorageService`: Advanced storage with maintenance and quotas
- `storageService`: Core CRUD operations
- `backupService`: Multi-layer backup with versioning
- `snapshotService`: Point-in-time recovery

### Key Architectural Patterns

#### Provider Composition

```typescript
// App root structure
<ClaudeProvider>
  <AppProvider>
    <CommandPaletteProvider>
      <AppShell />
    </CommandPaletteProvider>
  </AppProvider>
</ClaudeProvider>
```

#### Service Layer Boundaries

Services maintain strict boundaries enforced by ESLint rules:

- Services cannot import components or hooks
- Context cannot import hooks (prevents circular dependencies)
- Hooks should not import components (remain UI-agnostic)

#### Search System

- **Web Workers**: Search operations run in background workers
- **Incremental Indexing**: Real-time search index updates
- **Fuzzy Matching**: Advanced text search with relevance scoring

### Critical Dependencies

#### Core Framework

- **React 19.1.0**: Latest React with concurrent features
- **TypeScript 5.9+**: Strict mode with advanced type checking
- **Vite**: Build system with HMR and optimized bundling

#### Editor System

- **TipTap v3**: Rich text editor with ProseMirror foundation
- **Custom Extensions**: Writing-specific editor features

#### AI & Processing

- **Claude API**: Direct integration for AI assistance
- **CryptoJS**: Secure API key storage with encryption
- **Web Workers**: Background processing for search and analysis

#### Storage & Performance

- **IndexedDB**: Primary storage for large datasets
- **LocalStorage**: Fallback and metadata storage
- **Date-fns**: Date manipulation and formatting

### Development Guidelines

#### File Organization

- Use absolute imports with `@/` prefix for all internal modules
- Maintain the established directory structure:
  - `components/`: UI components grouped by feature
  - `services/`: Business logic and API integrations
  - `hooks/`: Custom React hooks
  - `context/`: React context providers
  - `types/`: TypeScript type definitions

#### Testing Strategy

- Unit tests for utility functions and hooks
- Integration tests for service layer
- Component tests using React Testing Library
- Performance benchmarks for search and storage operations

#### Code Quality

- ESLint enforces architectural boundaries and import patterns
- Prettier maintains consistent formatting
- Strict TypeScript prevents runtime errors
- Import order enforced with automatic grouping

#### Performance Considerations

- Panel lazy-loading reduces initial bundle size
- Web Workers prevent UI blocking during heavy operations
- Incremental storage updates minimize write operations
- Search indexing happens asynchronously

### Command Palette System

The application includes a comprehensive command palette (⌘K) with:

- **Context-Aware Commands**: Available commands change based on current view
- **Keyboard Navigation**: Full keyboard accessibility
- **Extensible Architecture**: New commands easily registered via hooks

### Focus Mode & Writing Experience

- **Distraction-Free Writing**: Advanced focus mode with typewriter scrolling
- **Real-Time Analytics**: Live word count, session tracking, productivity metrics
- **Auto-Save**: Intelligent auto-save with conflict resolution
- **Session Management**: Writing session tracking with productivity insights
