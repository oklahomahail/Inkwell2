# Plot Boards Feature Documentation

## Overview

Plot Boards is a Kanban-style story structure visualization system that allows writers to organize their story elements, scenes, and chapters using a drag-and-drop interface. This feature provides a visual approach to story planning and helps writers track progress across different story elements.

## Features

### 🎨 Visual Story Organization

- **Kanban Interface**: Drag-and-drop cards between customizable columns
- **Multiple Board Types**: Support for different organizational methods (Acts, Chapters, Character Arcs, Subplots, Themes)
- **Professional Templates**: Built-in story structure templates including Three-Act Structure and Hero's Journey
- **Custom Boards**: Create unlimited custom boards with personalized column structures

### 🔗 Chapter & Scene Integration

- **Two-Way Sync**: Automatic synchronization between plot cards and existing chapters/scenes
- **Smart Linking**: Intelligent scene-to-card mapping based on content and metadata
- **Auto-Generation**: Create plot cards automatically from existing chapter content
- **Conflict Resolution**: Handle data conflicts between cards and scenes gracefully

### ⏰ Timeline Integration

- **Event Linking**: Automatic linking of plot cards to timeline events based on story dates and tags
- **Temporal Matching**: Smart detection of related events within 24-hour windows
- **Tag-Based Association**: Connect cards to timeline events through shared tags
- **Visual Indicators**: Display timeline connections directly on cards

### 📊 Progress Tracking

- **Status Management**: Track card progress (Idea → Outlined → Draft → Revision → Complete)
- **Priority System**: Organize cards by priority levels (Low, Medium, High, Critical)
- **Word Count Integration**: Display and track word counts across cards and columns
- **Progress Visualization**: Visual progress bars showing completion percentages

### 🤝 Collaboration Features

- **Multi-User Support**: Real-time collaboration with user presence indicators
- **Permission System**: Role-based access control (Owner, Editor, Viewer, Commenter)
- **Conflict Resolution**: Automatic conflict detection and resolution strategies
- **User Presence**: Live user avatars showing who's currently viewing/editing
- **Activity Tracking**: Real-time user activity indicators and notifications
- **Board Sharing**: Public and private board sharing with access controls
- **Operational Transform**: Advanced conflict resolution for simultaneous edits
- **Connection Management**: Robust offline/online handling with automatic reconnection

### 🎛️ Advanced Features

- **Feature Flag System**: Controlled rollout using URL parameters (`?plotBoards=1`)
- **Auto-Save**: Automatic persistence using IndexedDB with localStorage fallback
- **Search & Filter**: Full-text search across all cards with filtering capabilities
- **Bulk Operations**: Mass update multiple cards simultaneously
- **Export/Import**: Board data portability with validation
- **Saved Views**: Custom board views with filtering and column configurations
- **Undo/Redo**: Comprehensive undo/redo system with keyboard shortcuts
- **Keyboard Navigation**: Full keyboard accessibility with focus management

## Architecture

### Technical Stack

- **State Management**: Zustand with persistence and selective state hydration
- **Drag & Drop**: @dnd-kit for professional drag-and-drop interactions
- **Storage**: Enhanced IndexedDB implementation with schema versioning
- **UI Framework**: React with TypeScript and TailwindCSS
- **Testing**: Comprehensive test suite using Vitest

### File Structure

