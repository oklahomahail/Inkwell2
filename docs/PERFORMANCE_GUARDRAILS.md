# Performance Guardrails System

> **Optimized performance for large projects with virtualization, debouncing, and real-time monitoring.**

## Overview

The Performance Guardrails system ensures Inkwell remains responsive even with large projects containing hundreds of scenes, characters, and chapters. It provides automatic optimizations and real-time performance monitoring.

## Key Features

### ⚡ **Virtualized Lists**

- **@tanstack/react-virtual**: Efficient rendering of large lists
- **Project Browser**: Handle 1000+ projects without performance degradation
- **Scene Management**: Smooth scrolling through hundreds of scenes
- **Automatic Sizing**: Dynamic height calculation for optimal rendering

### 🔍 **Debounced Operations**

- **Search Input**: 300ms debouncing for responsive search experience
- **Filter Changes**: Prevent excessive re-renders during rapid filtering
- **Auto-save**: Intelligent debouncing for writing content

### ⏰ **Deferred Processing**

- **Background Tasks**: Move expensive operations off main thread
- **Lazy Loading**: Load content only when needed
- **Progressive Enhancement**: Render basic UI first, enhance progressively

### 📊 **Performance Monitoring**

- **Real-time Metrics**: Track render times and scroll performance
- **Performance Hooks**: Custom hooks for component-level monitoring
- **Memory Usage**: Track and optimize memory consumption

## Implementation

### Virtualized Project List

```typescript
// src/components/ProjectBrowser/VirtualizedProjectList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedProjectList({ projects }: { projects: Project[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated item height
    overscan: 5, // Render 5 items outside viewport
  });

  return (
    <div ref={parentRef} className="project-list-container">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const project = projects[virtualItem.index];
          return (
            <ProjectCard
              key={virtualItem.key}
              project={project}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
```

### Debounced Search Hook

```typescript
// src/hooks/useDebouncedSearch.ts
import { useState, useCallback } from 'react';
import { debounce } from 'lodash';

export function useDebouncedSearch(searchFn: (query: string) => void, delay: number = 300) {
  const [query, setQuery] = useState('');

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      searchFn(searchQuery);
    }, delay),
    [searchFn, delay],
  );

  const updateQuery = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      debouncedSearch(newQuery);
    },
    [debouncedSearch],
  );

  return { query, updateQuery };
}
```

### Performance Monitoring Hook

```typescript
// src/hooks/usePerformanceMonitor.ts
import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  component: string;
  timestamp: number;
}

export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef<number>();
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  useEffect(() => {
    startTime.current = performance.now();

    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;

        const metric: PerformanceMetrics = {
          renderTime,
          component: componentName,
          timestamp: Date.now(),
        };

        metricsRef.current.push(metric);

        // Log slow renders in development
        if (process.env.NODE_ENV === 'development' && renderTime > 16) {
          console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }

        // Track in analytics if enabled
        if (featureFlagService.isEnabled('performance_monitoring')) {
          analyticsService.track('performance_render', {
            component: componentName,
            renderTime: Math.round(renderTime),
            isSlowRender: renderTime > 16,
          });
        }
      }
    };
  });

  const getMetrics = useCallback(() => {
    return metricsRef.current.slice();
  }, []);

  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
  }, []);

  return { getMetrics, clearMetrics };
}
```

### Deferred Operations Hook

```typescript
// src/hooks/useDeferredOperation.ts
import { useCallback, useRef } from 'react';

export function useDeferredOperation<T>(operation: () => Promise<T>, delay: number = 0) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const execute = useCallback((): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Clear any pending operation
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Schedule the operation
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }, [operation, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  return { execute, cancel };
}
```

## Feature Flag Integration

Performance features are controlled via feature flags:

```typescript
// Performance-related flags
const performanceFlags = {
  performance_monitoring: true, // Enable performance tracking
  virtualized_lists: true, // Use virtualization
  deferred_operations: true, // Enable deferred processing
  memory_optimization: true, // Advanced memory management
};

// Check if feature is enabled
if (featureFlagService.isEnabled('virtualized_lists')) {
  // Use virtualized components
} else {
  // Use standard components
}
```

## Analytics Integration

Performance metrics are tracked through the analytics system:

```typescript
// Performance event types
interface PerformanceEvents {
  performance_render: {
    component: string;
    renderTime: number;
    isSlowRender: boolean;
  };

  performance_scroll: {
    component: string;
    scrollDistance: number;
    fps: number;
  };

  performance_memory: {
    heapUsed: number;
    heapTotal: number;
    component?: string;
  };

  performance_optimization_applied: {
    optimization: string;
    component: string;
    improvement: number;
  };
}

// Track performance events
analyticsService.track('performance_render', {
  component: 'ProjectBrowser',
  renderTime: 23.4,
  isSlowRender: true,
});
```

## Memory Management

### Component Cleanup

```typescript
// Automatic cleanup for large components
function LargeProjectComponent({ project }: { project: Project }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Load data
    loadProjectData(project.id).then(setData);

    // Cleanup function
    return () => {
      // Clear large data structures
      setData(null);
      // Cancel pending requests
      cancelPendingRequests(project.id);
    };
  }, [project.id]);

  // Use useMemo for expensive calculations
  const processedData = useMemo(() => {
    if (!data) return null;
    return expensiveDataProcessing(data);
  }, [data]);

  return <div>{/* Render processed data */}</div>;
}
```

