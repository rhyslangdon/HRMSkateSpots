'use client';

import Link from 'next/link';

export default function FinderPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 text-center sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-xl border border-border bg-background p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-foreground">Spot Finder is temporarily disabled</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This feature is turned off for now and will return once it is ready.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
