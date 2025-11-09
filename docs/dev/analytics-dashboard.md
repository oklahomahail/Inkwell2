# Analytics Dashboard

## Overview

The Analytics Dashboard provides a React-based UI for viewing and analyzing Inkwell's privacy-first analytics data. It offers real-time visualization of performance metrics, session data, and usage patterns.

## Features

### Dev Dashboard ([/dev/analytics](http://localhost:5173/dev/analytics))

A comprehensive analytics interface for developers with:

- **Overview Tab**: High-level summary statistics
  - Total events and sessions
  - Average session duration
  - Events by category breakdown
  - Top actions ranking
  - Date range visualization

- **Events Tab**: Detailed event listing
  - Filterable by category and time range
  - Paginated table view (50 events per page)
  - Timestamp, category, action, label, and value columns
  - Export to CSV

- **Metrics Tab**: Performance metric statistics
  - Count, average, min, max, p50, p95, p99
  - Grouped by metric name
  - Automatic statistical calculations

- **Performance Tab**: Performance insights
  - Metric breakdowns by category
  - Event distribution analysis
  - Latency percentiles

### User-Facing Insights Panel

A privacy-focused analytics view for users in Settings:

- **Writing Session Statistics**
  - Total sessions (last 30 days)
  - Average session duration
  - Total tracked events

- **Recent Activity Chart**
  - Last 7 days of writing activity
  - Visual bar chart representation
  - Event count per day

- **Performance Metrics**
  - Autosave performance with color-coded ratings
  - AI usage statistics
  - Performance indicators (Excellent/Good/Needs attention)

- **Privacy Controls**
  - Toggle analytics on/off
  - Clear privacy notice
  - Local-only data storage guarantee

### Performance Guard Integration

Merges analytics with bundle audit system:

- **Regression Detection**
  - Compares current metrics to baseline (7 days ago)
  - 20% threshold for warnings
  - 50% threshold for critical alerts
  - Visual indicators for severity

- **Real-Time Monitoring**
  - Autosave latency (avg and p95)
  - Render time performance
  - Storage operation counts
  - AI request metrics

- **Baseline Comparison**
  - Historical performance tracking
  - Percentage change calculations
  - Date-stamped baselines

## Component Architecture

### AnalyticsDashboard

**Location**: [src/components/Dev/AnalyticsDashboard.tsx](../../src/components/Dev/AnalyticsDashboard.tsx)

**Props**: None

**Features**:

- Tab-based navigation (Overview, Events, Metrics, Performance)
- Category filtering (all, writing, autosave, ai, storage, ui, etc.)
- Time range filtering (1h, 24h, 7d, 30d, all time)
- Auto-refresh every 10 seconds
- Export to JSON and CSV
- Clear all data functionality

**Sub-Components**:

- `OverviewTab`: Summary statistics and charts
- `EventsTab`: Paginated event table
- `MetricsTab`: Statistical metric breakdowns
- `PerformanceTab`: Performance analysis

### InsightsPanel

**Location**: [src/components/Settings/InsightsPanel.tsx](../../src/components/Settings/InsightsPanel.tsx)

**Props**: None

**Features**:

- User-friendly analytics toggle
- Session statistics overview
- Recent activity visualization
- Autosave performance rating
- AI usage tracking
- Privacy-first messaging

### PerformanceGuardIntegration

**Location**: [src/components/Dev/PerformanceGuardIntegration.tsx](../../src/components/Dev/PerformanceGuardIntegration.tsx)

**Props**: None

**Features**:

- Automatic regression detection
- Baseline vs. current comparison
- Critical/warning severity levels
- Performance snapshot generation
- Real-time metric monitoring

## Usage

### Accessing the Dev Dashboard

1. Start the development server:

   ```bash
   pnpm dev
   ```

