#!/bin/bash

# Domain Migration Verification Script
# Automatically tests the migration is working correctly

set -e

echo "🔍 Inkwell Domain Migration Verification"
echo "========================================"
echo ""

LEGACY_DOMAIN="inkwell.leadwithnexus.com"
NEW_DOMAIN="writewithinkwell.com"
ERRORS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

info() {
    echo "ℹ $1"
}

# Test 1: DNS Resolution
echo "1️⃣  Testing DNS Resolution"
echo "-------------------------"

if dig +short "$NEW_DOMAIN" | grep -q "76.76.21.21"; then
    pass "New domain DNS configured correctly"
else
    fail "New domain DNS not resolving to Vercel"
    info "Expected: 76.76.21.21"
    info "Got: $(dig +short $NEW_DOMAIN)"
fi

if dig +short "www.$NEW_DOMAIN" | grep -q "cname.vercel-dns.com"; then
    pass "WWW subdomain configured correctly"
else
    warn "WWW subdomain not configured (optional)"
fi

echo ""

# Test 2: HTTPS Certificates
echo "2️⃣  Testing HTTPS Certificates"
echo "----------------------------"

if curl -sI "https://$NEW_DOMAIN" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    pass "New domain HTTPS working"
else
    fail "New domain HTTPS not working"
    info "Visit: https://$NEW_DOMAIN"
fi

echo ""

# Test 3: Redirects
echo "3️⃣  Testing Redirects"
echo "-------------------"

# Test root redirect
REDIRECT_URL=$(curl -sI "https://$LEGACY_DOMAIN/" | grep -i "^location:" | awk '{print $2}' | tr -d '\r')
if [[ "$REDIRECT_URL" == *"$NEW_DOMAIN"* ]]; then
    pass "Root redirect works: $LEGACY_DOMAIN → $NEW_DOMAIN"
else
    fail "Root redirect not working"
    info "Expected redirect to: https://$NEW_DOMAIN/"
    info "Got: $REDIRECT_URL"
fi

# Test path preservation
REDIRECT_URL=$(curl -sI "https://$LEGACY_DOMAIN/dashboard" | grep -i "^location:" | awk '{print $2}' | tr -d '\r')
if [[ "$REDIRECT_URL" == *"$NEW_DOMAIN/dashboard"* ]]; then
    pass "Path preservation works: /dashboard preserved in redirect"
else
    warn "Path preservation may not be working"
    info "Expected: https://$NEW_DOMAIN/dashboard"
    info "Got: $REDIRECT_URL"
fi

echo ""

# Test 4: Meta Tags
echo "4️⃣  Testing SEO Meta Tags"
echo "------------------------"

PAGE_CONTENT=$(curl -s "https://$NEW_DOMAIN/")

if echo "$PAGE_CONTENT" | grep -q "canonical.*https://$NEW_DOMAIN"; then
    pass "Canonical URL points to new domain"
else
    fail "Canonical URL not updated"
fi

if echo "$PAGE_CONTENT" | grep -q "og:url.*https://$NEW_DOMAIN"; then
    pass "Open Graph URL points to new domain"
else
    fail "Open Graph URL not updated"
fi

if echo "$PAGE_CONTENT" | grep -q "og:image.*https://$NEW_DOMAIN"; then
    pass "Open Graph image uses new domain"
else
    warn "Open Graph image may use old domain"
fi

echo ""

# Test 5: Robots.txt and Sitemap
echo "5️⃣  Testing SEO Files"
echo "-------------------"

ROBOTS=$(curl -s "https://$NEW_DOMAIN/robots.txt")
if echo "$ROBOTS" | grep -q "$NEW_DOMAIN"; then
    pass "robots.txt references new domain"
else
    fail "robots.txt may reference old domain"
fi

SITEMAP=$(curl -s "https://$NEW_DOMAIN/sitemap.xml")
if echo "$SITEMAP" | grep -q "$NEW_DOMAIN"; then
    pass "sitemap.xml uses new domain"
else
    fail "sitemap.xml may use old domain"
fi

echo ""

# Test 6: Service Worker
echo "6️⃣  Testing Service Worker"
echo "------------------------"

if curl -s "https://$NEW_DOMAIN/" | grep -q "v2025-11-15-migration"; then
    pass "Service worker cache version bumped for migration"
else
    warn "Service worker cache version may not be updated"
fi

echo ""

# Test 7: Authentication Endpoints
echo "7️⃣  Testing Auth Endpoints"
echo "------------------------"

if curl -sI "https://$NEW_DOMAIN/auth/callback" | grep -q "HTTP/2 200\|HTTP/1.1 200\|HTTP/2 307\|HTTP/1.1 307"; then
    pass "Auth callback endpoint accessible"
else
    fail "Auth callback endpoint may not be accessible"
fi

if curl -sI "https://$NEW_DOMAIN/sign-in" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    pass "Sign-in page accessible"
else
    fail "Sign-in page may not be accessible"
fi

echo ""

# Test 8: Static Assets
echo "8️⃣  Testing Static Assets"
echo "-----------------------"

if curl -sI "https://$NEW_DOMAIN/brand/inkwell-og-1200x630.png" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    pass "Brand assets accessible"
else
    warn "Brand assets may not be accessible"
fi

if curl -sI "https://$NEW_DOMAIN/favicon.svg" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    pass "Favicon accessible"
else
    warn "Favicon may not be accessible"
fi

echo ""

# Test 9: Health Check Endpoint
echo "9️⃣  Testing Health Check"
echo "----------------------"

HEALTH=$(curl -s "https://$NEW_DOMAIN/health")
if echo "$HEALTH" | grep -q "ok\|healthy"; then
    pass "Health check endpoint responding"
else
    warn "Health check endpoint may not be configured"
fi

echo ""

# Summary
echo "========================================="
echo "VERIFICATION SUMMARY"
echo "========================================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    echo ""
    echo "Migration appears successful. Recommended next steps:"
    echo "  1. Test authentication flow manually"
    echo "  2. Verify user session persistence"
    echo "  3. Check Sentry for any new errors"
    echo "  4. Monitor analytics for traffic shift"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS checks failed${NC}"
    echo ""
    echo "Please review the failed checks above and:"
    echo "  1. Verify Vercel configuration"
    echo "  2. Check DNS propagation status"
    echo "  3. Review deployment logs"
    echo "  4. Consult MIGRATION_GUIDE.md"
    echo ""
    exit 1
fi
