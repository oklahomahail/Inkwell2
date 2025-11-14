# Cloud Sync POC Suite

Proof-of-concept tests for Inkwell's always-on cloud synchronization system.

## Overview

This suite validates critical components before full implementation:

1. **LWW Merge Engine** - Conflict resolution logic
2. **Hydration Performance** - IndexedDB ↔ Supabase benchmarks
3. **Styled Textarea** - UI prototype for writing panel

## Running the Tests

### 1. LWW Merge POC

Tests Last Write Wins conflict resolution with various edge cases.

```bash
npx tsx docs/sync/poc-suite/01-lww-merge-poc.ts
```

**What it tests:**

- Cloud newer than local
- Local newer than cloud
- Never-synced records
- Timestamp collisions
- Clock skew scenarios
- Unicode/emoji content
- Large content (10MB)
- Performance (10,000 merges)

**Expected output:**

```
✅ All tests passed - LWW merge engine is ready
```

---

### 2. Hydration Benchmark POC

Simulates cloud → local hydration and local → cloud push for various project sizes.

```bash
npx tsx docs/sync/poc-suite/02-hydration-benchmark-poc.ts
```

**What it tests:**

- Small project (10 chapters, 5 characters, 10 notes)
- Medium project (50 chapters, 20 characters, 50 notes)
- Large project (200 chapters, 100 characters, 200 notes)
- Network conditions (fast 10ms, average 30ms, slow 100ms)

**Expected output:**

```
Small Project:
  Cloud → Local Hydration: ~60ms
  Local → Cloud Push: ~50ms

Medium Project:
  Cloud → Local Hydration: ~230ms
  Local → Cloud Push: ~180ms

Large Project:
  Cloud → Local Hydration: ~850ms
  Local → Cloud Push: ~680ms
```

**Note:** Uses mock implementations. Real Supabase will have additional network overhead.

---

### 3. Styled Textarea Prototype

Interactive browser-based demo of CSS-styled textarea approach.

```bash
open docs/sync/poc-suite/03-styled-textarea-poc.html
```

**What it demonstrates:**

- Document-wide formatting (font, size, line-height)
- Themes (light, dark, sepia)
- Indentation controls
- Scene separator insertion
- Interactive toolbar

**What it proves:**

- ✅ Fast and reliable plain text editing
- ✅ No contenteditable bugs
- ✅ Perfect for autosave (plain text)
- ❌ No inline formatting (bold/italic)
- ❌ No mixed fonts within document

**Conclusion:** Ideal for Inkwell IF inline formatting is not required.

---

## Test Results Summary

| Test         | Status  | Performance            | Recommendation                                     |
| ------------ | ------- | ---------------------- | -------------------------------------------------- |
| LWW Merge    | ✅ Pass | 0.002ms/merge          | Ready for production                               |
| Hydration    | ✅ Pass | <1s for large projects | Use batching, parallel ops                         |
| UI Prototype | ✅ Pass | Instant rendering      | Use styled textarea OR lightweight contenteditable |

---

## Next Steps

1. Review [IMPLEMENTATION_DECISION.md](../IMPLEMENTATION_DECISION.md)
2. Run all POCs locally to validate
3. Make architectural decisions (textarea vs contenteditable, etc.)
4. Begin Phase 1 implementation (schema migrations)

---

## Dependencies

These POCs use minimal dependencies:

- `tsx` - TypeScript execution (install: `npm i -D tsx`)
- Web browser - For styled textarea demo
- Node.js 18+ - For running TypeScript POCs

No Supabase connection required (uses mocks for testing).

---

## Interpreting Results

### LWW Merge POC

- **All tests pass:** LWW logic is sound, ready for production
- **Some tests fail:** Review merge logic before implementing

### Hydration Benchmark

- **Times <1 second:** Acceptable performance for user experience
- **Times >2 seconds:** Consider pagination or incremental hydration

### Styled Textarea

- **Smooth typing, no lag:** Textarea approach is viable
- **Missing features:** Decide if inline formatting is required

---

## Troubleshooting

### `npx tsx` not found

Install tsx globally:

```bash
npm install -g tsx
```

Or use local install:

```bash
npm install --save-dev tsx
```

### POC tests fail

Check Node version:

```bash
node --version  # Should be 18+
```

### Styled textarea won't open

Use any modern browser:

```bash
# macOS
open docs/sync/poc-suite/03-styled-textarea-poc.html

# Linux
xdg-open docs/sync/poc-suite/03-styled-textarea-poc.html

# Windows
start docs/sync/poc-suite/03-styled-textarea-poc.html
```

---

**Last Updated:** 2025-11-14
**Maintained By:** Inkwell Development Team
