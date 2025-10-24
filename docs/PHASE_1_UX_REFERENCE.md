# Phase 1 UX Quick Reference

## Last Active Chapter Persistence

### How It Works

Automatically remembers the last chapter you were editing for each project.

### Storage Location

`localStorage['lastChapter-{projectId}'] = chapterId`

### When It Saves

- ✅ When you select a chapter
- ✅ When you create a new chapter
- ✅ When you switch between chapters

### When It Restores

- ✅ Opening a project for the first time in a session
- ✅ Refreshing the page
- ✅ Returning from another project

### Edge Cases Handled

- ⚡ If saved chapter was deleted → selects first available chapter
- ⚡ If project has no chapters → no restoration attempted
- ⚡ If localStorage is cleared → falls back to first chapter

---

## Autosave Indicator

### Visual States

| State  | Icon         | Text              | Meaning                        |
| ------ | ------------ | ----------------- | ------------------------------ |
| Saving | 🔵 (pulsing) | "Saving..."       | Save operation in progress     |
| Saved  | 🟢 (solid)   | "Saved 2 min ago" | Last successful save timestamp |
| Idle   | —            | "—"               | No save data yet (new chapter) |

### Update Frequency

- **Autosave interval**: Every 10 seconds
- **Save on unmount**: When closing/switching chapters
- **Save on page close**: When closing browser/tab

### Time Format

- < 60 min: "X min ago"
- ≥ 60 min: "X h ago"
- Minimum: "1 min ago" (never shows "0 min")

---

## API Reference

### useChapterDocument Hook

```typescript
// Old API (Phase 0)
const [content, setContent] = useChapterDocument(chapterId);

// New API (Phase 1)
const {
  content, // string - chapter content
  setContent, // (content: string) => void
  isSaving, // boolean - true during save
  lastSavedAt, // string | null - ISO timestamp
} = useChapterDocument(chapterId);
```

### ChaptersContext Actions

```typescript
// Set active chapter (auto-persists to localStorage)
dispatch(chaptersActions.setActive(chapterId));

// Load chapters (auto-restores last active)
dispatch(chaptersActions.loadForProject(projectId, chapters));

// Remove chapter (auto-cleans up localStorage if active)
dispatch(chaptersActions.remove(chapterId, projectId));
```

---

## Implementation Checklist

If you're adding these features to a new component:

### Last Active Chapter

- [ ] Import `chaptersActions` from ChaptersContext
- [ ] Dispatch `setActive()` when user selects a chapter
- [ ] Use `LOAD_FOR_PROJECT` action to trigger restoration
- [ ] No manual localStorage calls needed (handled in reducer)

### Autosave Indicator

- [ ] Update hook usage from tuple to object destructuring
- [ ] Add indicator UI with 3 states (saving/saved/idle)
- [ ] Use `formatLastSaved()` helper for time display
- [ ] Consider placement in chapter header or toolbar

---

## Troubleshooting

### Last active chapter not restoring

1. Check browser console for localStorage access errors
2. Verify project ID matches between save and load
3. Confirm chapter exists in loaded chapters array
4. Check if localStorage quota exceeded (unlikely but possible)

### Autosave indicator stuck on "Saving..."

1. Check network tab for failed API requests
2. Verify `Chapters.saveDoc()` implementation
3. Look for uncaught errors in save operation
4. Confirm `finally` block is setting `isSaving=false`

### Time display showing wrong value

1. Verify `lastSavedAt` is valid ISO string
2. Check system clock accuracy
3. Confirm `formatLastSaved()` calculation logic

---

## Performance Notes

- **localStorage**: Writes are synchronous but fast (<1ms)
- **Autosave**: Debounced to 10-second intervals
- **Re-renders**: Hook only updates on actual save state changes
- **Memory**: Minimal overhead (~3 state variables per hook)

---

## Browser Compatibility

### localStorage

- ✅ All modern browsers
- ✅ Private/Incognito mode (may clear on session end)
- ⚠️ Quota: ~5-10MB per domain (sufficient for chapter IDs)

### Animations

- ✅ `animate-pulse` supported in Tailwind CSS v2+
- ✅ Fallback: static dot if animations disabled

---

## Future Enhancements (Phase 2+)

- [ ] Sync last active chapter across devices (Supabase)
- [ ] Visual indicator for unsaved changes (dirty state)
- [ ] Manual save button for explicit control
- [ ] Save conflict resolution (multiple tabs)
- [ ] Offline queue for failed saves
- [ ] Detailed save history/versioning

---

## Related Files

- `src/context/ChaptersContext.tsx` - Persistence logic
- `src/hooks/useChapterDocument.ts` - Autosave tracking
- `src/components/Writing/ChapterWritingPanel.tsx` - UI implementation
- `docs/PHASE_1_UX_POLISH.md` - Full documentation
