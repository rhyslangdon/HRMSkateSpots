// =============================================================================
// AVATAR UPLOAD API ROUTE — POST /api/avatar
// =============================================================================
//
// Receives a cropped avatar image from the client and:
//   1. Authenticates the user via Supabase session cookies.
//   2. Validates the file (type + size).
//   3. Deletes the user's previous avatar from Supabase Storage (if any).
//   4. Uploads the new image to Supabase Storage under:
//        avatars/<user-id>/avatar.webp
//   5. Saves the public URL in the `profiles.avatar_url` column.
//   6. Returns the public URL to the client.
//
// STORAGE LAYOUT:
//   Bucket: "avatars" (public)
//   Path:   <user_id>/avatar.webp
//   Each user gets ONE avatar file. Uploading a new one overwrites the old.
//
// SECURITY:
//   - Only authenticated users can upload (checked via getUser()).
//   - RLS policies on the "avatars" bucket ensure users can only write
//     into their own <user_id>/ folder.
//   - File type is validated server-side (can't trust the client alone).
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse multipart form
  const formData = await request.formData();
  const file = formData.get('avatar') as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // 5 MB limit
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  // Every user's avatar lives at: avatars/<user_id>/avatar.webp
  // Using a fixed filename means uploading a new one automatically replaces
  // the old file — no orphaned files pile up in storage.
  const filePath = `${user.id}/avatar.webp`;

  // Delete the old avatar first. We ignore errors here because the file
  // might not exist yet (first-time upload). This ensures the old cached
  // version is invalidated in Supabase's CDN edge cache.
  await supabase.storage.from('avatars').remove([filePath]);

  // Convert the incoming File (a Web API object) into a Node.js Buffer
  // because Supabase's server-side upload expects binary data.
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload the new avatar. `upsert: true` means "create or overwrite".
  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  // Build the public URL. Because the "avatars" bucket is public, anyone
  // can view this URL — which is what we want for profile photos.
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);

  // Append a cache-bust query param (?t=1234567890) so browsers and CDNs
  // fetch the NEW image instead of showing the old cached version.
  const url = `${publicUrl}?t=${Date.now()}`;

  // Save the URL to the user's profile row in the database.
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }

  return NextResponse.json({ url });
}
