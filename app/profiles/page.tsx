import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

import Dashboard from '@/components/Dashboard';

export default function ProfilesPage() {
  return (
    <>
      <SignedIn>
        <Dashboard />
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
