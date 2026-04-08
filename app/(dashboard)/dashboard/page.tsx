// =============================================================================
// DASHBOARD PAGE
// =============================================================================
// This is the main authenticated user dashboard.
//
// STUDENT: This page is currently accessible to everyone — there is NO
// authentication or route protection implemented.
//
// What you need to do:
//   1. Implement authentication (see your chosen auth provider's docs)
//   2. Protect this route so only authenticated users can access it
//   3. Replace placeholder data with real data from your database
//   4. Build out the dashboard features your product needs
//
// See /docs/admin-guide.md for route protection guidance and middleware.ts
// for where to implement auth checks.
//
// Authenticated user dashboard showing account stats from Supabase.
// =============================================================================

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your personal dashboard.',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all stats and recent spots in parallel
  const [spotsResult, favouritesResult, profileResult, recentSpotsResult] = await Promise.all([
    supabase.from('spots').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('favourites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('display_name, subscription_status, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('spots')
      .select('id, name, spot_type, difficulty, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const spotsCount = spotsResult.count ?? 0;
  const favouritesCount = favouritesResult.count ?? 0;
  const recentSpots = recentSpotsResult.data ?? [];
  const joinedAt = profileResult.data?.created_at
    ? new Date(profileResult.data.created_at).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';
  const displayName = profileResult.data?.display_name || user.email;
  const subscriptionStatus = profileResult.data?.subscription_status ?? 'free';

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* --- Header --- */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back, {displayName}! Here&apos;s an overview of your account.
          </p>
        </div>

        {/* --- Stat Cards --- */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-6">
            <p className="text-sm font-medium text-muted-foreground">Spots Created</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{spotsCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-6">
            <p className="text-sm font-medium text-muted-foreground">Favourite Spots</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{favouritesCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-6">
            <p className="text-sm font-medium text-muted-foreground">Member Since</p>
            <p className="mt-2 text-lg font-bold text-foreground">{joinedAt}</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-6">
            <p className="text-sm font-medium text-muted-foreground">Subscription</p>
            <p className="mt-2 text-3xl font-bold text-foreground capitalize">
              {subscriptionStatus}
            </p>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Spots */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-xl font-semibold text-foreground">Your Recent Spots</h2>
            {recentSpots.length === 0 ? (
              <div className="mt-4 text-center">
                <p className="text-muted-foreground">You haven&apos;t added any spots yet.</p>
                <a
                  href="/finder"
                  className="mt-3 inline-block rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Open the Map
                </a>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {recentSpots.map((spot) => (
                  <li key={spot.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-foreground">{spot.name}</p>
                      <div className="mt-1 flex gap-2">
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                          {spot.spot_type}
                        </span>
                        <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                          {spot.difficulty}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(spot.created_at).toLocaleDateString('en-CA')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href="/finder"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              >
                <span className="text-2xl">🗺️</span>
                <div>
                  <p className="font-medium text-foreground">Explore the Map</p>
                  <p className="text-xs text-muted-foreground">
                    Browse and discover skate spots around HRM
                  </p>
                </div>
              </a>
              <a
                href="/profile"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              >
                <span className="text-2xl">👤</span>
                <div>
                  <p className="font-medium text-foreground">Edit Profile</p>
                  <p className="text-xs text-muted-foreground">
                    Update your avatar, name, and account settings
                  </p>
                </div>
              </a>
              {subscriptionStatus === 'free' && (
                <a
                  href="/pricing"
                  className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
                >
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="font-medium text-foreground">Upgrade to Premium</p>
                    <p className="text-xs text-muted-foreground">
                      Unlock unlimited favourites and more features
                    </p>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