```
src/features/plotboards/
├── components/           # React components
│   ├── PlotBoard.tsx    # Main board orchestrator
│   ├── PlotColumn.tsx   # Kanban columns
│   ├── PlotCard.tsx     # Individual cards
│   ├── PlotBoards.tsx   # Page-level component
│   ├── collaboration/   # Collaboration UI components
│   │   ├── CollaborationToolbar.tsx    # Sharing and user controls
│   │   ├── UserAvatar.tsx             # User presence indicators
│   │   ├── PresencePanel.tsx          # Active user management
│   │   └── ConflictResolutionDialog.tsx # Merge conflict handling
│   ├── filters/
│   │   └── FilterPanel.tsx           # Card filtering interface
│   ├── views/
│   │   └── SavedViewsSelector.tsx    # Saved view management
│   └── index.ts         # Component exports
├── collaboration/       # Collaboration backend
│   ├── types.ts        # Collaboration data models
│   └── storage.ts      # Collaboration storage layer
├── export/
│   └── exportSystem.ts  # Board export functionality
├── import/
│   └── importSystem.ts  # Board import with validation
├── portability/
│   └── portabilitySystem.ts  # Universal board portability
├── views/
│   └── savedViews.ts   # Saved view persistence
├── filters/
│   └── filtering.ts    # Advanced filtering logic
├── hooks/
│   ├── usePlotBoardIntegration.ts  # Chapter/timeline integration
│   ├── useUndoRedo.ts             # Undo/redo functionality
│   └── useKeyboardNavigation.ts   # Keyboard accessibility
├── utils/
│   └── integration.ts   # Integration utilities
├── tests/
│   ├── plotBoards.test.ts          # Core functionality tests
│   ├── undoRedo.test.ts           # Undo/redo tests
│   ├── filtersAndViews.test.ts    # Filtering and views tests
│   └── keyboardNavigation.test.ts  # Accessibility tests
├── schema/
│   └── versioning.ts   # Data schema versioning
├── store.ts            # Zustand store
├── types.ts            # TypeScript definitions
└── index.ts            # Feature exports
```

### Data Models

#### Core Types

- **PlotBoard**: Top-level board containing columns and settings
- **PlotColumn**: Vertical lanes for organizing cards (Acts, Chapters, etc.)
- **PlotCard**: Individual story elements with rich metadata
- **PlotBoardTemplate**: Reusable board configurations

#### Integration Types

- **ScenePlotCardMapping**: Links between cards and existing scenes
- **TimelineEventPlotMapping**: Connections to timeline events
- **PlotProgressMetrics**: Comprehensive progress tracking data

#### Collaboration Types

- **CollaborativeUser**: User profile with permissions and presence data
- **UserPresence**: Real-time user status and activity information
- **Permission**: Granular access control (view, edit, comment, share, etc.)
- **SharedBoard**: Board sharing configuration and access controls
- **CollaborationEvent**: Real-time events for user actions and updates
- **ConflictResolution**: Conflict detection and resolution strategies
- **OperationalTransform**: Advanced conflict resolution for simultaneous edits
- **ConnectionState**: Network connection status and sync information

#### Storage & Portability Types

- **ExportResult**: Structured export data with validation
- **ImportValidation**: Import conflict detection and resolution
- **PortablePackage**: Cross-platform board package format
- **SavedView**: Custom board view configurations
- **FilterCriteria**: Advanced card filtering and search

## Usage Guide

### Enabling the Feature

The Plot Boards feature is gated behind a feature flag for controlled rollout:

1. **URL Parameter**: Add `?plotBoards=1` to any Inkwell URL
2. **Developer Console**: Run `__inkwellFlags.enable('plotBoards')`
3. **Persistent**: Setting persists in localStorage across sessions

### Getting Started

