// =============================================================================
// NAVBAR COMPONENT — Client Component
// =============================================================================
// The main navigation bar displayed at the top of every page.
//
// AUTH-AWARE BEHAVIOUR:
//   - Tracks `isLoggedIn` via Supabase auth state listener.
//   - Tracks `isAdmin` by querying the `profiles` table for the user's
//     `role` column whenever auth state changes.
//   - Shows/hides links accordingly:
//       • Logged-out users  → Log in / Sign up
//       • Logged-in users   → Dashboard, Profile, Log out
//       • Admin users only  → "Admin" link (to /admin/dashboard)
//
// RESPONSIVENESS:
//   - Desktop nav (md+): horizontal link row, hidden on small screens.
//   - Mobile nav (<md):  hamburger button toggles a slide-down menu.
//   Both menus conditionally render the Admin link based on `isAdmin`.
//
// NOTE: The Admin link visibility is a UI convenience only.
// Actual access control is enforced server-side in the middleware and
// in the admin dashboard page itself via `requireAdmin()`.
// =============================================================================

'use client';

import { useEffect, useState, useRef } from 'react';
import { useSubscription } from '@/components/SubscriptionContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { status: subscriptionStatus, refreshStatus } = useSubscription();
  const [userName, setUserName] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  // Close dropdown on outside click
  useEffect(() => {
    if (!profileDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileDropdownOpen]);

  useEffect(() => {
    const supabase = createClient();

    async function fetchProfile(userId: string) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, display_name, email')
        .eq('id', userId)
        .single();
      setIsAdmin(profile?.role === 'admin');
      setUserName(profile?.display_name || profile?.email || null);
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (user) {
        fetchProfile(user.id);
      } else {
        setIsAdmin(false);
        setUserName(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsAdmin(false);
        setUserName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setIsAdmin(false);
    router.push('/');
    router.refresh();
    setLoggingOut(false);
  };

  const isPro = subscriptionStatus === 'premium';
  return (
    <nav className="sticky top-0 z-[9999] border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* --- Logo --- */}
          <Link href="/" className="flex items-center gap-2 h-16">
            <Image
              src="/bearingLogo.png"
              alt="HRM Skate Spots logo"
              width={180}
              height={60}
              priority
              className="max-h-14 w-auto object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-foreground whitespace-nowrap">
              HRM Skate Spots
            </span>
          </Link>

          {/* --- Desktop Navigation --- */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
            {subscriptionStatus === 'premium' && (
              <Link
                href="/finder"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Spot Finder
              </Link>
            )}
          </div>

          {/* --- Desktop Auth/Profile Dropdown --- */}
          <div className="hidden items-center gap-4 md:flex">
            {isLoggedIn ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground px-3 py-2 rounded-lg border border-transparent hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => setProfileDropdownOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={profileDropdownOpen}
                >
                  {userName ? (
                    <>
                      {userName}
                      {isPro && (
                        <span className="ml-1 rounded bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">
                          PRO
                        </span>
                      )}
                    </>
                  ) : (
                    'Profile'
                  )}
                  <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.293l3.71-3.06a.75.75 0 1 1 .96 1.15l-4.25 3.5a.75.75 0 0 1-.96 0l-4.25-3.5a.75.75 0 0 1 .02-1.06z" />
                  </svg>
                </button>
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-background shadow-lg z-50 animate-fade-in">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleSignOut();
                      }}
                      disabled={loggingOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-muted hover:text-red-700 disabled:opacity-50"
                    >
                      {loggingOut ? 'Logging out…' : 'Log out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* --- Mobile Menu Button --- */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              // X icon
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>

        {/* --- Mobile Menu --- */}
        {mobileMenuOpen && (
          <div className="border-t border-border pb-4 md:hidden">
            <div className="flex flex-col gap-2 pt-4">
              <Link
                href="/"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/pricing"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              {subscriptionStatus === 'premium' && (
                <Link
                  href="/finder"
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Spot Finder
                </Link>
              )}
              <hr className="my-2 border-border" />
              {isLoggedIn ? (
                <details className="group">
                  <summary className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer flex items-center justify-between">
                    Profile & Account
                    <svg
                      className="ml-2 h-4 w-4 group-open:rotate-180 transition-transform"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.293l3.71-3.06a.75.75 0 1 1 .96 1.15l-4.25 3.5a.75.75 0 0 1-.96 0l-4.25-3.5a.75.75 0 0 1 .02-1.06z" />
                    </svg>
                  </summary>
                  <div className="flex flex-col gap-1 mt-2 pl-2">
                    <Link
                      href="/profile"
                      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      disabled={loggingOut}
                      className="rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-muted hover:text-red-700 disabled:opacity-50 text-left"
                    >
                      {loggingOut ? 'Logging out…' : 'Log out'}
                    </button>
                  </div>
                </details>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="mx-3 rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
