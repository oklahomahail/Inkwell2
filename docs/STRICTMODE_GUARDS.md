# StrictMode Guards - Developer Documentation

## Overview

React StrictMode intentionally double-mounts components in development to help detect side effects. While this is valuable for catching bugs, it can cause issues with async operations that aren't idempotent (e.g., creating database records, making API calls).

This document explains how to use the StrictMode guard utilities to prevent duplicate operations.

## The Problem

When React StrictMode is enabled, components mount → unmount → remount. This means:

```typescript
useEffect(() => {
  createSection('Chapter 1', 'chapter'); // Called TWICE in dev mode!
}, []);
```

**Result**: Two "Chapter 1" sections in the database, UI freezing, race conditions.

## The Solution: StrictMode Guards

We provide three utilities in `/src/utils/strictModeGuard.ts`:

### 1. `strictModeGuard()` - For Async Functions

Wraps an async function to prevent concurrent execution.

**Example:**

```typescript
import { strictModeGuard } from '@/utils/strictModeGuard';

// Wrap your async operation
const createSectionSafe = strictModeGuard(
  async (title: string, type: SectionType) => {
    const section = await Chapters.create({ title, type });
    return section;
  },
  'createSection', // Label for debugging
);

// Use it in your component
useEffect(() => {
  createSectionSafe('Chapter 1', 'chapter');
}, []);
```

**How it works:**

- First call: Executes normally
- Second call (from StrictMode): Returns `null` and logs debug message
- Guard resets after 100ms

### 2. `strictModeGuardSync()` - For Synchronous Functions

Same as above, but for synchronous operations.

**Example:**

```typescript
import { strictModeGuardSync } from '@/utils/strictModeGuard';

const handleClickSafe = strictModeGuardSync(() => {
  console.log('Button clicked');
  // ... expensive sync operation
}, 'handleClick');
```

### 3. `createStrictModeGuardRef()` - For Manual Control

For cases where you need fine-grained control over the guard lifecycle.

**Example:**

```typescript
import { createStrictModeGuardRef } from '@/utils/strictModeGuard';

function MyComponent() {
  const guard = useRef(createStrictModeGuardRef('myOperation'));

  const handleClick = async () => {
    if (!guard.current.canRun()) return; // Check if safe to run

    try {
      // Your async operation here
      await someAsyncOperation();
    } finally {
      guard.current.reset(); // Reset after completion
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Current Implementations

### EnhancedWritingPanel.tsx

**Problem**: Initial section auto-creation was happening twice.

**Solution**: Used ref-based guard in useEffect

```typescript
const initialSectionCreated = useRef(false);
useEffect(() => {
  if (sections.length === 0 && !activeId && !initialSectionCreated.current) {
    initialSectionCreated.current = true;
    await createSection('Chapter 1', 'chapter');
  }

  return () => {
    if (sections.length === 0) {
      initialSectionCreated.current = false;
    }
  };
}, [sections.length, activeId, createSection]);
```

**Problem**: Manual section creation could be triggered rapidly.

**Solution**: Time-based guard with lastCreateTime ref

```typescript
const lastCreateTime = useRef<number>(0);

const handleCreateSection = async () => {
  const now = Date.now();
  if (isCreatingSection || now - lastCreateTime.current < 1000) {
    return; // Skip duplicate call
  }

  lastCreateTime.current = now;
  // ... create section
};
```

### useSections.ts

**Problem**: `createSection()` could be called concurrently from multiple sources.

**Solution**: Ref-based guard with timeout reset

```typescript
const creatingSection = useRef(false);

const createSection = useCallback(async (title, type) => {
  if (creatingSection.current) {
    console.debug('[useSections] Ignoring duplicate createSection call');
    return null;
  }

  try {
    creatingSection.current = true;
    // ... create section
  } finally {
    setTimeout(() => {
      creatingSection.current = false;
    }, 500);
  }
}, []);
```

## When to Use StrictMode Guards

Use guards for operations that:

- ✅ Create/delete database records
- ✅ Make API calls
- ✅ Modify external state (localStorage, IndexedDB)
- ✅ Have side effects that shouldn't repeat
- ✅ Are expensive computationally

Don't use guards for:

- ❌ Pure calculations
- ❌ State setters (React handles these)
- ❌ Reading data (idempotent operations)
- ❌ Event handlers that should fire multiple times

## Debugging StrictMode Issues

### 1. Check the Console

In development, you'll see:

```
⚛️ React StrictMode Active
Components will intentionally double-mount to detect side effects.
```

### 2. Look for Guard Debug Messages

When a guard blocks a duplicate call:

```
[StrictGuard:createSection] Skipping duplicate call (running=true, delay=50ms)
```

### 3. Disable StrictMode Temporarily

To confirm StrictMode is the cause, temporarily remove it:

**src/main.tsx:**

```typescript
// Before
<StrictMode>
  <App />
</StrictMode>

// After (test only - don't commit!)
<App />
```

If the issue disappears, it's a StrictMode problem.

## Best Practices

1. **Always use cleanup functions** in `useEffect` when dealing with async operations
2. **Use refs for guard flags**, not state (refs persist across re-renders)
3. **Add descriptive labels** to guards for easier debugging
4. **Test in development** with StrictMode enabled to catch issues early
5. **Document why** you're using a guard in code comments

## Examples

### Example 1: Auto-create Welcome Project

```typescript
const welcomeCreated = useRef(false);

useEffect(() => {
  if (!welcomeCreated.current) {
    welcomeCreated.current = true;
    ensureWelcomeProject();
  }

  return () => {
    // Only reset if project wasn't actually created
    if (!hasWelcomeProject()) {
      welcomeCreated.current = false;
    }
  };
}, []);
```

### Example 2: Debounced API Call

```typescript
const saveDraft = strictModeGuard(async (content: string) => {
  await api.saveDraft({ content });
}, 'saveDraft');

// Use in component
useEffect(() => {
  if (content) {
    const timer = setTimeout(() => {
      saveDraft(content);
    }, 500);

    return () => clearTimeout(timer);
  }
}, [content]);
```

### Example 3: Manual Guard with Cleanup

```typescript
function MyComponent() {
  const guard = useRef(createStrictModeGuardRef('initializeService'));

  useEffect(() => {
    if (!guard.current.canRun()) return;

    const service = initializeExpensiveService();

    return () => {
      service.cleanup();
      guard.current.reset();
    };
  }, []);
}
```

## FAQ

**Q: Why not just disable StrictMode?**
A: StrictMode helps catch real bugs. It's better to make components StrictMode-safe than to disable this valuable tool.

**Q: Will guards affect production?**
A: No. StrictMode only runs in development. In production, components mount once, so guards are just a safety net.

**Q: What if I need to run an operation twice?**
A: Use the ref-based guard and manually call `guard.reset()` when appropriate.

**Q: Can I use guards outside React components?**
A: Yes! The utility functions work anywhere. Just pass a function and label.

## Related Files

- `/src/utils/strictModeGuard.ts` - Guard utilities
- `/src/components/Writing/EnhancedWritingPanel.tsx` - Example usage
- `/src/hooks/useSections.ts` - Example usage in hooks
- `/src/main.tsx` - StrictMode is enabled here

## Further Reading

- [React StrictMode Documentation](https://react.dev/reference/react/StrictMode)
- [React 18 Double Mounting Behavior](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)
