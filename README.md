# ✍️ Writing Platform

A modern, offline-first fiction writing app built with React, TypeScript, Tailwind CSS, and Vite. This platform helps writers plan, write, and organize novels with powerful features including timeline management, character bibles, AI-powered assistance, and writing progress analytics.

---

## 🚀 Features

* 📝 **Chapter Tracker** — Manage chapters with metadata, word counts, and status.
* 🧠 **Claude AI Assistant** — Integrated AI chat for plotting, dialogue, worldbuilding, and revision.
* 🧍‍♀️ **Character Bible** — Create detailed character profiles with arcs and milestones.
* 📅 **Timeline Checker** — Track story events and detect logical conflicts.
* 📊 **Analytics Dashboard** — View progress metrics, writing streaks, and goals.
* 💾 **Offline Support** — IndexedDB local storage for seamless offline use.
* 🎨 **Dark Mode** — Fully styled light/dark themes with Tailwind CSS.

---

## 📁 Project Structure

```bash
src/
├── App.tsx                # Main app with tab-based routing
├── main.tsx               # App entry point
├── index.css              # Tailwind base styles
├── components/            # Shared UI components
│   ├── Layout.tsx         # Navigation and layout wrapper
│   ├── Writing/           # Writing workspace
│   ├── Timeline/          # Timeline UI
│   └── Analytics/         # Progress and stats
├── features/              # (Planned) domain-specific logic
├── hooks/                 # (Planned) shared logic and Zustand stores
├── contexts/              # (Planned) React contexts
├── utils/                 # (Planned) utility functions
└── assets/                # Static images and icons
```

---

## 🧑‍💻 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/writing-platform.git
cd writing-platform
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will run at [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Tech Stack

* **React** + **TypeScript** — Component-based frontend architecture
* **Tailwind CSS** — Utility-first responsive styling
* **Vite** — Fast build tool for development and production
* **React Router** — Tab-based navigation
* **IndexedDB** — Persistent offline storage
* **(Planned)** Zustand, Claude API, Export tools, Plot boards

---

## 📦 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Create production build
npm run preview   # Preview production build
```

---

## 🧩 Contributing

Coming soon — feature roadmap, contribution guide, and CLA for contributors.

---

## 📘 License

This project is licensed under the MIT License. See `LICENSE` for more details.
