/**
 * EMAIL VERIFICATION BANNER — Yellow banner shown to users who haven't verified their email.
 *
 * WHERE IT SHOWS: Rendered in app/layout.tsx, right below the Navbar, so it appears on every page.
 *
 * HOW IT WORKS:
 * 1. On mount, checks if the logged-in user's email_confirmed_at is null
 *    (Supabase sets this timestamp when the user clicks the verification link)
 * 2. If unverified → shows the yellow banner with a "Resend verification email" button
 * 3. Listens for auth state changes so if the user verifies in another tab,
 *    the banner auto-hides without a page refresh
 * 4. The "Resend" button calls supabase.auth.resend() which tells Supabase
 *    to send another verification email (Supabase handles the sending)
 *
 * WHAT HAPPENS IF THEY DON'T VERIFY:
 * - They can still browse the site and see spots on the map
 * - But API routes (spots POST/PATCH/DELETE, checkout) will reject their requests
 *   with a 403 "Please verify your email" error
 */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EmailVerificationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check on page load: is the current user's email unverified?
    // email_confirmed_at is null until they click the verification link.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.email_confirmed_at) {
        setShowBanner(true);
      }
    });

    // Listen for real-time auth changes (e.g., user verifies in another tab).
    // This auto-hides the banner without needing a page refresh.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !session.user.email_confirmed_at) {
        setShowBanner(true);
      } else {
        setShowBanner(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      // Tell Supabase to resend the verification email.
      // type: 'signup' means "resend the original sign-up confirmation email".
      // Supabase sends this email — NOT our nodemailer/Gmail code.
      await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setResent(true);
    }
    setResending(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 text-center text-sm text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200">
      <span>
        Your email address is not verified. Please check your inbox for a confirmation link.
      </span>
      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="ml-3 font-medium underline hover:no-underline disabled:opacity-50"
      >
        {resending ? 'Sending…' : resent ? 'Sent!' : 'Resend verification email'}
      </button>
    </div>
  );
}
