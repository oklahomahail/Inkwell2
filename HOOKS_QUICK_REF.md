# React Hooks ESLint Quick Reference

## Running the Hooks Linter

```bash
# Check for hooks violations (strict mode - errors only)
pnpm lint:hooks

# Regular lint (hooks warnings allowed)
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

## Common Patterns & Fixes

### Pattern 1: Unstable Conditional Value

**Problem:** Conditional creates new identity each render

```typescript
// ❌ BAD - identity changes every render
const sessions = props.sessions || [];
const byDay = useMemo(() => summarize(sessions), [sessions]);
```

**Fix:** Wrap in `useMemo`

```typescript
// ✅ GOOD - stable identity
const sessions = useMemo(() => {
  return props.sessions ?? [];
}, [props.sessions]);
const byDay = useMemo(() => summarize(sessions), [sessions]);
```

### Pattern 2: Missing Dependencies

**Problem:** Effect uses values not in deps array

```typescript
// ❌ BAD
useEffect(() => {
  loadData(projectId);
}, []); // projectId missing!
```

**Fix:** Add all referenced values

```typescript
// ✅ GOOD
useEffect(() => {
  loadData(projectId);
}, [projectId]);
```

### Pattern 3: Unnecessary Dependencies

**Problem:** Dep doesn't affect the computation

```typescript
// ❌ BAD
const data = useMemo(() => {
  return staticService.getData(); // doesn't use currentView
}, [currentView]);
```

**Fix:** Remove unnecessary dep

```typescript
// ✅ GOOD
const data = useMemo(() => {
  return staticService.getData();
}, []);
```

### Pattern 4: Stabilize Handlers

**Problem:** Inline function creates new identity

```typescript
// ❌ BAD
<Button onClick={() => handleClick(id)} />
```

**Fix:** Use `useCallback`

```typescript
// ✅ GOOD
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id, handleClick]);

<Button onClick={handleButtonClick} />
```

### Pattern 5: Function Defined After Use

**Problem:** Function used in effect before it's defined

```typescript
// ❌ BAD
useEffect(() => {
  performAnalysis(); // defined later!
}, [currentContent]);

const performAnalysis = useCallback(...);
```

**Fix:** Move function definition before use

```typescript
// ✅ GOOD
const performAnalysis = useCallback(
  () => {
    /* ... */
  },
  [
    /* deps */
  ],
);

useEffect(() => {
  performAnalysis();
}, [currentContent, performAnalysis]);
```

### Pattern 6: Intentional Run-Once (use sparingly!)

**Problem:** Effect should only run on mount

```typescript
// ❌ BAD - using theme but not in deps
useEffect(() => {
  const initial = getInitialTheme();
  if (initial !== theme) setTheme(initial);
}, []); // theme missing!
```

**Fix:** Add disable with justification

```typescript
// ✅ ACCEPTABLE - with clear reason
useEffect(() => {
  const initial = getInitialTheme();
  if (initial !== theme) setTheme(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally run once on mount
}, []);
```

## When to Use `eslint-disable`

### ✅ Acceptable Cases

1. **Intentional run-once** - Effect should only run on mount
2. **Circular dependencies** - Function references another function that references it back
3. **Mutual references** - Complex interdependent functions (rare)
4. **Stable via closure** - Function is guaranteed stable by design

### ❌ Don't Use For

1. Laziness - "too many deps to add"
2. Fixing infinite loops - usually indicates architectural issue
3. Avoiding refactoring - better to fix the structure

### Always Include Justification

```typescript
// ✅ GOOD
// eslint-disable-next-line react-hooks/exhaustive-deps -- performSearch is stable via closure
[filters],

// ❌ BAD
// eslint-disable-next-line react-hooks/exhaustive-deps
[filters],
```

## Troubleshooting

### "Hook has a missing dependency"

→ Add the dependency to the array, or wrap it in `useCallback`/`useMemo`

### "Hook has unnecessary dependency"

→ Remove it - it doesn't affect the result

### "Conditional could make dependencies change"

→ Wrap the conditional in `useMemo` to stabilize its identity

### "Function whose dependencies are unknown"

→ Don't pass function references to `useCallback` - use inline functions

### Infinite render loop after adding deps?

→ You have an architectural issue. Consider:

- Using refs for values that shouldn't trigger re-renders
- Restructuring to avoid circular dependencies
- Memoizing expensive computations
- Moving state up or using a reducer

## CI Integration

The `lint:hooks` check runs on all PRs via GitHub Actions. It will **fail** if:

- Any new `react-hooks/rules-of-hooks` violations exist
- Any new `react-hooks/exhaustive-deps` violations exist

To check locally before pushing:

```bash
pnpm lint:hooks
```

## Resources

- [React Hooks API Reference](https://react.dev/reference/react)
- [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)
- [useEffect dependency array](https://react.dev/reference/react/useEffect#parameters)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
