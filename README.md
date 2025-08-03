# ✍️ Inkwell – AI-Assisted Fiction Writing Platform

**Inkwell** is a modern, offline-first writing platform built with React, TypeScript, Tailwind CSS, and Vite.  
It empowers fiction writers to plan, draft, and organize their novels with features like timeline tracking, character bibles, AI-powered brainstorming, and progress analytics — all in a distraction-free, dark-mode workspace.

---

## 🚀 Features

- 📝 **Chapter Tracker** – Manage chapters with metadata, word counts, and draft status.
- 🤖 **Claude AI Assistant** – Brainstorm plots, revise drafts, and generate dialogue (API key required).
- 👤 **Character Bible** – Build rich character profiles, arcs, and relationships.
- 🗓️ **Timeline Checker** – Visualize story events and check for continuity issues.
- 📈 **Analytics Dashboard** – Track your writing streaks, daily word counts, and project goals.
- 💾 **Offline-First** – All data stored locally with IndexedDB for seamless offline access.
- 🌙 **Dark Mode Ready** – Clean, modern Track15-inspired UI optimized for focus.

---

## 📁 Project Structure

```bash
src/
├── App.tsx                # Main app shell and tab routing
├── main.tsx               # App entry point
├── index.css              # Tailwind + global styles
├── components/            # Shared UI components
│   ├── Layout/            # Sidebar, top bar, page layout
│   ├── Writing/           # Editor, toolbar, writing panels
│   ├── Timeline/          # Timeline UI and event tools
│   └── Analytics/         # Progress dashboard and metrics
├── features/              # Domain-specific logic (in progress)
├── hooks/                 # Zustand stores and custom hooks
├── contexts/              # Global React contexts (e.g. Claude API)
├── utils/                 # Shared helper functions
└── assets/                # Icons, images, and media
```