2. Navigate to [http://localhost:5173/dev/analytics](http://localhost:5173/dev/analytics)

3. Sign in with your Inkwell account

4. Explore the dashboard tabs and filters

### Adding to Settings

To add the Insights Panel to your Settings page:

```tsx
import { InsightsPanel } from '@/components/Settings/InsightsPanel';

export function SettingsPage() {
  return (
    <div className="settings-container">
      {/* Other settings panels */}
      <InsightsPanel />
    </div>
  );
}
```

### Using Performance Guard

Add to your dev panel or performance monitoring UI:

```tsx
import { PerformanceGuardIntegration } from '@/components/Dev/PerformanceGuardIntegration';

export function DevPanel() {
  return (
    <div className="dev-panel">
      <h2>Performance Monitoring</h2>
      <PerformanceGuardIntegration />
    </div>
  );
}
```

## Data Filtering

### Category Filter

Available categories:

- `all` - All events
- `writing` - Writing sessions and typing events
- `editor` - Editor performance and interactions
- `autosave` - Save operations and latency
- `ai` - AI requests and responses
- `export` - Export operations
- `timeline` - Timeline interactions
- `storage` - Storage read/write operations
- `ui` - UI interactions and navigation
- `performance` - General performance metrics

### Time Range Filter

Available ranges:

- `1h` - Last hour
- `24h` - Last 24 hours
- `7d` - Last 7 days
- `30d` - Last 30 days
- `all` - All time

### Query Building

Filters are automatically combined into analytics queries:

```typescript
const query: AnalyticsQuery = {
  category: filter.category !== 'all' ? filter.category : undefined,
  startTime: getTimeRangeMs(filter.timeRange),
};
```

## Export Functionality

### JSON Export

Exports complete analytics data including:

- Summary statistics
- Events array
- Metrics array
- Query parameters
- Export timestamp

**Filename**: `inkwell-analytics-{timestamp}.json`

### CSV Export

Two export types:

1. **Events CSV**
   - Columns: Timestamp, Category, Action, Label, Value, Session ID
   - Filename: `inkwell-analytics-events-{timestamp}.csv`

2. **Metrics CSV**
   - Columns: Timestamp, Category, Name, Value, Unit, Session ID
   - Filename: `inkwell-analytics-metrics-{timestamp}.csv`

## Performance Metrics

### Autosave Performance Ratings

Based on average latency:

- **Excellent**: < 100ms (green)
- **Good**: 100-500ms (yellow)
- **Needs Attention**: > 500ms (red)

### Metric Statistics

For each metric, the dashboard calculates:

- **Count**: Total number of measurements
- **Average**: Mean value
- **Min**: Minimum value
- **Max**: Maximum value
- **p50**: 50th percentile (median)
- **p95**: 95th percentile
- **p99**: 99th percentile

### Regression Thresholds

Performance guard uses these thresholds:

- **Warning**: > 20% increase from baseline
- **Critical**: > 50% increase from baseline

## Testing

Comprehensive test suites are available:

### AnalyticsDashboard Tests

**Location**: [src/components/Dev/**tests**/AnalyticsDashboard.test.tsx](../../src/components/Dev/__tests__/AnalyticsDashboard.test.tsx)

**Coverage**:

- Renders dashboard header and title ✅
- Loads and displays summary data ✅
- Displays category and time filters ✅
- Switches between tabs ✅
- Filters data by category and time ✅
- Displays metric statistics ✅
- Exports JSON and CSV ✅
- Clears data with confirmation ✅
- Refreshes data on demand ✅
- Paginates events correctly ✅
- Handles loading and error states ✅

### InsightsPanel Tests

**Location**: [src/components/Settings/**tests**/InsightsPanel.test.tsx](../../src/components/Settings/__tests__/InsightsPanel.test.tsx)

**Coverage**:

- Renders insights panel header ✅
- Displays analytics toggle ✅
- Loads and displays insights ✅
- Shows recent activity chart ✅
- Displays performance metrics ✅
- Toggles analytics on/off ✅
- Shows privacy notice ✅
- Handles disabled and loading states ✅
- Formats durations correctly ✅
- Displays performance ratings ✅

### PerformanceGuardIntegration Tests

**Location**: [src/components/Dev/**tests**/PerformanceGuardIntegration.test.tsx](../../src/components/Dev/__tests__/PerformanceGuardIntegration.test.tsx)

**Coverage**:

- Displays all metric categories ✅
- Detects performance regressions ✅
- Shows no regressions when stable ✅
- Formats time values correctly ✅
- Handles loading and error states ✅
- Calculates baseline comparisons ✅
- Marks critical regressions ✅

### Running Tests

```bash
# Run all dashboard tests
pnpm test src/components/Dev/__tests__/AnalyticsDashboard.test.tsx

# Run insights panel tests
pnpm test src/components/Settings/__tests__/InsightsPanel.test.tsx

# Run performance guard tests
pnpm test src/components/Dev/__tests__/PerformanceGuardIntegration.test.tsx

# Run all analytics-related tests
pnpm test analytics

# Run with coverage
pnpm test:coverage src/components/Dev src/components/Settings
```

## Privacy & Security

### Local-First Design

- All analytics data stored in IndexedDB
- No external telemetry by default
- User-controlled opt-in for external services
- Clear privacy notices throughout UI

### Data Retention

- Default: 30 days
- Configurable via analytics service
- Automatic cleanup of old data
- Manual clear data option

### Do Not Track

Respects browser DNT settings:

- Analytics disabled if DNT = 1
- No data collection without consent
- Clear indicators when disabled

## Troubleshooting

### Dashboard Not Loading

1. Check analytics is enabled:

   ```javascript
   window.analytics.config();
   ```

2. Verify IndexedDB is accessible:

   ```javascript
   console.log(window.indexedDB);
   ```

3. Check browser console for errors

### No Data Showing

1. Ensure analytics service is initialized
2. Check if events are being logged:
   ```javascript
   window.analytics.events({ limit: 10 });
   ```
3. Verify time range filter includes data

### Performance Issues

1. Reduce time range filter
2. Clear old analytics data
3. Check IndexedDB quota
4. Enable sampling (< 100%)

## Best Practices

### For Developers

1. **Use appropriate time ranges**
   - Use shorter ranges (1h, 24h) for recent debugging
   - Use longer ranges (7d, 30d) for trend analysis

2. **Export data regularly**
   - Save baselines for performance comparison
   - Archive historical data before major changes

3. **Monitor regressions**
   - Check performance guard daily in dev
   - Investigate warnings promptly
   - Set baselines after major optimizations

4. **Keep queries focused**
   - Filter by specific categories when possible
   - Use appropriate sample rates for high-volume events

### For Users

1. **Enable analytics for insights**
   - Get visibility into writing patterns
   - Track productivity over time
   - Identify performance issues

2. **Review insights regularly**
   - Check weekly activity trends
   - Monitor autosave performance
   - Track AI usage patterns

3. **Trust privacy protections**
   - Data stays on your device
   - No external tracking
   - Full control over data

## Future Enhancements

Potential improvements for future releases:

1. **Advanced Visualizations**
   - Time-series charts with Chart.js
   - Heatmaps for activity patterns
   - Trend lines and forecasting

2. **Custom Reports**
   - Saved filter combinations
   - Scheduled exports
   - Custom metric calculations

3. **Comparative Analytics**
   - Project-to-project comparisons
   - Period-over-period analysis
   - Cohort analysis

4. **AI-Powered Insights**
   - Anomaly detection
   - Pattern recognition
   - Personalized recommendations

5. **Integration Improvements**
   - Bundle size correlation
   - Memory usage tracking
   - Network performance metrics

## Related Documentation

- [Analytics System Overview](../ANALYTICS.md)
- [Analytics Service API](../../src/services/analytics/analyticsService.ts)
- [Analytics Types](../../src/services/analytics/types.ts)
- [Console Analytics Tools](../../src/dev/analyticsExport.ts)
- [Privacy Policy](../privacy.md)
- [Developer Mode](../DEVELOPER_MODE.md)

## Support

For questions or issues with the analytics dashboard:

1. Check this documentation
2. Review test files for usage examples
3. Use DevTools console for debugging
4. Check [GitHub Issues](https://github.com/yourusername/inkwell/issues)
5. Contact development team

---

**Remember**: The analytics dashboard is built on the principle of privacy-first design. All data stays on your device unless you explicitly opt-in to telemetry.
