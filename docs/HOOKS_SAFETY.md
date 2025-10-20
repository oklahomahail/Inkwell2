# React Hooks Safety Guidelines

## Overview

This document outlines safety guidelines for using React hooks in the Inkwell application. These guidelines help prevent common issues like React #321 ("Invalid hook call") which can occur due to improper hook usage.

## Navigation Hook Standards

### ✅ DO

- Always use `useGo()` from '@/utils/navigate' for navigation
- Keep all hook calls at the top level of your component
- Include all dependencies in useEffect/useCallback dependency arrays
- Use one navigation approach consistently in a single component

### ❌ DON'T

- Import `useNavigate()` directly from 'react-router-dom'
- Mix `useGo()` and `useNavigate()` in the same component
- Use hooks conditionally or inside loops
- Use hooks in event handlers or nested functions

## Implemented Guardrails

### ESLint Rules

The codebase is protected by ESLint rules that:

1. Block direct imports of `useNavigate` from react-router-dom
2. Enforce React hooks rules (no conditional hooks, proper dependency arrays)
3. Prevent component layer violations that could cause circular dependencies

### fix.eslint.js Script

We've enhanced the `fix.eslint.js` script to:

1. Automatically convert `useNavigate()` to `useGo()`
2. Fix dependency arrays referencing navigate to use go instead
3. Detect and report potential Rules of Hooks violations:
   - Conditional hook usage
   - Hooks inside loops
   - Hooks inside callbacks or nested functions

## Common Issues and Resolutions

### "Invalid Hook Call" Error

**Symptoms:**

- Error #321 in React devtools
- Component fails to render or update
- Error about hooks not being called in the same order

**Causes:**

- Using different versions of React in the same app
- Conditional hook calls
- Hooks in loops or nested functions
- Multiple navigation hooks in the same component

**Solutions:**

- Ensure only one React version is used (run `pnpm ls react react-dom`)
- Move all hook calls to the top level of the component
- Standardize on `useGo()` for all navigation

### Navigation Hook Misuse

**Prevention:**

- The ESLint rule will block direct imports of useNavigate
- The fix.eslint.js script can automatically convert useNavigate to useGo
- Regular test runs will catch potential issues

## Troubleshooting

If you encounter hook-related errors:

1. Run `node fix.eslint.js` to automatically fix common issues
2. Check for conditional hook usage (if statements containing hooks)
3. Verify that all hooks are called at the top level of components
4. Run `pnpm test` to confirm all tests pass
5. Check for multiple versions of React with `pnpm ls react react-dom`

## References

- [React Rules of Hooks](https://reactjs.org/docs/hooks-rules.html)
- [Inkwell Navigation Utils](/src/utils/navigate.ts)
- [ESLint Config](/eslint.config.js)
