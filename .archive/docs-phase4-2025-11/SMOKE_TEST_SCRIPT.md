# Inkwell Production Smoke Test Script

**Duration: 10-15 minutes**  
**Environment: Incognito window on https://inkwell.leadwithnexus.com**

---

## ✅ **1. Router & Redirects (2 minutes)**

### Root Redirect Test

- [ ] Open https://inkwell.leadwithnexus.com
- [ ] **Expected**: Automatic redirect to `/profiles`
- [ ] **Verify**: URL shows `/profiles`, profile picker interface loads

### Deep Link & Refresh Test

- [ ] Create a profile and navigate to dashboard
- [ ] Copy the profile URL (e.g., `/p/{profileId}/dashboard`)
- [ ] **Hard refresh** the page (Cmd+Shift+R / Ctrl+Shift+R)
- [ ] **Expected**: Page loads correctly, profile remains active
- [ ] Navigate to `/p/{profileId}/writing` and hard refresh
- [ ] **Expected**: Writing interface loads with same profile

### Catch-All Redirect Test

- [ ] Try invalid URL: `/p/invalid-profile-id/dashboard`
- [ ] **Expected**: Redirect to `/profiles` with error handling
- [ ] Try random URL: `/random-page`
- [ ] **Expected**: Redirect to `/profiles`

---

## ✅ **2. Profiles & Data Isolation (5 minutes)**

### Profile A Creation & Data

- [ ] Click "Create New Profile"
- [ ] Enter name: "Profile A Test"
- [ ] Select a color (e.g., blue)
- [ ] **Expected**: Redirect to `/p/{profileId}/dashboard`
- [ ] Create a new project: "Test Project A"
- [ ] Add some content/notes to the project
- [ ] **Verify**: Project appears in dashboard

### Profile B Creation & Isolation

- [ ] Click ProfileSwitcher in header → "Create new profile"
- [ ] Enter name: "Profile B Test"
- [ ] Select different color (e.g., red)
- [ ] **Expected**: Redirect to new profile dashboard
- [ ] **Critical**: Verify "Test Project A" is NOT visible
- [ ] Create different project: "Test Project B"
- [ ] **Expected**: Only "Test Project B" visible

### Profile Switching & Persistence

- [ ] Use ProfileSwitcher → Switch to "Profile A Test"
- [ ] **Expected**: "Test Project A" visible, "Test Project B" NOT visible
- [ ] Switch to "Profile B Test"
- [ ] **Expected**: "Test Project B" visible, "Test Project A" NOT visible
- [ ] **Hard refresh** the page
- [ ] **Expected**: Same profile remains active, data persists
- [ ] Close browser, reopen incognito, navigate to site
- [ ] **Expected**: Redirects to `/profiles` (no active profile in new session)

---

## ✅ **3. Legacy Migration Test (2 minutes)**

### Simulation on Device with Legacy Data

- [ ] **If testing on device with existing Inkwell data:**
  - Clear all profile data: `localStorage.removeItem('inkwell_profiles')`
  - Keep legacy data: Don't clear `inkwell_enhanced_projects` etc.
  - Refresh page
  - Create first profile
  - **Expected**: Migration prompt or automatic migration
  - **Verify**: Legacy projects appear in new profile

### Alternative: Fresh Device Test

- [ ] **If no legacy data available:**
  - Test on completely fresh browser/device
  - Create profile
  - **Expected**: Clean profile creation, no migration prompts

---

## ✅ **4. IndexedDB Verification (2 minutes)**

### Database Structure Check

- [ ] Open DevTools → Application → Storage → IndexedDB
- [ ] **Expected structures:**
  - Main database: `InkwellStorage`
  - Profile data stored with prefixed keys: `profile_{profileId}_*`
- [ ] Switch between profiles using ProfileSwitcher
- [ ] **Expected**: Different profile data keys visible
- [ ] **Critical**: No cross-profile data contamination

### Storage Key Verification

- [ ] Application → Storage → Local Storage → site domain
- [ ] **Expected keys:**
  - `inkwell_profiles` (array of profiles)
  - `inkwell_active_profile` (current profile ID)
  - `profile_{profileId}_inkwell_enhanced_projects`
  - `profile_{profileId}_*` (various profile-specific keys)

---

## ✅ **5. SEO & Meta Verification (3 minutes)**

### Robots.txt Check

- [ ] Navigate to https://inkwell.leadwithnexus.com/robots.txt
- [ ] **Expected**: File loads with proper directives
- [ ] **Verify**: Blocks `/p/` routes, allows `/profiles`
- [ ] **Verify**: Contains sitemap reference

### Sitemap.xml Check

- [ ] Navigate to https://inkwell.leadwithnexus.com/sitemap.xml
- [ ] **Expected**: Valid XML with site structure
- [ ] **Verify**: Contains profiles route and public pages

### Open Graph Preview Test

- [ ] Copy homepage URL: https://inkwell.leadwithnexus.com
- [ ] Share in Slack/Discord/social platform
- [ ] **Expected**: Rich preview with:
  - Title: "Inkwell - Professional Writing Platform"
  - Description about writing platform
  - Clean, professional appearance

### Meta Tags Verification

- [ ] View page source (Cmd+U / Ctrl+U)
- [ ] **Verify presence of:**
  - `<title>Inkwell - Professional Writing Platform</title>`
  - Open Graph meta tags (`og:title`, `og:description`, `og:image`)
  - Twitter Card meta tags
  - Canonical URL

---

## ✅ **6. Performance & Error Verification (1 minute)**

### Console Clean Check

- [ ] Open DevTools → Console
- [ ] Navigate through profile creation, switching, project creation
- [ ] **Expected**: No unhandled errors (warnings OK)
- [ ] **Critical**: No profile data leakage errors

### Network Performance

- [ ] DevTools → Network → Hard refresh
- [ ] **Expected**: Reasonable load times (< 3 seconds)
- [ ] **Verify**: Assets load properly, no 404s

---

## ✅ **Critical Success Criteria**

All items below MUST pass for production readiness:

- [ ] **Router**: `/` redirects to `/profiles`, deep links work
- [ ] **Data Isolation**: Profiles completely isolated, no data leakage
- [ ] **Persistence**: Profile selection survives page reloads
- [ ] **Profile Switching**: Seamless switching via header dropdown
- [ ] **SEO**: robots.txt, sitemap.xml, and OG previews work
- [ ] **No Console Errors**: Clean error-free operation
- [ ] **IndexedDB**: Profile-specific data storage confirmed

---

## 🚨 **Failure Scenarios & Actions**

| Issue                                | Immediate Action                       |
| ------------------------------------ | -------------------------------------- |
| Profile data leaks between profiles  | **STOP** - Critical security issue     |
| Routing broken or infinite redirects | **STOP** - Core navigation failure     |
| Profile switching loses data         | **STOP** - Data integrity issue        |
| Console shows unhandled errors       | **INVESTIGATE** - May require hotfix   |
| SEO meta tags missing                | **LOW PRIORITY** - Can fix post-launch |

---

## 📋 **Test Completion Checklist**

**Tester**: **\*\***\_\_\_\_**\*\***  
**Date**: **\*\***\_\_\_\_**\*\***  
**Browser**: **\*\***\_\_\_\_**\*\***  
**Result**: ✅ PASS / ❌ FAIL

**Notes**:

---

---

---

**Ready for Beta Release**: ✅ YES / ❌ NO
