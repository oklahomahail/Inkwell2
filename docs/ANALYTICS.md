# Analytics System

## Overview

Inkwell includes a privacy-first analytics system for performance monitoring and usage insights. All analytics data is stored **locally** in IndexedDB with configurable retention. External telemetry is **opt-in only**.

## Architecture

### Core Components

1. **Analytics Service** ([src/services/analytics/analyticsService.ts](../src/services/analytics/analyticsService.ts))
   - Event queue with batching and auto-flush
   - IndexedDB persistence with 30-day retention
   - Session tracking and lifecycle management
   - Privacy-first configuration

2. **Analytics Types** ([src/services/analytics/types.ts](../src/services/analytics/types.ts))
   - `AnalyticsEvent` - User actions and system events
   - `AnalyticsMetric` - Performance measurements
   - `AnalyticsAggregate` - Cumulative metrics
   - `AnalyticsSession` - User session data

3. **Integration Hooks**
   - [src/services/autosaveService.ts](../src/services/autosaveService.ts) - Save latency and size
   - [src/services/claudeService.ts](../src/services/claudeService.ts) - AI request metrics
   - [src/services/storageService.ts](../src/services/storageService.ts) - Storage operations
   - [src/main.tsx](../src/main.tsx) - Session lifecycle

4. **Developer Dashboard** ([src/dev/analyticsExport.ts](../src/dev/analyticsExport.ts))
   - Console-based query interface
   - Export capabilities (JSON, CSV)
   - Performance statistics
   - Development-only tool

## Privacy Principles

### Local-First Architecture

- **All data stored locally** in IndexedDB
- **No external telemetry** by default
- **Opt-in only** for external services
- **30-day retention** policy (configurable)
- **User control** via configuration

### Data Categories

The system tracks these categories:

- `autosave` - Document save operations
- `ai` - AI request metrics
- `storage` - Storage read/write operations
- `ui` - User interface interactions
- `performance` - Application performance
- `error` - Error tracking

### What We Track

**Performance Metrics:**

- Operation latency (ms)
- Data sizes (bytes)
- Token usage (AI requests)
- Success/failure rates

**User Events:**

- Feature usage
- Error occurrences
- Session duration
- No personally identifiable information (PII)

**What We Don't Track:**

- Document content
- User names or emails
- IP addresses
- Location data

## Usage

### Configuration

```typescript
import { analyticsService } from '@/services/analytics';

// Update configuration
analyticsService.updateConfig({
  enabled: true,
  telemetryEnabled: false, // Keep telemetry disabled
  sampleRate: 1.0, // 100% sampling
  retentionDays: 30,
  batchSize: 100,
  flushInterval: 60000, // 1 minute
});

// Get current configuration
const config = analyticsService.getConfig();
```

### Logging Events

```typescript
import { analyticsService } from '@/services/analytics';

// Log an event
analyticsService.logEvent(
  'ui', // category
  'button.click', // action
  'save-button', // label (optional)
  1, // value (optional)
  { metadata: 'any' }, // metadata (optional)
);

// Log a performance metric
analyticsService.logMetric(
  'autosave', // category
  'save.latency', // name
  123.45, // value
  'ms', // unit
);

// Log an aggregate value
analyticsService.logAggregate(
  'ai', // category
  'tokens.total', // name
  1500, // value
  'project-123', // projectId (optional)
);
```

### Querying Data

```typescript
import { analyticsService } from '@/services/analytics';

// Query events
const events = await analyticsService.queryEvents({
  category: 'autosave',
  startTime: Date.now() - 86400000, // Last 24 hours
  limit: 100,
});

// Query metrics
const metrics = await analyticsService.queryMetrics({
  category: 'ai',
  endTime: Date.now(),
});

// Get summary
const summary = await analyticsService.getSummary({
  category: 'storage',
});
```

### Session Management

```typescript
import { analyticsService } from '@/services/analytics';

// Sessions are automatically managed
// Initialize analytics (done in main.tsx)
await analyticsService.initialize();

// End session (done on page unload)
await analyticsService.endSession();
```

