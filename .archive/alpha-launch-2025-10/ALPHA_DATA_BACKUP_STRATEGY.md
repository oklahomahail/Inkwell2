# Alpha Data Backup Strategy

**Status:** 🚨 **CRITICAL RECOMMENDATION**
**Audience:** Alpha testers and development team
**Last Updated:** November 2025

---

## ⚠️ Current Situation: No Centralized Backups

**As of November 2025:**

- ❌ No server-side backups of user data
- ❌ No automatic backup system for alpha testers
- ✅ Users can manually export data as JSON
- ✅ Local-first architecture (data stays on device)

**This means:**

- If an alpha tester's browser crashes, we **cannot** restore their data
- If a bug corrupts IndexedDB, we **cannot** recover their writing
- If a tester clears browser storage, their work is **permanently lost**

---

## 🎯 Recommendation: Implement Emergency Backup System

### Option 1: User-Managed Backups (Minimal Effort)

**What to Do:**

1. Add prominent "Backup Reminder" banner in alpha Quick Start guide
2. Add "Export All Data" button to Dashboard (highly visible)
3. Send weekly email reminders: "Don't forget to back up your work!"

**Alpha Tester Instructions:**

```markdown
### 🚨 CRITICAL: Back Up Your Work Regularly

**Inkwell is alpha software. Data loss is possible.**

**How to Back Up (Takes 30 seconds):**

1. Click **Settings → Privacy → Export All Data**
2. Save the `.json` file to your computer
3. Do this **at least once per week**

**If you lose data:**

- We **cannot** restore it from our servers (local-first design)
- You can restore from your exported `.json` file
```

**Pros:**

- No development work required
- Respects local-first privacy model
- Testers control their own data

**Cons:**

- Relies on user discipline (many will forget)
- No automated recovery if user didn't export
- Testers may lose work and blame us

---

### Option 2: Optional Cloud Backup (Recommended)

**What to Build:**

1. Add "Alpha Backup Service" feature flag
2. Automatic daily export to Supabase (encrypted)
3. User can enable/disable in Settings
4. Retention: Keep last 7 daily backups per user

**Implementation (1-2 days of work):**

```typescript
// services/alphaBackupService.ts

export async function enableAlphaBackups(userId: string) {
  // Store opt-in preference
  localStorage.setItem('inkwell_alpha_backup_enabled', 'true');

  // Schedule daily backup (24h interval)
  setInterval(
    async () => {
      const data = await exportAllUserData();
      const encrypted = await encryptBackup(data, userId);
      await supabase.from('alpha_backups').insert({
        user_id: userId,
        backup_data: encrypted,
        created_at: new Date().toISOString(),
      });

      // Clean up old backups (keep last 7)
      await cleanupOldBackups(userId, 7);
    },
    24 * 60 * 60 * 1000,
  ); // 24 hours
}
```

**Database Schema:**

```sql
-- Supabase migration
CREATE TABLE alpha_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  backup_data JSONB NOT NULL, -- Encrypted user data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  INDEX idx_alpha_backups_user_id (user_id),
  INDEX idx_alpha_backups_created_at (created_at)
);

-- Row-level security
ALTER TABLE alpha_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY alpha_backups_user_access ON alpha_backups
  FOR ALL USING (auth.uid() = user_id);

-- Auto-delete old backups (keep last 7 per user)
CREATE FUNCTION cleanup_old_alpha_backups() RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM alpha_backups
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM alpha_backups
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      LIMIT 7
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_alpha_backups
  AFTER INSERT ON alpha_backups
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_alpha_backups();
```

**Settings UI:**

```tsx
// Settings → Privacy → Alpha Backup

<div className="border p-4 rounded">
  <h3>Alpha Backup Service (Optional)</h3>
  <p className="text-sm text-gray-600 mb-2">
    Automatically backup your data to cloud daily. Keeps last 7 days. You can restore if local data
    is lost.
  </p>

  <label>
    <input
      type="checkbox"
      checked={backupEnabled}
      onChange={(e) => setBackupEnabled(e.target.checked)}
    />
    Enable automatic daily backups
  </label>

  {backupEnabled && (
    <div className="mt-2">
      <p className="text-xs text-green-600">✅ Last backup: {lastBackupTime || 'Never'}</p>
      <button onClick={restoreFromBackup}>Restore from Backup</button>
    </div>
  )}
</div>
```

**Pros:**

- Automatic - users don't have to remember
- We can help recover lost data
- Still optional (respects privacy)
- Encrypted at rest

**Cons:**

- 1-2 days of development work
- Requires Supabase storage quota
- Slight privacy tradeoff (data leaves device)

---

### Option 3: Browser Extension Backup (Future)

**Concept:**