1. **Access**: Navigate to "Plot Boards" in the sidebar (appears when enabled)
2. **Create First Board**:
   - Choose "Blank Board" for custom setup
   - Select from templates (Three-Act Structure, Hero's Journey)
3. **Add Columns**: Create columns for your organizational method
4. **Sync Content**: Use "📚 Sync Chapters" to import existing story content
5. **Organize**: Drag cards between columns to visualize story structure

### Chapter Synchronization

The chapter sync feature provides bidirectional integration:

**Manual Sync Options:**

- **Sync All Changes**: Full synchronization of all modifications
- **Create Cards from Chapters**: Generate cards from selected chapters
- **Auto-sync Toggle**: Enable/disable automatic synchronization

**Auto-Sync Features:**

- **Change Detection**: Monitors chapters for content updates
- **Conflict Resolution**: Handles simultaneous edits gracefully
- **Debounced Updates**: Prevents excessive sync operations
- **Error Recovery**: Robust error handling with user notifications

### Templates

#### Three-Act Structure

- **Act I - Setup**: Character introduction and inciting incident
- **Act II - Confrontation**: Rising action and character development
- **Act III - Resolution**: Climax and story conclusion

#### Hero's Journey

- **Ordinary World**: Hero's normal life before adventure
- **Call to Adventure**: Challenge that starts the journey
- **Special World**: Transformed environment and trials
- **Return with Elixir**: Hero returns transformed

### Collaboration

Plot Boards supports multi-user collaboration with real-time synchronization:

#### Sharing Boards

1. **Share Button**: Click the "Share" button in the collaboration toolbar
2. **Access Controls**: Set permissions (Owner, Editor, Viewer, Commenter)
3. **Public/Private**: Choose between public links or private invitations
4. **Permission Management**: Manage user access through the permissions panel

#### Real-Time Collaboration

- **User Presence**: See live avatars of active collaborators
- **Activity Indicators**: Real-time user activity with descriptive tooltips
- **Conflict Resolution**: Automatic detection and resolution of editing conflicts
- **Connection Status**: Visual indicators for sync status and connectivity

#### Conflict Handling

When multiple users edit simultaneously:

- **Auto-Merge**: Simple conflicts resolved automatically
- **Manual Resolution**: Complex conflicts require user decision
- **Resolution Strategies**: Keep local, keep remote, or merge manually
- **Conflict Preview**: Side-by-side comparison of conflicting versions

### Export & Import

Comprehensive data portability features:

#### Export Options

- **JSON**: Raw data export for backup and migration
- **Markdown**: Human-readable format for documentation
- **CSV**: Spreadsheet-compatible format for analysis
- **Template**: Reusable board structure without content
- **Portable Package**: Complete cross-platform backup with integrity checks

#### Import Features

- **Validation**: Automatic data validation and error detection
- **Conflict Resolution**: Handle duplicate boards and naming conflicts
- **Preview**: Preview import contents before applying changes
- **Selective Import**: Choose specific boards or components to import

### Best Practices

1. **Start Simple**: Begin with a basic structure and expand as needed
2. **Use Templates**: Leverage built-in templates for common story structures
3. **Sync Regularly**: Keep cards synchronized with chapter content
4. **Track Progress**: Use status and priority systems consistently
5. **Organize by Purpose**: Create columns that match your planning workflow
6. **Collaborate Effectively**: Use clear card titles and descriptions for team clarity
7. **Export Regularly**: Create portable backups for important project milestones
8. **Manage Permissions**: Use appropriate access levels for different collaborators

## API Reference

### Store Actions

#### Board Management

```typescript
createBoard(projectId: string, title: string, templateId?: string): Promise<PlotBoard>
updateBoard(boardId: string, updates: Partial<PlotBoard>): Promise<void>
deleteBoard(boardId: string): Promise<void>
duplicateBoard(boardId: string, newTitle?: string): Promise<PlotBoard>
```

#### Column Operations

```typescript
createColumn(boardId: string, title: string, type?: PlotColumnType): Promise<PlotColumn>
updateColumn(columnId: string, updates: Partial<PlotColumn>): Promise<void>
deleteColumn(columnId: string): Promise<void>
reorderColumns(boardId: string, columnIds: string[]): Promise<void>
```

#### Card Operations

```typescript
createCard(columnId: string, title: string, description?: string): Promise<PlotCard>
updateCard(cardId: string, updates: Partial<PlotCard>): Promise<void>
deleteCard(cardId: string): Promise<void>
moveCard(cardId: string, destinationColumnId: string, newOrder: number): Promise<void>
linkCardToScene(cardId: string, sceneId: string, chapterId: string): Promise<void>
```

#### Integration Methods

```typescript
syncWithChapters(boardId: string, chapters: Record<string, Chapter>): Promise<void>
createCardsFromChapters(boardId: string, chapterIds: string[], chapters: Record<string, Chapter>): Promise<void>
autoSyncWithTimeline(boardId: string, timelineEvents: TimelineEvent[], chapters: Record<string, Chapter>): Promise<void>
getProgressMetrics(boardId: string, chapters: Record<string, Chapter>): PlotProgressMetrics | null
```

#### Collaboration Methods

```typescript
// User Management
addCollaborator(boardId: string, user: CollaborativeUser): Promise<void>
removeCollaborator(boardId: string, userId: string): Promise<void>
updateUserPermissions(boardId: string, userId: string, permissions: Permission[]): Promise<void>
getActiveUsers(boardId: string): CollaborativeUser[]

// Sharing
createBoardShare(boardId: string, shareType: ShareType, permissions: Permission[]): Promise<SharedBoard>
revokeBoardShare(boardId: string): Promise<void>
getSharedBoardInfo(shareId: string): Promise<SharedBoard | null>

// Conflict Resolution
detectConflicts(boardId: string): Promise<ConflictDetection[]>
resolveConflict(conflictId: string, strategy: ResolutionStrategy, data?: any): Promise<void>
getConflictHistory(boardId: string): ConflictResolution[]

// Real-time Events
broadcastEvent(boardId: string, event: CollaborationEvent): void
subscribeToEvents(boardId: string, callback: (event: CollaborationEvent) => void): () => void
updateUserPresence(boardId: string, presence: UserPresence): void
```

#### Export/Import Methods

```typescript
// Export System
exportBoard(board: PlotBoard, views: SavedView[], templates: Template[], options: ExportOptions): Promise<ExportResult>
downloadExport(exportResult: ExportResult): Promise<void>
getSupportedFormats(): ExportFormat[]
validateExportData(data: any, format: ExportFormat): ValidationResult

// Import System
importBoard(data: any, options: ImportOptions): Promise<ImportResult>
validateImportData(data: any): ImportValidation
previewImport(data: any): ImportPreview
resolveImportConflicts(conflicts: ImportConflict[], resolutions: ConflictResolution[]): Promise<void>

// Portability System
createPortablePackage(boards: PlotBoard[], views: SavedView[], templates: Template[], metadata: PackageMetadata): Promise<PortablePackage>
importPortablePackage(packageData: any, options: ImportOptions): Promise<ImportResult>
validatePackageIntegrity(packageData: any): IntegrityResult
exportPortablePackage(package: PortablePackage): Promise<void>
```

### Integration Hook

```typescript
const integration = usePlotBoardIntegration({
  boardId: activeBoard,
  projectId: currentProject.id,
  autoSync: true,
});

// Available methods:
integration.syncWithChapters();
integration.syncWithTimeline();
integration.createCardsFromChapters(chapterIds);
integration.getProgressMetrics();
integration.enableAutoSync();
integration.disableAutoSync();
```

## Testing

The Plot Boards feature includes a comprehensive test suite covering:

- **Store Operations**: All CRUD operations for boards, columns, and cards
- **Drag & Drop**: Card movement between columns and reordering
- **Chapter Integration**: Scene-to-card synchronization and conflict resolution
- **Timeline Linking**: Automatic event linking based on dates and tags
- **Progress Tracking**: Metrics calculation and chapter-level progress
- **Collaboration Features**: Multi-user scenarios, conflict resolution, and real-time events
- **Export/Import**: Data portability, validation, and format conversion
- **Accessibility**: Keyboard navigation, screen reader support, and ARIA compliance
- **Undo/Redo**: Command history, state restoration, and keyboard shortcuts
- **Filtering & Views**: Advanced search, saved views, and filter persistence
- **Error Handling**: Edge cases and error recovery scenarios

### Running Tests

```bash
# Run all Plot Boards tests
pnpm test src/features/plotboards/tests/

# Run with coverage
pnpm test:coverage src/features/plotboards/tests/

# Watch mode during development
pnpm test src/features/plotboards/tests/ --watch
```

## Performance Considerations

### Optimization Strategies

- **Selective Rendering**: Components use React.memo and useMemo for optimization
- **Virtualization**: Large boards can be virtualized for better performance
- **Debounced Operations**: Auto-save and sync operations are debounced
- **IndexedDB**: Efficient storage with background persistence
- **Lazy Loading**: Components and templates loaded on-demand

### Memory Management

- **Store Cleanup**: Unused board data is garbage collected
- **Event Listeners**: Proper cleanup of drag-and-drop listeners
- **Subscription Management**: Zustand subscriptions are managed efficiently

## Troubleshooting

### Common Issues

**Feature Not Visible**

- Ensure feature flag is enabled: `?plotBoards=1`
- Check browser console for any JavaScript errors
- Verify you have a current project selected

**Sync Issues**

- Check auto-sync setting in chapter sync modal
- Look for error messages in the sync status panel
- Try manual "Sync All Changes" to resolve conflicts

**Performance Issues**

- Large boards (>100 cards) may experience slower rendering
- Consider using multiple smaller boards for complex stories
- Clear browser cache if experiencing storage issues

**Data Loss Prevention**

- Plot boards auto-save every 30 seconds
- Manual save occurs on all operations
- Use export feature to backup important boards

### Debug Tools

**Developer Console:**

```javascript
// List all feature flags
__inkwellFlags.list();

// Enable debug mode for detailed logging
__inkwellFlags.enable('debugStorage');
__inkwellFlags.enable('debugState');

// Export board data for debugging
const boardData = usePlotBoardStore.getState().exportBoard(boardId);
```

**URL Parameters:**

- `?plotBoards=1` - Enable Plot Boards feature
- `?trace=1` - Enable performance tracing
- `?debugStorage=1` - Show storage operation logs

## Future Enhancements

### Planned Features

- **Advanced Export**: PDF and image export of plot boards
- **Enhanced Collaboration**: Voice/video chat integration and advanced presence features
- **AI Integration**: AI-powered plot hole detection, suggestions, and story structure analysis
- **Custom Templates**: User-created templates with community sharing marketplace
- **Advanced Analytics**: Story structure insights, pacing analysis, and genre-specific recommendations
- **Mobile Optimization**: Native mobile app with offline synchronization
- **Integration APIs**: Third-party tool connections (Scrivener, Final Draft, etc.)
- **Advanced Permissions**: Project-level roles, approval workflows, and review cycles

### Community Requests

- **Mobile Support**: Touch-optimized interface for tablets
- **Offline Mode**: Enhanced offline capabilities with sync queuing
- **Integration APIs**: Third-party tool integration possibilities
- **Accessibility**: Enhanced keyboard navigation and screen reader support

## Contributing

Plot Boards follows the established Inkwell development patterns:

1. **Feature-First Architecture**: Self-contained feature modules
2. **Type Safety**: Comprehensive TypeScript coverage
3. **Test Coverage**: All public APIs have corresponding tests
4. **Accessibility**: ARIA labels and keyboard navigation support
5. **Performance**: Optimized for large story projects

### Development Setup

```bash
# Install dependencies
pnpm install

# Start development server with feature enabled
pnpm dev
# Navigate to http://localhost:5173?plotBoards=1

# Run tests during development
pnpm test src/features/plotboards/tests/ --watch
```

---

## License

Plot Boards feature is part of Inkwell and follows the same MIT license terms.

## Support

For issues, questions, or feature requests related to Plot Boards:

- **GitHub Issues**: https://github.com/oklahomahail/Inkwell2/issues
- **Tag**: Use `plot-boards` label for feature-specific issues
- **Documentation**: This guide and inline code comments
