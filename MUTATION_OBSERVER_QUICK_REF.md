# MutationObserver Quick Reference

## ✅ Always Use Safe Utilities

```typescript
import {
  safeObserve,
  safeDisconnect,
  waitForElement,
  getPortalTarget,
} from '@/utils/dom/safeObserver';
```

## Common Patterns

### 1. Observe an Element (Basic)

```typescript
const observer = new MutationObserver((mutations) => {
  // Handle mutations
});

const target = document.getElementById('my-element');
const ok = safeObserve(observer, target, {
  childList: true,
  subtree: true,
});

if (!ok) {
  // Fallback: observe document.body instead
  safeObserve(observer, document.body, { childList: true, subtree: true });
}

// Always clean up
return () => safeDisconnect(observer);
```

### 2. Wait for Element Then Observe

```typescript
useEffect(() => {
  let observer: MutationObserver | null = null;

  (async () => {
    // Wait up to 2 seconds for element to appear
    const target = await waitForElement('#late-mounted-element', 2000);

    if (!target) {
      console.warn('Element never appeared');
      return;
    }

    observer = new MutationObserver(() => {
      /* ... */
    });
    safeObserve(observer, target, { childList: true, subtree: true });
  })();

  return () => safeDisconnect(observer);
}, []);
```

### 3. Portal/Modal Observation with Fallback

```typescript
const observer = new MutationObserver(() => {
  // Check for tour overlays, modals, etc.
});

// Try to observe portal, fall back to document.body
const target = getPortalTarget('inkwell-portal');
safeObserve(observer, target, { childList: true, subtree: true });

return () => safeDisconnect(observer);
```

### 4. React useEffect Pattern

```typescript
useEffect(
  () => {
    const observer = new MutationObserver((mutations) => {
      // Your logic here
    });

    const target = document.getElementById('root');
    safeObserve(observer, target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-state'],
    });

    // Cleanup on unmount
    return () => safeDisconnect(observer);
  },
  [
    /* dependencies */
  ],
);
```

## API Reference

### `safeObserve(observer, target, options)`

Safely observe a DOM node with automatic error handling.

**Parameters:**

- `observer: MutationObserver` - The observer instance
- `target: unknown` - The element to observe (accepts any type, validates internally)
- `options: MutationObserverInit` - Standard MutationObserver options

**Returns:** `boolean`

- `true` if observation started successfully
- `false` if target is invalid or observation failed

**Example:**

```typescript
const ok = safeObserve(observer, myElement, { childList: true });
if (!ok) {
  // Handle fallback
}
```

### `safeDisconnect(observer)`

Safely disconnect an observer without throwing errors.

**Parameters:**

- `observer: MutationObserver | null | undefined` - The observer to disconnect

**Example:**

```typescript
safeDisconnect(observer); // Never throws, even if null/undefined
```

### `waitForElement(selector, timeout?)`

Asynchronously wait for an element to appear in the DOM.

**Parameters:**

- `selector: string` - CSS selector to find
- `timeout?: number` - Max wait time in ms (default: 2000)

**Returns:** `Promise<Element | null>`

- Resolves with element when found
- Resolves with `null` if timeout expires

**Example:**

```typescript
const el = await waitForElement('#my-async-element', 3000);
if (el) {
  // Element exists, use it
}
```

### `getPortalTarget(preferredId?)`

Get a safe target for portal/modal observation.

**Parameters:**

- `preferredId?: string` - ID of preferred portal element

**Returns:** `Node | null`

- Returns the preferred element if it exists
- Falls back to `document.body`
- Returns `null` only in SSR

**Example:**

```typescript
const target = getPortalTarget('inkwell-portal');
// Will return document.body if #inkwell-portal doesn't exist
```

## Common MutationObserverInit Options

```typescript
{
  childList: true,      // Watch for added/removed children
  subtree: true,        // Watch all descendants
  attributes: true,     // Watch attribute changes
  attributeFilter: ['class', 'data-state'], // Only watch specific attrs
  characterData: true,  // Watch text content changes
  attributeOldValue: true,   // Include old attribute values
  characterDataOldValue: true // Include old text content
}
```

## ❌ Common Mistakes to Avoid

```typescript
// ❌ DON'T: Direct observe without safety
observer.observe(element, options);

// ✅ DO: Use safeObserve
safeObserve(observer, element, options);

// ❌ DON'T: Forget to disconnect
useEffect(() => {
  observer.observe(element, options);
  // Missing cleanup!
}, []);

// ✅ DO: Always disconnect in cleanup
useEffect(() => {
  safeObserve(observer, element, options);
  return () => safeDisconnect(observer);
}, []);

// ❌ DON'T: Assume element exists
const el = document.querySelector('#maybe-not-there');
observer.observe(el, options); // Crash if null!

// ✅ DO: Use safeObserve which handles null
const el = document.querySelector('#maybe-not-there');
safeObserve(observer, el, options); // Safe!

// ❌ DON'T: Pass window object
observer.observe(window, options); // TypeError!

// ✅ DO: Only pass DOM Nodes
safeObserve(observer, document.body, options);
```

## Performance Tips

1. **Be specific with options** - Only watch what you need

   ```typescript
   // ❌ Expensive - watches everything
   safeObserve(observer, root, {
     childList: true,
     subtree: true,
     attributes: true,
     characterData: true,
   });

   // ✅ Efficient - only watches necessary changes
   safeObserve(observer, root, {
     childList: true,
     attributeFilter: ['data-tour-active'],
   });
   ```

2. **Disconnect when done** - Don't leave observers running

   ```typescript
   if (conditionMet) {
     safeDisconnect(observer); // Stop observing ASAP
   }
   ```

3. **Use narrow targets** - Observe specific elements, not entire document

   ```typescript
   // ❌ Watches entire document
   safeObserve(observer, document.body, options);

   // ✅ Watches only specific container
   const container = document.getElementById('my-container');
   safeObserve(observer, container, options);
   ```

4. **Debounce mutation handlers** - Avoid processing every tiny change
   ```typescript
   const observer = new MutationObserver(
     debounce((mutations) => {
       // Process mutations
     }, 100),
   );
   ```

## Troubleshooting

### "Failed to execute 'observe' on 'MutationObserver'"

**Cause:** Passing invalid target (null, undefined, window, or non-Node)  
**Fix:** Use `safeObserve` instead of direct `observe()`

### Observer not detecting changes

1. Check that target element exists
2. Verify options match the type of change (e.g., need `attributes: true` for class changes)
3. Ensure observer wasn't disconnected prematurely

### Performance issues

1. Use `attributeFilter` to limit attribute observations
2. Avoid `subtree: true` on large DOM trees if possible
3. Disconnect observers when no longer needed
4. Consider debouncing the callback

---

**Last Updated:** 2025-01-27
