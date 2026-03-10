// =============================================================================
// ADMIN ROLE UTILITIES
// =============================================================================
// Server-side helpers for role-based access control (RBAC).
//
// These functions query the `profiles` table to check the authenticated
// user's `role` column. They are designed for use in:
//   - Server Components (e.g., admin dashboard page)
//   - Route Handlers / Server Actions
//
// The middleware in /lib/supabase/middleware.ts provides a first layer of
// protection by redirecting non-admin users before the page renders.
// These utilities add a second server-side layer of defence.
// =============================================================================

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Checks if the currently authenticated user has the 'admin' role.
 *
 * Calls `supabase.auth.getUser()` to identify the user, then queries
 * the `profiles` table for their role. Returns false if the user is
 * not logged in or does not have an admin role.
 *
 * @returns true if the user is an admin, false otherwise.
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

/**
 * Guard function for admin-only Server Components.
 *
 * Call at the top of any `async` page component to enforce admin access.
 * If the user is not authenticated or their role is not 'admin', they
 * are immediately redirected to the home page via Next.js `redirect()`.
 *
 * @example
 * ```tsx
 * export default async function AdminPage() {
 *   await requireAdmin(); // redirects non-admins
 *   return <div>Admin content</div>;
 * }
 * ```
 */
export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin();
  if (!admin) {
    redirect('/');
  }
}
