import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SpotFormData } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('spots')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
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
    // Update spot
    const { data: updated, error: updateError } = await supabase
      .from('spots')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (updateError) {
      return NextResponse.json(
        { error: 'Database Error', message: updateError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ data: updated, message: 'Spot updated.' });
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
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Spot ID is required.' },
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
          message: 'You can only delete your own spots unless you are an admin.',
        },
        { status: 403 }
      );
    }
    // Delete spot
    const { error: deleteError } = await supabase.from('spots').delete().eq('id', id);
    if (deleteError) {
      return NextResponse.json(
        { error: 'Database Error', message: deleteError.message },
        { status: 500 }
      );
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
        image_url: body.image_url || null,
        is_approved: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, message: 'Spot submitted for approval.' }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Server Error', message: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
