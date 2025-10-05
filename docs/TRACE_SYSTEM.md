# Trace System Documentation

## Overview

Inkwell includes a comprehensive tracing system for performance monitoring, debugging, and observability across the application. The trace system is particularly useful for understanding Plot Boards operations, storage interactions, and user actions.

## Usage

### Basic Logging

```typescript
import { trace } from '../utils/trace';

// Log an instant event
trace.log('User clicked save button', 'user_action', 'info', {
  boardId: 'board-123',
  cardCount: 15,
});

// Log with different levels
trace.log('Storage operation failed', 'store_action', 'error', {
  key: 'board-data',
  error: errorMessage,
});
```

### Performance Tracing

```typescript
// Start a performance trace
const traceId = trace.start('Board filtering operation', 'performance', {
  filterCount: 3,
  cardCount: 150,
});

// ... perform operation ...

// End the trace
trace.end(traceId, {
  filteredCards: 45,
  processingTime: '23ms',
});
```

## Event Types

- **`performance`** - Performance-related operations (filtering, rendering, etc.)
- **`user_action`** - User interactions (clicks, navigation, etc.)
- **`store_action`** - Storage operations (save, load, sync, etc.)
- **`api_call`** - External API calls (AI services, etc.)
- **`component_render`** - React component render tracking

## Log Levels

- **`debug`** - Detailed information for debugging
- **`info`** - General information about operations
- **`warn`** - Warning conditions that don't break functionality
- **`error`** - Error conditions that require attention

## Configuration

The trace system automatically enables based on:

1. Feature flag: `performanceMonitoring`
2. Debug mode: `?debug=1` URL parameter
3. Trace mode: `?trace=1` URL parameter

## Performance

- Minimal overhead when disabled
- Automatic cleanup of old trace data (keeps last 1000 events)
- Smart performance thresholds for highlighting slow operations:
  - > 16.67ms: Logged as potentially frame-dropping
  - > 100ms: Logged as slow operation

## Testing

Test files should mock the trace system:

```typescript
vi.mock('../../../utils/trace', () => ({
  trace: {
    log: vi.fn(),
    start: vi.fn().mockReturnValue('mock-trace-id'),
    end: vi.fn(),
  },
}));
```

## Recent Improvements (v1.0.5)

- ✅ Fixed "TraceLogger has no call signatures" errors
- ✅ Standardized API across all plotboards files
- ✅ Improved test mocks for better reliability
- ✅ Enhanced categorization of trace events
- ✅ Better performance insights for Plot Boards operations

## Examples in Codebase

### Plot Board Operations

- Card filtering performance tracking
- Collaboration storage operations
- View management actions

### Storage Layer

- IndexedDB operations
- localStorage fallbacks
- Data migration processes

### User Interface

- Component render performance
- Navigation actions
- User preference changes

The trace system provides valuable insights for debugging issues and optimizing performance across the Inkwell application.
