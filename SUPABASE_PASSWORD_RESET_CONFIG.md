# 🔐 Supabase Password Reset Configuration

Quick reference for configuring password reset in Supabase Dashboard.

---

## 📍 Navigation Path

```
Supabase Dashboard → [Your Project] → Authentication → URL Configuration
```

**Direct Link:** `https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/auth/url-configuration`

---

## 🌐 Redirect URLs to Add

### Development Environment

```
http://localhost:5173/auth/update-password
```

**Alternative dev ports (if you use them):**

```
http://localhost:3000/auth/update-password
http://localhost:5174/auth/update-password
```

### Production Environment

```
https://your-production-domain.com/auth/update-password
https://your-app.vercel.app/auth/update-password
```

⚠️ **Important:** Replace with your actual domain(s)

---

## 🏠 Site URL Configuration

### Development

```
http://localhost:5173
```

### Production

```
https://your-production-domain.com
```

---

## 📧 Email Template Configuration

**Location:** Authentication → Email Templates → Reset Password

### Default Template Variables

- `{{ .ConfirmationURL }}` - The full reset URL with token
- `{{ .Token }}` - The raw token (not recommended to use directly)
- `{{ .SiteURL }}` - Your configured site URL

### Example Template

```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
```

---

## ⏱️ Token Expiration Settings

**Location:** Authentication → Settings → General

### Default Settings

- **Access Token Expiry:** 3600 seconds (1 hour)
- **Refresh Token Expiry:** 2592000 seconds (30 days)

These settings apply to password reset tokens as well.

---

## 🔍 Verification Steps

After configuration, verify:

1. ✅ All redirect URLs added (dev + prod)
2. ✅ Site URL matches your environment
3. ✅ Email template includes `{{ .ConfirmationURL }}`
4. ✅ Save all changes

---

## 🧪 Testing Configuration

### Test 1: Local Development

1. Start your dev server: `pnpm dev`
2. Navigate to: `http://localhost:5173/auth/forgot-password`
3. Request password reset
4. Check email and click link
5. Should land on `/auth/update-password`

### Test 2: Production

1. Deploy your app
2. Navigate to: `https://your-domain.com/auth/forgot-password`
3. Request password reset
4. Check email and click link
5. Should land on `/auth/update-password`

---

## 🐛 Troubleshooting

### Error: "Invalid Redirect URL"

**Cause:** URL not whitelisted in Supabase

**Solution:**

1. Go to Authentication → URL Configuration
2. Add the exact URL from the error message
3. Save and retry

### Error: Email not sending

**Cause:** Email service not configured

**Solution:**

1. Go to Authentication → Settings → SMTP Settings
2. Configure SMTP or use Supabase's built-in service
3. Test email delivery

### Error: Token expired

**Cause:** Link older than 1 hour

**Solution:**

- Request a new password reset
- Consider increasing token expiry in Settings

---

## 📋 Quick Checklist

- [ ] Development redirect URL added
- [ ] Production redirect URL(s) added
- [ ] Site URL configured correctly
- [ ] Email template verified
- [ ] Changes saved in Supabase Dashboard
- [ ] Local testing completed
- [ ] Production testing completed

---

## 🔗 Related Documentation

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Password Reset Guide](https://supabase.com/docs/guides/auth/passwords#reset-password)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

## 💡 Pro Tips

1. **Use wildcard for Vercel previews:**
   - Pattern: `https://*-your-app.vercel.app/auth/update-password`
   - Note: Supabase may require exact URLs, not wildcards

2. **Add all environments:**
   - localhost:5173 (Vite default)
   - localhost:3000 (if using alternative port)
   - staging.your-domain.com
   - your-production-domain.com

3. **Test before deploying:**
   - Always test password reset in local environment first
   - Verify email delivery works
   - Check all redirect flows

4. **Monitor logs:**
   - Check Supabase logs for auth events
   - Monitor for failed password reset attempts
   - Track email delivery status

---

**Last Updated:** October 27, 2025
