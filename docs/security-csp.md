# Content Security Policy (CSP)

This project sets a strict CSP in [proxy.ts](../proxy.ts).
Every matched request gets a `Content-Security-Policy` header.

## Quick Summary

- CSP is built per request in [proxy.ts](../proxy.ts)
- A unique nonce is generated for scripts
- The nonce is included in `script-src`
- `upgrade-insecure-requests` is added in production only

## Directives (Simple Explanation)

| Directive | Value | Why it is needed |
| --- | --- | --- |
| `default-src` | `'self'` | Safe default: only same-origin resources unless explicitly allowed. |
| `base-uri` | `'self'` | Stops attackers from changing how relative links/forms resolve. |
| `form-action` | `'self'` | Forms can only submit back to this app. |
| `frame-ancestors` | `'none'` | Prevents clickjacking by blocking iframe embedding. |
| `object-src` | `'none'` | Blocks legacy plugin content. |
| `script-src` | `'self' 'nonce-<per-request>' 'strict-dynamic'` | Runs only trusted scripts (same-origin + nonce-approved runtime scripts). |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | Allows app styles and Google Fonts stylesheet; inline styles are still needed by current UI libraries. |
| `font-src` | `'self' https://fonts.gstatic.com data:` | Allows local fonts and Google font files. |
| `img-src` | `'self' data: blob: https://*.supabase.co https://unpkg.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com` | Allows app images, Supabase storage, and map/marker assets. |
| `connect-src` | `'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org` | Allows API calls, Supabase HTTPS/WebSocket traffic, and geocoding requests. |
| `worker-src` | `'self' blob:` | Allows service worker and blob workers. |
| `manifest-src` | `'self'` | Manifest can only be loaded from this app. |
| `media-src` | `'self' data: blob:` | Restricts media files to trusted/local sources. |
| `upgrade-insecure-requests` (production only) | enabled | Forces HTTP subresources to HTTPS in production. |

## When You Add Integrations

If you add a new SDK, CDN, analytics tool, or external API:

1. Update the allowlist in [proxy.ts](../proxy.ts)
2. Update this file with the reason
3. Keep both changes in the same PR
