# Telemetry & Analytics Guide

## Overview

Inkwell uses privacy-focused analytics to understand how users interact with the platform and identify areas for improvement. This guide covers event tracking, metrics, and privacy considerations.

## Analytics Stack

### Current Implementation

- **Provider**: [To be determined - Mixpanel, PostHog, or custom solution]
- **Storage**: Client-side event buffering with batched uploads
- **Privacy**: GDPR-compliant, user opt-out supported
- **Data retention**: 90 days for event data, aggregated metrics retained longer

### Event Types

1. **User Events**: Signup, login, profile updates
2. **Feature Events**: Project creation, chapter management, AI usage
3. **Tour Events**: Tour start, step views, completion, skip
4. **Performance Events**: Page load times, API latency
5. **Error Events**: Client-side errors, API failures

## Tour Analytics

### Tracked Events

#### `tour_started`

Fired when a user begins a tour.

**Properties**:

```typescript
{
  tourId: string;          // e.g., 'onboarding-tour'
  tourVersion: number;     // e.g., 1
  totalSteps: number;      // e.g., 8
  userId?: string;         // If user is authenticated
  timestamp: number;       // Unix timestamp
}
```

**When**:

- User clicks "Take a Tour" in help menu
- First-time user completes signup (auto-start)

---

#### `tour_step_viewed`

Fired when a user views a tour step.

**Properties**:

```typescript
{
  tourId: string;
  tourVersion: number;
  stepId: string;          // e.g., 'create-project'
  stepIndex: number;       // 1-based (e.g., 2 for second step)
  totalSteps: number;
  stepTitle: string;       // e.g., 'Create Your First Project'
  placement: string;       // e.g., 'bottom', 'right'
  targetFound: boolean;    // Was the target element found?
  userId?: string;
  timestamp: number;
}
```

**When**:

- User navigates to a new step (via Next/Previous buttons or keyboard)
- Step is auto-advanced after user completes an action

---

#### `tour_completed`

Fired when a user completes all tour steps.

**Properties**:

```typescript
{
  tourId: string;
  tourVersion: number;
  totalSteps: number;
  durationMs: number;      // Time from start to completion
  userId?: string;
  timestamp: number;
}
```

**When**:

- User clicks "Finish" on the last step
- User auto-completes the tour by finishing all steps

---

#### `tour_skipped`

Fired when a user exits the tour early.

**Properties**:

```typescript
{
  tourId: string;
  tourVersion: number;
  atStepId: string;        // Step where user exited
  atStepIndex: number;     // 1-based
  totalSteps: number;
  completionRate: number;  // e.g., 0.375 (3 out of 8 steps)
  durationMs: number;      // Time from start to skip
  userId?: string;
  timestamp: number;
}
```

**When**:

- User clicks "Skip" button
- User presses Escape key
- User navigates away from the tour

---

### Key Metrics

**Completion Rate**:

```
Completion Rate = (tour_completed events) / (tour_started events)
```

**Step Drop-off**:

```
Step Drop-off Rate = (tour_skipped at step N) / (tour_step_viewed at step N)
```

**Average Duration**:

```
Avg Duration = mean(durationMs) from tour_completed events
```

**Target Found Rate**:

```
Target Found Rate = (tour_step_viewed with targetFound=true) / (tour_step_viewed total)
```

### Dashboard Widgets

Recommended analytics dashboard views:

1. **Tour Funnel**: Completion rate over time
2. **Step Drop-off**: Bar chart showing where users exit
3. **Avg Duration**: Line chart of time to complete
4. **Target Errors**: Steps with low targetFound rate
5. **Version Comparison**: A/B test different tour versions

## General Analytics Events

### User Events

- `user_signed_up`: New user registration
- `user_logged_in`: User login
- `user_logged_out`: User logout
- `user_settings_updated`: Profile or preferences changed

### Project Events

- `project_created`: New project created
- `project_opened`: User opens an existing project
- `project_deleted`: User deletes a project
- `project_exported`: User exports a project (PDF, DOCX, etc.)

### Chapter Events

- `chapter_created`: New chapter created
- `chapter_edited`: Chapter content changed
- `chapter_deleted`: Chapter deleted
- `chapter_reordered`: Chapter moved in the outline

### AI Events

- `ai_analysis_requested`: User requests AI plot analysis
- `ai_analysis_completed`: AI analysis finishes
- `ai_suggestion_accepted`: User accepts an AI suggestion
- `ai_suggestion_rejected`: User dismisses an AI suggestion

### Performance Events

- `page_loaded`: Page load time
- `api_request`: API call duration and status
- `error_occurred`: Client-side error or exception

## Analytics Integration

### Implementation

