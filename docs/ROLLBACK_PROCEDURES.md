# Rollback & Recovery Procedures

**Emergency response procedures for Inkwell production incidents**

---

## 🚨 **Emergency Rollback (Critical Issues)**

### Immediate Rollback via Vercel

```bash
# 1. List recent deployments
vercel deployments list --limit 10

# 2. Identify stable deployment (before incident)
# Look for deployment from before the issue started

# 3. Promote previous deployment
vercel promote [DEPLOYMENT_URL] --scope=your-team

# 4. Verify rollback successful
curl -I https://inkwell.leadwithnexus.com/health
```

**Rollback Timeline**: 2-3 minutes for global propagation

### Rollback Decision Matrix

| Issue Severity | Rollback Threshold                              | Action                       |
| -------------- | ----------------------------------------------- | ---------------------------- |
| **Critical**   | Profile data loss, app won't load               | Immediate rollback           |
| **High**       | Profile switching broken, data isolation issues | Rollback within 15 minutes   |
| **Medium**     | UI issues, non-critical features broken         | Evaluate, may hotfix instead |
| **Low**        | Minor bugs, cosmetic issues                     | No rollback, schedule fix    |

---

## 🔄 **Profile System Recovery**

### Data Integrity Issues

If profile data isolation is compromised:

```javascript
// Emergency profile data cleanup (dev console)
// WARNING: Run this only under guidance

// 1. Check for cross-profile contamination
const checkDataIsolation = () => {
  const profiles = JSON.parse(localStorage.getItem('inkwell_profiles') || '[]');
  console.log('Profiles found:', profiles.length);

  profiles.forEach((profile) => {
    const profileKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith(`profile_${profile.id}_`),
    );
    console.log(`Profile ${profile.name}:`, profileKeys.length, 'keys');
  });
};

// 2. Clean corrupted profile data (DESTRUCTIVE)
const cleanCorruptedProfile = (profileId) => {
  const keysToRemove = Object.keys(localStorage).filter((key) =>
    key.startsWith(`profile_${profileId}_`),
  );

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  console.log(`Removed ${keysToRemove.length} keys for profile ${profileId}`);
};
```

### Migration Recovery

If legacy migration fails or causes issues:

```javascript
// Recovery from failed migration
const recoverFromMigration = () => {
  // 1. Check if backup exists
  const legacyBackup = localStorage.getItem('migration_backup_' + Date.now());

  if (legacyBackup) {
    console.log('Legacy backup found, can restore');
    // Manual restoration process
  }

  // 2. Restore from known good state
  const knownGoodProjects = JSON.parse(
    localStorage.getItem('inkwell_enhanced_projects_backup') || '[]',
  );
  if (knownGoodProjects.length > 0) {
    localStorage.setItem('inkwell_enhanced_projects', JSON.stringify(knownGoodProjects));
    console.log('Restored', knownGoodProjects.length, 'projects from backup');
  }
};
```

---

## 💾 **Data Recovery Strategies**

### Local Storage Recovery

```javascript
// Export all user data for backup
const exportAllUserData = () => {
  const data = {};

  // Export profiles
  data.profiles = JSON.parse(localStorage.getItem('inkwell_profiles') || '[]');
  data.activeProfile = localStorage.getItem('inkwell_active_profile');

  // Export all profile-specific data
  data.profiles.forEach((profile) => {
    const profileData = {};
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`profile_${profile.id}_`)) {
        profileData[key] = localStorage.getItem(key);
      }
    });
    data.profileData = profileData;
  });

  // Download as JSON file
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inkwell-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  return data;
};

// Import user data from backup
const importUserData = (backupData) => {
  // Restore profiles
  localStorage.setItem('inkwell_profiles', JSON.stringify(backupData.profiles));

  // Restore profile data
  if (backupData.profileData) {
    Object.entries(backupData.profileData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }

  console.log('Data restored from backup');
  window.location.reload();
};
```

### IndexedDB Recovery

```javascript
// Export IndexedDB data (if used by profile system)
const exportIndexedDBData = async () => {
  const databases = await indexedDB.databases();
  const exports = {};

  for (const dbInfo of databases) {
    if (dbInfo.name?.includes('inkwell') || dbInfo.name?.includes('profile')) {
      // Custom export logic for each database
      console.log('Found database:', dbInfo.name);
      // Implementation depends on database structure
    }
  }

  return exports;
};
```

---

## 🏥 **Health Check & Monitoring**

### Automated Health Verification

```bash
#!/bin/bash
# health-check.sh - Automated health verification script

HEALTH_URL="https://inkwell.leadwithnexus.com/health"
MAX_RETRIES=3
RETRY_DELAY=10

check_health() {
  echo "Checking health endpoint..."

  for i in $(seq 1 $MAX_RETRIES); do
    if curl -f --max-time 30 "$HEALTH_URL" > /dev/null 2>&1; then
      echo "✅ Health check passed (attempt $i)"
      return 0
    else
      echo "❌ Health check failed (attempt $i)"
      if [ $i -lt $MAX_RETRIES ]; then
        echo "Retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
      fi
    fi
  done

  echo "🚨 Health check failed after $MAX_RETRIES attempts"
  return 1
}

check_profiles() {
  echo "Testing profile system..."

  # Use headless browser to test profile creation
  # This would require additional tooling (Playwright, Puppeteer)
  echo "Manual profile system test required"
}

# Run checks
check_health
check_profiles

echo "Health verification complete"
```

