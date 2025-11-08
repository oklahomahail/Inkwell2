# Getting Started with Inkwell

Welcome to **Inkwell**, your secure, offline-first writing environment built for focus, privacy, and creative flow.
This short guide will help you get comfortable with the workspace, learn core actions, and understand how your data stays protected.

---

## 1. Navigating the App {#navigating-the-app}

When you first open Inkwell, you'll see three primary panels in the sidebar:

- **Dashboard** – view all projects, word counts, and exports.
- **Editor** – where you'll spend most of your time drafting and revising.
- **Export** – generate formatted versions of your manuscript.

**Keyboard shortcuts**

- `⌘K` (or `Ctrl+K`) – open the Command Palette
- `⌘S` – manual save (optional; autosave runs automatically)
- `⌘⇧E` – jump to the Export Dashboard

_Tip:_ You can rearrange panels or collapse the sidebar to create a distraction-free workspace.

---

## 2. Writing Your First Scene {#writing-your-first-scene}

1. Open your **Welcome Project** or create a new project.
2. Click **New Chapter** and begin typing.
3. Inkwell autosaves every edit instantly — even offline.
4. Switch between chapters from the sidebar or Command Palette.

### Organizing your writing

- Use headings (\`#\`, \`##\`) to structure chapters or sections.
- Rename chapters by clicking the title at the top of the editor.
- Drag and drop chapters to reorder.
- The editor keeps a rolling autosave history for recovery.

---

## 3. Exporting Your Work {#exporting-your-work}

When you're ready to share or back up your work:

1. Navigate to the **Export Dashboard**.
2. Choose your preferred format: **PDF**, **DOCX**, or **EPUB**.
3. Select all chapters or specific ones.
4. Click **Export** – Inkwell will process locally and notify you when complete.

Exports run offline and sync automatically when you reconnect.

### Export Options

- **PDF** – Professional-quality PDFs with customizable styling
- **DOCX** – Microsoft Word format for editing and collaboration
- **EPUB** – Digital book format for e-readers and publishing platforms

---

## 4. Privacy and Telemetry {#privacy-and-telemetry}

Inkwell collects **anonymous performance metrics** (for example, autosave speed, cache efficiency, and error counts) to improve reliability.

We **never** collect or transmit:

- Written content
- Project or chapter titles
- Any personally identifying information

All telemetry is processed locally and sent only in aggregate, sample-based form.
You can disable telemetry at any time.

### To disable telemetry

1. Open **Settings → Privacy**.
2. Uncheck **Enable anonymous telemetry**.
3. Changes take effect immediately (no restart required).

### What we collect

When telemetry is enabled, we collect:

- **Performance metrics**: Autosave latency (p50, p95, p99), render drift, cache hit rates
- **Usage patterns**: Feature activation counts (anonymized, no identifying info)
- **Error tracking**: Recovery attempts and outcomes (no content included)
- **Sample rate**: All events include \`sample: 1\` for statistical analysis

All telemetry uses the browser's \`sendBeacon\` API (non-blocking) and falls back gracefully if unavailable.

---

## 5. Troubleshooting and Recovery {#troubleshooting-and-recovery}

If you encounter an unexpected error:

- Inkwell automatically attempts recovery in three tiers:
  1. Restore from cloud backup (if sync enabled)
  2. Restore from a local shadow copy
  3. Prompt you to upload a saved backup file

- You can inspect recovery status in DevTools by running:

  \`\`\`js
  window.Inkwell.recovery.inspect();
  \`\`\`

### Common Issues

**Autosave not working?**

- Check the status indicator in the top bar (should show green when synced)
- Run \`window.Inkwell.cache.inspect()\` in DevTools to check cache health
- Verify your browser allows IndexedDB (required for offline storage)

**Export failing?**

- Ensure you have selected at least one chapter
- Check browser console for detailed error messages
- Try exporting individual chapters to isolate the issue

**Offline mode not working?**

- Verify Service Worker is registered (check Application tab in DevTools)
- Ensure you've loaded the app at least once while online
- Check \`navigator.onLine\` status in console

For offline reliability tips, see the **Welcome Project** chapters on autosave and export.

---

## 6. Developer Tools {#developer-tools}

Inkwell exposes several debugging utilities via \`window.Inkwell\`:

### Cache Inspection

\`\`\`js
// View cache statistics
window.Inkwell.cache.inspect();

// View performance metrics
window.Inkwell.cache.metrics();

// Clear cache (for testing)
window.Inkwell.cache.reset();
\`\`\`

### Recovery Testing

\`\`\`js
// View current recovery state
window.Inkwell.recovery.inspect();

// Simulate recovery scenarios
window.Inkwell.recovery.simulate();

// Force recovery attempt
window.Inkwell.recovery.test();
\`\`\`

### Performance Metrics

\`\`\`js
// Get autosave performance data
window.Inkwell.performance.getAutosaveMetrics();

// View all performance data
window.Inkwell.performance.getAll();
\`\`\`

---

## 7. Keyboard Shortcuts {#keyboard-shortcuts}

### Global

- \`⌘K\` / \`Ctrl+K\` – Command Palette
- \`⌘S\` / \`Ctrl+S\` – Manual save
- \`⌘,\` / \`Ctrl+,\` – Settings

### Editor

- \`⌘B\` / \`Ctrl+B\` – Bold
- \`⌘I\` / \`Ctrl+I\` – Italic
- \`⌘Z\` / \`Ctrl+Z\` – Undo
- \`⌘⇧Z\` / \`Ctrl+Shift+Z\` – Redo

### Navigation

- \`⌘⇧E\` / \`Ctrl+Shift+E\` – Export Dashboard
- \`⌘⇧D\` / \`Ctrl+Shift+D\` – Dashboard
- \`⌘⇧P\` / \`Ctrl+Shift+P\` – Projects

---

## 8. Next Steps {#next-steps}

- Explore your **Welcome Project** for guided chapters
- Click **Learn More** in the onboarding banner anytime to return here
- Visit [github.com/oklahomahail/Inkwell2](https://github.com/oklahomahail/Inkwell2) for updates and release notes
- Join the beta feedback round to shape future releases

---

## 9. Feature Highlights {#feature-highlights}

### Offline-First Architecture

Inkwell is designed to work seamlessly offline:

- All writing is saved locally in IndexedDB
- Changes sync automatically when you reconnect
- Offline queue shows pending sync operations
- Service Worker caches the app for instant offline access

### 3-Tier Recovery System

Your work is protected by multiple safety nets:

1. **Cloud backup** – Automatic sync to Supabase (if enabled)
2. **Local shadow copies** – Automatic local backups every 5 minutes
3. **Manual restore** – Upload saved backups from your device

### Autosave Performance

Inkwell monitors autosave performance to ensure smooth writing:

- Target latency: p95 under 250ms
- Render drift: Less than 10ms (imperceptible lag)
- Status indicator: Real-time feedback in the top bar

---

## 10. Getting Help {#getting-help}

Need additional support?

- **Documentation**: Check this guide for common questions
- **DevTools**: Use debugging utilities (see section 6)
- **GitHub Issues**: Report bugs at [github.com/oklahomahail/Inkwell2/issues](https://github.com/oklahomahail/Inkwell2/issues)
- **Community**: Join discussions and share feedback

---

### Version Information

- **Document version**: v0.9.1
- **Last updated**: November 2025
- **Compatible with**: Inkwell v0.9.0 Beta and later

---

_This documentation is part of the Inkwell v0.9.1 Beta release, focusing on onboarding and export polish._
