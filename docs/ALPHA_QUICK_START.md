# Inkwell Alpha Quick Start Guide

**Welcome to the Inkwell Alpha!**

Thank you for helping us test Inkwell before public launch. This guide will get you started in under 10 minutes.

---

## What to Expect

**Duration:** 2 weeks
**Time Commitment:** ~30 minutes to 1 hour (use Inkwell as you normally would write)
**Your Role:** Use Inkwell for your real writing, report what works and what doesn't
**Compensation:** Personal favor - your feedback shapes the final product

---

## Getting Started (5 Minutes)

### Step 1: Access Inkwell

**URL:** [inkwell-writing.vercel.app](https://inkwell-writing.vercel.app)

**Create Account:**

1. Click "Sign Up" or "Get Started"
2. Choose **Email + Password** or **Magic Link**
3. Verify your email (check spam if needed)

### Step 2: Complete Onboarding

When you first log in, you'll see the **Welcome Project** - a sample story with 3 chapters that demonstrates Inkwell's features.

**You can:**

- ✅ Explore the Welcome Project (recommended - takes 5 minutes)
- ✅ Skip it and create your own project immediately

**Tour Tips:**

- The product tour will highlight key features
- You can dismiss it anytime and replay from Settings → Help
- Not required, but helpful for first-time users

### Step 3: Create Your First Project

1. Click **"New Project"** in the Dashboard
2. Give it a name and description
3. Choose a genre (optional - you can change later)
4. Click **"Create"**

---

## Core Features to Test

### ✍️ Writing

**Where:** Click any project → Click "Writing" tab

**What to Try:**

- Type at least 300-500 words
- Notice the **autosave indicator** (top-right)
- Try **Focus Mode** (hides sidebar for distraction-free writing)

**What We're Testing:**

- Does autosave work reliably?
- Is typing smooth with no lag?
- Does the editor feel intuitive?

---

### 📚 Chapters

**Where:** Click "Chapters" tab

**What to Try:**

- Add 2-3 chapters
- Rename chapters
- Reorder chapters (drag and drop)
- Delete a chapter

**What We're Testing:**

- Is chapter management intuitive?
- Does drag-and-drop feel smooth?

---

### 📤 Export

**Where:** Click "Export" button (top-right)

**What to Try:**

- Export as **PDF**
- Export as **DOCX** (Word)
- Export as **EPUB** (ebook format)
- Open the exported files and verify they look correct

**What We're Testing:**

- Do exports download successfully?
- Do files open in your preferred apps (Word, Pages, Calibre, Apple Books)?
- Is formatting clean and professional?

---

### 🤖 AI Story Architect (Optional)

**Where:** Click "Story Architect" tab

**What to Try:**

- Ask for story ideas or plot suggestions
- Request character development help
- Try narrative structure advice

**What We're Testing:**

- Are AI responses helpful and relevant?
- Does the feature feel valuable or gimmicky?

**Note:** AI features require an active internet connection.

---

### 🕐 Timeline (Optional)

**Where:** Click "Timeline" tab

**What to Try:**

- Add a few story events with dates/times
- See events visualized chronologically

**What We're Testing:**

- Is timeline creation intuitive?
- Is the visualization helpful for tracking story chronology?

---

## What to Report

### 🐛 Bugs & Issues

**Report immediately if you experience:**

- ❌ **Data loss** (your writing disappeared)
- ❌ **Can't save** (autosave fails repeatedly)
- ❌ **App crashes or freezes**
- ❌ **Export fails or produces corrupt files**
- ❌ **Login issues**

**How to Report:**

- Email: [your-email@example.com]
- Forum: [your-forum-link]
- In-App: Click "Report Issue" button (if available)

**Include:**

- What you were doing when the issue occurred
- Browser & device (e.g., "Chrome on Mac", "Safari on iPhone")
- Screenshot or screen recording (if possible)

---

### 💡 Feedback & Suggestions

**We want to hear:**

- ✅ What felt confusing or frustrating?
- ✅ What delighted you?
- ✅ What features are missing that you expected?
- ✅ What slowed you down?

**When to Share:**

- Anytime via email or forum
- We'll send a mid-alpha survey (Week 1)
- We'll send a final survey (Week 2)

---

### 📊 Optional: Enable Telemetry

**What It Does:**

- Tracks anonymous usage data (session duration, feature usage, error rates)
- Helps us identify performance bottlenecks
- **Does NOT collect your writing content, project names, or personal info**

**How to Enable:**

1. Go to **Settings → Privacy**
2. Toggle **"Enable Telemetry"** ON
3. Read the Privacy Policy for full details

**Opt-Out Anytime:**

- Same toggle in Settings → Privacy

**Why This Helps:**

- We can see aggregate performance metrics
- Identifies which features are used most
- Spots errors before they become critical

---

## Privacy & Data Safety

### What Data We Collect

**With Telemetry Enabled:**

- Session ID (anonymous, resets on browser close)
- Feature usage (e.g., "exported PDF", "created chapter")
- Performance metrics (e.g., "load time: 1.2s")

**What We NEVER Collect:**

- ❌ Your writing content
- ❌ Project names or descriptions
- ❌ Character names or story details
- ❌ Personal information

### Where Your Data Lives

**Local-First:**

- All writing is stored **on your device** in IndexedDB
- Works offline (no internet required)
- Your content never leaves your device unless you export it

**Cloud (Authentication Only):**

- Email and password (encrypted) via Supabase
- Used only for login - no content sync

**AI Features:**

- When you use Story Architect, your query is sent to Claude API
- Claude does not retain your data after processing

### Data Export & Deletion

**Export Your Data:**

- Settings → Privacy → "Export All Data" (downloads JSON)

**Delete Your Account:**

- Settings → Account → "Delete Account"
- Permanently removes all cloud data
- Local data remains until you clear browser storage

**Full Privacy Policy:**

- [Link to docs/privacy.md]

---

## Known Limitations (Alpha Stage)

**These are expected and being worked on:**

1. **EPUB Exports:** Basic formatting only (no cover image, custom CSS)
2. **Mobile:** Works but not fully optimized (better on desktop/tablet)
3. **Offline Mode:** Some features require internet (AI, exports)
4. **Cloud Sync:** Not yet available (coming in beta)
5. **Collaboration:** Single-user only (no sharing/co-authoring)

---

## Support & Communication

### How to Reach Us

**Email:** [your-email@example.com]
**Forum:** [your-forum-link]
**Response Time:** Within 24 hours (usually much faster)

### Weekly Check-Ins

**Week 1 (Mid-Alpha):**

- We'll send a short survey (5 questions, 2 minutes)
- Optional: Schedule a 15-minute video call

**Week 2 (Final):**

- Final survey (10 questions, 5 minutes)
- Share your overall impression

---

## FAQs

### Q: What if I find a critical bug?

**A:** Email immediately with details. We'll prioritize fixing it.

---

### Q: Can I use Inkwell for my real writing?

**A:** Yes! That's the best way to test it. But **keep backups** of important work (export regularly).

---

### Q: What if my writing disappears?

**A:** Inkwell has 3-tier recovery (IndexedDB → localStorage → memory). If you lose data, contact us immediately - we may be able to help recover it.

---

### Q: Can I share Inkwell with friends?

**A:** Not yet - this is a private alpha. Public beta will launch soon.

---

### Q: Will my alpha account carry over to the public version?

**A:** Yes! Your account and projects will remain intact.

---

### Q: What happens after the alpha ends?

**A:** You'll be invited to the closed beta (v1.0.0-rc.1) with early access to new features.

---

## Thank You!

Your feedback is invaluable. Every bug report, suggestion, and moment of frustration you share helps us build a better writing platform for everyone.

**Happy Writing!**
— The Inkwell Team

---

**Version:** Alpha v0.9.1
**Last Updated:** November 2025
**Questions?** Email [your-email@example.com]