### Post-Rollback Verification

```javascript
// Verification checklist after rollback
const verifyRollback = async () => {
  const checks = {
    routing: false,
    profiles: false,
    dataIsolation: false,
    localStorage: false,
    indexedDB: false,
  };

  // Test routing
  try {
    window.history.pushState({}, '', '/profiles');
    checks.routing = window.location.pathname === '/profiles';
  } catch (e) {
    console.error('Routing test failed:', e);
  }

  // Test profile system
  try {
    const profiles = JSON.parse(localStorage.getItem('inkwell_profiles') || '[]');
    checks.profiles = Array.isArray(profiles);
  } catch (e) {
    console.error('Profile system test failed:', e);
  }

  // Test localStorage
  try {
    localStorage.setItem('test_key', 'test_value');
    checks.localStorage = localStorage.getItem('test_key') === 'test_value';
    localStorage.removeItem('test_key');
  } catch (e) {
    console.error('LocalStorage test failed:', e);
  }

  // Test IndexedDB
  try {
    const request = indexedDB.open('test_db', 1);
    request.onsuccess = () => {
      checks.indexedDB = true;
      request.result.close();
      indexedDB.deleteDatabase('test_db');
    };
  } catch (e) {
    console.error('IndexedDB test failed:', e);
  }

  console.log('Rollback verification:', checks);
  return checks;
};
```

---

## 📋 **Recovery Runbook**

### Incident Response Checklist

#### Phase 1: Assessment (0-5 minutes)

- [ ] Confirm issue severity using monitoring dashboard
- [ ] Check recent deployments in Vercel dashboard
- [ ] Verify issue affects multiple users (not single-user problem)
- [ ] Check Sentry for error spike patterns
- [ ] Determine if rollback is necessary

#### Phase 2: Rollback Decision (5-10 minutes)

- [ ] **Critical Issues**: Execute immediate rollback
- [ ] **High Issues**: Attempt quick hotfix OR rollback
- [ ] **Medium Issues**: Schedule fix, monitor closely
- [ ] Communicate status to team/users if necessary

#### Phase 3: Rollback Execution (10-15 minutes)

- [ ] Identify last known good deployment
- [ ] Execute Vercel deployment promotion
- [ ] Verify rollback success via health check
- [ ] Test profile system functionality
- [ ] Update incident status/communication

#### Phase 4: Post-Rollback (15-60 minutes)

- [ ] Analyze root cause of original issue
- [ ] Prepare hotfix or proper fix
- [ ] Document incident and lessons learned
- [ ] Plan redeployment strategy
- [ ] Consider additional safeguards

### Communication Templates

#### Incident Alert

```
🚨 INCIDENT: Inkwell Production Issue
Severity: [Critical/High/Medium/Low]
Impact: [Description of user impact]
Status: [Investigating/Rollback in progress/Resolved]
ETA: [Expected resolution time]

Actions taken:
- [Action 1]
- [Action 2]

Next update: [Time]
```

#### Resolution Notice

```
✅ RESOLVED: Inkwell Production Issue
Duration: [X minutes]
Root Cause: [Brief technical explanation]
Resolution: [Rollback/Hotfix/etc.]

User Impact: [Description]
Data Safety: All user data secure ✓

Post-mortem: [Link to detailed analysis]
```

---

## 🛡️ **Prevention Measures**

### Pre-Deployment Checklist

- [ ] Run full test suite (200+ tests)
- [ ] Verify TypeScript compilation
- [ ] Test profile system manually
- [ ] Check bundle size hasn't increased significantly
- [ ] Verify Sentry error tracking works
- [ ] Test in incognito window

### Deployment Safety

- [ ] Deploy during low-traffic hours when possible
- [ ] Monitor error rates for first 30 minutes post-deploy
- [ ] Keep previous deployment ready as "rollback" alias
- [ ] Have team member available for 1 hour post-deploy

### Data Safety

- [ ] Profile system creates automatic local backups
- [ ] Migration process preserves original data
- [ ] Export functionality available for user data recovery
- [ ] No destructive operations without user confirmation

---

## 🔧 **Tools & Commands**

### Vercel CLI Commands

```bash
# Essential rollback commands
vercel deployments list
vercel promote [deployment-url]
vercel domains list
vercel logs [deployment-url]

# Deployment status
vercel inspect [deployment-url]
```

### Browser Console Commands

```javascript
// Quick diagnostic commands
localStorage.length;
Object.keys(localStorage).filter((k) => k.includes('profile')).length;
JSON.parse(localStorage.getItem('inkwell_profiles') || '[]').length;

// Export user data
copy(
  JSON.stringify({
    profiles: localStorage.getItem('inkwell_profiles'),
    active: localStorage.getItem('inkwell_active_profile'),
  }),
);
```

### Health Check Commands

```bash
# Test availability
curl -I https://inkwell.leadwithnexus.com/health

# Test with timeout
timeout 30s curl -f https://inkwell.leadwithnexus.com/health

# Test from multiple locations (if needed)
curl -H "CF-IPCountry: US" https://inkwell.leadwithnexus.com/health
curl -H "CF-IPCountry: EU" https://inkwell.leadwithnexus.com/health
```

---

**🚨 Emergency Contact**: For critical production issues, document who should be contacted and how.