## Developer Dashboard

### UI Dashboard (Development Mode)

A comprehensive React-based analytics dashboard is available at [/dev/analytics](http://localhost:5173/dev/analytics) in development mode.

**Features:**

- **Overview Tab**: Summary statistics, category breakdown, top actions
- **Events Tab**: Paginated event listing with filters
- **Metrics Tab**: Statistical analysis (avg, min, max, p50, p95, p99)
- **Performance Tab**: Performance insights and event distribution
- **Export**: JSON and CSV export capabilities
- **Filters**: Category and time range filtering

See [Analytics Dashboard Documentation](./dev/analytics-dashboard.md) for detailed usage.

### Console Commands

Analytics can also be queried via the browser console:

```javascript
// View analytics summary
window.analytics.summary();

// Query events
window.analytics.events({ category: 'autosave', limit: 50 });

// Query metrics with statistics
window.analytics.metrics({ category: 'ai' });

// View performance by category
window.analytics.performance('storage');

// View configuration
window.analytics.config();

// Export data as JSON
window.analytics.downloadJSON();

// Export data as CSV
window.analytics.downloadCSV('events'); // or 'metrics'

// Enable/disable analytics
window.analytics.toggle(true);

// Clear all analytics data
window.analytics.clear();
```

### Example Queries

```javascript
// Get all autosave events from the last hour
await window.analytics.events({
  category: 'autosave',
  startTime: Date.now() - 3600000,
});

// Get AI performance metrics
await window.analytics.performance('ai');

// Export last 7 days of data
await window.analytics.downloadJSON({
  startTime: Date.now() - 7 * 86400000,
});
```

## Integration Guide

### Adding Analytics to a Service

```typescript
import { analyticsService } from '@/services/analytics';

export class MyService {
  async performOperation(data: string): Promise<void> {
    const startTime = performance.now();

    try {
      // Perform operation
      const result = await someAsyncWork(data);

      const latency = performance.now() - startTime;
      const dataSize = new Blob([data]).size;

      // Log success metrics
      analyticsService.logMetric('my-service', 'operation.latency', latency, 'ms');
      analyticsService.logMetric('my-service', 'operation.size', dataSize, 'bytes');
      analyticsService.logEvent('my-service', 'operation.success', undefined, latency, {
        dataSize,
        resultType: result.type,
      });

      return result;
    } catch (error) {
      const latency = performance.now() - startTime;

      // Log error
      analyticsService.logEvent('my-service', 'operation.error', error.code, latency, {
        errorMessage: error.message,
        dataSize: new Blob([data]).size,
      });

      throw error;
    }
  }
}
```

### Best Practices

1. **Use Performance.now()** for accurate timing

   ```typescript
   const startTime = performance.now();
   // ... operation ...
   const latency = performance.now() - startTime;
   ```

2. **Calculate data sizes accurately**

   ```typescript
   const dataSize = new Blob([JSON.stringify(data)]).size;
   ```

3. **Include relevant metadata**

   ```typescript
   analyticsService.logEvent('category', 'action', 'label', value, {
     userId: 'anon-123',
     feature: 'export',
     format: 'pdf',
   });
   ```

4. **Use consistent naming**
   - Categories: `lowercase` (e.g., `autosave`, `ai`, `storage`)
   - Actions: `category.action` (e.g., `save.success`, `request.error`)
   - Metrics: `category.metric` (e.g., `save.latency`, `tokens.total`)

5. **Log both success and failure**
   ```typescript
   try {
     await operation();
     analyticsService.logEvent('cat', 'action.success');
   } catch (error) {
     analyticsService.logEvent('cat', 'action.error', error.code);
   }
   ```

## Testing

The analytics system has comprehensive test coverage:

- **Core Service**: [src/services/analytics/**tests**/analyticsService.test.ts](../src/services/analytics/__tests__/analyticsService.test.ts)
- **62 tests** covering all functionality
- **100% critical path coverage**

### Running Tests

```bash
# Run all analytics tests
pnpm test src/services/analytics

# Run with coverage
pnpm test:coverage src/services/analytics
```

### Test Categories

- ✅ Initialization and configuration
- ✅ Event logging and querying
- ✅ Metric logging and statistics
- ✅ Aggregate logging
- ✅ Session management
- ✅ Data cleanup and retention
- ✅ Privacy controls
- ✅ Export functionality

## Performance

### Batching and Flushing

- Events are queued in memory
- Auto-flush when queue reaches `batchSize` (default: 100)
- Periodic flush every `flushInterval` (default: 60 seconds)
- Manual flush on session end

### Storage Overhead

- Minimal memory footprint (event queue only)
- IndexedDB storage ~1-5 MB for typical usage
- Automatic cleanup after `retentionDays` (default: 30)

### Performance Impact

- **Negligible**: < 1ms per event
- **Async**: All operations are non-blocking
- **Graceful degradation**: Errors don't crash app

## Troubleshooting

### Analytics Not Working

```javascript
// Check if analytics is enabled
window.analytics.config();

// Enable analytics if disabled
window.analytics.toggle(true);

// Check for errors in console
```

### Clearing Corrupted Data

```javascript
// Clear all analytics data
await window.analytics.clear();

// This will:
// 1. Destroy current analytics service
// 2. Clear IndexedDB
// 3. Reinitialize analytics
```

### Testing in Development

```javascript
// Log a test event
analyticsService.logEvent('test', 'test.action', 'test-label', 123);

// Query to verify
const events = await window.analytics.events({ category: 'test' });
console.table(events);
```

## User-Facing Insights

### Settings → Insights Panel

A privacy-focused analytics panel for users:

**Features:**

- Writing session statistics (last 30 days)
- Recent activity chart (last 7 days)
- Autosave performance rating
- AI usage tracking
- Privacy controls and clear notices

**Usage:**

```tsx
import { InsightsPanel } from '@/components/Settings/InsightsPanel';

export function SettingsPage() {
  return <InsightsPanel />;
}
```

See [Analytics Dashboard Documentation](./dev/analytics-dashboard.md) for integration details.

## Performance Guard Integration

The analytics system integrates with the performance monitoring to detect regressions:

**Features:**

- Automatic regression detection (> 20% increase = warning)
- Baseline comparison (7 days ago)
- Real-time monitoring (autosave, render, storage, AI)
- Critical/warning severity levels

**Usage:**

```tsx
import { PerformanceGuardIntegration } from '@/components/Dev/PerformanceGuardIntegration';

export function DevPanel() {
  return <PerformanceGuardIntegration />;
}
```

## Future Enhancements

Potential improvements for future releases:

1. ~~**Visual Dashboard UI**~~ - ✅ Implemented in v0.9.3
2. **Advanced Filtering** - More complex query capabilities
3. **Data Visualization** - Charts and graphs (Chart.js integration)
4. **Custom Retention Policies** - Per-category retention
5. **Export Scheduling** - Automated periodic exports
6. **A/B Testing Support** - Experiment tracking
7. **User Feedback Integration** - Link analytics to feedback

## Related Documentation

- [Analytics Dashboard Guide](./dev/analytics-dashboard.md) - Comprehensive dashboard documentation
- [Privacy Policy](./privacy.md)
- [Developer Mode](./DEVELOPER_MODE.md)
- [Testing Guide](./TESTING.md)
- [Performance Monitoring](./PERFORMANCE.md)

## Support

For questions or issues with the analytics system:

1. Check [GitHub Issues](https://github.com/yourusername/inkwell/issues)
2. Review test files for usage examples
3. Use developer dashboard for debugging
4. Contact development team

## License

The analytics system is part of Inkwell and is licensed under the same terms as the main application.

---

**Remember**: Analytics data is **your data**. It stays on your device unless you explicitly opt-in to telemetry. We respect your privacy.
