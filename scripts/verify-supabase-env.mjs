// scripts/verify-supabase-env.mjs
/**
 * Validates Supabase environment variables.
 * Used as a pre-build check to ensure required env vars are present.
 */

import { exit } from "node:process";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

// Check for missing variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "✖ Missing Supabase env vars. Need VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
  exit(1);
}

// Basic format validation
const urlPattern = /^https:\/\/.+\.supabase\.co\/?$/;
if (!urlPattern.test(SUPABASE_URL)) {
  console.warn(
    `⚠ Supabase URL may be invalid. Expected https://*.supabase.co. Got: ${SUPABASE_URL}`
  );
}

if (!SUPABASE_ANON_KEY.startsWith("eyJ")) {
  console.warn(
    `⚠ Supabase anon key may be invalid. Expected key starting with "eyJ". Check your Supabase project settings.`
  );
}

console.log("✓ Supabase environment variables validated");
exit(0);
