import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Skateability } from '@/types';

type ReviewProfile = {
  display_name: string | null;
  email: string | null;
};

function isValidSkateability(value: unknown): value is Skateability {
  return value === 'skateable' || value === 'not_skateable';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const spotId = request.nextUrl.searchParams.get('spotId');

    if (!spotId) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'spotId is required.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('reviews')
      .select(
        'id, user_id, spot_id, skateability, comment, created_at, updated_at, profiles(display_name, email)'
      )
      .eq('spot_id', spotId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }

    const reviews = (data ?? []).map((review) => {
      const profile = Array.isArray(review.profiles)
        ? (review.profiles[0] as ReviewProfile | undefined)
        : ((review.profiles as ReviewProfile | null | undefined) ?? undefined);

      return {
        id: review.id,
        user_id: review.user_id,
        spot_id: review.spot_id,
        skateability: review.skateability,
        comment: review.comment,
        created_at: review.created_at,
        updated_at: review.updated_at,
        reviewer_name: profile?.display_name ?? profile?.email ?? 'Anonymous',
      };
    });

    return NextResponse.json({ data: reviews });
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
        { error: 'Unauthorized', message: 'You must be logged in to leave a review.' },
        { status: 401 }
      );
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Please verify your email before leaving a review.' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      spot_id?: string;
      skateability?: Skateability;
      comment?: string;
    };

    if (!body.spot_id) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'spot_id is required.' },
        { status: 400 }
      );
    }

    if (!isValidSkateability(body.skateability)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'skateability must be either skateable or not_skateable.',
        },
        { status: 400 }
      );
    }

    const comment = body.comment?.trim() || null;
    const { data, error } = await supabase
      .from('reviews')
      .upsert(
        {
          user_id: user.id,
          spot_id: body.spot_id,
          skateability: body.skateability,
          comment,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,spot_id' }
      )
      .select('id, user_id, spot_id, skateability, comment, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Database Error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, message: 'Review saved.' }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Server Error', message: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
