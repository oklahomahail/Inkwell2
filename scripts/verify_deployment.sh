#!/bin/bash
# Deployment verification script for static assets
# Usage: ./verify_deployment.sh [domain]
# Example: ./verify_deployment.sh inkwell.leadwithnexus.com

DOMAIN=${1:-"inkwell.leadwithnexus.com"}
PROTOCOL="https://"
BASE_URL="$PROTOCOL$DOMAIN"

echo "=== Verifying deployment at $BASE_URL ==="
echo

# Function to check Content-Type for a given URL
check_content_type() {
  local url="$1"
  local expected_type="$2"
  local description="$3"

  echo "Checking $description..."
  
  # Get headers only with curl
  local headers=$(curl -s -I "$url")
  local content_type=$(echo "$headers" | grep -i "Content-Type" | head -1)
  local status_code=$(echo "$headers" | grep -i "HTTP/" | awk '{print $2}')
  local cache_control=$(echo "$headers" | grep -i "Cache-Control" | head -1)
  
  echo "  Status: $status_code"
  echo "  Content-Type: $content_type"
  echo "  Cache-Control: $cache_control"
  
  # Check if content type matches expected
  if echo "$content_type" | grep -q "$expected_type"; then
    echo "  ✅ Content-Type is correct"
  else
    echo "  ❌ Content-Type is INCORRECT! Expected: $expected_type"
  fi
  
  # Check for redirects
  if [[ "$status_code" == "301" || "$status_code" == "302" || "$status_code" == "307" || "$status_code" == "308" ]]; then
    local location=$(echo "$headers" | grep -i "Location" | head -1)
    echo "  ⚠️ Redirect detected: $location"
    
    if echo "$location" | grep -q "/sign-in"; then
      echo "  ❌ ERROR: Static asset redirected to /sign-in!"
    fi
  fi
  
  # Check caching headers for static assets vs HTML
  if [[ "$description" == *"HTML"* || "$description" == *"route"* ]]; then
    # HTML should have short or no cache
    if echo "$cache_control" | grep -q "no-store\|no-cache\|max-age=0\|must-revalidate"; then
      echo "  ✅ Cache-Control is appropriate for HTML"
    else
      echo "  ⚠️ HTML caching may be too aggressive"
    fi
  else
    # Static assets should have longer cache times
    if echo "$cache_control" | grep -q "max-age=[1-9]"; then
      echo "  ✅ Cache-Control set for static asset"
      if echo "$cache_control" | grep -q "immutable"; then
        echo "  ✅ Using immutable for optimal caching"
      fi
    else
      echo "  ⚠️ Missing or short cache time for static asset"
    fi
  fi
  
  echo
}

# Find a JS asset filename from the main page
echo "Finding JS assets..."
main_page=$(curl -s "$BASE_URL")
js_asset=$(echo "$main_page" | grep -o '/assets/[^"]*\.js' | head -1)

if [[ -z "$js_asset" ]]; then
  echo "❌ Could not find JS asset on main page. This is concerning!"
  js_asset="/assets/index.js" # Fallback for testing
else
  echo "✅ Found JS asset: $js_asset"
fi

# Find a CSS asset filename
css_asset=$(echo "$main_page" | grep -o '/assets/[^"]*\.css' | head -1)

if [[ -z "$css_asset" ]]; then
  echo "❌ Could not find CSS asset on main page. This is concerning!"
  css_asset="/assets/index.css" # Fallback for testing
else
  echo "✅ Found CSS asset: $css_asset"
fi

echo

# Check various asset types
check_content_type "$BASE_URL/sign-in" "text/html" "HTML route (/sign-in)"
check_content_type "$BASE_URL$js_asset" "application/javascript" "JS asset ($js_asset)"
check_content_type "$BASE_URL$css_asset" "text/css" "CSS asset ($css_asset)"
check_content_type "$BASE_URL/registerSW.js" "application/javascript" "Service Worker Registration (/registerSW.js)"
check_content_type "$BASE_URL/site.webmanifest" "application/manifest+json" "Web Manifest (/site.webmanifest)"
check_content_type "$BASE_URL/favicon.ico" "image/" "Favicon (/favicon.ico)"

# Validate site.webmanifest JSON format
echo "Validating site.webmanifest JSON format..."
manifest_content=$(curl -s "$BASE_URL/site.webmanifest")
if echo "$manifest_content" | jq . > /dev/null 2>&1; then
  echo "  ✅ site.webmanifest is valid JSON"
else
  echo "  ❌ site.webmanifest has invalid JSON format!"
fi
echo

echo "=== Verification complete ==="
echo
echo "If all Content-Types are correct, your static asset configuration is working properly."
echo "If any errors were reported, check your middleware and vercel.json configuration."
echo
echo "PWA Post-Deployment Checklist:"
echo "  1. In Chrome DevTools > Application > Service Workers, confirm one active SW"
echo "  2. Check that static assets don't redirect to /sign-in when accessed directly"
echo "  3. Verify there are no 404s for critical files in the console"
