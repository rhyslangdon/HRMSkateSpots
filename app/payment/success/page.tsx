'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSubscription } from '@/components/SubscriptionContext';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { setStatus, refreshStatus } = useSubscription();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const confirmCheckout = async () => {
      if (!sessionId) {
        if (!mounted) return;
        setError('Missing checkout session. Please contact support.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || 'Could not confirm payment.');
        }

        if (!mounted) return;
        setStatus('premium');
        await refreshStatus();
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unexpected error while confirming payment.');
        setLoading(false);
      }
    };

    void confirmCheckout();

    return () => {
      mounted = false;
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto mb-16 mt-16 max-w-lg rounded-xl border bg-background p-8 shadow">
      <h1 className="mb-2 text-center text-2xl font-bold text-foreground">Payment Result</h1>

      {loading && <p className="text-center text-muted-foreground">Confirming your payment...</p>}

      {!loading && !error && (
        <div className="space-y-4 text-center">
          <p className="font-semibold text-green-600">
            Payment successful. Your account is now premium.
          </p>
          <Link
            href="/finder"
            className="inline-block rounded bg-primary px-4 py-2 font-medium text-primary-foreground"
          >
            Go to Spot Finder
          </Link>
        </div>
      )}

      {!loading && error && (
        <div className="space-y-4 text-center">
          <p className="text-red-600">{error}</p>
          <Link
            href="/payment"
            className="inline-block rounded border border-border px-4 py-2 font-medium text-foreground"
          >
            Back to payment
          </Link>
        </div>
      )}
    </div>
  );
}
