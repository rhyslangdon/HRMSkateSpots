import type { MetadataRoute } from 'next';

/**
 * Next.js automatically serves a robots.txt at `/robots.txt` when this file
 * exists in the `app/` directory. The function below returns a typed object
 * that Next.js serialises into the standard robots.txt format at build time.
 *
 * - `userAgent: '*'`  → these rules apply to every crawler (Googlebot, Bingbot, etc.)
 * - `allow: '/'`      → by default, allow crawling of all public pages
 * - `disallow: [...]`  → block crawlers from authenticated, admin, and auth-flow routes
 *                        so private pages never appear in search results
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Authenticated user routes
        '/dashboard/',
        '/profile/',
        '/payment/',
        '/finder/',

        // Auth flow routes (login, signup, password reset)
        '/login/',
        '/signup/',
        '/forgot-password/',
        '/reset-password/',

        // Admin routes
        '/admin/',

        // API routes should not be indexed
        '/api/',
      ],
    },
  };
}
