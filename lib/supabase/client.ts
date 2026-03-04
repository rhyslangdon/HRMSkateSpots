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
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
