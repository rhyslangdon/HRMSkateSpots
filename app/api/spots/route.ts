import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import type { SpotFormData } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseSecretFlag(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'boolean' ? value : null;
}

function buildCreatorName(profile: { display_name?: string | null; email?: string | null } | null) {
  if (!profile) {
    return null;
  }

  const displayName = profile.display_name?.trim();
  if (displayName) {
    return displayName;
  }

  const email = profile.email?.trim();
  if (!email) {
    return null;
  }

  return email.split('@')[0] || email;
}

function normalizeSpot<
  T extends { profiles?: { display_name?: string | null; email?: string | null } | null },
>(spot: T) {
  const { profiles, ...spotData } = spot;

  return {
    ...spotData,
    creator_name: buildCreatorName(profiles ?? null),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('spots')
      .select('*, profiles(display_name, email)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: (data ?? []).map(normalizeSpot) },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Server Error', message: 'Something went wrong.' },
      { status: 500 }
    );
  }
}

// PATCH: Edit a spot (only if user is owner)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to edit a spot.' },
        { status: 401 }
      );
    }
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Please verify your email address before editing spots.' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Spot ID is required.' },
        { status: 400 }
      );
    }
    if (
      'bust_factor' in updateData &&
      (typeof updateData.bust_factor !== 'number' ||
        Number.isNaN(updateData.bust_factor) ||
        updateData.bust_factor < 1 ||
        updateData.bust_factor > 5)
    ) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Bust factor must be a number from 1 to 5.' },
        { status: 400 }
      );
    }
    if ('is_secret' in updateData && parseSecretFlag(updateData.is_secret) === null) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Secret spot flag must be true or false.' },
        { status: 400 }
      );
    }
    // Check ownership or admin
    const { data: spot, error: fetchError } = await supabase
      .from('spots')
      .select('user_id')
      .eq('id', id)
      .single();
    if (fetchError || !spot) {
      return NextResponse.json({ error: 'Not Found', message: 'Spot not found.' }, { status: 404 });
    }
    // Fetch user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'User profile not found.' },
        { status: 403 }
      );
    }
    if (spot.user_id !== user.id && profile.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You can only edit your own spots unless you are an admin.',
        },
        { status: 403 }
      );
    }
    const secretFlag = parseSecretFlag(updateData.is_secret);
    const sanitizedUpdateData = {
      name: typeof updateData.name === 'string' ? updateData.name.trim() : undefined,
      description:
        typeof updateData.description === 'string'
          ? updateData.description.trim() || null
          : undefined,
      address:
        typeof updateData.address === 'string' ? updateData.address.trim() || null : undefined,
      latitude: typeof updateData.latitude === 'number' ? updateData.latitude : undefined,
      longitude: typeof updateData.longitude === 'number' ? updateData.longitude : undefined,
      spot_type: typeof updateData.spot_type === 'string' ? updateData.spot_type : undefined,
      street_feature:
        typeof updateData.spot_type === 'string'
          ? updateData.spot_type === 'street'
            ? updateData.street_feature || null
            : null
          : undefined,
      difficulty: typeof updateData.difficulty === 'string' ? updateData.difficulty : undefined,
      bust_factor: typeof updateData.bust_factor === 'number' ? updateData.bust_factor : undefined,
      image_url:
        typeof updateData.image_url === 'string' || updateData.image_url === null
          ? updateData.image_url
          : undefined,
      is_secret: secretFlag === undefined ? undefined : secretFlag,
    };
    // Update spot
    const { data: updated, error: updateError } = await supabase
      .from('spots')
      .update(sanitizedUpdateData)
      .eq('id', id)
      .select('*, profiles(display_name, email)')
      .single();
    if (updateError) {
      return NextResponse.json(
        { error: 'Database Error', message: updateError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ data: normalizeSpot(updated), message: 'Spot updated.' });
  } catch {
    return NextResponse.json(
      { error: 'Server Error', message: 'Something went wrong.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a spot (only if user is owner)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceRoleSupabase = createServiceRoleClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to delete a spot.' },
        { status: 401 }
      );
    }
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Please verify your email address before deleting spots.' },
        { status: 403 }
      );
    }
    let id = request.nextUrl.searchParams.get('id');

    if (!id) {
      try {
        const body = (await request.json()) as { id?: string };
        id = body.id ?? null;
      } catch {
        id = null;
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Spot ID is required.' },
        { status: 400 }
      );
    }
    // Check ownership or admin
    const { data: spot, error: fetchError } = await supabase
      .from('spots')
      .select('user_id, image_url')
      .eq('id', id)
      .single();
    if (fetchError || !spot) {
      return NextResponse.json({ error: 'Not Found', message: 'Spot not found.' }, { status: 404 });
    }
    // Fetch user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'User profile not found.' },
        { status: 403 }
      );
    }
    if (spot.user_id !== user.id && profile.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You can only delete your own spots unless you are an admin.',
        },
        { status: 403 }
      );
    }
    const { error: deleteReviewsError } = await serviceRoleSupabase
      .from('reviews')
      .delete()
      .eq('spot_id', id);

    if (deleteReviewsError) {
      return NextResponse.json(
        { error: 'Database Error', message: deleteReviewsError.message },
        { status: 500 }
      );
    }

    const { error: deleteFavouritesError } = await serviceRoleSupabase
      .from('favourites')
      .delete()
      .eq('spot_id', id);

    if (deleteFavouritesError) {
      return NextResponse.json(
        { error: 'Database Error', message: deleteFavouritesError.message },
        { status: 500 }
      );
    }

    const { error: deleteError } = await serviceRoleSupabase.from('spots').delete().eq('id', id);
    if (deleteError) {
      return NextResponse.json(
        { error: 'Database Error', message: deleteError.message },
        { status: 500 }
      );
    }

    if (spot.image_url) {
      try {
        const imagePath = new URL(spot.image_url).pathname.split('/spot-images/')[1];
        if (imagePath) {
          await serviceRoleSupabase.storage
            .from('spot-images')
            .remove([decodeURIComponent(imagePath)]);
        }
      } catch {
        // Ignore storage cleanup failures so spot deletion still succeeds.
      }
    }

    return NextResponse.json({ message: 'Spot deleted.' });
  } catch {
    return NextResponse.json(
      { error: 'Server Error', message: 'Something went wrong.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to add a spot.' },
        { status: 401 }
      );
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Please verify your email address before adding spots.' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as SpotFormData & {
      latitude: number;
      longitude: number;
      image_url?: string;
    };

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Spot name is required.' },
        { status: 400 }
      );
    }

    if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Valid latitude and longitude are required.' },
        { status: 400 }
      );
    }

    if (
      typeof body.bust_factor !== 'number' ||
      Number.isNaN(body.bust_factor) ||
      body.bust_factor < 1 ||
      body.bust_factor > 5
    ) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Bust factor must be a number from 1 to 5.' },
        { status: 400 }
      );
    }
    if (parseSecretFlag(body.is_secret) === null) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Secret spot flag must be true or false.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('spots')
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address?.trim() || null,
        city: 'Halifax',
        spot_type: body.spot_type || 'street',
        street_feature: body.spot_type === 'street' ? body.street_feature || null : null,
        difficulty: body.difficulty || 'beginner',
        bust_factor: body.bust_factor,
        image_url: body.image_url || null,
        is_secret: body.is_secret ?? false,
        is_approved: true,
      })
      .select('*, profiles(display_name, email)')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: normalizeSpot(data), message: 'Spot submitted for approval.' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Server Error', message: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
