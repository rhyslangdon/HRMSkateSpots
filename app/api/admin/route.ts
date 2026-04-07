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

    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
      action?: unknown;
    } | null;
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const action = body?.action === 'demote' ? 'demote' : 'promote';

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

    if (action === 'promote' && targetProfile.role === 'admin') {
      return NextResponse.json({ message: 'User is already an admin.' }, { status: 200 });
    }

    if (action === 'demote' && targetProfile.role === 'user') {
      return NextResponse.json({ message: 'User is already a non-admin.' }, { status: 200 });
    }

    if (action === 'demote' && targetProfile.id === user.id) {
      return NextResponse.json(
        { error: 'You cannot demote your own admin account.' },
        { status: 400 }
      );
    }

    const nextRole = action === 'demote' ? 'user' : 'admin';
    const { error: updateError } = await admin
      .from('profiles')
      .update({ role: nextRole })
      .eq('id', targetProfile.id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to ${action} user: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        action === 'demote'
          ? 'Admin demoted to user successfully.'
          : 'User promoted to admin successfully.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to promote user.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
