# Sync and Storage in Inkwell

Inkwell is **local‑first**. Your work saves instantly on your device and **works offline**. When you're online, Inkwell can **sync securely to the cloud** so your projects stay backed up and available across devices.

- Local storage: IndexedDB for fast, reliable offline access.
- Cloud sync (optional): Supabase Postgres with Row Level Security.
- Privacy: You control sync. Turn it on or off anytime in Settings.
- Backups: You can export a portable `.inkwell` bundle at any time.
- Conflicts: If changes happen in two places, Inkwell will ask you which version to keep or how to merge.

**Dev tip:** When reading from Supabase, use the `selectFrom()` helper so you automatically query the `*_active` views and avoid pulling soft‑deleted rows into the UI.
