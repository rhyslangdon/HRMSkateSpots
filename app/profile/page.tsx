'use client';
// =============================================================================
// PROFILE PAGE
// =============================================================================
// User account settings and profile information.
//
// STUDENT: This page is currently accessible to everyone — there is NO
// authentication or route protection implemented.
//
// What you need to do:
//   1. Implement authentication and protect this route
//   2. Load the user's actual profile data from your database
//   3. Wire up the form to update user profile information
//   4. Implement the subscription status section with real data
//   5. Connect the "Upgrade" button to your payment flow
//
// See /docs/payments.md for subscription and premium tier guidance.
// =============================================================================

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// import { useSubscription } from '@/components/SubscriptionContext';
import { useTheme } from '@/components/ThemeContext';
import AvatarUpload from '@/components/AvatarUpload';

// function SubscriptionSection() {
//   const { status, setStatus, refreshStatus } = useSubscription();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   const handleRemovePremium = async () => {
//     setLoading(true);
//     setError('');
//     setSuccess(false);
//     try {
//       const response = await fetch('/api/subscription/downgrade', {
//         method: 'POST',
//       });

//       if (!response.ok) {
//         const payload = (await response.json().catch(() => null)) as { error?: string } | null;
//         throw new Error(payload?.error || 'Failed to cancel subscription.');
//       }

//     setStatus('free');
//     setSuccess(true);
//     setShowConfirm(false);
//     await refreshStatus();
//   } catch (err) {
//     const message = err instanceof Error ? err.message : 'Failed to remove premium.';
//     setError(message);
//   } finally {
//     setLoading(false);
//   }
// };

// if (status === null) return <div className="mt-4">Loading subscription...</div>;

//   return (
//     <div className="mt-4">
//       <div className="flex items-center gap-3">
//         {/* <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
//           {status === 'premium' ? 'Premium Plan' : 'Free Plan'}
//         </span> */}
//       </div>
//       <p className="mt-4 text-sm text-muted-foreground">
//         {status === 'premium'
//           ? 'You are currently on the Premium plan. Enjoy all features!'
//           : 'You are currently on the Free plan. Upgrade to unlock premium features.'}
//       </p>
//       {status === 'premium' ? (
//         <>
//           <button
//             onClick={() => setShowConfirm(true)}
//             className="mt-4 inline-block rounded-lg bg-red-600 text-white px-6 py-2 text-sm font-medium transition-colors hover:bg-red-700 disabled:opacity-60"
//             disabled={loading}
//           >
//             Remove Premium
//           </button>
//           {showConfirm && (
//             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//               <div className="bg-background border border-border rounded-xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
//                 <h3 className="text-lg font-semibold mb-2 text-center">
//                   Remove Premium Subscription?
//                 </h3>
//                 <p className="text-sm text-muted-foreground mb-6 text-center">
//                   Are you sure you want to remove your premium subscription and return to the free
//                   plan? This action is immediate.
//                 </p>
//                 <div className="flex gap-4 w-full justify-center">
//                   <button
//                     onClick={handleRemovePremium}
//                     className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium transition-colors hover:bg-red-700 disabled:opacity-60"
//                     disabled={loading}
//                   >
//                     {loading ? 'Removing...' : 'Yes, Remove'}
//                   </button>
//                   <button
//                     onClick={() => setShowConfirm(false)}
//                     className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
//                     disabled={loading}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       ) : null}
//       {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
//       {success && (
//         <div className="text-green-600 text-sm mt-2">
//           Premium removed. You are now on the Free plan.
//         </div>
//       )}
//     </div>
//   );
// }

function DeleteAccountSection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError('');

    try {
      // Trigger server-side soft-delete and user id reassignment
      const response = await fetch('/api/profile/delete', {
        method: 'POST',
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Failed to delete account.');
      }

      // Trigger a client auth state change so Navbar/UI updates immediately.
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();

      // Redirect away from account pages once the local session is cleared.
      setShowConfirm(false);
      router.replace('/');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-8 rounded-xl border border-red-300 bg-red-50/60 p-6">
      <h2 className="text-xl font-semibold text-red-800">Delete Account</h2>
      <p className="mt-2 text-sm text-red-700">
        Your account will be deleted. Spots you created are reassigned to a deleted-user profile.
      </p>
      <button
        type="button"
        onClick={() => {
          setError('');
          setShowConfirm(true);
        }}
        disabled={loading}
        className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {loading ? 'Deleting Account...' : 'Delete Account'}
      </button>
      {error && <div className="mt-2 text-sm text-red-700">{error}</div>}
      {/* confirmation pop-up */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-8 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Delete account?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will delete your account but keep all your spots available. Your spots will not
              be associated with your profile.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function ProfilePage() {
  const { toggleTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch current avatar URL on mount
  useEffect(() => {
    (async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
    })();
  }, []);

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            aria-label="Toggle light/dark mode"
            type="button"
          >
            <span>Toggle theme</span>
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            View Your Dashboard
          </Link>
        </div>

        <p className="mt-2 text-muted-foreground">Manage your profile and preferences.</p>

        {/* --- Profile Information --- */}
        {/* STUDENT: Wire this form to your database to load and save user data */}
        <section className="mt-8 rounded-xl border border-border bg-background p-6">
          <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
          <div className="mt-6 space-y-6">
            {/* Avatar Upload */}
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              onUploadComplete={(url) => setAvatarUrl(url)}
            />

            {/* Name */}
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-foreground">
                Full name
              </label>
              <input
                type="text"
                id="profile-name"
                defaultValue=""
                placeholder="Jane Doe"
                className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                type="email"
                id="profile-email"
                defaultValue=""
                placeholder="example@email.com"
                className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* STUDENT: Implement the save functionality */}
            <button
              type="button"
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </section>

        {/* --- Subscription Status --- */}
        {/* STUDENT: Replace this with real subscription data from your database.
            See /docs/payments.md for implementing the freemium model. */}
        {/* <section className="mt-8 rounded-xl border border-border bg-background p-6">
          <h2 className="text-xl font-semibold text-foreground">Subscription</h2>
          <SubscriptionSection />
        </section> */}

        <DeleteAccountSection />
      </div>
    </div>
  );
}
