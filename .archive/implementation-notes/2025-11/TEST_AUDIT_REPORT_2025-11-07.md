# Test File Audit Report

**Generated:** 2025-11-07T22:30:47.665Z

## Summary

| Category     | Count   | Percentage |
| ------------ | ------- | ---------- |
| ❌ Obsolete  | 3       | 2.9%       |
| ⚠️ Redundant | 3       | 2.9%       |
| 🔧 Stale     | 3       | 2.9%       |
| ✅ Current   | 94      | 91.3%      |
| **Total**    | **103** | **100%**   |

## ❌ OBSOLETE Files

**Recommendation:** DELETE

| File                                                                            | Reason                              | Size   | Last Modified | Stale Imports |
| ------------------------------------------------------------------------------- | ----------------------------------- | ------ | ------------- | ------------- |
| `src/test-skipped/foundation.test.ts.skip`                                      | In archive/skipped folder           | 15.3KB | 2025-10-05    | 1             |
| `src/.archive-phase2-2025-11/services/enhancedSearchService.mainthread.test.ts` | In archive/skipped folder           | 3.2KB  | 2025-11-05    | 0             |
| `src/components/Onboarding/TourProvider.test.tsx.skip`                          | Skipped test file (.skip extension) | 4.0KB  | 2025-10-26    | 0             |

## ⚠️ REDUNDANT Files

**Recommendation:** MERGE/DELETE

| File                                          | Reason                                                             | Size  | Last Modified | Stale Imports |
| --------------------------------------------- | ------------------------------------------------------------------ | ----- | ------------- | ------------- |
| `src/context/AuthContext.test.tsx`            | Duplicate of src/context/**tests**/AuthContext.test.tsx            | 8.5KB | 2025-10-28    | 0             |
| `src/context/AppContext.test.tsx`             | Duplicate of src/context/**tests**/AppContext.test.tsx             | 3.2KB | 2025-10-26    | 0             |
| `src/services/enhancedStorageService.test.ts` | Duplicate of src/services/**tests**/enhancedStorageService.test.ts | 6.5KB | 2025-10-26    | 0             |

## 🔧 STALE Files

**Recommendation:** UPDATE

| File                                         | Reason                                                                                    | Size  | Last Modified | Stale Imports |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- | ----- | ------------- | ------------- |
| `src/test/timeline-conflict.test.ts`         | 2 stale import(s): ../services/timelineConflictService, ../services/projectContextService | 1.9KB | 2025-10-15    | 2             |
| `src/__tests__/smoke/brand-ui.test.tsx`      | 2 stale import(s): ../../components/Auth/AuthHeader, ../../hooks/useTheme                 | 4.2KB | 2025-11-05    | 2             |
| `src/hooks/__tests__/onboardingGate.test.ts` | 1 stale import(s): @/hooks/onboardingGate                                                 | 0.8KB | 2025-10-22    | 1             |

## Recommendations

### Immediate Actions

1. **Delete Obsolete Files** - These are in archive folders or explicitly skipped
2. **Resolve Redundant Files** - Merge or delete duplicate test files
3. **Update Stale Tests** - Fix broken imports and update to current architecture

### Commands

```bash
# Delete obsolete files
rm "src/test-skipped/foundation.test.ts.skip"
rm "src/.archive-phase2-2025-11/services/enhancedSearchService.mainthread.test.ts"
rm "src/components/Onboarding/TourProvider.test.tsx.skip"
```
