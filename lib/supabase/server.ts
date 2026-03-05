import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Reads and writes cookies to maintain the user's auth session server-side.
 *
 * Usage:
 *   import { createClient } from '@/lib/supabase/server';
 *   const supabase = await createClient();
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set before creating the server client.'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch (error) {
          // The `setAll` method may be called from a Server Component where
          // cookies cannot be set. In that specific case, Next.js throws an
          // error which we can safely ignore if you have middleware/proxy
          // refreshing user sessions.
          const message = error instanceof Error ? error.message : String(error);

          if (!/server component/i.test(message)) {
            // Unexpected error when setting cookies – log so it is not
            // silently hidden. We do not rethrow to preserve existing
            // behavior.

            console.error(
              '[supabase] Unexpected error while setting auth cookies in createClient:',
              error
            );
          }
        }
      },
    },
  });
}
