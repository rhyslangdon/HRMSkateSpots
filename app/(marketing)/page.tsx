// =============================================================================
// LANDING PAGE (Home)
// =============================================================================
// This is the main marketing landing page for your SaaS application.
//
// STUDENT: Replace ALL placeholder content with your actual product information:
//   - Hero section: your headline, tagline, and call-to-action
//   - Features section: your product's actual features
//   - Testimonials: real or realistic testimonials
//   - CTA section: your actual conversion messaging
//
// This page uses Server Components by default (no 'use client' directive).
// See /docs/performance.md for when to use Server vs Client Components.
// =============================================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import MapWrapper from '@/components/MapWrapper';

export const metadata: Metadata = {
  title: 'HRM Skate Spots — [Your Tagline Here]',
  description: '[Describe what your SaaS product does in 1-2 sentences for SEO]',
};

export default function HomePage() {
  return (
    <div>
      {/* ===== HERO SECTION ===== */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            [Your Headline Here]
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            [Your subheadline — explain the key value proposition of your product in one or two
            compelling sentences that make visitors want to learn more.]
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="w-full rounded-lg bg-primary px-8 py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-lg border border-border px-8 py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ===== MAP SECTION ===== */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto h-125 max-w-5xl overflow-hidden rounded-xl border border-border shadow-sm">
          <MapWrapper />
        </div>
      </section>
    </div>
  );
}
