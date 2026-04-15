'use client';

import Link from 'next/link';

export default function PaymentPage() {
  return (
    <div className="mx-auto mb-16 mt-16 max-w-lg rounded-xl border bg-background p-8 text-center shadow">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Premium subscriptions are off</h1>
      <p className="text-sm text-muted-foreground">
        Checkout and premium plan upgrades are temporarily unavailable.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary/90"
      >
        Return Home
      </Link>
    </div>
  );
}
