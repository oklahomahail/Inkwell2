# ✍️ Inkwell – AI-Assisted Fiction Writing Platform

Inkwell is a **modern, offline-first writing app** built with React, TypeScript, Tailwind CSS, and Vite.  
It helps writers plan, write, and organize novels with features like **timeline management, character bibles, AI-powered assistance (Claude), and progress analytics** — all optimized for a distraction-free, dark-mode experience.

---

## 🚀 Features

* 📝 **Chapter Tracker** — Manage chapters with metadata, word counts, and draft status.
* 🧠 **Claude AI Assistant** — Integrated AI chat for plotting, dialogue, worldbuilding, and revision (API key required).
* 🧍‍♀️ **Character Bible** — Create detailed character profiles with arcs and relationships.
* 📅 **Timeline Checker** — Track story events and detect logical or continuity conflicts.
* 📊 **Analytics Dashboard** — View progress metrics, streaks, and writing goals.
* 💾 **Offline Support** — IndexedDB local storage for seamless offline writing.
* 🎨 **Dark Mode Ready** — Clean Track15-inspired theme for immersive focus.

---

## 📁 Project Structure

```bash
src/
├── App.tsx                # Main app with tab-based routing
├── main.tsx               # App entry point
├── index.css              # Tailwind base styles
├── components/            # Shared UI components
│   ├── Layout.tsx         # Navigation and layout wrapper
│   ├── Writing/           # Writing workspace (editor + toolbar)
│   ├── Timeline/          # Timeline UI
│   └── Analytics/         # Progress and stats views
├── features/              # (Planned) domain-specific logic
├── hooks/                 # (Planned) shared Zustand/global stores
├── contexts/              # (Planned) global React contexts
├── utils/                 # (Planned) utility functions
└── assets/                # Static images and icons
