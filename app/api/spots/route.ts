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
