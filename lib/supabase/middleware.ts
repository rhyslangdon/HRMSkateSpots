import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Updates the Supabase auth session by refreshing the token in the proxy/middleware.
 * This ensures the session stays alive across requests.
 *
 * Call this from your proxy.ts file.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Supabase environment variables are not configured.' },
      { status: 500 }
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do NOT run any Supabase logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake here could make it very hard
  // to debug session issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    isProtectedRoute(request.nextUrl.pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // ---------------------------------------------------------------------------
  // Admin route protection (RBAC)
  // ---------------------------------------------------------------------------
  // If the user is authenticated but requesting an /admin/* route, verify
  // their `role` in the `profiles` table. Non-admin users are redirected
  // to the home page before the page ever renders.
  //
  // This is the FIRST line of defence. The admin dashboard page itself
  // calls `requireAdmin()` as a second server-side check.
  // ---------------------------------------------------------------------------
  if (
    user &&
    (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/'))
  ) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: Return the supabaseResponse object as-is. Do NOT create a new
  // NextResponse without copying the cookies, or sessions will break.
  return supabaseResponse;
}

/**
 * Determines if a route requires authentication.
 * Add paths here as you build protected features.
 */
function isProtectedRoute(pathname: string): boolean {
  const protectedPrefixes = ['/dashboard', '/profile', '/admin'];

  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}
