# Inkwell Branding Guide

Version: 1.0  
Status: Active  
Last Updated: October 2025

---

## 🎯 Brand Purpose

**Inkwell** represents _clarity, creativity, and composure_.  
The brand should feel **modern, focused, and intelligent**, never busy or performative. Every visual and word choice should reinforce trust and a sense of creative calm.

> **Tagline:** "Where stories take shape."

---

## 🪶 Brand Mark System

### Primary Wordmark

- **Format:** lowercase `inkwell`
- **Typeface:** geometric or humanist sans (recommendations: _Inter Tight_, _Manrope_, _Neue Montreal_, or _Satoshi_)
- **Kerning:** +2%
- **Weight:** 500 (medium)
- **Case:** always lowercase
- **Color:** `var(--ink-primary)` on light surfaces, `var(--ink-accent)` on dark

### Icon Mark

- **Concept:** Ink droplet fused with quill nib or spark — symbolizing thought flowing into creation.
- **Shape Language:** minimal, monoline, symmetrical
- **Formats:**
  - `icon-inkwell.svg` (24×24) for UI components
  - `icon-inkwell@2x.svg` (48×48) for splash/loading
  - `inkwell-mark.svg` (128×128) for docs and marketing

**Usage Examples:**

- **App Sidebar:** 24×24 icon followed by wordmark
- **Splash Screen:** centered mark + tagline
- **Favicon:** droplet-only version (white on dark background)

---

## 🎨 Color System

### Core Palette

| Token           | Hex       | Usage                              |
| --------------- | --------- | ---------------------------------- |
| `--ink-primary` | `#5B8CFF` | Primary brand color, buttons, CTAs |
| `--ink-accent`  | `#FFD580` | Highlights, links, subtle emphasis |
| `--ink-bg`      | `#0B0E13` | Dark background surfaces           |
| `--ink-surface` | `#1A1E2B` | Card surfaces, panels              |
| `--ink-text`    | `#E6E8EE` | Primary text color                 |
| `--ink-muted`   | `#9EA4B8` | Secondary text                     |
| `--ink-border`  | `#2C3242` | Dividers, outlines                 |
| `--ink-success` | `#52E19F` | Success states                     |
| `--ink-error`   | `#FF5C7A` | Errors, alerts                     |

**Implementation (Tailwind theme extension):**

```js
theme: {
  extend: {
    colors: {
      ink: {
        primary: '#5B8CFF',
        accent: '#FFD580',
        bg: '#0B0E13',
        surface: '#1A1E2B',
        text: '#E6E8EE',
        muted: '#9EA4B8',
        border: '#2C3242',
        success: '#52E19F',
        error: '#FF5C7A',
      },
    },
  },
}
```

### Color Discipline

- Use `--ink-primary` for action emphasis only (buttons, links).
- Avoid brand color saturation in backgrounds—let dark neutrals dominate.
- Keep overall contrast ≥ 4.5:1 for accessibility.

---

## ✍️ Typography

| Role               | Font             | Weight  | Usage                         |
| ------------------ | ---------------- | ------- | ----------------------------- |
| Display / Headings | Inter Tight      | 600     | Titles, splash headers        |
| Body / UI          | Inter or Manrope | 400–500 | Body text, form labels        |
| Monospace / Code   | JetBrains Mono   | 400     | Technical docs, code snippets |

**Hierarchy Example:**

```css
h1 {
  font-size: 2.25rem;
  font-weight: 600;
}
h2 {
  font-size: 1.5rem;
  font-weight: 500;
}
p {
  font-size: 1rem;
  line-height: 1.6;
}
small {
  color: var(--ink-muted);
}
```

**Do:**

- Maintain wide spacing and generous line height.
- Use sentence case for readability.
- Keep all-caps only for UI labels (e.g., "SAVE DRAFT").

---

## ⚡ Motion & Interaction

### Philosophy

Motion should reflect precision and focus, like ink spreading on paper — smooth, natural, never showy.

### Timing

