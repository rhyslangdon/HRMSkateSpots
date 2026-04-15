import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Pricing is temporarily unavailable on HRM Skate Spots.',
};

export default function PricingPage() {
  return (
    <div className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-10 text-center shadow-sm">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Pricing is temporarily unavailable
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Premium subscriptions are currently turned off while the feature set is being revised.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
