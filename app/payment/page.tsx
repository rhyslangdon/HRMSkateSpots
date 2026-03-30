'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        setError('Please log in before starting checkout.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Could not create checkout session.');
      }

      const payload = (await res.json()) as { url?: string };

      if (!payload.url) {
        throw new Error('Checkout session URL missing.');
      }

      window.location.href = payload.url;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Unexpected checkout error.');
    }
  };

  return (
    <div className="mx-auto mb-16 mt-16 max-w-lg rounded-xl border bg-background p-8 shadow">
      <h1 className="mb-2 text-center text-2xl font-bold text-foreground">Upgrade to Premium</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        You will be redirected to Stripe Checkout in test mode.
      </p>

      <div className="mb-8 rounded-lg bg-muted px-6 py-4 shadow-sm">
        <div className="text-lg font-semibold text-foreground">Premium Subscription</div>
        <div className="mt-1 text-2xl font-bold text-primary">
          $19.00 <span className="text-base font-normal text-muted-foreground">/ month</span>
        </div>
        <ul className="mt-2 list-inside list-disc text-left text-sm text-muted-foreground">
          <li>Unlimited skate spot submissions</li>
          <li>Access to premium features</li>
          <li>Priority support</li>
          <li>Cancel anytime</li>
        </ul>
      </div>

      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      <button
        type="button"
        className="mt-2 w-full rounded bg-primary py-2 font-semibold text-white disabled:opacity-60"
        disabled={loading}
        onClick={startCheckout}
      >
        {loading ? 'Redirecting to Stripe...' : 'Continue to Stripe Checkout'}
      </button>
    </div>
  );
}