| Action                  | Duration  | Easing                       |
| ----------------------- | --------- | ---------------------------- |
| Hover / Focus           | 120ms     | ease-out                     |
| Page / modal transition | 200–250ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Autosave pulse          | 400ms     | ease-in-out                  |

### Micro-interaction Examples

- **Autosave:** a faint ink droplet pulse next to "Saved" indicator
- **Button hover:** gentle scale (1.02) + underline fade-in
- **Loading:** mark "fills" with ink from bottom up, then fades

**Add shared Tailwind utilities:**

```css
@layer utilities {
  .transition-ink {
    @apply transition-all duration-200 ease-in-out;
  }
  .pulse-ink {
    animation: inkPulse 1s ease-in-out infinite alternate;
  }
  @keyframes inkPulse {
    from {
      opacity: 0.5;
    }
    to {
      opacity: 1;
    }
  }
}
```

---

## 🧭 Brand Voice & Microcopy

| Context       | Tone              | Example                                |
| ------------- | ----------------- | -------------------------------------- |
| Empty state   | Calm, encouraging | "Blank pages are full of possibility." |
| Save toast    | Confident, warm   | "Saved to your Inkwell."               |
| AI prompt CTA | Conversational    | "Polish this paragraph"                |
| Loading       | Reflective        | "Gathering your thoughts…"             |
| Errors        | Supportive, clear | "Something spilled. Let's try again."  |

### Voice Principles

- **Clarity over cleverness** — always direct, never chatty.
- **Empathy through restraint** — writers want focus, not fanfare.
- **Confidence in craft** — every line should feel intentional and precise.

---

## 🧱 Layout & Usage Examples

### App Sidebar

```tsx
<div className="flex items-center space-x-2 px-4 py-3">
  <img src="/assets/icon-inkwell.svg" alt="Inkwell" className="w-6 h-6" />
  <span className="text-ink-text font-medium tracking-wide">inkwell</span>
</div>
```

### Splash / Loading

```tsx
<div className="flex flex-col items-center justify-center h-screen bg-ink-bg text-ink-text">
  <img src="/assets/inkwell-mark.svg" className="w-20 h-20 mb-4 animate-pulse" />
  <p className="text-lg tracking-wide">Where stories take shape</p>
</div>
```

---

## 📦 Assets Directory Structure

```
/public/assets/
├── icon-inkwell.svg
├── icon-inkwell@2x.svg
├── inkwell-mark.svg
└── favicon.svg
```

---

## 🧩 Integration Checklist

| Area             | Action                                          | Owner    | Status |
| ---------------- | ----------------------------------------------- | -------- | ------ |
| Logo mark        | Replace app icon and favicon                    | Design   | ☐      |
| Sidebar header   | Add wordmark + tagline hover                    | Frontend | ☐      |
| Color tokens     | Integrate Tailwind theme extension              | Frontend | ☐      |
| Motion utilities | Add .transition-ink and .pulse-ink              | Frontend | ☐      |
| Microcopy        | Review all toasts and empty states              | UX       | ☐      |
| Docs             | Add branding usage section in /docs/BRANDING.md | Docs     | ☐      |

---

## 🌍 Brand Extensions

When used in partner or publisher contexts (pre-white-label):

- Always include Inkwell mark in the top-left or footer.
- Use "Powered by Inkwell" in neutral type (no trademark required).
- Avoid recoloring the icon mark; use approved color tokens only.
- For dark-host portals, use `inkwell-mark-light.svg` variant.

---

## 🔒 Brand Governance

- All marks © Track15 / Inkwell Platform, 2025.
- Do not alter the logotype or color tokens without a design review.
- Maintain version history in `/design/inkwell-brand-assets/`.

**Maintainer:** Dave Hail  
**Repo:** https://github.com/oklahomahail/Inkwell2  
**Purpose:** Ensure consistent brand experience across product, documentation, and partner implementations.

---

This system transforms Inkwell from "utility SaaS" to a distinctive creative platform through minimal, consistent design choices that reinforce trust and creative calm.
