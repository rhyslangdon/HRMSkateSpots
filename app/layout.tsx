// =============================================================================
// ROOT LAYOUT
// =============================================================================
// This is the root layout that wraps every page in your application.
// It includes the global font, navbar, and footer.
//
// STUDENT: Update the metadata below with your actual app name and description.
// To change fonts, replace Inter with any Google Font from:
//   https://fonts.google.com/
//
// How to change fonts:
//   1. Import a different font from 'next/font/google'
//   2. Replace `Inter` with your chosen font
//   3. Update the CSS variable name if needed
//   4. Update globals.css to reference the new CSS variable
//
// See /docs/styling.md for detailed font configuration guidance.
// =============================================================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import './globals.css';
import AppToaster from '@/components/AppToaster';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import UnauthorizedToast from '@/components/UnauthorizedToast';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { SubscriptionProvider } from '@/components/SubscriptionContext';
import { ThemeProvider } from '@/components/ThemeContext';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.hrmskatespots.com';

// --- Font Configuration ---
// next/font automatically optimizes fonts — no external requests at runtime.
// The font is loaded at build time and served as a local asset.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

// --- Metadata ---
// STUDENT: Replace these placeholder values with your actual app information.
// See /docs/performance.md for more on metadata and SEO.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HRM Skate Spots',
    template: '%s | HRM Skate Spots',
  },
  icons: {
    icon: '/bearingLogo.png',
    shortcut: '/bearingLogo.png',
    apple: '/bearingLogo.png',
  },
  description:
    'Discover skate spots, street spots, skateparks, and DIY locations across Halifax Regional Municipality with community reviews, photos, and local skate info.',
  keywords: [
    'HRM skate spots',
    'Halifax skate spots',
    'Halifax skateboarding',
    'Nova Scotia skate spots',
    'Halifax skatepark map',
    'street skating Halifax',
    'DIY skate spots Halifax',
    'Halifax skateboard spots',
    'skate spots near me Halifax',
    'HRM skateboard map',
  ],
  openGraph: {
    title: 'HRM Skate Spots',
    description:
      'Discover skate spots, street spots, skateparks, and DIY locations across Halifax Regional Municipality.',
    type: 'website',
    siteName: 'HRM Skate Spots',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HRM Skate Spots',
    description:
      'Find skate spots, skateparks, and street skating locations across Halifax Regional Municipality.',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reading x-nonce causes Next.js to stamp that nonce on all its
  // internal inline scripts, satisfying the nonce-based CSP in production.
  await headers();
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ServiceWorkerRegistration />
        <ThemeProvider>
          <SubscriptionProvider>
            <Navbar />
            <EmailVerificationBanner />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </SubscriptionProvider>
          <AppToaster />
          <Suspense>
            <UnauthorizedToast />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
