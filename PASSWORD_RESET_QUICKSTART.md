# 🚀 Password Reset - Quick Start Guide

**Time to Complete:** ~10 minutes

---

## ✅ What's Already Done

Your password reset flow is **100% implemented** in code. All you need to do is configure Supabase.

---

## 🎯 Step-by-Step Setup

### Step 1: Open Supabase Dashboard (1 min)

1. Go to: https://supabase.com/dashboard
2. Select your Inkwell project
3. Navigate to: **Authentication** → **URL Configuration**

### Step 2: Add Redirect URLs (2 min)

Copy and paste these URLs into the **Redirect URLs** section:

**For Development:**

```
http://localhost:5173/auth/update-password
```

**For Production (when you deploy):**

```
https://[YOUR-DOMAIN]/auth/update-password
```

Replace `[YOUR-DOMAIN]` with your actual domain.

Click **Save** ✅

### Step 3: Test Locally (5 min)

1. **Start your dev server:**

   ```bash
   pnpm dev
   ```

2. **Open your browser:**

   ```
   http://localhost:5173/sign-in
   ```

3. **Click "Forgot your password?"** (below password field)

4. **Enter your email** and click "Send reset link"

5. **Check your email** for the reset link

6. **Click the link** - should open `/auth/update-password`

7. **Enter new password** (twice) and click "Update password"

8. **Verify success** - should redirect to dashboard

✅ **Done!**

---

## 🐛 Troubleshooting

### ❌ Reset link redirects to `/sign-in`

**Fix:** The URL isn't whitelisted in Supabase.

- Go back to Step 2 and add the redirect URL
- Make sure you clicked Save
- Try again with a new reset link

### ❌ Email not received

**Check:**

- Spam folder
- Email address is correct
- Supabase email service is configured

### ❌ "Invalid token" error

**Fix:** Request a new reset link (tokens expire after 1 hour)

---

## 📚 Documentation

For more details, see:

- **`PASSWORD_RESET_COMPLETE.md`** - Full implementation summary
- **`SUPABASE_PASSWORD_RESET_CONFIG.md`** - Detailed Supabase configuration
- **`PASSWORD_RESET_TESTING_CHECKLIST.md`** - Comprehensive testing guide

---

## 🎉 That's It!

Your password reset flow is ready to use. The implementation includes:

✅ Beautiful, branded UI
✅ Secure token validation
✅ Password confirmation
✅ Success/error handling
✅ Mobile responsive
✅ Auto-redirect after success

**Just configure Supabase and you're done!**

---

**Need help?** Check the troubleshooting guides in the documentation files.
