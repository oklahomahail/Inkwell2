# Supabase Configuration for Domain Migration

## Quick Configuration Checklist

### 1. Access Supabase Dashboard

Navigate to: **https://app.supabase.com/project/YOUR_PROJECT_ID/auth/url-configuration**

Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.

---

### 2. Update Site URL

**Location:** URL Configuration → Site URL

**Set to:**

```
https://writewithinkwell.com
```

> **Note:** This is the default URL Supabase will use for redirects.

---

### 3. Add Redirect URLs

**Location:** URL Configuration → Redirect URLs

**Click "Add URL" and add each of these:**

#### New Domain (Primary)

```
https://writewithinkwell.com/*
https://writewithinkwell.com/auth/callback
https://writewithinkwell.com/auth/update-password
```

#### Legacy Domain (Keep for 30-60 days during migration)

```
https://inkwell.leadwithnexus.com/*
https://inkwell.leadwithnexus.com/auth/callback
https://inkwell.leadwithnexus.com/auth/update-password
```

#### Development (Already configured, verify present)

```
http://localhost:5173/*
http://localhost:5173/auth/callback
http://localhost:5173/auth/update-password
```

---

### 4. Configure Additional Allowed Origins (CORS)

**Location:** Authentication → Settings → Additional Allowed Origins

**Add:**

```
https://writewithinkwell.com
https://www.writewithinkwell.com
```

**Keep existing:**

```
https://inkwell.leadwithnexus.com
http://localhost:5173
```

---

### 5. Verify Configuration

After saving, verify:

- [ ] Site URL shows: `https://writewithinkwell.com`
- [ ] Redirect URLs include both new and legacy domains
- [ ] Additional origins include new domain
- [ ] No errors or warnings shown

---

### 6. Test Authentication Flow

After deploying the code changes:

1. **Test New Domain:**
   - Visit https://writewithinkwell.com/sign-in
   - Sign in with test account
   - Verify redirect works
   - Check browser console for errors

2. **Test Legacy Domain:**
   - Visit https://inkwell.leadwithnexus.com/sign-in
   - Should redirect to new domain
   - Auth should work after redirect

3. **Test Password Reset:**
   - Click "Forgot Password" on sign-in page
   - Request reset email
   - Click link in email
   - Should redirect to correct domain

---

## Copy-Paste Configuration Values

For quick copy-paste into Supabase dashboard:

### Site URL

```
https://writewithinkwell.com
```

### Redirect URLs (copy all at once, then add line by line)

```
https://writewithinkwell.com/*
https://writewithinkwell.com/auth/callback
https://writewithinkwell.com/auth/update-password
https://inkwell.leadwithnexus.com/*
https://inkwell.leadwithnexus.com/auth/callback
https://inkwell.leadwithnexus.com/auth/update-password
```

### Additional Allowed Origins

```
https://writewithinkwell.com
https://www.writewithinkwell.com
```

---

## Troubleshooting

### "Invalid redirect URL" error

- Verify the URL is added to Redirect URLs list
- Check for typos in the URL
- Ensure wildcard `/*` is included for base domain

### Auth callback fails

- Check browser console for specific error
- Verify Site URL matches primary domain
- Ensure both domains are in Redirect URLs during transition

### "CORS error" in console

- Add domain to Additional Allowed Origins
- Include both root and www subdomain
- Wait a few minutes for changes to propagate

---

## Removal Timeline

### After 30 Days

If traffic has fully migrated to new domain:

- Can remove legacy domain redirect URLs
- Keep monitoring for edge cases

### After 60 Days

Safe to remove all legacy references:

- Remove `https://inkwell.leadwithnexus.com/*` from Redirect URLs
- Remove from Additional Allowed Origins
- Update this guide to remove legacy references

---

**Configuration Time:** ~5 minutes
**DNS Propagation:** 5-60 minutes
**Full Migration Period:** 30-60 days

For issues, check: https://supabase.com/docs/guides/auth
