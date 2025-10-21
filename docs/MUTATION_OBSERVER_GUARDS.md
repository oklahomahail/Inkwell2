# MutationObserver Guards Implementation

## Overview

MutationObservers are used in Inkwell to watch for DOM changes and react accordingly, particularly in onboarding tours, UI synchronization, and interactive elements. However, they can cause errors in certain environments like SSR/hydration or when DOM elements aren't available.

## October 2025 Hardening

We've implemented robust guards for all MutationObserver usages across the codebase to prevent SSR/hydration errors and improve stability:

### Implementation Details

1. **Node Instance Checks**

   ```typescript
   if (!node || !(node instanceof Node)) {
     console.warn('resolveTarget: document.body is not a Node');
     setTimeout(() => resolve(tryFind()), 100); // Fallback to simple timeout
     return;
   }
   ```

2. **Try/Catch Blocks**

   ```typescript
   try {
     observer.observe(node, {
       childList: true,
       subtree: true,
       attributes: true,
       attributeFilter: ['class', 'style', 'data-tour'],
     });
   } catch (e) {
     console.warn('MutationObserver failed:', e);
     setTimeout(() => resolve(tryFind()), 100); // Fallback to simple timeout
   }
   ```

3. **Timeout Fallbacks**
   ```typescript
   // Set timeout to avoid hanging
   setTimeout(() => {
     observer.disconnect();
     resolve(tryFind()); // One final try before giving up
   }, timeout);
   ```

### Affected Files

- `/src/tour/targets.ts`
- `/src/components/Onboarding/hooks/useSpotlightAutostart.ts`
- `/src/components/Onboarding/selectorMap.ts`

## Best Practices

When using MutationObserver in Inkwell:

1. **Always check if the node is valid**: Use `if (!node || !(node instanceof Node))`
2. **Always use try/catch**: Wrap observer.observe() calls in try/catch
3. **Always include timeouts**: Prevent infinite waiting with setTimeout fallbacks
4. **Handle disconnection**: Ensure observer is disconnected in cleanup functions
5. **Provide fallback mechanisms**: Have an alternative if observation fails

## Testing

The hardened implementation has been tested across multiple environments:

- Server-side rendering
- Client hydration
- React Strict Mode (double rendering)
- Various browsers (Chrome, Firefox, Safari)

## See Also

- [Mozilla MutationObserver Documentation](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [React 18 Hydration Notes](https://react.dev/reference/react-dom/hydrate)
