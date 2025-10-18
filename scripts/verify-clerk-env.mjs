// scripts/verify-clerk-env.mjs
const ref = process.env.GITHUB_REF || "";
const event = process.env.GITHUB_EVENT_NAME || "";
const isMainPush =
  ref === "refs/heads/main" ||
  (event === "push" && (process.env.GITHUB_BASE_REF ?? "") === "");

const PUBLISHABLE = process.env.VITE_CLERK_PUBLISHABLE_KEY || "";
const SECRET = process.env.CLERK_SECRET_KEY || "";

// Fail if missing anywhere
if (!PUBLISHABLE || !SECRET) {
  console.error(
    "✖ Missing Clerk env vars. Need VITE_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY."
  );
  process.exit(1);
}

// On main, require live keys (no test/dev keys)
if (isMainPush) {
  const badPub = !PUBLISHABLE.startsWith("pk_live_");
  const badSec = !SECRET.startsWith("sk_live_");
  if (badPub || badSec) {
    console.error(
      `✖ Invalid Clerk keys for main. Expected pk_live_/sk_live_. Got:
PUBLISHABLE=${PUBLISHABLE.slice(0, 12)}…
SECRET=${SECRET.slice(0, 8)}…`
    );
    process.exit(1);
  }
}

// Optional: warn on PRs if dev keys (doesn't fail)
const isPR = event === "pull_request";
if (isPR) {
  const devPub = PUBLISHABLE.startsWith("pk_test_");
  const devSec = SECRET.startsWith("sk_test_");
  if (devPub || devSec) {
    console.warn("⚠ Using Clerk test keys on PR (okay for previews).");
  }
}

console.log("✓ Clerk env check passed.");
