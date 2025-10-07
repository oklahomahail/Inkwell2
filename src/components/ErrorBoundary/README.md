# Error Boundary System

A comprehensive error boundary system for Inkwell that provides graceful error handling at different application levels.

## Components

### `AppErrorBoundary`

The main error boundary component that provides different UIs based on error level:

- **App Level**: Full-screen error UI with recovery options
- **Feature Level**: Panel-specific error UI with retry functionality
- **Component Level**: Inline error handling

### `FeatureErrorBoundary` & `ComponentErrorBoundary`

Convenience components for wrapping features and components with appropriate error boundaries.

### Panel-Specific Error Fallbacks

Specialized error fallback components for different panel types:

- `PlotBoardErrorFallback`
- `TimelineErrorFallback`
- `AnalyticsErrorFallback`
- `EditorErrorFallback`
- `ImageErrorFallback`
- `SettingsErrorFallback`
- `GenericPanelErrorFallback`

## Usage Examples

### 1. App-Level Error Boundary (already implemented)

```tsx
// src/App.tsx
import { AppErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <AppErrorBoundary level="app">
      <Providers>
        <AppShell />
      </Providers>
    </AppErrorBoundary>
  );
}
```

### 2. Feature-Level Error Boundaries (already implemented)

```tsx
// src/components/ViewSwitcher.tsx
import { FeatureErrorBoundary } from './ErrorBoundary';

switch (currentView) {
  case View.Timeline:
    return (
      <FeatureErrorBoundary featureName="Timeline">
        <TimelinePanel />
      </FeatureErrorBoundary>
    );
  // ... other cases
}
```

### 3. Component-Level Error Boundaries

```tsx
import { ComponentErrorBoundary, getPanelErrorFallback } from './components/ErrorBoundary';

// For individual components
const MyComponent = () => {
  return (
    <ComponentErrorBoundary>
      <SomeRiskyComponent />
    </ComponentErrorBoundary>
  );
};

// For panels with specific error UI
const MyPanel = () => {
  const errorProps = {
    onRetry: () => window.location.reload(),
    onReportIssue: () => console.log('Report issue'),
  };

  return (
    <ComponentErrorBoundary fallback={getPanelErrorFallback('timeline', errorProps)}>
      <TimelineContent />
    </ComponentErrorBoundary>
  );
};
```

### 4. Using the HOC Pattern

```tsx
import { withErrorBoundary } from './components/ErrorBoundary';

const MyComponent = () => {
  // Component might throw errors
  return <div>...</div>;
};

// Wrap with error boundary
export default withErrorBoundary(MyComponent, {
  level: 'component',
  featureName: 'My Feature',
});
```

### 5. Custom Error Fallbacks

```tsx
import { AppErrorBoundary } from './components/ErrorBoundary';

const MyCustomFallback = () => (
  <div className="p-8 text-center">
    <h2>Oops! Something went wrong</h2>
    <button onClick={() => window.location.reload()}>Try Again</button>
  </div>
);

const MyComponent = () => {
  return (
    <AppErrorBoundary fallback={<MyCustomFallback />}>
      <RiskyComponent />
    </AppErrorBoundary>
  );
};
```

## Error Reporting

The error boundary system includes built-in error reporting:

1. **Development**: Errors are logged to console with full stack traces
2. **Production**: Errors are stored in localStorage and can be reported via email
3. **Performance Monitoring**: Errors are marked in the Performance API
4. **User Feedback**: Users can easily report errors with pre-filled issue templates

## Best Practices

### 1. Layered Error Boundaries

```tsx
// App Level
<AppErrorBoundary level="app">
  {/* Feature Level */}
  <FeatureErrorBoundary featureName="Dashboard">
    {/* Component Level */}
    <ComponentErrorBoundary>
      <RiskyWidget />
    </ComponentErrorBoundary>
  </FeatureErrorBoundary>
</AppErrorBoundary>
```

### 2. Error Boundary Placement

- **Root Level**: Wrap the entire app
- **Route Level**: Wrap each major view/page
- **Feature Level**: Wrap complex features (Plot Boards, Timeline, etc.)
- **Component Level**: Wrap individual risky components (charts, external integrations)

### 3. Error Recovery Strategies

```tsx
const RecoverableComponent = () => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <ComponentErrorBoundary
        fallback={
          <div>
            <p>Component failed to load</p>
            <button onClick={() => setHasError(false)}>Try Again</button>
          </div>
        }
      >
        <FallbackComponent />
      </ComponentErrorBoundary>
    );
  }

  return (
    <ComponentErrorBoundary>
      <MainComponent onError={() => setHasError(true)} />
    </ComponentErrorBoundary>
  );
};
```

### 4. Error Boundary Testing

```tsx
// Add to development/testing components
const ErrorTrigger = () => {
  if (process.env.NODE_ENV === 'development') {
    return (
      <button
        onClick={() => {
          throw new Error('Test error boundary');
        }}
      >
        🚨 Trigger Error (Dev Only)
      </button>
    );
  }
  return null;
};
```

## Error Information Captured

The error boundary system captures:

- Error message and stack trace
- Component stack
- User agent and browser info
- URL and timestamp
- Feature/component context
- Build version and environment
- Unique error ID for tracking

## Accessibility

All error fallbacks include:

- Proper ARIA labels
- Keyboard navigation support
- High contrast error indicators
- Clear, actionable messaging
- Consistent visual hierarchy

## Future Enhancements

- Integration with external error reporting services (Sentry, Bugsnag)
- User session recording for error context
- Automatic error recovery with exponential backoff
- Error trend analysis and alerting
- Integration with the support ticket system
