# Inkwell Branding Guide

Version: 2.0 - **Blue & Gold Brand Update**  
Status: Active  
Last Updated: October 2025

> **🎨 Brand Update:** Inkwell has transitioned from the previous color palette to a sophisticated blue and gold system. The new navy blue (#13294B) serves as the primary brand color with warm gold (#D4AF37) accents, creating a more professional and accessible visual identity.

---

## 🎯 Brand Purpose

**Inkwell** represents _clarity, creativity, and composure_.  
The brand should feel **modern, focused, and intelligent**, never busy or performative. Every visual and word choice should reinforce trust and a sense of creative calm.

### Brand Taglines

Inkwell uses a dual-tagline system that speaks to both creative inspiration and professional capability:

- **Primary Tagline (User-facing):**  
  "Find your story. Write it well."
  - Used in core product UI: onboarding, create profile, app dashboard
  - Emphasizes the creative journey and quality
  - Centers the writer rather than the tool

- **Secondary Tagline (Marketing):**  
  "Because great stories deserve great tools."
  - Used in marketing materials, footers, feature pages
  - Emphasizes capability and craftsmanship
  - Positions Inkwell as a professional instrument

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

### Core Brand Palette (2024 Update)

| Token                | Hex       | Usage                                     |
| -------------------- | --------- | ----------------------------------------- |
| `--inkwell-navy`     | `#13294B` | **Primary brand navy** - buttons, headers |
| `--inkwell-gold`     | `#D4AF37` | **Warm gold accent** - highlights, CTAs   |
| `--inkwell-charcoal` | `#2C3242` | **Rich charcoal** - body text, neutrals   |

### Extended Navy Scale

| Token                | Hex       | Usage                               |
| -------------------- | --------- | ----------------------------------- |
| `--inkwell-navy-50`  | `#f1f5f9` | Very light backgrounds              |
| `--inkwell-navy-100` | `#e2e8f0` | Card backgrounds, subtle sections   |
| `--inkwell-navy-200` | `#cbd5e1` | Borders, inactive states            |
| `--inkwell-navy-500` | `#334155` | Secondary text on light backgrounds |
| `--inkwell-navy-600` | `#13294B` | Primary brand color                 |
| `--inkwell-navy-700` | `#0e1e38` | Hover states, darker accents        |
| `--inkwell-navy-800` | `#0a1525` | Dark theme backgrounds              |
| `--inkwell-navy-900` | `#050b12` | Darkest navy, high contrast text    |

### Extended Gold Scale

| Token                | Hex       | Usage                       |
| -------------------- | --------- | --------------------------- |
| `--inkwell-gold-50`  | `#fef9e7` | Light gold backgrounds      |
| `--inkwell-gold-100` | `#fcf0c3` | Subtle gold accents         |
| `--inkwell-gold-500` | `#D4AF37` | Primary gold                |
| `--inkwell-gold-700` | `#8c6b12` | Deep gold for text on light |

### Legacy Colors (Maintained)

| Token           | Hex       | Usage                         |
| --------------- | --------- | ----------------------------- |
| `--ink-primary` | `#5B8CFF` | Legacy blue (compatibility)   |
| `--ink-accent`  | `#FFD580` | Legacy accent (compatibility) |
| `--ink-bg`      | `#0B0E13` | Dark background surfaces      |
| `--ink-surface` | `#1A1E2B` | Card surfaces, panels         |
| `--ink-text`    | `#E6E8EE` | Primary text color            |
| `--ink-muted`   | `#9EA4B8` | Secondary text                |
| `--ink-border`  | `#2C3242` | Dividers, outlines            |
| `--ink-success` | `#52E19F` | Success states                |
| `--ink-error`   | `#FF5C7A` | Errors, alerts                |

**Implementation (Tailwind theme extension):**

```js
theme: {
  extend: {
    colors: {
      // New Inkwell Brand Colors (2024)
      inkwell: {
        navy: '#13294B',    // Primary brand navy
        gold: '#D4AF37',    // Warm gold accent
        charcoal: '#2C3242', // Rich charcoal neutral
        white: '#FAFAFA',   // Soft white
        // Extended navy scale
        'navy-50': '#f1f5f9',
        'navy-100': '#e2e8f0',
        'navy-200': '#cbd5e1',
        'navy-500': '#334155',
        'navy-600': '#13294B', // Primary
        'navy-700': '#0e1e38',
        'navy-800': '#0a1525',
        'navy-900': '#050b12',
        // Extended gold scale
        'gold-50': '#fef9e7',
        'gold-100': '#fcf0c3',
        'gold-500': '#D4AF37', // Primary
        'gold-600': '#b38d22',
        'gold-700': '#8c6b12',
      },
      // Legacy colors (maintained for compatibility)
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

- **Primary Actions**: Use `bg-inkwell-navy` for primary buttons and CTAs
- **Accent Highlights**: Use `text-inkwell-gold` for highlights and decorative elements
- **Text Hierarchy**: Use `text-inkwell-charcoal` for body text, `text-inkwell-navy` for headings
- **Backgrounds**: Use navy-50/100 variants for subtle sections, avoid saturated backgrounds
- **Accessibility**: All combinations maintain WCAG AA compliance (≥ 4.5:1 contrast)
- **Dark Theme**: Use lighter navy variants (navy-100/200) for proper contrast

---

## ✍️ Typography

### Inkwell Type System (2024 Update)

| Role               | Font                 | Weight  | Usage                         |
| ------------------ | -------------------- | ------- | ----------------------------- |
| Display / Headings | **Source Serif Pro** | 600-700 | Brand headlines, hero text    |
| Body / UI          | **Inter**            | 400–500 | UI text, form labels, buttons |
| Monospace / Code   | **JetBrains Mono**   | 400     | Technical docs, code snippets |

### Brand Font Implementation

```css
/* Import from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');

/* Tailwind font family config */
fontFamily: {
  serif: ['Source Serif Pro', 'ui-serif', 'Georgia', 'serif'],
  sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  display: ['Source Serif Pro', 'ui-serif', 'Georgia', 'serif'],
  mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
}
```

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
  <Logo variant="svg-feather-navy" size={24} />
  <span className="text-inkwell-navy dark:text-white font-medium tracking-wide font-serif">
    Inkwell
  </span>
</div>
```

### Splash / Loading

```tsx
<div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-ink-bg text-inkwell-navy dark:text-ink-text">
  <div className="mb-6 p-6 rounded-full bg-gradient-to-br from-inkwell-navy-50 to-inkwell-gold-50 dark:from-inkwell-navy-800 dark:to-inkwell-gold-700/20">
    <Logo variant="mark-light" size={64} className="animate-pulse" />
  </div>
  <h1 className="text-2xl font-serif font-semibold mb-2">Welcome to Inkwell</h1>
  <p className="text-lg text-inkwell-charcoal dark:text-ink-muted">Where stories take shape</p>
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