- Build a browser extension that auto-exports IndexedDB every hour
- Stores backups in browser's sync storage (Chrome/Firefox)
- No server required - truly local-first

**Pros:**

- No server costs
- Fully private
- Works offline

**Cons:**

- 1-2 weeks of development
- Not ready for alpha launch
- Requires users to install extension

---

## 🚨 Decision Required

**You need to choose one before alpha launch:**

### Scenario A: No Backup System (Current State)

**Accept the risk that:**

- Testers will lose work
- You cannot help them recover
- They may abandon alpha in frustration
- Negative word-of-mouth ("I lost 3 chapters!")

**Mitigations:**

- Prominent warnings in Quick Start guide
- Weekly email reminders to export data
- Clear "Export All Data" button in UI

**Best For:**

- If alpha is only 1-2 weeks
- If testers are technical and understand risks
- If maintaining privacy is absolute priority

---

### Scenario B: Optional Cloud Backup (Recommended)

**Implement Option 2 above:**

- 1-2 days of work before alpha
- Automatic daily backups (opt-in)
- You can help testers recover data

**Mitigations:**

- Still offer manual export for privacy-conscious users
- Make backup opt-in (default: OFF)
- Encrypt backups at rest

**Best For:**

- Protecting testers from data loss
- Building trust during alpha
- Reducing support burden

---

## 📋 Implementation Checklist (If Choosing Option 2)

**Before Alpha Launch:**

- [ ] Create `alpha_backups` table in Supabase
- [ ] Implement `alphaBackupService.ts`
- [ ] Add Settings UI toggle
- [ ] Test backup/restore flow
- [ ] Document in Alpha Quick Start guide
- [ ] Add privacy disclosure to Tester Agreement

**Week 1 of Alpha:**

- [ ] Monitor backup success rate
- [ ] Test restore with 1-2 testers
- [ ] Fix any issues

**Week 2 of Alpha:**

- [ ] Verify all testers who opted in have ≥1 backup
- [ ] Test restore scenarios (corruption, browser crash)

**After Alpha:**

- [ ] Migrate backup system to beta (if successful)
- [ ] Or sunset alpha backups and delete data

---

## 🔒 Privacy Considerations

### If Implementing Cloud Backups:

**Transparency:**

- Clearly explain what's backed up (all projects, settings)
- Explain encryption (AES-256 at rest)
- Explain retention (7 days, then auto-deleted)

**User Control:**

- Opt-in (default: OFF)
- Can disable anytime
- Can delete all backups instantly

**Data Minimization:**

- Only backup what's necessary for recovery
- Exclude telemetry, session IDs, logs

**Update Privacy Policy:**

```markdown
### Alpha Backup Service (Optional)

If you enable automatic backups:

- Your projects and settings are encrypted and stored on Supabase
- Backups occur daily, keeping the last 7 days
- Backups are deleted after 7 days or when you disable the feature
- You can restore from backup if local data is lost
- You can delete all backups instantly from Settings
```

---

## 💡 Recommendation Summary

**For Alpha Launch (2 weeks):**

**Minimum Viable Approach:**

1. ✅ Add prominent backup warnings to Quick Start guide
2. ✅ Add "Export All Data" button to Dashboard (highly visible)
3. ✅ Send weekly email reminder: "Back up your work!"
4. ✅ Include backup instructions in Tester Agreement

**Strongly Recommended (If Time Allows):** 5. ⭐ Implement Option 2 (Optional Cloud Backup) 6. ⭐ Make it opt-in, encrypted, 7-day retention 7. ⭐ Test restore flow before launch

**Best Case:**

- Testers have automatic safety net
- You can help recover lost data
- Builds trust and confidence

**Worst Case (If No Backup System):**

- Accept that data loss will happen
- Document it clearly in all tester communications
- Respond quickly with empathy when testers lose work

---

## ❓ Questions to Answer

1. **How critical is it that alpha testers don't lose data?**
   - High: Implement Option 2
   - Medium: Implement Option 1 with strong warnings
   - Low: Accept risk, focus on MVP

2. **How much development time before alpha launch?**
   - <1 day: Use Option 1 (manual export only)
   - 1-2 days: Implement Option 2 (cloud backup)
   - 1+ week: Consider Option 3 (browser extension)

3. **What's the privacy priority?**
   - Absolute: Option 1 (manual export, fully local)
   - High but flexible: Option 2 (opt-in cloud backup)
   - Medium: Option 2 (default ON, can disable)

---

## 📞 Need Help Deciding?

**Contact me with:**

- How long until alpha launch?
- How many alpha testers? (5? 10? 50?)
- How technical are they?
- What's your privacy philosophy?

I'll recommend the best approach for your situation.

---

**Version:** 1.0
**Last Updated:** November 2025
**Status:** Awaiting decision before alpha launch
