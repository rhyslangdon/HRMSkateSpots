'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EmailVerificationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.email_confirmed_at) {
        setShowBanner(true);
      }
    });

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
