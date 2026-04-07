import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email is not found' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createServiceRoleClient();

    const { data: targetProfile, error: targetProfileError } = await admin
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .maybeSingle();

    if (targetProfileError) {
      return NextResponse.json(
        { error: `Failed to load target user: ${targetProfileError.message}` },
        { status: 500 }
      );
    }

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetProfile.role === 'admin') {
      return NextResponse.json({ message: 'User is already an admin.' }, { status: 200 });
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update({ role: 'admin' }) //updating to admin here
      .eq('id', targetProfile.id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to promote user: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'User promoted to admin successfully.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to promote user.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
