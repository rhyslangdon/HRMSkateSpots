import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Checks if the currently authenticated user has the 'admin' role.
 * Queries the `profiles` table for the user's role.
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
 * Requires the current user to be an admin.
 * Redirects to "/" if not authenticated or not an admin.
 * Use in Server Components to protect admin pages.
 */
export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin();
  if (!admin) {
    redirect('/');
  }
}
