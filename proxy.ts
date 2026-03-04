// =============================================================================
// PROXY — Auth Session Refresh & Route Protection
// =============================================================================
// Next.js 16 renamed middleware to proxy. The proxy runs before every matched
// request and is used to refresh the Supabase auth session and protect routes
// that require authentication.
//
// See /lib/supabase/middleware.ts for the session refresh and protection logic.
// See /docs/admin-guide.md for context on protecting the admin route.
// =============================================================================

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
