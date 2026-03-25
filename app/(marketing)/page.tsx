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
      {/* ===== MAP SECTION ===== */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <MapWrapper />
        </div>
      </section>
    </div>
  );
}
