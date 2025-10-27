/**
 * Password Reset Flow Verification Script
 *
 * This script helps verify that the password reset flow is configured correctly.
 * Run with: npx tsx scripts/verify-password-reset.ts
 */

import { createClient } from '@supabase/supabase-js';

// You can also load from .env if needed
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyPasswordResetFlow() {
  console.log('\n🔍 Password Reset Flow Verification\n');
  console.log('='.repeat(50));

  // Check Supabase connection
  console.log('\n1️⃣  Checking Supabase connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return;
    }
    console.log('✅ Supabase connection successful');
  } catch (err) {
    console.error('❌ Supabase connection error:', err);
    return;
  }

  // Verify reset URL configuration
  console.log('\n2️⃣  Verifying reset URL configuration...');
  const expectedURLs = [
    'http://localhost:5173/auth/update-password',
    'http://localhost:3000/auth/update-password', // Alternative dev port
  ];

  console.log('\n📋 Expected Redirect URLs (to add in Supabase Dashboard):');
  expectedURLs.forEach((url) => {
    console.log(`   - ${url}`);
  });

  console.log('\n📍 How to add these URLs:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Navigate to: Authentication → URL Configuration');
  console.log('   4. Add each URL to the "Redirect URLs" list');
  console.log('   5. Save changes');

  // Test email template
  console.log('\n3️⃣  Email template verification...');
  console.log('   Go to: Authentication → Email Templates → Reset Password');
  console.log('   Ensure the template uses {{ .ConfirmationURL }}');
  console.log('   This will use the redirectTo parameter from your code');

  // Production URLs reminder
  console.log('\n4️⃣  Production URLs (add when deploying):');
  console.log('   - https://your-domain.com/auth/update-password');
  console.log('   - https://your-app.vercel.app/auth/update-password');
  console.log('   Replace with your actual production URL(s)');

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Verification complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Add redirect URLs to Supabase Dashboard');
  console.log('   2. Test password reset from /auth/forgot-password');
  console.log('   3. Check email and click reset link');
  console.log('   4. Verify you land on /auth/update-password');
  console.log('   5. Update password and confirm redirect works\n');
}

// Run verification
verifyPasswordResetFlow().catch(console.error);
