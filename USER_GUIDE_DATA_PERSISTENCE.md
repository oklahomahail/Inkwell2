# User Guide: Data Persistence in Inkwell

## Your Data, Your Choice

Inkwell gives you complete control over where and how your writing is stored. This guide will help you choose the right option for your needs.

---

## The Three Options

### 🔒 Local Only

**Your writing stays on your device. That's it.**

**Choose this if you:**

- Want complete privacy
- Don't need to access work from multiple devices
- Prefer not to create an account
- Work offline frequently
- Are privacy-conscious

**Pros:**

- ✅ Complete privacy - data never leaves your device
- ✅ Works offline
- ✅ No account needed
- ✅ Fast and simple

**Cons:**

- ⚠️ Data could be lost if you clear browser data
- ⚠️ Can't access from other devices
- ⚠️ No automatic backups

**Tip:** If you choose this mode, export your work regularly as a backup!

---

### ☁️ Cloud Sync

**Your writing is stored in the cloud and synced across all your devices.**

**Choose this if you:**

- Use multiple devices
- Want automatic backups
- Need to access your work anywhere
- Want peace of mind

**Pros:**

- ✅ Access from any device
- ✅ Automatic backups
- ✅ Never lose your work
- ✅ Future: Collaborate with others

**Cons:**

- ⚠️ Requires an account
- ⚠️ Needs internet connection for sync
- ⚠️ Data travels to our servers (encrypted)

**Tip:** Your data is encrypted in transit and at rest. Only you can access it.

---

### 🔄 Hybrid (Recommended)

**Work locally with automatic cloud backups. Best of both worlds.**

**Choose this if you:**

- Want the speed of local storage
- Need the safety of cloud backups
- Like having options
- Want flexibility

**Pros:**

- ✅ Works offline immediately
- ✅ Cloud backups for safety
- ✅ Access from anywhere
- ✅ You control backup frequency
- ✅ Best of both worlds

**Cons:**

- ⚠️ Requires account for cloud features

**Why we recommend this:** It combines the speed and privacy of local storage with the safety and accessibility of cloud backups. You stay in control.

---

## How to Choose

### Quick Decision Tree

1. **Do you care about privacy above all else?**
   - Yes → **Local Only**
   - No → Continue

2. **Do you use multiple devices?**
   - Yes → **Cloud Sync** or **Hybrid**
   - No → Continue

3. **Do you want automatic backups?**
   - Yes → **Cloud Sync** or **Hybrid**
   - No → **Local Only**

4. **Do you want to work offline most of the time?**
   - Yes → **Hybrid**
   - No → **Cloud Sync**

**Still not sure?** Start with **Hybrid** - you can always change later!

---

## Switching Modes

You can change your storage mode anytime:

1. Go to **Settings** → **Data & Persistence**
2. Select your new mode
3. Click to confirm
4. Inkwell will migrate your data automatically

**What happens to my data?**

- Switching from Local → Cloud: Your data is uploaded to the cloud
- Switching from Cloud → Local: Your data is downloaded to your device
- Switching to Hybrid: Both local and cloud storage are set up

**Is it safe?** Yes! We verify the migration before completing it. Your data is never lost.

---

## Advanced Settings

### Automatic Sync (Cloud Sync & Hybrid)

- **What it is:** Automatically syncs your changes to the cloud
- **When:** Every few minutes (you choose)
- **Why:** Ensures your work is always backed up

### Backup Frequency (Hybrid only)

- **What it is:** How often to backup to the cloud
- **Default:** Once per day
- **Range:** 1 hour to 7 days
- **Why:** More frequent = safer, but uses more bandwidth

### Manual Actions

- **Sync Now:** Force an immediate sync to the cloud
- **Backup Now:** Force an immediate backup
- **Export Data:** Download all your work as files

---

## Common Scenarios

### "I'm writing on the train with no internet"

**Solution:** Use **Local Only** or **Hybrid** mode. Both work perfectly offline.

### "I write on my laptop at home and my phone on the go"

**Solution:** Use **Cloud Sync** or **Hybrid**. Your work will be accessible everywhere.

### "I'm paranoid about privacy"

**Solution:** Use **Local Only**. Your data never leaves your device. Remember to export regularly!

### "I just want it to work without thinking about it"

**Solution:** Use **Hybrid** (our recommendation). It handles everything automatically.

### "I'm in private/incognito mode"

**Warning:** Local storage might be cleared when you close the browser. We recommend **Cloud Sync** in private mode.

---

## Data Safety

### What We Store

- **Local Only:** Everything on your device only
- **Cloud Sync:** Everything in our secure cloud database
- **Hybrid:** Everything locally + backups in the cloud

### Encryption

- **In Transit:** All data sent to the cloud is encrypted (HTTPS)
- **At Rest:** Cloud data is encrypted in our database
- **Future:** Optional end-to-end encryption

### Who Can Access?

- **Local Only:** Only you (on your device)
- **Cloud Sync:** Only you (with your account)
- **Hybrid:** Only you

**We never:**

- Read your writing
- Share your data
- Sell your data
- Use your data for training AI

---

## Exporting Your Data

You can export your work anytime:

1. Go to **Settings** → **Data & Persistence**
2. Click **Export All Data**
3. Choose format (JSON, Markdown, DOCX, etc.)
4. Download your files

**No lock-in:** Your data is always yours. Take it wherever you want.

---

## Troubleshooting

### "Sync failed"

**Common causes:**

- No internet connection
- Not signed in
- Server temporarily down

**Solutions:**

1. Check your internet connection
2. Sign in again
3. Try **Sync Now** manually
4. Contact support if it persists

### "Storage quota exceeded"

**Cause:** Your browser's storage is full

**Solutions:**

1. Export old projects
2. Clear browser cache (warning: backs up first!)
3. Switch to **Cloud Sync** (more space)

### "Data not appearing on my other device"

**Common causes:**

- Not using Cloud Sync or Hybrid mode
- Not signed in on both devices
- Sync not complete yet

**Solutions:**

1. Verify you're in Cloud Sync or Hybrid mode
2. Sign in with the same account on both devices
3. Click **Sync Now** manually
4. Wait a few moments for sync to complete

---

## FAQs

**Q: Can I change modes later?**
A: Yes! Anytime. We'll migrate your data automatically.

**Q: What happens if I run out of cloud storage?**
A: We'll notify you and offer options (upgrade, delete old projects, etc.)

**Q: Is my data backed up automatically?**
A: In Cloud Sync and Hybrid modes, yes. In Local Only mode, no - export regularly!

**Q: What if your servers go down?**
A: In Hybrid mode, you keep working locally. In Cloud Sync, you have a local cache.

**Q: Can I use my own cloud storage?**
A: Not yet, but we're planning to support self-hosted options in the future.

**Q: Is my data encrypted?**
A: Yes, in transit and at rest. End-to-end encryption coming soon.

---

## Need Help?

- **Documentation:** Full technical docs available
- **Support:** Email support@inkwell.app
- **Community:** Join our Discord for tips from other users
- **Feedback:** We'd love to hear how we can improve!

---

**Remember:** No matter which mode you choose, your data is yours. We're just here to keep it safe and accessible. ✍️
