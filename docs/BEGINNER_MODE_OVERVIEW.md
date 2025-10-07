# Beginner Mode & First Draft Path Overview

The Beginner Mode and First Draft Path system introduce a guided, performance-optimized onboarding experience for new Inkwell users.  
This release transforms isolated features into a cohesive framework that accelerates activation, reduces friction, and maintains full flexibility for advanced authors.

---

## 🎯 Purpose

**Goal:** Help first-time authors reach their first 300 written words within minutes, not hours.

Beginner Mode simplifies the interface, hides complex tools until users need them, and walks writers through a structured "First Draft Path" designed to demonstrate immediate value.

**Primary success metric:**

> 60%+ of new projects reach 300 words within 15 minutes (20% improvement over baseline activation)

---

## 🧩 System Components

| Component                    | Purpose                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| **Beginner Preset**          | Feature flag bundle that hides advanced UI until onboarding completion               |
| **First Draft Path**         | Guided five-step onboarding flow leading to the user's first export                  |
| **Educational Empty States** | Replace blank screens with contextual instructions and a single primary action       |
| **Power Tools Menu**         | Collapsible hub exposing advanced features once Beginner Mode is complete            |
| **Just-in-Time AI Setup**    | Inline AI activation triggered by user intent instead of a settings visit            |
| **Analytics Funnel**         | Tracks A1–A4 progress (project → chapter → scene → 300 words → export) automatically |
| **Feature Flag Service**     | Controls phased rollout and per-tenant configuration for partners                    |

---

## ⚙️ Architecture Overview

The system operates as a lightweight layer over the existing app:

```
┌─────────────────────────────────────┐
│             Inkwell Core            │
│ ├── Projects / Chapters / Scenes    │
│ ├── Editor & AI Engine              │
│ ├── Analytics Hooks                 │
│ └── Feature Flag Service            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│           Beginner Layer            │
│ ├── Preset Manager                  │
│ ├── Onboarding State Machine        │
│ ├── FirstDraftPath UI               │
│ ├── EmptyState Components           │
│ ├── PowerMenu                       │
│ └── Inline AI Activation            │
└─────────────────────────────────────┘
```

---

## 🚀 Integration Summary

1. **Enable feature flag**

   ```bash
   ENABLE_BEGINNER_MODE=true
   BEGINNER_MODE_PERCENT=0.10
   ```

2. **Initialize preset**

   ```typescript
   import { BeginnerPreset } from '@/services/featureFlagService.presets';
   applyFeaturePreset(BeginnerPreset);
   ```

3. **Wrap router**

   ```typescript
   const Router = embedded ? MemoryRouter : BrowserRouter;
   ```

4. **Import onboarding flow**

   ```typescript
   <FirstDraftPath projectId={id} />
   ```

5. **Verify analytics tracking**
   - `A1_PROJECT_CREATED`
   - `A2_SCENE_CREATED`
   - `A3_300_WORDS_SAVED`
   - `A4_EXPORTED`

---

## 📊 Measurement Framework

| KPI                      | Target       | Description                            |
| ------------------------ | ------------ | -------------------------------------- |
| **Activation Rate (A3)** | ≥ 60%        | Users reaching 300 words in 15 minutes |
| **Time to Value**        | < 10 min avg | From project creation to A3 event      |
| **Conversion Delta**     | +20%         | Improvement over baseline activation   |
| **Error Rate**           | < 2%         | Onboarding flow interruptions          |

All metrics are automatically captured through the existing analytics service and performance hooks.

---

## 🧪 Rollout Strategy

| Phase           | Rollout             | Objective                                        |
| --------------- | ------------------- | ------------------------------------------------ |
| **Pilot**       | 10% of new projects | Validate stability and telemetry accuracy        |
| **Ramp-Up**     | 50%                 | Collect A/B data and qualitative feedback        |
| **Full Launch** | 100%                | Promote Beginner Mode as default                 |
| **Post-Launch** | Continuous          | Iterate via feature flags and analytics insights |

**Disable instantly with:**

```bash
ENABLE_BEGINNER_MODE=false
```

---

## 🧭 Validation & Continuous Improvement

### **Launch Success Criteria**

- 60%+ activation (A3) within 15 minutes
- 20% faster time-to-value vs. baseline
- <2% error rate during onboarding
- Positive qualitative feedback from ≥80% of pilot users

### **Post-Launch Optimization**

- A/B test template variations and copy
- Iterate AI setup flow based on completion rates
- Optimize word count targets per user segment
- Monitor long-term retention impact

---

## 📚 Related Documentation

- **[docs/BEGINNER_MODE_INTEGRATION.md](./BEGINNER_MODE_INTEGRATION.md)** — Complete technical integration guide
- **[docs/featureFlagService.md](./featureFlagService.md)** — Feature flag reference
- **[docs/analytics_events.md](./analytics_events.md)** — Event schema and funnel tracking

---

**Status:** Ready for deployment  
**Owner:** Core Platform / UX Team  
**Last updated:** October 2025
