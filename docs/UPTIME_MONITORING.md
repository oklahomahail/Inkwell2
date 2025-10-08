# Uptime Monitoring & Health Checks

**Ensuring Inkwell production reliability and quick incident response**

---

## 🏥 Health Check Endpoint

### Current Implementation

- **URL**: https://inkwell.leadwithnexus.com/health
- **Purpose**: Validates core app functionality without requiring profiles
- **Response**: Basic HTML page confirming app is running
- **Status Codes**: 200 (OK), 500 (Error)

### Health Check Content

The `/health` route loads a minimal version of the app that:

- ✅ Confirms React bundle loads successfully
- ✅ Validates basic routing works
- ✅ Checks localStorage/IndexedDB availability
- ✅ Displays app version and build info

---

## 📊 Recommended Monitoring Setup

### UptimeRobot Configuration

```
Monitor Name: Inkwell Production
URL: https://inkwell.leadwithnexus.com/health
Check Type: HTTPS
Check Interval: 5 minutes
Request Timeout: 30 seconds
```

**Alert Conditions**:

- Down for 2 consecutive checks (10 minutes)
- Response time > 10 seconds consistently
- Status code != 200

### Healthchecks.io Configuration

```bash
# Ping endpoint (if using cron-based checks)
curl -fsS --retry 3 "https://hc-ping.com/YOUR-UUID" > /dev/null || curl -fsS --retry 3 "https://hc-ping.com/YOUR-UUID/fail"

# HTTP check
curl -f "https://inkwell.leadwithnexus.com/health" || exit 1
```

---

## 🚨 Incident Response Procedures

### Level 1: Site Down (Critical)

1. **Immediate Actions** (0-2 minutes):
   - Check Vercel deployment status
   - Verify DNS resolution for domain
   - Check Sentry for error spikes

2. **Investigation** (2-10 minutes):
   - Review recent deployments
   - Check browser console errors
   - Verify profile system routing

3. **Resolution**:
   - Rollback to previous Vercel deployment if needed
   - Fix critical bugs and redeploy
   - Update incident status

### Level 2: Performance Degradation

1. **Metrics to Check**:
   - Response times > 5 seconds
   - Bundle size increases
   - Profile switching delays

2. **Common Causes**:
   - Large IndexedDB operations
   - Memory leaks in profile switching
   - Unoptimized database queries

### Level 3: Feature-Specific Issues

1. **Profile System Issues**:
   - Profile creation failures
   - Data isolation problems
   - Migration errors

2. **Core App Issues**:
   - Editor not loading
   - Projects not saving
   - Export functionality broken

---

## 📈 Advanced Monitoring (Optional)

### Sentry Performance Monitoring

```typescript
// Already integrated in main.tsx
Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Tracks profile operations
  beforeSend(event) {
    // Filter profile-related expected errors
  },
});
```

### Custom Health Check Metrics

Future enhancement to `/health` endpoint:

```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  checks: {
    storage: boolean; // localStorage/IndexedDB available
    routing: boolean; // React Router working
    profiles: boolean; // Profile system operational
    assets: boolean; // Static assets loading
  };
  metrics: {
    responseTime: number;
    memoryUsage: number;
    profileCount: number;
  };
}
```

### Real User Monitoring (RUM)

```typescript
// Track profile system performance
Sentry.addBreadcrumb({
  category: 'profile',
  message: 'Profile switching started',
  data: { fromProfile: 'abc', toProfile: 'def' },
});

// Track critical user journeys
Sentry.startTransaction({
  name: 'profile-creation',
  op: 'navigation',
});
```

---

## 🔧 Monitoring Tools Comparison

| Tool                | Cost               | Features                       | Best For        |
| ------------------- | ------------------ | ------------------------------ | --------------- |
| **UptimeRobot**     | Free (50 monitors) | HTTP/HTTPS, keyword monitoring | Basic uptime    |
| **Healthchecks.io** | Free (20 checks)   | Cron job monitoring, webhooks  | Scheduled tasks |
| **Pingdom**         | $10+/month         | Advanced RUM, multi-location   | Enterprise      |
| **StatusCake**      | Free (10 tests)    | Global monitoring, alerts      | Small teams     |

### Recommended Stack for Inkwell

```
Primary: UptimeRobot (free tier)
- Monitor: /health endpoint
- Frequency: 5 minutes
- Alerts: Email + Slack

Secondary: Sentry (error tracking)
- Performance monitoring
- Error aggregation
- Release tracking

Optional: Healthchecks.io
- Backup monitoring
- Integration testing alerts
```

---

## 📋 Monitoring Checklist

### Setup (One-time)

- [ ] Configure UptimeRobot monitor for `/health`
- [ ] Set up Sentry project with VITE_SENTRY_DSN
- [ ] Test alert notifications (email/Slack)
- [ ] Document escalation contacts

### Weekly Review

- [ ] Check uptime percentage (target: 99.9%)
- [ ] Review Sentry error reports
- [ ] Validate alert response times
- [ ] Test rollback procedures

### Incident Response

- [ ] Uptime monitoring alerts configured
- [ ] Escalation procedures documented
- [ ] Rollback commands ready
- [ ] Communication channels established

---

## 🚀 Quick Commands

### Manual Health Check

```bash
# Basic availability
curl -I https://inkwell.leadwithnexus.com/health

# Full response check
curl -f https://inkwell.leadwithnexus.com/health

# Response time check
curl -w "@curl-format.txt" -s -o /dev/null https://inkwell.leadwithnexus.com/health
```

### Vercel Deployment Check

```bash
# List recent deployments
vercel deployments ls

# Promote previous deployment (rollback)
vercel promote [deployment-url] --scope=your-team
```

### Sentry Integration Test

```bash
# Test error reporting (dev environment)
throw new Error("Test error for Sentry integration");

# Check Sentry dashboard
open https://sentry.io/organizations/your-org/issues/
```
