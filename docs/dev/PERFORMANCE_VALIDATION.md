# React Performance Validation Guide

## Overview

After memoization changes (useMemo, useCallback, React.memo), validate that you haven't over or under-optimized using React DevTools Profiler.

## Setup

1. Install [React DevTools](https://react.dev/learn/react-developer-tools) browser extension
2. Open your app in development mode: `pnpm dev`
3. Open DevTools → Profiler tab

## Hot Components to Watch

These components are performance-critical and should be validated after hooks changes:

### Analytics Views

- `src/components/Analytics/AnalyticsView.tsx`
- `src/components/Analytics/ProgressChart.tsx`
- `src/components/Analytics/StatCard.tsx`

### Character Management

- `src/components/CharacterManagement/CharacterList.tsx`
- `src/components/CharacterManagement/CharacterCard.tsx`

### Chapter/Scene Editing

- `src/components/ChapterManagement/ChapterList.tsx`
- `src/components/SceneEditor/SceneEditor.tsx`

### AI Assistant

- `src/components/AIAssistant/AssistantPanel.tsx`
- `src/components/AIAssistant/ChatInterface.tsx`

## Validation Process

### Step 1: Record a Profile

1. Click the **Record** button in Profiler
2. Perform typical user interactions:
   - Navigate between views
   - Edit content
   - Toggle UI elements
   - Filter/search
3. Click **Stop** to finish recording

### Step 2: Analyze Render Counts

Look for:

- ✅ **Good**: Parent re-renders, memoized children don't
- ❌ **Bad**: Child re-renders every time parent does (when it shouldn't)
- ❌ **Bad**: Component never re-renders when props actually change

### Step 3: Check Commit Timing

- Most interactions should be < 16ms (60fps)
- Analytics updates can be slower (~50-100ms acceptable)
- Editor typing must be < 16ms

### Step 4: Investigate Suspicious Patterns

**Symptom**: Component re-renders every time

```typescript
// ❌ Problem: Inline object/array creation
<MyComponent config={{ option: true }} />

// ✅ Fix: Memoize or move outside render
const config = useMemo(() => ({ option: true }), []);
<MyComponent config={config} />
```

**Symptom**: Component never updates when it should

```typescript
// ❌ Problem: Over-memoization
const MemoizedChild = React.memo(Child);
<MemoizedChild data={data} />
// But 'data' is a new object every render!

// ✅ Fix: Stabilize the dependency
const stableData = useMemo(() => data, [data.id, data.value]);
<MemoizedChild data={stableData} />
```

## Common Memoization Anti-Patterns

### 1. Memoizing Everything

```typescript
// ❌ Unnecessary - primitive values are cheap
const count = useMemo(() => items.length, [items]);

// ✅ Just compute it
const count = items.length;
```

### 2. Missing Dependencies

```typescript
// ❌ Stale closure
const handleClick = useCallback(() => {
  doSomething(userId);
}, []); // userId missing!

// ✅ Include all dependencies
const handleClick = useCallback(() => {
  doSomething(userId);
}, [userId]);
```

### 3. Expensive Memo Check

```typescript
// ❌ Deep equality check is expensive
React.memo(Component, (prev, next) => {
  return _.isEqual(prev, next); // slow!
});

// ✅ Shallow comparison is default
React.memo(Component);
```

## Performance Benchmarks

Use these as rough guidelines:

| Component     | Expected Render Time | Notes                   |
| ------------- | -------------------- | ----------------------- |
| StatCard      | < 5ms                | Simple display          |
| CharacterCard | < 10ms               | Medium complexity       |
| ProgressChart | 20-50ms              | Canvas rendering        |
| SceneEditor   | < 16ms               | Must be responsive      |
| AnalyticsView | 50-100ms             | Complex calculations OK |

## Tools

- **React DevTools Profiler**: Visual render timeline
- **Chrome DevTools Performance**: Low-level metrics
- **console.time/timeEnd**: Quick measurement

```typescript
console.time('expensive-calculation');
const result = expensiveCalculation();
console.timeEnd('expensive-calculation');
```

## When to Optimize

Optimize when:

- ✅ User experiences lag (> 100ms delays)
- ✅ Profiler shows > 100ms commit times
- ✅ Component re-renders 10+ times during one interaction

Don't optimize when:

- ❌ Profiler shows < 16ms commit times
- ❌ User doesn't notice any lag
- ❌ "Just in case" - measure first!

## Further Reading

- [React Profiler API](https://react.dev/reference/react/Profiler)
- [Optimizing Performance](https://react.dev/reference/react/memo)
- [useMemo Hook](https://react.dev/reference/react/useMemo)
- [useCallback Hook](https://react.dev/reference/react/useCallback)
