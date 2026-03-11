// =============================================================================
// ADMIN DASHBOARD — Server Component
// =============================================================================
// Protected admin-only page that displays platform analytics and user data.
//
// ACCESS CONTROL (two layers):
//   1. Middleware (/lib/supabase/middleware.ts) — redirects non-admin users
//      to "/" before this page is ever rendered.
//   2. `requireAdmin()` — called at the top of this component as a
//      second server-side check. Redirects to "/" if not admin.
//
// DATA:
//   Fetches all rows from the `profiles` table to compute stats and
//   populate the user tables. The query uses the Supabase server client
//   which respects RLS policies (profiles are publicly readable).
//
// SECTIONS:
//   - Stat cards: total users, premium count, recent signups, free count
//   - Premium users table: filtered list of subscription_status='premium'
//   - All users table: every profile with role & plan badges
//
// See /docs/admin-guide.md for RBAC implementation details.
// =============================================================================

import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin-only dashboard for managing the application.',
};

export default async function AdminDashboardPage() {
  // Server-side admin guard — redirects non-admin users to "/"
  await requireAdmin();

  const supabase = await createClient();

  // --- Compute summary statistics for the stat cards using aggregate/count queries ---
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Total users
  const { count: totalUsers = 0 } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  // Total premium users
  const { count: premiumCount = 0 } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('subscription_status', 'premium');

  // Users created within the last 7 days
  const { count: newThisWeek = 0 } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString());

  // Users created within the last 30 days
  const { count: recentSignups = 0 } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  // --- Fetch a limited set of users for the overview tables ---
  // Ordered newest-first so the most recent signups appear at the top.
  // NOTE: We only fetch the most recent 100 users to keep this page fast.
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, display_name, role, subscription_status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const users: Profile[] = profiles ?? [];
  const premiumUsers = users.filter((u) => u.subscription_status === 'premium');
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* --- Header --- */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Application overview and management tools.</p>
        </div>

        {/* --- Stat Cards --- */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Users</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{totalUsers}</p>
            <p className="mt-1 text-xs text-muted-foreground">+{newThisWeek} this week</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-6">
            <p className="text-sm font-medium text-muted-foreground">Premium Users</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{premiumCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Active premium subscriptions</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-6">
            <p className="text-sm font-medium text-muted-foreground">Recent Signups</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{recentSignups}</p>
            <p className="mt-1 text-xs text-muted-foreground">Last 30 days</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-6">
            <p className="text-sm font-medium text-muted-foreground">Free Users</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{totalUsers - premiumCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">On free plan</p>
          </div>
        </div>

        {/* --- Premium Users --- */}
        <div className="mt-8 rounded-xl border border-border bg-background p-6">
          <h2 className="text-xl font-semibold text-foreground">Premium Users</h2>
          {premiumUsers.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No premium users yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="whitespace-nowrap pb-3 font-medium text-muted-foreground">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {premiumUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap py-3 pr-4 text-foreground">
                        {user.display_name || '—'}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- All Users Table --- */}
        <div className="mt-8 rounded-xl border border-border bg-background p-6">
          <h2 className="text-xl font-semibold text-foreground">All Users</h2>
          {users.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="whitespace-nowrap pb-3 pr-4 font-medium text-muted-foreground">
                      Plan
                    </th>
                    <th className="whitespace-nowrap pb-3 font-medium text-muted-foreground">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap py-3 pr-4 text-foreground">
                        {user.display_name || '—'}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            user.subscription_status === 'premium'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {user.subscription_status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