### Lazy Loading

```typescript
// Lazy load heavy components
const LazyPlotBoardsView = lazy(() => import('./PlotBoardsView'));
const LazyTimelineView = lazy(() => import('./TimelineView'));

function ProjectView({ project }: { project: Project }) {
  return (
    <Suspense fallback={<ProjectViewSkeleton />}>
      {project.type === 'plotboard' && <LazyPlotBoardsView project={project} />}
      {project.type === 'timeline' && <LazyTimelineView project={project} />}
    </Suspense>
  );
}
```

## Configuration

### Environment Variables

```bash
# Enable performance monitoring
VITE_PERFORMANCE_MONITORING=true

# Virtualization settings
VITE_VIRTUAL_LIST_OVERSCAN=5
VITE_VIRTUAL_ITEM_SIZE=120

# Debounce timings
VITE_SEARCH_DEBOUNCE_MS=300
VITE_AUTOSAVE_DEBOUNCE_MS=2000
```

### Performance Budgets

```typescript
// Performance budgets for different operations
const PERFORMANCE_BUDGETS = {
  render: 16, // 60 FPS
  search: 100, // 100ms for search results
  save: 500, // 500ms for save operations
  load: 1000, // 1s for initial load
};

// Check if operation exceeds budget
function checkPerformanceBudget(operation: string, duration: number) {
  const budget = PERFORMANCE_BUDGETS[operation];
  if (budget && duration > budget) {
    console.warn(`Performance budget exceeded for ${operation}: ${duration}ms > ${budget}ms`);

    analyticsService.track('performance_budget_exceeded', {
      operation,
      duration: Math.round(duration),
      budget,
      overage: Math.round(duration - budget),
    });
  }
}
```

## Testing Performance

### Performance Tests

```typescript
// Test component render performance
describe('ProjectBrowser Performance', () => {
  it('should render 1000 projects within budget', async () => {
    const startTime = performance.now();

    render(<ProjectBrowser projects={generateMockProjects(1000)} />);

    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // 100ms budget
  });

  it('should handle rapid search input', async () => {
    const { getByPlaceholderText } = render(<ProjectSearch />);
    const searchInput = getByPlaceholderText('Search projects...');

    const startTime = performance.now();

    // Simulate rapid typing
    for (let i = 0; i < 10; i++) {
      fireEvent.change(searchInput, { target: { value: `search${i}` } });
    }

    // Wait for debounce
    await waitFor(() => {
      const searchTime = performance.now() - startTime;
      expect(searchTime).toBeLessThan(50); // Should be very fast due to debouncing
    });
  });
});
```

### Memory Leak Detection

```typescript
// Test for memory leaks
describe('Memory Management', () => {
  it('should not leak memory when unmounting large components', () => {
    const { unmount } = render(<LargeProjectComponent project={mockProject} />);

    const initialMemory = performance.memory?.usedJSHeapSize || 0;

    unmount();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = performance.memory?.usedJSHeapSize || 0;

    // Memory should not increase significantly
    expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024); // 1MB threshold
  });
});
```

## Monitoring Dashboard

Development dashboard for performance metrics:

```typescript
// src/components/Development/PerformanceDashboard.tsx
function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  useEffect(() => {
    // Subscribe to performance events
    const unsubscribe = analyticsService.subscribe('performance', (event) => {
      setMetrics(prev => [...prev.slice(-99), event]); // Keep last 100 metrics
    });

    return unsubscribe;
  }, []);

  const averageRenderTime = metrics
    .filter(m => m.type === 'render')
    .reduce((sum, m) => sum + m.renderTime, 0) / metrics.length || 0;

  const slowRenders = metrics.filter(m => m.isSlowRender).length;

  return (
    <div className="performance-dashboard">
      <h3>Performance Metrics</h3>
      <div className="metrics-grid">
        <div className="metric">
          <label>Average Render Time</label>
          <span className={averageRenderTime > 16 ? 'warning' : 'good'}>
            {averageRenderTime.toFixed(2)}ms
          </span>
        </div>
        <div className="metric">
          <label>Slow Renders</label>
          <span className={slowRenders > 0 ? 'warning' : 'good'}>
            {slowRenders}
          </span>
        </div>
      </div>
    </div>
  );
}
```

## Best Practices

### Component Optimization

1. **Use React.memo** for expensive components
2. **Implement useMemo** for expensive calculations
3. **Use useCallback** for stable function references
4. **Avoid inline objects** in props
5. **Split large components** into smaller ones

### Data Management

1. **Implement pagination** for large datasets
2. **Use lazy loading** for off-screen content
3. **Cache expensive operations**
4. **Clean up subscriptions** and timeouts
5. **Monitor memory usage** in development

### User Experience

1. **Show loading states** for async operations
2. **Implement skeleton screens** for better perceived performance
3. **Use optimistic updates** where appropriate
4. **Provide feedback** for long-running operations
5. **Graceful degradation** when performance is poor

The Performance Guardrails system ensures Inkwell remains fast and responsive regardless of project size, providing an excellent user experience for all writers.
