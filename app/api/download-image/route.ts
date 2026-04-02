import { NextRequest, NextResponse } from 'next/server';

// Maps common image content-types to file extensions for nicer downloaded names.
const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

function sanitizeFileName(name: string, extension: string): string {
  // Keep file names safe and predictable for downloads.
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `${base || 'spot-image'}${extension}`;
}

function getAllowedHost(): string | null {
  //  only allow downloads from the configured Supabase host.
  // This prevents this endpoint from becoming an open proxy to any website.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Query params sent from the client: image URL and optional display name.
  const imageUrl = request.nextUrl.searchParams.get('url');
  const requestedName = request.nextUrl.searchParams.get('name') ?? 'spot-image';

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
  }

  // make sure the URL is using a supported protocol (http or https) for security
  if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: 'Unsupported URL protocol' }, { status: 400 });
  }

  // Only allow the known storage host (Supabase project host).
  const allowedHost = getAllowedHost();
  if (allowedHost && parsedUrl.hostname !== allowedHost) {
    return NextResponse.json({ error: 'Image host is not allowed' }, { status: 400 });
  }

  // Server fetches the image, then streams it back as an attachment.
  // This helps browsers treat it like a real download instead of just opening a tab.
  const upstream = await fetch(parsedUrl.toString(), { cache: 'no-store' });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Unable to fetch image' }, { status: 502 });
  }

  const contentType = (upstream.headers.get('content-type') ?? '').toLowerCase();
  const extension =
    Object.entries(CONTENT_TYPE_EXTENSIONS).find(([type]) => contentType.includes(type))?.[1] ?? '';
  const fileName = sanitizeFileName(requestedName, extension);

  // Content-Disposition=attachment is the key header that triggers download behavior.
  // No store tells the browser not to cache the file
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
