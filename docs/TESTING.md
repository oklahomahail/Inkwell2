# Testing Guide

Comprehensive testing documentation for Inkwell, including setup, best practices, and common patterns.

---

## Quick Start

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

---

## Test Infrastructure

### Vitest Configuration

Inkwell uses **Vitest** as the test runner with the following setup:

- **Test files**: `**/*.test.{ts,tsx}` and `**/*.spec.{ts,tsx}`
- **Setup file**: `vitest.setup.ts`
- **Coverage tool**: v8
- **Environment**: jsdom (browser-like)

### IndexedDB Polyfill for Tests

**Problem**: IndexedDB is not available in Node.js test environment

**Solution**: Use `fake-indexeddb` polyfill

#### Installation

```bash
pnpm add -D fake-indexeddb
```

#### Setup in `vitest.setup.ts`

```typescript
// vitest.setup.ts
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// Make IndexedDB available globally
global.indexedDB = new IDBFactory();

// Optional: Add cleanup between tests
afterEach(() => {
  // Clean up IndexedDB databases
  if (global.indexedDB) {
    const dbs = global.indexedDB.databases?.();
    if (dbs) {
      dbs.then((databases) => {
        databases.forEach((db) => {
          if (db.name) {
            global.indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }
  }
});
```

#### Why This Matters

- **Storage services** (enhancedStorageService, projectService) rely on IndexedDB
- **Health checks** (useStorageHealth hook) need IndexedDB to test quota detection
- **Tour persistence** (tutorialStorage) stores progress in IndexedDB
- Without polyfill: `ReferenceError: indexedDB is not defined`

---

## Testing Patterns

### Testing React Components

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const { user } = render(<MyComponent />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Testing Services with IndexedDB

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { enhancedStorageService } from './enhancedStorageService';

describe('enhancedStorageService', () => {
  beforeEach(async () => {
    // Clear IndexedDB before each test
    await enhancedStorageService.clearAll();
  });

  it('stores and retrieves data', async () => {
    const data = { id: '1', title: 'Test' };
    await enhancedStorageService.save('projects', data);

    const retrieved = await enhancedStorageService.get('projects', '1');
    expect(retrieved).toEqual(data);
  });

  it('handles quota errors gracefully', async () => {
    // Test quota exceeded scenario
    const largeData = new Array(1000000).fill('x').join('');
    await expect(enhancedStorageService.save('projects', { data: largeData })).rejects.toThrow();
  });
});
```

### Testing Auth Components

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from './context/AuthContext';
import SignIn from './pages/SignInPage';

describe('SignIn', () => {
  it('renders sign-in form', () => {
    render(
      <AuthProvider>
        <SignIn />
      </AuthProvider>
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('submits form with valid credentials', async () => {
    const { user } = render(
      <AuthProvider>
        <SignIn />
      </AuthProvider>
    );

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
    });
  });
});
```

### Testing Router-Dependent Components

```typescript
import { BrowserRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
}

describe('Navigation', () => {
  it('renders navigation links', () => {
    renderWithRouter(<MainLayout><Dashboard /></MainLayout>);
    // assertions...
  });
});
```

### Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useStorageHealth } from './useStorageHealth';

describe('useStorageHealth', () => {
  it('returns storage health status', async () => {
    const { result } = renderHook(() => useStorageHealth());

    await waitFor(() => {
      expect(result.current.isHealthy).toBeDefined();
    });

    expect(result.current.quota).toBeGreaterThan(0);
    expect(result.current.usage).toBeGreaterThanOrEqual(0);
  });
});
```

---

## Common Test Issues & Solutions

### Issue: "indexedDB is not defined"

**Cause**: IndexedDB is not available in Node.js environment

**Solution**: Add `fake-indexeddb` polyfill (see above)

### Issue: "Cannot read properties of undefined (reading 'location')"

**Cause**: Component uses `useLocation()` outside of Router context

**Solution**: Wrap component in `<BrowserRouter>` or use `MemoryRouter` for tests

### Issue: "window.matchMedia is not a function"

**Cause**: jsdom doesn't implement matchMedia

**Solution**: Add polyfill in `vitest.setup.ts`:

```typescript
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Issue: "ResizeObserver is not defined"

**Cause**: jsdom doesn't implement ResizeObserver

**Solution**: Add polyfill in `vitest.setup.ts`:

```typescript
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### Issue: Tests timeout with async operations

**Cause**: Async operations not properly awaited

**Solution**: Use `waitFor` from @testing-library/react:

```typescript
await waitFor(
  () => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  },
  { timeout: 5000 },
);
```

---

## Coverage

### Running Coverage

```bash
pnpm test:coverage
```

### Coverage Thresholds

Recommended thresholds in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
});
```

### Viewing Coverage Reports

- **Terminal**: `pnpm test:coverage` shows summary
- **HTML**: Open `coverage/index.html` in browser
- **CI**: Coverage reports uploaded to code coverage services

---

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**:

```typescript
expect(component.state.count).toBe(1);
```

✅ **Good**:

```typescript
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### 2. Use Data-Testid Sparingly

❌ **Bad**:

```typescript
<button data-testid="submit-button">Submit</button>
screen.getByTestId('submit-button');
```

✅ **Good**:

```typescript
<button>Submit</button>
screen.getByRole('button', { name: /submit/i });
```

### 3. Clean Up After Tests

```typescript
afterEach(async () => {
  // Clear IndexedDB
  await enhancedStorageService.clearAll();

  // Clear localStorage
  localStorage.clear();

  // Clear sessionStorage
  sessionStorage.clear();
});
```

### 4. Mock External Services

```typescript
vi.mock('@/services/analyticsService', () => ({
  analyticsService: {
    track: vi.fn(),
    trackEvent: vi.fn(),
  },
}));
```

### 5. Test Error States

```typescript
it('handles errors gracefully', async () => {
  // Trigger error condition
  await user.click(screen.getByRole('button'));

  // Verify error message shown
  expect(screen.getByRole('alert')).toHaveTextContent('Error occurred');
});
```

---

## E2E Testing (Playwright)

### Running E2E Tests

```bash
# Install Playwright browsers (first time only)
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run in UI mode
pnpm exec playwright test --ui
```

### E2E Test Structure

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign in', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
```

---

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:run
      - run: pnpm build
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB)

---

**Last Updated**: October 25, 2025
