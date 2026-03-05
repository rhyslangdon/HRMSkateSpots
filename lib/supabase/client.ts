import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in Client Components (browser).
 * This client is used for auth, data fetching, and subscriptions on the client side.
 *
 * Usage:
 *   import { createClient } from '@/lib/supabase/client';
 *   const supabase = createClient();
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please set it before using the Supabase client.'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please set it before using the Supabase client.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