```typescript
// src/services/analytics.ts
export interface AnalyticsService {
  track(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
}

class MixpanelAnalytics implements AnalyticsService {
  track(event: string, properties?: Record<string, unknown>) {
    mixpanel.track(event, properties);
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    mixpanel.identify(userId);
    if (traits) mixpanel.people.set(traits);
  }

  reset() {
    mixpanel.reset();
  }
}

export const analytics = new MixpanelAnalytics();
```

### Usage in Tour

```typescript
// src/tour/TourService.ts
import { analytics } from '@/services/analytics';

class TourService {
  start() {
    // ... tour logic
    analytics.track('tour_started', {
      tourId: this.config.id,
      tourVersion: this.config.version,
      totalSteps: this.config.steps.length,
    });
  }

  next() {
    const step = this.currentStep;
    analytics.track('tour_step_viewed', {
      tourId: this.config.id,
      tourVersion: this.config.version,
      stepId: step.id,
      stepIndex: this.currentIndex + 1,
      totalSteps: this.config.steps.length,
      stepTitle: step.title,
      placement: step.placement || 'auto',
      targetFound: this.targetElementFound,
    });
    // ... advance logic
  }

  complete() {
    analytics.track('tour_completed', {
      tourId: this.config.id,
      tourVersion: this.config.version,
      totalSteps: this.config.steps.length,
      durationMs: Date.now() - this.startTime,
    });
    // ... completion logic
  }
}
```

## Privacy & Compliance

### User Consent

- Display analytics opt-in/opt-out in settings
- Respect "Do Not Track" browser headers
- Default to opt-in for authenticated users
- Anonymous usage for unauthenticated users

### GDPR Compliance

- **Data minimization**: Only track necessary events
- **Anonymization**: Remove PII from event properties
- **Right to erasure**: Provide user data deletion endpoint
- **Data portability**: Allow users to export their analytics data

### Data Retention

- **Event data**: 90 days
- **Aggregated metrics**: Indefinite (anonymized)
- **User profiles**: Until account deletion or opt-out

### Sensitive Data

**Never track**:

- User-generated content (chapter text, project names)
- Passwords or authentication tokens
- Payment information
- Personal identifiers (email, phone, address)

**OK to track**:

- Feature usage (button clicks, page views)
- Performance metrics (load times, error rates)
- Aggregated counts (projects created, chapters written)

## Error Tracking

### Client-Side Errors

Use a service like Sentry for error tracking:

```typescript
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: process.env.NODE_ENV,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1, // 10% of requests
});
```

### Tour-Specific Errors

Log tour errors to help debug selector issues:

```typescript
// In TourService or useSpotlightUI
if (!targetElement) {
  console.warn(`[Tour] Target not found: ${step.selectors.join(', ')}`);
  analytics.track('tour_target_not_found', {
    tourId: this.config.id,
    stepId: step.id,
    selectors: step.selectors,
  });
}
```

## Performance Monitoring

### Core Web Vitals

Track key performance metrics:

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

```typescript
import { onLCP, onFID, onCLS } from 'web-vitals';

onLCP((metric) => analytics.track('core_web_vitals', { metric: 'LCP', value: metric.value }));
onFID((metric) => analytics.track('core_web_vitals', { metric: 'FID', value: metric.value }));
onCLS((metric) => analytics.track('core_web_vitals', { metric: 'CLS', value: metric.value }));
```

### API Latency

Track API response times:

```typescript
fetch('/api/projects').then((response) => {
  analytics.track('api_request', {
    endpoint: '/api/projects',
    method: 'GET',
    status: response.status,
    durationMs: performance.now() - startTime,
  });
});
```

## Testing Analytics

### Local Testing

Use a debug mode to log events to console:

```typescript
class DebugAnalytics implements AnalyticsService {
  track(event: string, properties?: Record<string, unknown>) {
    console.log('[Analytics]', event, properties);
  }
  // ... other methods
}

export const analytics =
  process.env.NODE_ENV === 'development' ? new DebugAnalytics() : new MixpanelAnalytics();
```

### E2E Testing

Mock the analytics service in tests:

```typescript
// vitest.setup.ts
vi.mock('@/services/analytics', () => ({
  analytics: {
    track: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}));
```

### QA Checklist

- [ ] All tour events fire correctly
- [ ] Event properties match schema
- [ ] No PII in event properties
- [ ] Analytics opt-out works
- [ ] Events batch correctly (no duplicate sends)
- [ ] Performance impact is minimal (< 50ms)

## Reporting

### Weekly Reports

Generate weekly reports with:

- Tour completion rate
- Most common drop-off points
- Average tour duration
- New user activation rate

### Alerts

Set up alerts for:

- Tour completion rate drops below 30%
- High error rate on specific steps
- Unusual spike in tour skips

## Related Documentation

- [Architecture: Spotlight Tour](../architecture/spotlight-tour-architecture.md)
- [Feature Guide: Tour](../features/tour.md)
- [Product: First-Run Experience](../product/first-run-experience.md)
- [QA Checklist](../../QA_CHECKLIST.md)
