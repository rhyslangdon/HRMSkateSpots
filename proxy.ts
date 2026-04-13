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

function buildContentSecurityPolicy(nonce: string) {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://unpkg.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' data: blob:",
  ];

  if (process.env.NODE_ENV === 'production') {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = await updateSession(request, requestHeaders);
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(nonce));

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - image assets (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
