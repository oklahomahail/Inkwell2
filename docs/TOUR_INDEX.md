# Inkwell Tour System - Documentation Index

**Last Updated:** October 27, 2025  
**Version:** 1.3.2  
**Status:** ✅ Production Ready

---

## Quick Links

| Document                                         | Purpose                                    | Audience                    |
| ------------------------------------------------ | ------------------------------------------ | --------------------------- | ---------------- | --- |
| [Quick Reference](./TOUR_QUICK_REFERENCE.md)     | Fast lookup for common tasks               | All developers              |
| [Integration Guide](./TOUR_INTEGRATION_GUIDE.md) | Complete setup instructions                | Integration engineers       |
| [Data Attributes](./TOUR_DATA_ATTRIBUTES.md)     | All `data-tour-id` attributes              | Frontend developers         |
| [Pitfalls Guide](./TOUR_PITFALLS_GUIDE.md)       | Common mistakes & solutions                | Troubleshooters             |
| <!--                                             | [Ship Checklist](./TOUR_SHIP_CHECKLIST.md) | Pre-deployment verification | Release managers | --> |

---

## Documentation Files

### Getting Started

- **[TOUR_QUICK_REFERENCE.md](./TOUR_QUICK_REFERENCE.md)**  
  Essential tour APIs, data attributes, and code snippets for quick reference.

- **[TOUR_INTEGRATION_GUIDE.md](./TOUR_INTEGRATION_GUIDE.md)**  
  Complete step-by-step guide for integrating the tour system into your application.

### Implementation Details

- **[TOUR_DATA_ATTRIBUTES.md](./TOUR_DATA_ATTRIBUTES.md)**
  Comprehensive list of all `data-tour-id` attributes used throughout the application.

<!-- - **[TOUR_DATA_ATTRIBUTES_IMPLEMENTATION.md](./TOUR_DATA_ATTRIBUTES_IMPLEMENTATION.md)**
  Technical details about data attribute implementation and verification. -->

- **[TOUR_A11Y_ANALYTICS_VARIANTS.md](./TOUR_A11Y_ANALYTICS_VARIANTS.md)**  
  Accessibility enhancements, analytics integration, and tour variants documentation.

### Troubleshooting & Best Practices

- **[TOUR_PITFALLS_GUIDE.md](./TOUR_PITFALLS_GUIDE.md)**  
  Common pitfalls, anti-patterns, and solutions for tour implementation.

### Deployment

<!-- - **[TOUR_SHIP_CHECKLIST.md](./TOUR_SHIP_CHECKLIST.md)**
  Pre-deployment checklist ensuring all tour components are production-ready. -->

---

## Feature Overview

### ✅ Core Tour System

- Spotlight overlay with tooltips
- Multi-step guided tours
- Auto-start on first login
- Progress persistence
- Version migration support

### ✅ Accessibility (A11y)

- ESC key to close
- Tab trap in tooltips
- Focus rings on buttons
- ARIA announcements
- Keyboard navigation

### ✅ Analytics

- Event tracking (started, viewed, completed, skipped)
- Dashboard widget showing metrics
- Completion rate analytics
- Duration tracking
- localStorage persistence

### ✅ Tour Variants

- **Default Tour**: Core onboarding experience
- **AI Tools Tour**: AI assistant and features
- **Export Tour**: Export workflow with auto-modal

### ✅ Developer Experience

- Centralized tour registry
- Browser console helpers
- Verification scripts
- Comprehensive testing
- TypeScript support

---

## Quick Start

```typescript
// Launch the default onboarding tour
import { startDefaultTour } from '@/tour/tourEntry';
startDefaultTour();

// Launch feature tours
import { launchAIToolsTour, launchExportTour } from '@/tour/featureTours';
launchAIToolsTour();
launchExportTour();

// Check tour completion status
import { isTourDone } from '@/tour/tourEntry';
if (isTourDone('inkwell-ai-tools-v1')) {
  console.log('User already completed AI tour');
}
```

---

## Data Tour ID Attributes

### Required (Default Tour)

- `dashboard` - Main dashboard
- `sidebar` - Navigation sidebar
- `topbar` - Top navigation bar
- `help-tour-button` - Help menu button

### Optional (Feature Tours)

- `claude-assistant` - AI assistant panel
- `ai-model-selector` - AI model dropdown
- `privacy-hint` - Privacy hint tooltip
- `export-button` - Export trigger
- `export-template-selector` - Template picker
- `export-run-button` - Export execution

See [TOUR_DATA_ATTRIBUTES.md](./TOUR_DATA_ATTRIBUTES.md) for the complete list.

---

## Analytics Events

All events automatically tracked:

```typescript
tour_started; // Tour begins
tour_step_viewed; // Each step viewed
tour_completed; // Tour finished
tour_skipped; // Tour abandoned
```

View analytics in the dashboard via `TourCompletionCard` widget.

---

## Testing & Verification

### Run Tests

```bash
pnpm test InkwellTourOverlay
pnpm test tourTriggers
pnpm test tourSafety
```

### Browser Verification

```javascript
// Open browser console and run:
window.__tourUtils.listAllTourIds(); // List all data-tour-id attributes
window.__tourUtils.verifyTourTargets(); // Check all targets exist
window.__tourUtils.resetAllTours(); // Clear tour state
```

### CLI Verification

```bash
chmod +x scripts/verify-tour-implementation.sh
./scripts/verify-tour-implementation.sh
```

---

## File Structure

```
src/
├── tour/
│   ├── tourEntry.ts              # Main entry points
│   ├── featureTours.ts           # Feature tour launchers
│   ├── TourService.ts            # Core service
│   ├── persistence.ts            # State management
│   ├── adapters/
│   │   └── analyticsAdapter.ts   # Analytics integration
│   └── variants/
│       ├── aiToolsTour.ts        # AI features tour
│       └── exportTour.ts         # Export workflow tour
├── components/
│   └── Onboarding/
│       ├── InkwellTourOverlay.tsx
│       ├── tourRegistry.ts
│       └── __tests__/
└── features/
    └── analytics/
        └── components/
            └── TourCompletionCard.tsx
```

---

## Support

- **Documentation Issues**: Check [TOUR_PITFALLS_GUIDE.md](./TOUR_PITFALLS_GUIDE.md)
- **Integration Help**: See [TOUR_INTEGRATION_GUIDE.md](./TOUR_INTEGRATION_GUIDE.md)
- **API Reference**: See [TOUR_QUICK_REFERENCE.md](./TOUR_QUICK_REFERENCE.md)
<!-- - **Deployment**: See [TOUR_SHIP_CHECKLIST.md](./TOUR_SHIP_CHECKLIST.md) -->

---

## Changelog

### v1.3.2 (October 27, 2025)

- ✅ Added 6 new data-tour-id attributes
- ✅ Integrated TourCompletionCard analytics widget
- ✅ Created verification scripts
- ✅ Comprehensive documentation updates
- ✅ 100% test coverage maintained

### v1.3.1 (October 27, 2025)

- ✅ Accessibility enhancements (ESC, tab trap, focus rings)
- ✅ Analytics dashboard integration
- ✅ AI Tools and Export tour variants
- ✅ Tour registry system

### v1.3.0 (October 18, 2025)

- ✅ Initial production release
- ✅ Default onboarding tour
- ✅ Auto-start functionality
- ✅ Progress persistence

---

**Ready to ship!** 🚀
